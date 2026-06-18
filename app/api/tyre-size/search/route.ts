import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_CATEGORY_PRODUCTS_ONLY_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// Default tyre category (matches the products page fallback) — kleverCategoryProducts requires a
// categoryId; the tyre-size filters (width/height/rim) narrow within it.
const DEFAULT_TYRE_CATEGORY_ID = 5;

// GET — tyre-size product search via GraphQL kleverCategoryProducts(categoryId, width/height/rim).
// Replaces the REST /tyre-size/search/{w}/{h}/{r}. Returns { products, total_count }.
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const width = searchParams.get("width") || "";
    const height = searchParams.get("height") || "";
    const rim = searchParams.get("rim") || "";
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10) || 20;
    const categoryId = parseInt(searchParams.get("categoryId") || "", 10) || DEFAULT_TYRE_CATEGORY_ID;

    if (!width && !height && !rim) {
        return NextResponse.json(
            { error: "Missing required parameters: at least one of width, height, or rim must be provided." },
            { status: 400 }
        );
    }

    try {
        const token = await getRequestToken(request);
        const variables: Record<string, any> = { categoryId, pageSize, currentPage: page };
        if (width) variables.width = width;
        if (height) variables.height = height;
        if (rim) variables.rim = rim;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Store: getLocaleFromRequest(request),
        };
        if (token && token !== "null") headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers,
            body: JSON.stringify({ query: KLEVER_CATEGORY_PRODUCTS_ONLY_QUERY, variables }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[tyre-size/search] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ error: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }

        const result = json?.data?.kleverCategoryProducts;
        return NextResponse.json({
            products: Array.isArray(result?.products) ? result.products : [],
            total_count: result?.total_count ?? 0,
        });
    } catch (err: any) {
        console.error("[tyre-size/search] error:", err.message);
        return NextResponse.json(
            { error: "Failed to fetch tyre size search results", message: err.message },
            { status: 500 }
        );
    }
}
