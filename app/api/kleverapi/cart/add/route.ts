import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { getCustomerCartId } from "@/lib/api/customer-cart";
import { ADD_PRODUCTS_TO_CART_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — add a product to the cart (GraphQL: addProductsToCart). Body: { sku, qty }.
// NOT executed during this migration — schema-validated + build-verified only.
export async function POST(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const locale = getLocaleFromRequest(req);
        const { sku, qty } = await req.json();
        const cartId = await getCustomerCartId(token, locale);
        if (!cartId) return NextResponse.json({ message: "No active cart" }, { status: 400 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: locale, Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                query: ADD_PRODUCTS_TO_CART_MUTATION,
                variables: { cartId, cartItems: [{ sku, quantity: Number(qty) }] },
            }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to add to cart" }, { status: 400 });
        }
        const userErrors = json?.data?.addProductsToCart?.user_errors ?? [];
        if (userErrors.length > 0) {
            return NextResponse.json({ message: userErrors[0]?.message || "Failed to add to cart" }, { status: 400 });
        }
        return NextResponse.json({ success: true, cart: json?.data?.addProductsToCart?.cart ?? null });
    } catch (error) {
        console.error("Cart Add Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
