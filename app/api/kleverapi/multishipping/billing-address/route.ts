import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_MULTISHIPPING_SET_BILLING_ADDRESS_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — set the multi-shipping billing address (GraphQL:
// kleverMultishippingSetBillingAddress). Client sends { addressId, paymentMethod? };
// the schema op takes only addressId: Int! (payment method is set at place-order),
// so paymentMethod is ignored here. Returns { success: Boolean }. NOT executed during
// migration — modifies the quote; schema-validated + build-verified only.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const addressId = Number(body?.addressId);
        if (!addressId || Number.isNaN(addressId)) {
            return NextResponse.json({ message: "addressId is required" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_MULTISHIPPING_SET_BILLING_ADDRESS_MUTATION, variables: { addressId } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[multishipping/billing-address] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to set billing address" }, { status: 400 });
        }

        return NextResponse.json({ success: json?.data?.kleverMultishippingSetBillingAddress ?? false });
    } catch (error: any) {
        console.error("[multishipping/billing-address] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
