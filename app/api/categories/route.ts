import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { KLEVER_CATEGORY_PRODUCTS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// Optional string filters forwarded verbatim to kleverCategoryProducts.
const STRING_PARAMS = [
    "searchQuery", "sortBy", "sortOrder", "partsCategory", "itemCode", "brand",
    "productGroup", "tyreSize", "color", "width", "height", "rim", "pattern",
    "warrantyPeriod", "offers", "year", "origin", "manufacturer", "types",
    "runflat", "oemMarking", "newArrivals",
] as const;

// GET — category products + layered-nav filters (GraphQL: kleverCategoryProducts).
// Replaces the REST /category-products proxy. categoryId comes from ?categoryId=
// (the backend requires it), with optional paging/price/filter params. Returns
// { total_count, page_size, current_page, total_pages, products[...], filters[...] }.
export async function GET(request: NextRequest) {
    const session: any = await getServerSession(authOptions);
    const token = session?.accessToken;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sp = new URL(request.url).searchParams;
    const categoryId = sp.get("categoryId");
    if (!categoryId) {
        return NextResponse.json({ message: "Category ID is required." }, { status: 400 });
    }

    const variables: Record<string, any> = { categoryId: parseInt(categoryId, 10) };
    if (sp.get("pageSize")) variables.pageSize = parseInt(sp.get("pageSize")!, 10);
    if (sp.get("currentPage")) variables.currentPage = parseInt(sp.get("currentPage")!, 10);
    if (sp.get("minPrice")) variables.minPrice = parseFloat(sp.get("minPrice")!);
    if (sp.get("maxPrice")) variables.maxPrice = parseFloat(sp.get("maxPrice")!);
    for (const key of STRING_PARAMS) {
        const v = sp.get(key);
        if (v != null && v !== "") variables[key] = v;
    }

    try {
        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_CATEGORY_PRODUCTS_QUERY, variables }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[categories] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to load categories" }, { status: 400 });
        }
        return NextResponse.json(json?.data?.kleverCategoryProducts ?? {});
    } catch (error: any) {
        console.error("[categories] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
