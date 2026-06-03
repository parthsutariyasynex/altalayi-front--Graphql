import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_QUICK_ORDER_CHECKOUT_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — quick-order checkout (GraphQL: kleverQuickOrderCheckout). Body: { items: [{ sku, qty }] }.
// Returns { success, message, redirect_url, items_count, grand_total }.
// NOT executed during this migration — schema-validated (return type KleverQuickOrderCartResponse
// has all selected fields) + build-verified only.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const items = Array.isArray(body?.items) ? body.items : [];

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_QUICK_ORDER_CHECKOUT_MUTATION, variables: { items } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[quick-order/checkout] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ success: false, message: json.errors[0]?.message || "Checkout failed" }, { status: 400 });
        }
        return NextResponse.json(json?.data?.kleverQuickOrderCheckout ?? { success: false });
    } catch (error: any) {
        console.error("[quick-order/checkout] error:", error.message);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
