import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";

// Extracts a navigable path from an absolute Magento URL.
// Keeps the full pathname (including locale prefix) and only strips
// the .html extension so Next.js can route to the correct page.
// The middleware handles Magento-style paths → Next.js route rewrites.
//
// Examples:
//   "https://autoono-demo.btire.com/en/products?category=5" → "/en/products?category=5"
//   "https://autoono-demo.btire.com/en/all-tyres.html"      → "/en/all-tyres"
//   "https://autoono-demo.btire.com/ar/lubricants.html"     → "/ar/lubricants"
function magentoUrlToPath(url: string): string {
    if (!url) return "#";
    try {
        const parsed = new URL(url);
        const path = parsed.pathname.replace(/\.html$/, "");
        const search = parsed.search;
        return (path || "#") + search;
    } catch {
        return url;
    }

}

// ── Caches ───────────────────────────────────────────────────────────────────

// Menu items keyed by locale — serves unauthenticated pages from the last
// successful live-API fetch (dynamic data, never static).
const menuCache = new Map<string, { items: any[]; expires: number }>();
const MENU_CACHE_TTL_MS = 60 * 60 * 1000; // 60 min

// Service-account token cache — avoids a Magento login on every request.
let serviceTokenCache: { token: string; expires: number } | null = null;
const SERVICE_TOKEN_TTL_MS = 50 * 60 * 1000; // 50 min (Magento tokens expire in 1 h)

/**
 * Returns a token for calling the menu API on behalf of unauthenticated users.
 * Tries (in order):
 *   1. MAGENTO_MENU_TOKEN  — a long-lived integration token you paste directly
 *   2. MAGENTO_SERVICE_EMAIL + MAGENTO_SERVICE_PASSWORD — dynamic login via
 *      the Klever API /login/email endpoint (same as the app's auth flow), cached 50 min
 */
async function getServiceToken(baseUrl: string): Promise<string | null> {
    // 1. Direct long-lived token from env (Magento Admin → System → Integrations)
    if (process.env.MAGENTO_MENU_TOKEN) return process.env.MAGENTO_MENU_TOKEN;

    // 2. Return the cached dynamic token if still valid
    if (serviceTokenCache && serviceTokenCache.expires > Date.now()) {
        return serviceTokenCache.token;
    }

    // 3. Fetch a fresh token using the same Klever API login the app uses
    const email = process.env.MAGENTO_SERVICE_EMAIL;
    const password = process.env.MAGENTO_SERVICE_PASSWORD;
    if (!email || !password) return null;

    try {
        // Uses the same endpoint and body shape as auth-options.ts
        const res = await fetch(`${baseUrl}/login/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            cache: "no-store",
        });
        if (!res.ok) {
            console.warn("[menu] Service account login failed:", res.status);
            return null;
        }
        const raw = await res.json();
        const token: string | null =
            typeof raw === "string" ? raw : (raw?.token ?? raw?.customer?.token ?? null);
        if (!token) return null;

        serviceTokenCache = { token, expires: Date.now() + SERVICE_TOKEN_TTL_MS };
        console.log("[menu] Service account token refreshed dynamically");
        return token;
    } catch (err: any) {
        console.error("[menu] Service account login error:", err.message);
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const BASE_URL = getBaseUrl(request);

        // Resolve locale key for cache bucketing
        const xLocale = request.headers.get("x-locale") || "";
        const cacheKey = xLocale || "default";

        let token = await getRequestToken(request);

        // No user token — try service account (dynamic, never static)
        if (!token) {
            token = await getServiceToken(BASE_URL);
        }

        // Still no token — serve from cache (populated by prior authenticated requests)
        if (!token) {
            const cached = menuCache.get(cacheKey);
            if (cached && cached.expires > Date.now()) {
                console.log(`[menu] No token — serving cached menu (locale=${cacheKey})`);
                return new Response(JSON.stringify(cached.items), {
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "no-store, no-cache, must-revalidate",
                    },
                });
            }

            // Last resort — try fetching from Magento as a guest (no auth token).
            // Some Magento/Klever API endpoints allow unauthenticated catalog access.
            // If this succeeds, populate the cache so subsequent requests are instant.
            try {
                console.log("[menu] Attempting guest fetch from Magento...");
                const guestRes = await fetch(`${BASE_URL}/menu`, {
                    headers: { "Content-Type": "application/json" },
                    cache: "no-store",
                });
                if (guestRes.ok) {
                    const guestData = await guestRes.json();
                    const rawItems = Array.isArray(guestData) ? guestData : [];
                    if (rawItems.length > 0) {
                        const mapMenuItem = (item: any): any => {
                            const categoryId = item.category_id ?? item.categoryId ?? null;
                            const mapped: any = {
                                code: item.code,
                                label: item.label,
                                href: magentoUrlToPath(item.url || ""),
                                magentoUrl: item.url || "",
                                categoryId: categoryId != null ? String(categoryId) : null,
                                sort_order: item.sort_order,
                                is_visible: item.is_visible !== false,
                            };
                            if (Array.isArray(item.children) && item.children.length > 0) {
                                mapped.children = item.children
                                    .filter((c: any) => c.is_visible !== false)
                                    .map(mapMenuItem);
                            }
                            return mapped;
                        };
                        const items = rawItems
                            .filter((item: any) => item.is_visible !== false)
                            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                            .map(mapMenuItem);
                        menuCache.set(cacheKey, { items, expires: Date.now() + MENU_CACHE_TTL_MS });
                        console.log(`[menu] Guest fetch succeeded — ${items.length} items cached`);
                        return new Response(JSON.stringify(items), {
                            headers: {
                                "Content-Type": "application/json",
                                "Cache-Control": "no-store, no-cache, must-revalidate",
                            },
                        });
                    }
                }
            } catch (guestErr: any) {
                console.warn("[menu] Guest fetch failed:", guestErr.message);
            }

            console.warn("[menu] No token, no cache, guest fetch failed — returning empty menu");
            return new Response(JSON.stringify([]), {
                headers: { "Content-Type": "application/json" },
            });
        }

        const res = await fetch(`${BASE_URL}/menu`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            // On 401, try the cache before giving up
            const cached = menuCache.get(cacheKey);
            if (cached && cached.expires > Date.now()) {
                console.log(`[menu] Magento 401 — serving cached menu for locale="${cacheKey}"`);
                return new Response(JSON.stringify(cached.items), {
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "no-store, no-cache, must-revalidate",
                    },
                });
            }

            const errBody = await res.text();
            console.error("[menu] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Failed to fetch menu" }, { status: res.status });
        }

        const data = await res.json();
        const rawItems = Array.isArray(data) ? data : [];

        // Recursive mapper to handle children and URL mapping
        const mapMenuItem = (item: any): any => {
            // Use only category_id and categoryId from the API — not entity_id/id which
            // are the menu-entity IDs and do not correspond to product categories.
            const categoryId = item.category_id ?? item.categoryId ?? null;
            const mapped = {
                code: item.code,
                label: item.label,
                // href is derived exclusively from the API-provided URL.
                // magentoUrlToPath extracts the pathname (with locale prefix) and
                // strips .html so the middleware can route to the right Next.js page.
                href: magentoUrlToPath(item.url || ""),
                magentoUrl: item.url || "",
                categoryId: categoryId != null ? String(categoryId) : null,
                sort_order: item.sort_order,
                is_visible: item.is_visible !== false,
            } as any;

            if (Array.isArray(item.children) && item.children.length > 0) {
                mapped.children = item.children
                    .filter((child: any) => child.is_visible !== false)
                    .map(mapMenuItem);
            }

            return mapped;
        };

        const items = rawItems
            .filter((item: any) => item.is_visible !== false)
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            .map(mapMenuItem);

        // Populate cache so unauthenticated pages get live data
        menuCache.set(cacheKey, { items, expires: Date.now() + MENU_CACHE_TTL_MS });

        return new Response(JSON.stringify(items), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        });
    } catch (error: any) {
        console.error("[menu] Route error:", error.message);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}
