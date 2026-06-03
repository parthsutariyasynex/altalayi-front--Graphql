import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_QUICK_ORDER_VALIDATE_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — validate quick-order items (GraphQL: kleverQuickOrderValidate). Non-destructive
// (validates SKUs/qty, returns totals + per-item validity). Body: { items: [{ sku, qty }] }.
// Returns { grand_total, items: [{ sku, name, qty, price, row_total, is_valid, error_message }] }.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const items = Array.isArray(body?.items) ? body.items : [];

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_QUICK_ORDER_VALIDATE_MUTATION, variables: { items } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[quick-order/validate] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ error: "Validation failed", details: json.errors }, { status: 502 });
        }

        const r = json?.data?.kleverQuickOrderValidate;
        return NextResponse.json({
            grand_total: r?.grand_total ?? 0,
            items: Array.isArray(r?.items) ? r.items : [],
        });
    } catch (error: any) {
        console.error("[quick-order/validate] error:", error.message);
        return NextResponse.json({ error: "Validation failed" }, { status: 500 });
    }
}
