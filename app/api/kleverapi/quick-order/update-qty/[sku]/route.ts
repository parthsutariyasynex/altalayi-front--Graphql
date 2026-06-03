import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_QUICK_ORDER_UPDATE_ITEM_QTY_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// PUT — update a quick-order item's quantity (GraphQL: kleverQuickOrderUpdateQty).
// SKU from path, { qty } from body. Returns the full quick-order cart shape.
// NOT executed during this migration — schema-validated + build-verified only.
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ sku: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { sku } = await params;
        const { qty } = await request.json();

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                query: KLEVER_QUICK_ORDER_UPDATE_ITEM_QTY_MUTATION,
                variables: { sku: decodeURIComponent(sku), qty: Number(qty) },
            }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[quick-order/update-qty] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ success: false, message: json.errors[0]?.message || "Failed to update quantity" }, { status: 400 });
        }
        return NextResponse.json(json?.data?.kleverQuickOrderUpdateQty ?? { success: false });
    } catch (error: any) {
        console.error("[quick-order/update-qty] error:", error.message);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
