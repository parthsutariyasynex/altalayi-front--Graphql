import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import {
    KLEVER_CATEGORY_PRODUCTS_WITH_FILTERS_QUERY,
    KLEVER_CATEGORY_PRODUCTS_ONLY_QUERY,
} from "@/src/graphql/queries";

// GraphQL queries backing this route (kleverCategoryProducts) live in queries.ts:
//  - KLEVER_CATEGORY_PRODUCTS_WITH_FILTERS_QUERY: products + layered-nav filters
//  - KLEVER_CATEGORY_PRODUCTS_ONLY_QUERY: products only (faster; filters fetched separately)

// ── Short-lived response cache ───────────────────────────────────────────────
// The backend kleverCategoryProducts resolver is slow (~10-20s) because it scans
// the whole category collection to build layered-nav counts. We cache the final,
// normalized response body for a short window so repeat navigations are instant.
//
// IMPORTANT: the response includes customer-specific pricing (customer_price /
// customer_group_price), so the key includes the auth token — entries are never
// shared across customers. Guests share a "guest" bucket.
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const responseCache = new Map<string, { body: string; expires: number }>();

export async function GET(request: NextRequest) {
    try {
        // Step 1: Get token - try multiple methods
        let token: string | null = null;

        // Method 1: Authorization header from client
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).replace(/['"]/g, "").trim();
            console.log("[category-products] Token from Auth header:", token ? "found" : "missing");
        }

        // Method 2: NextAuth JWT from cookie (most reliable on Vercel)
        if (!token) {
            try {
                const jwtToken = await getToken({
                    req: request,
                    secret: process.env.NEXTAUTH_SECRET,
                });
                token = (jwtToken as any)?.accessToken || null;
                console.log("[category-products] Token from JWT cookie:", token ? "found" : "missing");
            } catch (e) {
                console.error("[category-products] JWT token error:", e);
            }
        }

        // Method 4: auth-token cookie directly
        if (!token) {
            token = request.cookies.get("auth-token")?.value || null;
            if (token) {
                token = token.replace(/['"]/g, "").trim();
                console.log("[category-products] Token from auth-token cookie:", token ? "found" : "missing");
            }
        }

        // Final check: if token is invalid string, clear it
        if (token === "null" || token === "undefined" || !token) {
            token = null;
        }

        // Note: For some anonymous endpoints, we might want to continue even without a token.
        // But here we'll keep the check if the app requires login to see products.
        if (!token) {
            console.warn("[category-products] No token found. Proceeding as guest if allowed by Magento.");
        }

        // Step 2: Handle search parameters
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        if (!categoryId) {
            return new Response(JSON.stringify({ error: "categoryId is required" }), { status: 400 });
        }
        const page = searchParams.get("page") || "1";
        const pageSize = searchParams.get("pageSize") || "20";
        // When true, skip the (slow) layered-nav filter computation — filters are
        // fetched separately via /api/category-filter-options. Roughly halves latency.
        const productsOnly = searchParams.get("productsOnly") === "1";

        // Group parameters: Magento's layered navigation uses key[0]=v1. 
        // We want to group these into key=v1,v2 for the category-products JSON API.
        const groupedParams: Record<string, string[]> = {};
        searchParams.forEach((value, key) => {
            const baseKey = key.includes("[") ? key.split("[")[0] : key;
            if (!groupedParams[baseKey]) groupedParams[baseKey] = [];
            if (!groupedParams[baseKey].includes(value)) groupedParams[baseKey].push(value);
        });

        // Step 3: Map incoming layered-nav params to kleverCategoryProducts GraphQL args.
        const variables: Record<string, any> = {
            categoryId: parseInt(categoryId, 10),
            currentPage: parseInt(page, 10) || 1,
            pageSize: parseInt(pageSize, 10) || 20,
        };

        const sortByParam = searchParams.get("sortBy");
        if (sortByParam) variables.sortBy = sortByParam;
        const sortOrderParam = searchParams.get("sortOrder");
        if (sortOrderParam) variables.sortOrder = sortOrderParam;

        // Frontend filter key → GraphQL argument name (the resolver mirrors the
        // old REST attributes: tyre size = `color`, etc.).
        const argMap: Record<string, string> = {
            brand: "brand",
            origin: "origin",
            manufacturer: "manufacturer",
            tyre_size: "color",
            product_group: "productGroup",
            warranty_period: "warrantyPeriod",
            new_arrivals: "newArrivals",
            newArrivals: "newArrivals",
            item_code: "itemCode",
            itemCode: "itemCode",
            oem_marking: "oemMarking",
            oemMarking: "oemMarking",
            pattern: "pattern",
            year: "year",
            types: "types",
            offers: "offers",
            width: "width",
            height: "height",
            rim: "rim",
            runflat: "runflat",
            parts_category: "partsCategory",
            partsCategory: "partsCategory",
            searchQuery: "searchQuery",
            minPrice: "minPrice",
            maxPrice: "maxPrice",
        };
        const floatArgs = new Set(["minPrice", "maxPrice"]);
        // Params consumed elsewhere / not resolver filter args.
        const reservedKeys = new Set(["categoryId", "page", "pageSize", "sortBy", "sortOrder", "is_ajax", "lang"]);

        Object.entries(groupedParams).forEach(([key, values]) => {
            if (reservedKeys.has(key)) return;
            const arg = argMap[key];
            if (!arg) return; // ignore params the resolver doesn't accept

            const combined = values
                .flatMap((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .join(",");

            if (combined) {
                variables[arg] = floatArgs.has(arg) ? parseFloat(combined) : combined;
            }
        });

        // Debug: log what locale the API route receives
        const xLocaleHeader = request.headers.get("x-locale");
        const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
        const referer = request.headers.get("referer") || "";
        const langParam = new URL(request.url).searchParams.get("lang");
        const resolvedLocale = getLocaleFromRequest(request);
        console.log("[category-products] LOCALE DEBUG: lang=" + langParam + " header=" + xLocaleHeader + " cookie=" + localeCookie + " resolved=" + resolvedLocale + " referer=" + referer);

        // ── Cache lookup ─────────────────────────────────────────────────
        const now = Date.now();
        const cacheKey = `${resolvedLocale}|${token || "guest"}|${productsOnly ? "po" : "full"}|${JSON.stringify(variables)}`;
        const cached = responseCache.get(cacheKey);
        if (cached && cached.expires > now) {
            console.log("[category-products] cache HIT", cacheKey);
            return new Response(cached.body, {
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                    "X-Cache": "HIT",
                },
            });
        }

        // Fetch products via Magento GraphQL (kleverCategoryProducts) instead of REST.
        const domain = process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com";
        console.log("[category-products] GraphQL variables:", JSON.stringify(variables));

        const res = await fetch(`${domain}/graphql`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Select store view for locale (mirrors the old /rest/{locale}/ path).
                Store: resolvedLocale,
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ query: productsOnly ? KLEVER_CATEGORY_PRODUCTS_ONLY_QUERY : KLEVER_CATEGORY_PRODUCTS_WITH_FILTERS_QUERY, variables }),
            cache: "no-store",
        });

        const json = await res.json();

        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("kleverCategoryProducts error:", JSON.stringify(json.errors).slice(0, 500));
            return Response.json(
                { error: "Magento GraphQL error", details: json.errors },
                { status: 502 }
            );
        }

        const result = json?.data?.kleverCategoryProducts;
        if (!result) {
            return Response.json(
                { error: "Magento GraphQL error", message: "Empty kleverCategoryProducts response" },
                { status: 502 }
            );
        }

        // Shape into the structure the rest of this route (and the frontend) expects.
        const data: any = {
            products: Array.isArray(result.products) ? result.products : [],
            filters: Array.isArray(result.filters) ? result.filters : [],
            total_count: result.total_count,
            page_size: result.page_size,
            current_page: result.current_page,
            total_pages: result.total_pages,
        };

        // ── Normalize Filter Keys ── (skipped in products-only mode)
        if (!productsOnly && Array.isArray(data.filters)) {
            data.filters = data.filters.map((f: any) => {
                let code = f.code || f.attribute_code;

                // Map backend keys to what the frontend expects
                if (code === "color") code = "tyre_size";
                if (code === "manufacturer") code = "origin";
                if (code === "mgs_brand") code = "brand";
                if (code === "productGroup") code = "product_group";
                if (code === "warrantyPeriod") code = "warranty_period";
                if (code === "newArrivals") code = "new_arrivals";

                return { ...f, code };
            });
        }

        // ── Dynamic Offers Filter Injection ── (skipped in products-only mode;
        // the products page derives the offers group client-side instead)
        const products = Array.isArray(data.products) ? data.products : (Array.isArray(data.items) ? data.items : []);

        if (!productsOnly && products.length > 0) {
            // Collect unique offers from the products array
            const offerValues = products
                .map((p: any) => p.offer)
                .filter((v: any): v is string => typeof v === 'string' && v.trim().length > 0);

            const uniqueOffers: string[] = Array.from(new Set(offerValues));

            if (uniqueOffers.length > 0) {
                // Count products per offer for the filter counts
                const offerCounts: Record<string, number> = {};
                offerValues.forEach((v: string) => {
                    offerCounts[v] = (offerCounts[v] || 0) + 1;
                });

                const locale = getLocaleFromRequest(request);
                // Create the synthetic filter group
                const offersFilter = {
                    code: "offers",
                    label: locale === "ar" ? "العروض والترقيات" : "Promotions and Offers",
                    record_count: uniqueOffers.length,
                    options: uniqueOffers.map((offer: string) => ({
                        value: offer,
                        label: offer,
                        count: offerCounts[offer]
                    }))
                };

                // Ensure data.filters exists
                if (!Array.isArray(data.filters)) {
                    data.filters = [];
                }

                // Check if already exists to avoid duplicates
                const hasOffers = data.filters.some((f: any) => f.code === "offers" || f.code === "promotions_and_offers");

                if (!hasOffers) {
                    // Find index of itemCode to insert after it, or push to start
                    const itemCodeIndex = data.filters.findIndex((f: any) => f.code === "itemCode" || f.code === "item_code");
                    if (itemCodeIndex !== -1) {
                        data.filters.splice(itemCodeIndex + 1, 0, offersFilter);
                    } else {
                        data.filters.unshift(offersFilter);
                    }
                }
            }
        }

        // Extract total count and other fields from the original response
        const totalCount = typeof data.total_count === "number" ? data.total_count : products.length;
        const finalFilters = Array.isArray(data.filters) ? data.filters : [];

        // Return the clean, normalized structure requested.
        const responseBody = JSON.stringify({
            ...data,
            products: products,
            total_count: totalCount,
            filters: finalFilters
        });

        // Store in the short-lived cache so repeat navigations skip the slow backend.
        responseCache.set(cacheKey, { body: responseBody, expires: now + CACHE_TTL_MS });
        // Bound memory: sweep expired entries when the map grows.
        if (responseCache.size > 200) {
            for (const [k, v] of responseCache) {
                if (v.expires <= now) responseCache.delete(k);
            }
        }

        return new Response(responseBody, {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "X-Cache": "MISS",
            },
        });

    } catch (error: any) {
        console.error("category-products route error:", error.message);
        return Response.json(
            { error: "Failed to fetch products", message: error.message },
            { status: 500 }
        );
    }
}
