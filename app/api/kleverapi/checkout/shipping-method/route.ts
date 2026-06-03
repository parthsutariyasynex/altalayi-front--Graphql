import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { getCustomerCartId } from "@/lib/api/customer-cart";
import { SET_SHIPPING_METHODS_ON_CART_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — set the cart's shipping method (GraphQL: setShippingMethodsOnCart).
// Needs the masked cart_id. Body: { carrier_code, method_code }. The consumer
// (useCheckout.setShippingMethod) re-fetches totals + payment methods after, so a
// minimal success object suffices.
// NOT executed during this migration — schema-validated + build-verified only.
export async function POST(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const locale = getLocaleFromRequest(req);
        const body = await req.json();
        const carrierCode = body.carrier_code ?? body.carrierCode;
        const methodCode = body.method_code ?? body.methodCode;
        if (!carrierCode || !methodCode) {
            return NextResponse.json({ message: "carrier_code and method_code are required" }, { status: 400 });
        }

        const cartId = await getCustomerCartId(token, locale);
        if (!cartId) return NextResponse.json({ message: "No active cart" }, { status: 400 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: locale, Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: SET_SHIPPING_METHODS_ON_CART_MUTATION, variables: { cartId, carrierCode, methodCode } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to set shipping method" }, { status: 400 });
        }
        return NextResponse.json({ success: true, cart: json?.data?.setShippingMethodsOnCart?.cart ?? null });
    } catch (error) {
        console.error("Set Shipping Method Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
