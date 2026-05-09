import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";

// Returns the Magento URL's pathname + search as-is, preserving `.html` and
// the original CMS slug. The middleware resolves these to internal Next.js
// pages without changing the browser URL, so the navbar can link directly
// to Magento SEO URLs.
function magentoUrlToPath(url: string): string {
    if (!url) return "#";
    try {
        const parsed = new URL(url);
        return (parsed.pathname || "#") + parsed.search;
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

// Category-tree cache: maps "url_path" → category_id, fetched once per hour.
// This lets the menu route translate URLs like "all-tyres/car-tyres" → category id
// dynamically, so the frontend never needs a hardcoded categoryId.
const categoryMapCache = new Map<string, { map: Map<string, string>; expires: number }>();
const CATEGORY_MAP_TTL_MS = 60 * 60 * 1000;

// Walks a Magento category-tree node recursively and builds a url_path → id map.
function indexCategoryTree(
    node: any,
    parentPath: string,
    out: Map<string, string>,
): void {
    if (!node || typeof node !== "object") return;

    const id = node.id ?? node.entity_id;
    const urlKey =
        node.url_key ??
        node.custom_attributes?.find((a: any) => a.attribute_code === "url_key")?.value;
    const explicitUrlPath =
        node.url_path ??
        node.custom_attributes?.find((a: any) => a.attribute_code === "url_path")?.value;

    let path = "";
    if (explicitUrlPath) {
        path = String(explicitUrlPath).replace(/^\/+|\/+$/g, "");
    } else if (urlKey) {
        path = parentPath ? `${parentPath}/${urlKey}` : String(urlKey);
    }

    if (id != null && path) {
        out.set(path, String(id));
    }

    const children = node.children_data ?? node.children ?? [];
    if (Array.isArray(children)) {
        for (const child of children) indexCategoryTree(child, path, out);
    }
}

// Resolves URLs → category IDs by calling Magento GraphQL urlResolver per URL.
// This is publicly accessible (no auth/admin required) and is Magento's standard way.
async function resolveUrlsViaGraphQL(
    klverBase: string,
    urlPaths: string[],
): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (urlPaths.length === 0) return map;

    // klverBase is like "https://altalayi-demo.btire.com/rest/en/V1/kleverapi"
    // GraphQL endpoint sits at the domain root: "https://<host>/graphql"
    const u = new URL(klverBase);
    const graphqlUrl = `${u.protocol}//${u.host}/graphql`;

    // Build batched query: one urlResolver alias per URL path.
    // Magento's urlResolver expects the .html suffix; bare paths return null.
    const aliases = urlPaths.map((p, i) => {
        const withHtml = p.endsWith(".html") ? p : `${p}.html`;
        const safe = withHtml.replace(/"/g, '\\"');
        return `r${i}: urlResolver(url: "${safe}") { type entity_uid relative_url }`;
    });
    const query = `{ ${aliases.join(" ")} }`;

    try {
        const res = await fetch(graphqlUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
            cache: "no-store",
        });
        if (!res.ok) {
            console.warn(`[menu] GraphQL urlResolver → HTTP ${res.status}`);
            return map;
        }
        const json = await res.json();
        const data = json?.data || {};
        urlPaths.forEach((p, i) => {
            const entry = data[`r${i}`];
            const uid = entry?.entity_uid;
            const type = entry?.type;
            if (!uid || !type || (type !== "CATEGORY" && type !== "CMS_PAGE")) return;
            // GraphQL entity_uid is base64-encoded category id (Magento 2.4+)
            // First try as plain integer, then try base64-decoded value
            let id: string | null = null;
            if (/^\d+$/.test(uid)) id = uid;
            else {
                try {
                    const decoded = Buffer.from(uid, "base64").toString("utf-8");
                    if (/^\d+$/.test(decoded)) id = decoded;
                } catch { }
            }
            if (id) map.set(p, id);
        });
    } catch (err: any) {
        console.warn(`[menu] GraphQL urlResolver failed:`, err?.message || err);
    }
    return map;
}

// Fetches/builds the URL → categoryId map. Tries:
//  1. Klever REST /categories
//  2. Klever REST /category-list
//  3. Standard Magento REST /V1/categories (admin auth required)
//  4. Magento GraphQL urlResolver (always public)
async function getCategoryMap(
    klverBase: string,
    locale: string,
    token: string | null,
    menuUrlPaths: string[] = [],
): Promise<Map<string, string>> {
    const cached = categoryMapCache.get(locale);
    if (cached && cached.expires > Date.now()) return cached.map;

    const standardBase = klverBase.replace(/\/kleverapi$/, "");
    const candidates = [
        `${klverBase}/categories`,
        `${klverBase}/category-list`,
        `${standardBase}/categories`,
    ];

    if (token) {
        for (const url of candidates) {
            try {
                const res = await fetch(url, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                });
                if (!res.ok) {
                    console.warn(`[menu] Category endpoint ${url} → HTTP ${res.status}`);
                    continue;
                }
                const data = await res.json();
                const map = new Map<string, string>();
                if (Array.isArray(data?.items)) {
                    for (const item of data.items) indexCategoryTree(item, "", map);
                } else {
                    indexCategoryTree(data, "", map);
                }
                if (map.size > 0) {
                    categoryMapCache.set(locale, { map, expires: Date.now() + CATEGORY_MAP_TTL_MS });
                    console.log(`[menu] Category map loaded from ${url}: ${map.size} entries`);
                    return map;
                }
            } catch (err: any) {
                console.warn(`[menu] Category fetch failed at ${url}:`, err?.message || err);
            }
        }
    }

    // Fallback: GraphQL urlResolver — public, batches lookups for the menu's URLs only
    if (menuUrlPaths.length > 0) {
        const map = await resolveUrlsViaGraphQL(klverBase, menuUrlPaths);
        if (map.size > 0) {
            categoryMapCache.set(locale, { map, expires: Date.now() + CATEGORY_MAP_TTL_MS });
            console.log(`[menu] Category map built via GraphQL urlResolver: ${map.size} entries`);
            console.log(`[menu] Sample entries:`, Array.from(map.entries()).slice(0, 5));
            return map;
        }
    }

    console.warn(`[menu] All category resolution methods failed — categoryId unavailable`);
    return new Map();
}

// Extracts the URL slug path from a Magento menu URL.
//   "https://x.com/en/all-tyres/car-tyres.html" → "all-tyres/car-tyres"
function extractUrlSlugPath(menuUrl: string): string {
    try {
        const parsed = new URL(menuUrl);
        const pathname = parsed.pathname.replace(/\.html$/, "");
        const segments = pathname.split("/").filter(Boolean);
        const hasLocale = segments[0] === "en" || segments[0] === "ar";
        const slug = hasLocale ? segments.slice(1) : segments;
        return slug.join("/");
    } catch {
        return "";
    }
}

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

        // Collect every URL path from the raw menu so the GraphQL fallback can batch-resolve them.
        const collectUrlPaths = (item: any, out: string[] = []): string[] => {
            const slug = extractUrlSlugPath(item?.url || "");
            if (slug) out.push(slug);
            if (Array.isArray(item?.children)) {
                for (const c of item.children) collectUrlPaths(c, out);
            }
            return out;
        };
        const allUrlPaths = Array.from(new Set(rawItems.flatMap((i: any) => collectUrlPaths(i))));

        // Magento's /menu endpoint omits category_id, so we resolve each URL → categoryId
        // dynamically. Tries REST category endpoints first, then GraphQL urlResolver.
        const categoryMap = await getCategoryMap(BASE_URL, cacheKey, token, allUrlPaths);

        const resolveCategoryId = (item: any): string | null => {
            const direct = item.category_id ?? item.categoryId;
            if (direct != null) return String(direct);
            const slug = extractUrlSlugPath(item.url || "");
            if (!slug) return null;
            // Try full path first, then progressively shorter parents
            const segs = slug.split("/").filter(Boolean);
            for (let i = segs.length; i > 0; i--) {
                const probe = segs.slice(0, i).join("/");
                const id = categoryMap.get(probe);
                if (id) return id;
            }
            // Final fallback: try the leaf slug alone
            const leaf = segs[segs.length - 1];
            return leaf ? categoryMap.get(leaf) ?? null : null;
        };

        const mapMenuItem = (item: any): any => {
            const categoryId = resolveCategoryId(item);
            const mapped = {
                code: item.code,
                label: item.label,
                href: magentoUrlToPath(item.url || ""),
                magentoUrl: item.url || "",
                categoryId,
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
