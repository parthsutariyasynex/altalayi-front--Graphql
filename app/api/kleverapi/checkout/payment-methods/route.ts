import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { getCustomerCartId } from "@/lib/api/customer-cart";
import { CART_PAYMENT_METHODS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — available payment methods (GraphQL: cart.available_payment_methods).
// Returns an array of { code, title } — the useCheckout consumer reads data.methods
// || data.payment_methods || array, then maps {code,title}, so the array is correct.
export async function GET(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const locale = getLocaleFromRequest(req);
        const cartId = await getCustomerCartId(token, locale);
        if (!cartId) return NextResponse.json([]); // no active cart → empty (consumer has fallback)

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: locale, Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: CART_PAYMENT_METHODS_QUERY, variables: { cartId } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[payment-methods] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json([]);
        }
        const methods = json?.data?.cart?.available_payment_methods ?? [];
        return NextResponse.json(methods);
    } catch (error) {
        console.error("Payment Methods Error:", error);
        return NextResponse.json([]);
    }
}
