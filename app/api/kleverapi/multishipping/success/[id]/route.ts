import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_MULTISHIPPING_SUCCESS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — multi-shipping order-success summary (GraphQL: kleverMultishippingSuccess).
// The [id] path segment is the comma-separated order entity ids (e.g. "28675,28676"),
// passed straight through as orderIds: String!. Returns
// { message, continue_shopping_url, orders[{ order_id, order_increment_id,
// shipping_address, order_view_url, grand_total, status }] } — the shape the page reads.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const orderIds = decodeURIComponent(id);

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_MULTISHIPPING_SUCCESS_QUERY, variables: { orderIds } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[multishipping/success] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to load order success" }, { status: 400 });
        }

        const r = json?.data?.kleverMultishippingSuccess;
        return NextResponse.json({
            message: r?.message ?? "",
            continue_shopping_url: r?.continue_shopping_url ?? "",
            orders: Array.isArray(r?.orders) ? r.orders : [],
        });
    } catch (error: any) {
        console.error("[multishipping/success] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
