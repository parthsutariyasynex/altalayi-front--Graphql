import { NextRequest } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_CATEGORY_FILTER_OPTIONS_FROM_PRODUCTS_QUERY } from "@/src/graphql/queries";

// Layered-navigation filter options for a category, served via Magento GraphQL.
// This is the filters-only counterpart to /api/category-products — fetching them
// separately lets the products list and the filter sidebar load in parallel
// instead of one slow combined call.
//
// Backed by kleverCategoryProducts(pageSize: 1){ filters } rather than
// kleverCategoryFilterOptions: the latter omits the category-wide `offers` group
// (which the sidebar shows) and is measurably slower. pageSize:1 keeps the product
// payload negligible while the resolver returns the full category-wide filter set.
// The query const lives in src/graphql/queries.ts.

// GraphQL filter `code` → the snake_case codes the frontend expects
// (kept identical to the normalization in /api/category-products).
function normalizeCode(code: string): string {
    switch (code) {
        case "tyreSize": return "tyre_size";
        case "color": return "tyre_size";
        case "productGroup": return "product_group";
        case "warrantyPeriod": return "warranty_period";
        case "newArrivals": return "new_arrivals";
        case "manufacturer": return "origin";
        case "mgs_brand": return "brand";
        default: return code; // itemCode, brand, pattern, year, origin, types, oemMarking, offers
    }
}

// ── Short-lived response cache (the resolver is slow ~10s) ───────────────────
// Keyed by locale + auth token + categoryId. Token is included because counts
// can reflect customer-group visibility; never share entries across customers.
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const responseCache = new Map<string, { body: string; expires: number }>();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        if (!categoryId || !/^\d+$/.test(categoryId)) {
            return Response.json({ error: "categoryId (numeric) is required" }, { status: 400 });
        }

        const token = await getRequestToken(request);
        const locale = getLocaleFromRequest(request);

        // ── Cache lookup ─────────────────────────────────────────────────
        const now = Date.now();
        const cacheKey = `${locale}|${token || "guest"}|${categoryId}`;
        const cached = responseCache.get(cacheKey);
        if (cached && cached.expires > now) {
            console.log("[category-filter-options] cache HIT", cacheKey);
            return new Response(cached.body, {
                headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Cache": "HIT" },
            });
        }

        const domain = process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com";
        console.log("[category-filter-options] GraphQL categoryId:", categoryId, "locale:", locale);

        const res = await fetch(`${domain}/graphql`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: locale,
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
                query: KLEVER_CATEGORY_FILTER_OPTIONS_FROM_PRODUCTS_QUERY,
                variables: { categoryId: parseInt(categoryId, 10) },
            }),
            cache: "no-store",
        });

        const json = await res.json();

        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("category-filter-options error:", JSON.stringify(json.errors).slice(0, 500));
            return Response.json({ error: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }

        const result = json?.data?.kleverCategoryProducts;
        if (!result) {
            return Response.json(
                { error: "Magento GraphQL error", message: "Empty filter-options response" },
                { status: 502 }
            );
        }

        // Normalize filter codes to what the frontend expects.
        const filters = Array.isArray(result.filters)
            ? result.filters.map((f: any) => ({ ...f, code: normalizeCode(f.code || f.attribute_code) }))
            : [];

        const responseBody = JSON.stringify({ filters });

        // Store in cache + bound memory.
        responseCache.set(cacheKey, { body: responseBody, expires: now + CACHE_TTL_MS });
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
        console.error("category-filter-options route error:", error.message);
        return Response.json(
            { error: "Failed to fetch filter options", message: error.message },
            { status: 500 }
        );
    }
}
