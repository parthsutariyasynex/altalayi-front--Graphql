import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl, getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_MULTISHIPPING_SHIPPING_METHODS_QUERY } from "@/src/graphql/queries";

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

export async function POST(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        console.log(">>> Set Multishipping Shipping Methods REQUEST:", JSON.stringify(body, null, 2));

        const response = await fetch(`${BASE_URL}/multishipping/shipping-methods`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                platform: "web",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const responseText = await response.text();
        console.log("<<< Set Multishipping Shipping Methods RESPONSE:", response.status, responseText);

        if (!response.ok) {
            let errorData;
            try { errorData = JSON.parse(responseText); } catch { errorData = { message: responseText }; }
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = JSON.parse(responseText);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Set Multishipping Shipping Methods Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
