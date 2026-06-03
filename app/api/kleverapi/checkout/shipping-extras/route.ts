import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_CHECKOUT_SET_SHIPPING_EXTRAS_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — set shipping extras / pickup details (GraphQL: kleverSetShippingExtras).
// Maps the camelCase request body to the snake_case KleverShippingExtrasInput.
// NOT executed during this migration — schema-validated + build-verified only.
export async function POST(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });

        const b = await req.json();
        // Accept both camelCase (frontend) and snake_case keys; emit snake_case input.
        const input: Record<string, unknown> = {};
        const set = (k: string, v: unknown) => { if (v !== undefined && v !== null && v !== "") input[k] = v; };
        set("pickup_store", b.pickupStore ?? b.pickup_store);
        set("pickup_date", b.pickupDate ?? b.pickup_date);
        set("pickup_time", b.pickupTime ?? b.pickup_time);
        set("pickup_person_name", b.pickupPersonName ?? b.pickup_person_name);
        set("pickup_person_id", b.pickupPersonId ?? b.pickup_person_id);
        set("pickup_mobile_number", b.pickupMobileNumber ?? b.pickup_mobile_number);
        set("delivery_date", b.deliveryDate ?? b.delivery_date);
        set("delivery_comment", b.deliveryComment ?? b.delivery_comment);
        if (b.fee !== undefined && b.fee !== null) input.fee = Number(b.fee);

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_CHECKOUT_SET_SHIPPING_EXTRAS_MUTATION, variables: { input } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to set shipping extras" }, { status: 400 });
        }
        return NextResponse.json({ success: true, result: json?.data?.kleverSetShippingExtras ?? null });
    } catch (error) {
        console.error("Shipping Extras Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
