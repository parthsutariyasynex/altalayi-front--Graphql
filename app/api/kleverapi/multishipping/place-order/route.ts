import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_MULTISHIPPING_PLACE_ORDER_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — place a multi-shipping order (GraphQL: kleverMultishippingPlaceOrder).
// The client payload carries { payment_method, billing_address_id, general_comment,
// shipping_information[...] }, but the schema op accepts ONLY paymentMethod: String! and
// optional agreementIds: [Int] — billing address + per-address shipping methods are set
// by the preceding mutations (billing-address / set-shipping-methods). Returns
// { order_ids: [Int], increment_ids: [String], success } — the shape the review page reads.
// NOT executed during migration — places a real order; schema-validated + build-verified only.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const paymentMethod = String(body?.payment_method ?? body?.paymentMethod ?? "");
        if (!paymentMethod) {
            return NextResponse.json({ message: "payment_method is required" }, { status: 400 });
        }
        const rawAgreements = body?.agreementIds ?? body?.agreement_ids ?? null;
        const agreementIds = Array.isArray(rawAgreements)
            ? rawAgreements.map((a: any) => Number(a)).filter((n: number) => !Number.isNaN(n))
            : null;

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                query: KLEVER_MULTISHIPPING_PLACE_ORDER_MUTATION,
                variables: { paymentMethod, agreementIds },
            }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[multishipping/place-order] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to place order" }, { status: 400 });
        }

        const r = json?.data?.kleverMultishippingPlaceOrder;
        return NextResponse.json({
            order_ids: Array.isArray(r?.order_ids) ? r.order_ids : [],
            increment_ids: Array.isArray(r?.increment_ids) ? r.increment_ids : [],
            success: r?.success ?? false,
        });
    } catch (error: any) {
        console.error("[multishipping/place-order] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
