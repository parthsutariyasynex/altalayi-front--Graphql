import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── i18n config ────────────────────────────────────────────────────────────
const LOCALES = ["en", "ar"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "en";
const LOCALE_COOKIE = "NEXT_LOCALE";

function isValidLocale(value: string): value is Locale {
    return LOCALES.includes(value as Locale);
}

// ─── Route config ───────────────────────────────────────────────────────────
// Internal Next.js routes (app routes that should be served as-is, not rewritten).
const APP_ROUTES = new Set([
    "login", "register", "forgot-password", "change-password",
    "products", "cart", "checkout", "favorites", "quick-order",
    "my-account", "my-orders", "customer", "subaccount",
    "multi-location-delivery", "popup-demo",
    // Magento-native system URLs that have re-export pages in app/
    "sales", "wishlist",
    // CMS-page Next.js implementations (visible browser URLs may use Magento slugs)
    "about", "locations", "guides", "catalogue",
    "privacy-policy", "return-exchange-policy", "terms-conditions",
]);

// Routes that don't require auth.
const PUBLIC_ROUTES = [
    "/login", "/register", "/forgot-password",
    "/about", "/locations", "/guides", "/catalogue",
    "/privacy-policy", "/return-exchange-policy", "/terms-conditions",
];

const SKIP_PATHS = ["/api", "/_next", "/favicon.ico", "/logo", "/images", "/locales"];

// ─── Magento URL resolution ────────────────────────────────────────────────
// Magento exposes SEO URLs like /en/all-tyres/car-tyres.html and /en/about-us.
// We mirror that exact structure in the browser by resolving each URL to the
// underlying Next.js page via Magento's GraphQL urlResolver (cached).
type ResolvedUrl =
    | { kind: "category"; categoryId: string }
    | { kind: "cms"; nextjsPath: string }
    | { kind: "unknown" };

const urlResolutionCache = new Map<string, ResolvedUrl>();

// Cache of the dynamic "first category URL" used as the default landing path.
// Populated by calling Magento's /menu endpoint with the user's auth token.
const defaultLandingCache = new Map<string, { path: string; expires: number }>();
const LANDING_CACHE_TTL_MS = 60 * 60 * 1000;

async function getDefaultLandingPath(request: NextRequest, locale: string): Promise<string | null> {
    const cached = defaultLandingCache.get(locale);
    if (cached && cached.expires > Date.now()) return cached.path;

    try {
        const jwt = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET || "yoursecret",
            secureCookie: process.env.NODE_ENV === "production",
        });
        const accessToken = (jwt as any)?.accessToken;
        if (!accessToken) return null;

        const domain = process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com";
        const res = await fetch(`${domain}/rest/${locale}/V1/kleverapi/menu`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            cache: "no-store",
        });
        if (!res.ok) return null;

        const items = await res.json();
        if (!Array.isArray(items)) return null;

        // Pick the first menu item whose URL is a category page (ends with .html).
        for (const item of items) {
            const url = item?.url || "";
            if (typeof url === "string" && url.endsWith(".html")) {
                try {
                    const parsed = new URL(url);
                    const path = parsed.pathname;
                    defaultLandingCache.set(locale, { path, expires: Date.now() + LANDING_CACHE_TTL_MS });
                    return path;
                } catch { /* ignore */ }
            }
        }
    } catch { /* fall through */ }

    return null;
}

// CMS slug → Next.js page mapping. CMS pages have hand-written Next.js
// implementations, so we map Magento slugs to those routes.
const CMS_SLUG_TO_ROUTE: Record<string, string> = {
    "about": "/about",
    "about-us": "/about",
    "locations": "/locations",
    "branch-locations": "/locations",
    "branches": "/locations",
    "our-branches": "/locations",
    "contact": "/locations",
    "contact-us": "/locations",
    "guides": "/guides",
    "user-guides": "/guides",
    "tyre-guides": "/guides",
    "catalogue": "/catalogue",
    "catalog": "/catalogue",
    "product-catalogue": "/catalogue",
    "product-catalog": "/catalogue",
    "privacy-policy": "/privacy-policy",
    "privacy": "/privacy-policy",
    "return-exchange-policy": "/return-exchange-policy",
    "returns-exchange": "/return-exchange-policy",
    "terms-conditions": "/terms-conditions",
    "terms": "/terms-conditions",
    "terms-of-service": "/terms-conditions",
    // Account pages (Magento SEO slugs -> Next.js paths)
    "mystatement": "/customer/statement",
    "my-statement": "/customer/statement",
    "customer-account": "/my-account",
    "manage-accounts": "/customer/subaccounts/manage",
    "order-attachments": "/customer/order-attachments",
    "my-order-attachments": "/customer/order-attachments",
    "notifications": "/customer/notifications",
    "my-notifications": "/customer/notifications",
    "address-book": "/customer/address-book",
    "favourite-products": "/favorites",
    "favorite-products": "/favorites",
    "wishlist": "/favorites",
    "my-forecast": "/customer/forecast",
    "business-overview": "/customer/dashboard",
    "dashboard": "/customer/dashboard",
    "customertarget": "/customer/dashboard",
    "statement": "/customer/statement",
    "orders": "/my-orders",
    "sales": "/my-orders",
    "history": "/my-orders",
    "account": "/my-account",
    "usernotifications": "/customer/notifications",
    "orderupload": "/customer/order-attachments",
    "viewforcast": "/customer/forecast",
    "subaccounts": "/customer/subaccounts/manage",
    "manage": "/customer/subaccounts/manage",
};

async function resolveMagentoUrl(slugPath: string): Promise<ResolvedUrl> {
    const cached = urlResolutionCache.get(slugPath);
    if (cached) return cached;

    // 1. Quick CMS slug lookup — no network needed.
    const bare = slugPath.replace(/\.html$/, "");
    const segs = bare.split("/").filter(Boolean);

    // Check segments from most specific (right) to least specific (left)
    for (let i = segs.length - 1; i >= 0; i--) {
        const seg = segs[i];
        if (CMS_SLUG_TO_ROUTE[seg]) {
            const result: ResolvedUrl = { kind: "cms", nextjsPath: CMS_SLUG_TO_ROUTE[seg] };
            urlResolutionCache.set(slugPath, result);
            return result;
        }
    }

    // 2. GraphQL urlResolver — handles category URLs dynamically (no hardcoding).
    const domain = process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com";
    // urlResolver expects `.html` for category URLs; CMS pages may resolve without.
    const queryUrl = slugPath.endsWith(".html") ? slugPath : `${slugPath}.html`;
    try {
        const res = await fetch(`${domain}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: `{ urlResolver(url: "${queryUrl.replace(/"/g, '\\"')}") { type entity_uid } }`,
            }),
            cache: "no-store",
        });
        if (res.ok) {
            const data = await res.json();
            const r = data?.data?.urlResolver;
            if (r?.entity_uid && r.type === "CATEGORY") {
                let id = String(r.entity_uid);
                if (!/^\d+$/.test(id)) {
                    try {
                        id = Buffer.from(id, "base64").toString("utf-8");
                    } catch { }
                }
                if (/^\d+$/.test(id)) {
                    const result: ResolvedUrl = { kind: "category", categoryId: id };
                    urlResolutionCache.set(slugPath, result);
                    return result;
                }
            }
        }
    } catch { }

    const fallback: ResolvedUrl = { kind: "unknown" };
    urlResolutionCache.set(slugPath, fallback);
    return fallback;
}

// True if the first path segment is a known internal Next.js app route.
// These render as-is — we don't call urlResolver for them.
function isInternalAppRoute(firstSeg: string): boolean {
    return APP_ROUTES.has(firstSeg);
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── 1. Skip static assets & API routes ──────────────────────────────
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) {
        if (pathname.startsWith("/api")) {
            const clientLocale = request.headers.get("x-locale");
            const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
            const locale = (clientLocale && isValidLocale(clientLocale))
                ? clientLocale
                : (localeCookie && isValidLocale(localeCookie))
                    ? localeCookie
                    : DEFAULT_LOCALE;

            const requestHeaders = new Headers(request.headers);
            requestHeaders.set("x-locale", locale);
            return NextResponse.next({
                request: { headers: requestHeaders },
            });
        }
        return NextResponse.next();
    }

    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    // ── 2. No locale prefix → redirect to /{locale}/... ─────────────────
    if (!firstSegment || !isValidLocale(firstSegment)) {
        const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
        const localeToUse = (cookieLocale && isValidLocale(cookieLocale)) ? cookieLocale : DEFAULT_LOCALE;
        const url = request.nextUrl.clone();
        url.pathname = `/${localeToUse}${pathname === "/" ? "" : pathname}`;
        const response = NextResponse.redirect(url);
        response.cookies.set(LOCALE_COOKIE, localeToUse, {
            path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax",
        });
        return response;
    }

    // ── 3. Locale-prefixed URL ──────────────────────────────────────────
    const locale = firstSegment;
    const restSegments = segments.slice(1);
    const pathnameWithoutLocale = "/" + restSegments.join("/") || "/";

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", locale);

    const setLocaleCookie = (response: NextResponse) => {
        response.cookies.set(LOCALE_COOKIE, locale, {
            path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax",
        });
        return response;
    };

    // ── 3a. Root /{locale} → redirect to login or first Magento category ──
    if (pathnameWithoutLocale === "/") {
        const isAuthenticated = await checkAuth(request);
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.search = "";
        if (!isAuthenticated) {
            redirectUrl.pathname = `/${locale}/login`;
        } else {
            // Pull the first category URL dynamically from the Magento menu.
            // No hardcoded path — falls back to /login if nothing resolves.
            const landing = await getDefaultLandingPath(request, locale);
            redirectUrl.pathname = landing ?? `/${locale}/login`;
        }
        return NextResponse.redirect(redirectUrl);
    }

    const firstAfterLocale = restSegments[0];

    // ── 3b. Internal app routes (e.g. /login, /products, /cart) ─────────
    // These render directly without any URL resolution.
    if (firstAfterLocale && isInternalAppRoute(firstAfterLocale)) {
        const url = request.nextUrl.clone();
        url.pathname = pathnameWithoutLocale;
        const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
        setLocaleCookie(response);

        if (PUBLIC_ROUTES.some((r) => pathnameWithoutLocale.startsWith(r))) {
            return response;
        }
        const isAuthenticated = await checkAuth(request);
        if (!isAuthenticated) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = `/${locale}/login`;
            loginUrl.search = "";
            loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
            return NextResponse.redirect(loginUrl);
        }
        return response;
    }

    // ── 3c. Magento SEO URL — resolve to category or CMS page ───────────
    const slugPath = pathnameWithoutLocale.replace(/^\//, "");
    const resolved = await resolveMagentoUrl(slugPath);

    if (resolved.kind === "category") {
        const url = request.nextUrl.clone();
        url.pathname = "/products";
        url.searchParams.set("categoryId", resolved.categoryId);
        const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
        setLocaleCookie(response);

        const isAuthenticated = await checkAuth(request);
        if (!isAuthenticated) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = `/${locale}/login`;
            loginUrl.search = "";
            loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
            return NextResponse.redirect(loginUrl);
        }
        return response;
    }

    if (resolved.kind === "cms") {
        const url = request.nextUrl.clone();
        url.pathname = resolved.nextjsPath;
        const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
        setLocaleCookie(response);
        return response;
    }

    // ── 3d. Unknown — fall through to default Next.js routing ───────────
    const url = request.nextUrl.clone();
    url.pathname = pathnameWithoutLocale;
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    setLocaleCookie(response);
    return response;
}

async function checkAuth(request: NextRequest): Promise<boolean> {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET || "yoursecret",
            secureCookie: process.env.NODE_ENV === "production",
        });
        if (!token?.accessToken || token?.error === "MagentoTokenExpired") return false;
        if (token.magentoTokenExp) {
            const now = Math.floor(Date.now() / 1000);
            if (now >= (token.magentoTokenExp as number)) return false;
        }
        return true;
    } catch { }
    return false;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|logo|images).*)",
    ],
};
