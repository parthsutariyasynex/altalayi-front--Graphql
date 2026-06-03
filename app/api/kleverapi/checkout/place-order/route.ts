import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_PLACE_ORDER_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — place the order (GraphQL: kleverPlaceOrder). Token-based, NO cart_id:
// the shipping address + method are already applied to the quote by the earlier
// checkout steps, so only the payment method is required here.
// Returns { order_id, order_increment_id, grand_total, currency_code, status } —
// the same fields the success page reads (result.order_id / order_increment_id / status).
// NOT executed during this migration — schema-validated + build-verified only.
export async function POST(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const paymentMethod = body.payment_method ?? body.paymentMethod;
        if (!paymentMethod) {
            return NextResponse.json({ message: "payment_method is required" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_PLACE_ORDER_MUTATION, variables: { paymentMethod } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to place order" }, { status: 400 });
        }
        // Preserve the result shape the success page consumes.
        return NextResponse.json(json?.data?.kleverPlaceOrder ?? {});
    } catch (error) {
        console.error("Place Order Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
