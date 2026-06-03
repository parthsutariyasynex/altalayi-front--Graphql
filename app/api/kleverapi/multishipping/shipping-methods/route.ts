import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_MULTISHIPPING_SHIPPING_METHODS_QUERY } from "@/src/graphql/queries";
import { KLEVER_MULTISHIPPING_SET_SHIPPING_METHODS_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — per-address shipping methods (GraphQL: kleverMultishippingShippingMethods).
// No args. Returns { addresses[{ quote_address_id, customer_address_id, street, city,
// region, postcode, country_id, methods[{ carrier_code, method_code, carrier_title,
// method_title, amount, base_amount, available, error_message, price_excl_tax,
// price_incl_tax }] }] } — the exact shape the multi-shipping page reads.
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_MULTISHIPPING_SHIPPING_METHODS_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[multishipping/shipping-methods] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to fetch shipping methods" }, { status: 400 });
        }

        const r = json?.data?.kleverMultishippingShippingMethods;
        return NextResponse.json({ addresses: Array.isArray(r?.addresses) ? r.addresses : [] });
    } catch (error: any) {
        console.error("[multishipping/shipping-methods GET] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// POST — set the chosen shipping method per address (GraphQL:
// kleverMultishippingSetShippingMethods). The hook sends camelCase
// { request: { methods: [{ quoteAddressId, carrierCode, methodCode }] } }; the route
// maps to the snake_case schema input { quote_address_id: Int!, carrier_code: String!,
// method_code: String! } and returns { success: Boolean }. NOT executed during
// migration — modifies the quote; schema-validated + build-verified only.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const rawMethods = body?.request?.methods ?? body?.methods ?? [];
        const methods = (Array.isArray(rawMethods) ? rawMethods : []).map((m: any) => ({
            quote_address_id: Number(m.quoteAddressId ?? m.quote_address_id),
            carrier_code: String(m.carrierCode ?? m.carrier_code ?? ""),
            method_code: String(m.methodCode ?? m.method_code ?? ""),
        }));

        if (methods.length === 0) {
            return NextResponse.json({ message: "methods are required" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_MULTISHIPPING_SET_SHIPPING_METHODS_MUTATION, variables: { input: { methods } } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[multishipping/shipping-methods POST] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to set shipping methods" }, { status: 400 });
        }

        return NextResponse.json({ success: json?.data?.kleverMultishippingSetShippingMethods ?? false });
    } catch (error: any) {
        console.error("[multishipping/shipping-methods POST] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
