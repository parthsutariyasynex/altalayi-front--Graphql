import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { getCustomerCartId } from "@/lib/api/customer-cart";
import { UPDATE_CART_ITEMS_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// PUT — update a cart item's quantity (GraphQL: updateCartItems). The numeric
// item_id from the path maps directly to cart_item_id (no uid encoding needed).
// Body: { qty }. NOT executed during this migration — schema-validated + build-verified.
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const locale = getLocaleFromRequest(req);
        const { itemId } = await params;
        const { qty } = await req.json();
        const cartId = await getCustomerCartId(token, locale);
        if (!cartId) return NextResponse.json({ message: "No active cart" }, { status: 400 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: locale, Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                query: UPDATE_CART_ITEMS_MUTATION,
                variables: { cartId, items: [{ cart_item_id: parseInt(itemId, 10), quantity: Number(qty) }] },
            }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to update cart" }, { status: 400 });
        }
        return NextResponse.json({ success: true, cart: json?.data?.updateCartItems?.cart ?? null });
    } catch (error) {
        console.error("Cart Update Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
