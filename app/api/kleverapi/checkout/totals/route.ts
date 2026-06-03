import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { getCustomerCartId } from "@/lib/api/customer-cart";
import { CART_TOTALS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — checkout totals (GraphQL: native cart.prices; kleverCheckoutTotals doesn't
// exist on the schema). Maps Money objects → the flat CheckoutTotals shape the
// consumer needs: { subtotal, tax_amount, shipping_amount, grand_total, currency_code }.
// (The consumer does not read shipping_address / cart_id / discount_amount.)
export async function GET(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });

        const locale = getLocaleFromRequest(req);
        const cartId = await getCustomerCartId(token, locale);
        if (!cartId) {
            return NextResponse.json({ subtotal: 0, tax_amount: 0, grand_total: 0, currency_code: "SAR" });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: locale, Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: CART_TOTALS_QUERY, variables: { cartId } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[totals] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }

        const prices = json?.data?.cart?.prices ?? {};
        const grand = prices.grand_total?.value ?? 0;
        const subtotal = prices.subtotal_excluding_tax?.value ?? prices.subtotal_including_tax?.value ?? 0;
        const taxFromApplied = Array.isArray(prices.applied_taxes)
            ? prices.applied_taxes.reduce((s: number, t: any) => s + (t?.amount?.value ?? 0), 0)
            : 0;
        const incl = prices.subtotal_including_tax?.value;
        const excl = prices.subtotal_excluding_tax?.value;
        const tax_amount = taxFromApplied || (typeof incl === "number" && typeof excl === "number" ? incl - excl : 0);
        const shipping_amount = json?.data?.cart?.shipping_addresses?.[0]?.selected_shipping_method?.amount?.value ?? 0;

        return NextResponse.json({
            subtotal,
            tax_amount,
            shipping_amount,
            grand_total: grand,
            currency_code: prices.grand_total?.currency ?? "SAR",
        });
    } catch (error) {
        console.error("Totals Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
