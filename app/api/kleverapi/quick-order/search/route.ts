import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_QUICK_ORDER_SEARCH_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — quick-order product search (GraphQL: kleverQuickOrderSearch).
// Returns { items: [{ product_id, sku, name, price, image_url, is_in_stock }], total_count }.
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") || "";
        const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

        // Preserve the existing short-query guard.
        if (!query || query.length < 2) {
            return NextResponse.json({ items: [], total_count: 0 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_QUICK_ORDER_SEARCH_QUERY, variables: { query, pageSize } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[quick-order/search] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ error: "Search failed", details: json.errors }, { status: 502 });
        }

        const r = json?.data?.kleverQuickOrderSearch;
        return NextResponse.json({
            items: Array.isArray(r?.items) ? r.items : [],
            total_count: r?.total_count ?? 0,
        });
    } catch (error: any) {
        console.error("[quick-order/search] error:", error.message);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
