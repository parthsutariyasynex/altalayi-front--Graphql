import { NextResponse } from "next/server";
import { KLEVER_PRINT_ORDER_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// Map a kleverPrintOrder flat address → the REST order-address shape the detail UI reads
// (firstname/lastname/company/street[]/city/region/postcode/country_id/telephone). The print
// op returns a single `name`, so we surface it as firstname (lastname empty) — the UI renders
// `{firstname} {lastname}`, so the full name still shows.
function mapOrderAddress(a: any) {
    if (!a) return null;
    return {
        firstname: a.name ?? "",
        lastname: "",
        company: a.company ?? null,
        street: Array.isArray(a.street) ? a.street : a.street ? [a.street] : [],
        city: a.city ?? null,
        region: a.region ?? null,
        postcode: a.postcode ?? null,
        country_id: a.country_id ?? null,
        telephone: a.telephone ?? null,
    };
}

// GET — order detail. The route param is the order entity_id; native `customer.orders` can only
// be filtered by `number` (increment_id) and doesn't expose entity_id, so it can't be looked up
// by this param. `kleverPrintOrder(orderId: Int!)` IS keyed by entity_id and returns the full
// order, so we use it and map to the existing REST order shape the detail page consumes.
export async function GET(
    request: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;
        // orderId may arrive as a plain numeric entity_id ("222") OR as the GraphQL order id from
        // customer.orders, which is base64 of the entity_id ("MjIy" → "222", "MzY3Ng==" → "3676").
        // kleverPrintOrder needs the numeric entity_id, so decode base64 ids first.
        let entityId: number;
        if (/^\d+$/.test(orderId)) {
            entityId = parseInt(orderId, 10);
        } else {
            try { entityId = parseInt(Buffer.from(decodeURIComponent(orderId), "base64").toString("utf8"), 10); }
            catch { entityId = NaN; }
        }
        if (Number.isNaN(entityId)) {
            return NextResponse.json({ message: "Invalid order id" }, { status: 400 });
        }

        const authHeader = request.headers.get("Authorization");
        const locale = request.headers.get("x-locale") || "en";
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: locale, Authorization: authHeader },
            body: JSON.stringify({ query: KLEVER_PRINT_ORDER_QUERY, variables: { orderId: entityId } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            const msg = json.errors[0]?.message || "Magento GraphQL error";
            // "not authorized" for an order that isn't this customer's → 404, matching old REST.
            const status = /authorized/i.test(msg) ? 404 : 502;
            console.error("[order/:id GET] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: msg }, { status });
        }

        const o = json?.data?.kleverPrintOrder;
        if (!o) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        const items = Array.isArray(o.items)
            ? o.items.map((it: any, i: number) => ({
                item_id: i,
                id: i,
                name: it.name,
                sku: it.sku,
                price: it.price,
                qty_ordered: it.qty_ordered,
                row_total: it.subtotal,
                subtotal: it.subtotal,
            }))
            : [];

        const totals = o.totals || {};
        // Preserve the REST order shape the detail UI reads.
        const order = {
            entity_id: entityId,
            increment_id: o.order_number,
            status: o.order_status,
            created_at: o.order_date,
            subtotal: totals.subtotal ?? 0,
            grand_total: totals.grand_total ?? 0,
            tax_amount: totals.tax ?? 0,
            discount_amount: totals.discount ?? 0,
            shipping_amount: totals.shipping ?? 0,
            order_currency_code: totals.currency_code ?? null,
            shipping_description: o.shipping_method ?? null,
            payment: {
                method: o.payment_method ?? null,
                method_title: o.payment_method ?? null,
                additional_information: o.payment_method ? [o.payment_method] : [],
            },
            billing_address: mapOrderAddress(o.billing_address),
            shipping_address: mapOrderAddress(o.shipping_address),
            items,
            total_item_count: items.reduce((acc: number, it: any) => acc + (Number(it.qty_ordered) || 0), 0),
            totals,
        };

        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Server error fetching order details" },
            { status: 500 }
        );
    }
}
