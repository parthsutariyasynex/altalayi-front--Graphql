import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { CUSTOMER_ADDRESSES_QUERY } from "@/src/graphql/queries";
import { CREATE_CUSTOMER_ADDRESS_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — customer addresses (GraphQL: customer.addresses). Returns the array; the
// consumer maps id/firstname/lastname/street/city/region/postcode/telephone/defaults.
// Native exposes country_code (not country_id) and has no custom_attributes, so we
// map country_code→country_id and default custom_attributes to [].
export async function GET(request: Request) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: CUSTOMER_ADDRESSES_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[addresses] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }
        const addresses = (json?.data?.customer?.addresses ?? []).map((a: any) => ({
            ...a,
            country_id: a.country_code,   // consumer reads country_id
            custom_attributes: [],         // native CustomerAddress has none
        }));
        return NextResponse.json(addresses);
    } catch (error: any) {
        console.error("[addresses GET] error:", error.message);
        return NextResponse.json({ message: error.message || "Server-side error fetching addresses." }, { status: 500 });
    }
}

// POST — create a customer address (GraphQL: createCustomerAddress). Maps the REST
// body to CustomerAddressInput (country_id→country_code; region string→{region}).
// NOT executed during this migration — schema-validated + build-verified only.
export async function POST(request: Request) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Authorization required" }, { status: 401 });

        const b = await request.json();
        const input: Record<string, unknown> = {
            firstname: b.firstname,
            lastname: b.lastname,
            company: b.company,
            street: Array.isArray(b.street) ? b.street : [b.street].filter(Boolean),
            city: b.city,
            postcode: b.postcode,
            telephone: b.telephone,
            country_code: b.country_code ?? b.country_id,
            default_billing: !!b.default_billing,
            default_shipping: !!b.default_shipping,
        };
        if (b.region) {
            input.region = typeof b.region === "string"
                ? { region: b.region }
                : { region: b.region.region, region_id: b.region.region_id, region_code: b.region.region_code };
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: CREATE_CUSTOMER_ADDRESS_MUTATION, variables: { input } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to add address" }, { status: 400 });
        }
        const created = json?.data?.createCustomerAddress;
        return NextResponse.json({ ...created, country_id: created?.country_code });
    } catch (error: any) {
        console.error("[addresses POST] error:", error.message);
        return NextResponse.json({ message: "Server-side error adding address." }, { status: 500 });
    }
}
