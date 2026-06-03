import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { getCustomerCartId } from "@/lib/api/customer-cart";
import { REMOVE_ITEM_FROM_CART_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// DELETE — remove a cart item (GraphQL: removeItemFromCart). The numeric item_id
// from the path maps directly to cart_item_id (no uid encoding needed).
// NOT executed during this migration — schema-validated + build-verified only.
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const locale = getLocaleFromRequest(req);
        const { itemId } = await params;
        const cartId = await getCustomerCartId(token, locale);
        if (!cartId) return NextResponse.json({ message: "No active cart" }, { status: 400 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: locale, Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                query: REMOVE_ITEM_FROM_CART_MUTATION,
                variables: { cartId, cartItemId: parseInt(itemId, 10) },
            }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to remove item" }, { status: 400 });
        }
        return NextResponse.json({ success: true, cart: json?.data?.removeItemFromCart?.cart ?? null });
    } catch (error) {
        console.error("Cart Remove Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
