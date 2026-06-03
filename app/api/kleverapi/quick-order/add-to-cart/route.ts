import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_QUICK_ORDER_ADD_TO_CART_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — add quick-order items to the cart (GraphQL: kleverQuickOrderAddToCart).
// Body: { items: [{ sku, qty }] }. Returns { success, message, items_count, grand_total, redirect_url }.
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
            body: JSON.stringify({ query: KLEVER_QUICK_ORDER_ADD_TO_CART_MUTATION, variables: { items } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[quick-order/add-to-cart] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ success: false, message: json.errors[0]?.message || "Failed to add to cart" }, { status: 400 });
        }
        // Pass the result through (success, message, items_count, grand_total, redirect_url).
        return NextResponse.json(json?.data?.kleverQuickOrderAddToCart ?? { success: false });
    } catch (error: any) {
        console.error("[quick-order/add-to-cart] error:", error.message);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
