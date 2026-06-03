import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_CHECKOUT_PICKUP_TIME_SLOTS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — pickup time slots (GraphQL: kleverPickupTimeSlots(storeId, date) → {time, available}).
// Mapped to the consumer's expected { time, label, enabled } shape (label = time;
// enabled derived from `available`, defaulting to true when null).
export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string; date: string }> }
) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { storeId, date } = await params;

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                query: KLEVER_CHECKOUT_PICKUP_TIME_SLOTS_QUERY,
                variables: { storeId: parseInt(storeId, 10), date },
            }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }
        const slots = Array.isArray(json?.data?.kleverPickupTimeSlots) ? json.data.kleverPickupTimeSlots : [];
        const mapped = slots.map((s: any) => ({
            time: s.time,
            label: s.time,
            enabled: s.available == null ? true : Boolean(s.available),
        }));
        return NextResponse.json(mapped);
    } catch (error) {
        console.error("Pickup Time Slots Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
