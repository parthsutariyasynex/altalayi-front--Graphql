import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_QUICK_ORDER_REMOVE_ITEM_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// DELETE — remove a SKU from the quick-order list (GraphQL: kleverQuickOrderRemove).
// Returns { success, message, items_count, grand_total, redirect_url, items[{sku,name,qty,price,row_total}] }.
// NOT executed during this migration — schema-validated + build-verified only.
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ sku: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { sku } = await params;

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_QUICK_ORDER_REMOVE_ITEM_MUTATION, variables: { sku: decodeURIComponent(sku) } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[quick-order/remove] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ success: false, message: json.errors[0]?.message || "Failed to remove item" }, { status: 400 });
        }
        return NextResponse.json(json?.data?.kleverQuickOrderRemove ?? { success: false });
    } catch (error: any) {
        console.error("[quick-order/remove] error:", error.message);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
