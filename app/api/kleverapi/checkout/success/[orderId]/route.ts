import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_CHECKOUT_SUCCESS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — order success details (GraphQL: kleverCheckoutSuccess(orderId)).
// Returns { order_id, order_increment_id, message, continue_shopping_url, order_view_url }.
export async function GET(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });

        const { orderId } = await params;
        if (!orderId) return NextResponse.json({ message: "Order ID is required" }, { status: 400 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_CHECKOUT_SUCCESS_QUERY, variables: { orderId: parseInt(orderId, 10) } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ error: "Failed to get success data", details: json.errors }, { status: 502 });
        }
        return NextResponse.json(json?.data?.kleverCheckoutSuccess ?? {});
    } catch (error: any) {
        console.error("Checkout Success Error:", error);
        return NextResponse.json({ message: "Internal server error", details: error.message }, { status: 500 });
    }
}
