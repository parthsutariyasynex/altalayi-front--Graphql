import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_MULTISHIPPING_START_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — start multi-shipping (GraphQL: kleverMultishippingStart). Switches the quote
// to multishipping mode and returns the form data. No args. Returns
// { success, items[{quote_item_id,name,sku,qty}],
//   addresses[{customer_address_id,city,street,region,postcode,country_id}] }.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_MULTISHIPPING_START_MUTATION }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[multishipping/start] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to start multi-shipping" }, { status: 400 });
        }

        const r = json?.data?.kleverMultishippingStart;
        return NextResponse.json({
            success: r?.success ?? false,
            items: Array.isArray(r?.items) ? r.items : [],
            addresses: Array.isArray(r?.addresses) ? r.addresses : [],
        });
    } catch (error: any) {
        console.error("[multishipping/start] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
