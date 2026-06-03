import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_PICKUP_STORES_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — pickup stores (GraphQL: kleverPickupStores). Returns the store array; the
// useCheckout consumer maps store_id→id, name, address.
// DEVIATION: kleverPickupStores does not expose `email` (REST did) — Store.email
// will be empty. gps_location was already absent under REST (it had lat/long).
export async function GET(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_PICKUP_STORES_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[pickup-stores] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }
        return NextResponse.json(Array.isArray(json?.data?.kleverPickupStores) ? json.data.kleverPickupStores : []);
    } catch (error) {
        console.error("Pickup Stores Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
