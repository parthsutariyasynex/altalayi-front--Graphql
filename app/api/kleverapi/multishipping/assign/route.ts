import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_MULTISHIPPING_ASSIGN_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — assign quote items to addresses (GraphQL: kleverMultishippingAssign).
// Client sends { request: { assignments: [{ quote_item_id, customer_address_id, qty }] } }.
// Coerces each assignment to the schema types (Int!, Int!, Float!) and returns
// { success: Boolean }. NOT executed during migration — modifies the quote;
// schema-validated + build-verified only.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const rawAssignments = body?.request?.assignments ?? body?.assignments ?? [];
        const assignments = (Array.isArray(rawAssignments) ? rawAssignments : []).map((a: any) => ({
            quote_item_id: Number(a.quote_item_id),
            customer_address_id: Number(a.customer_address_id),
            qty: Number(a.qty),
        }));

        if (assignments.length === 0) {
            return NextResponse.json({ message: "assignments are required" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_MULTISHIPPING_ASSIGN_MUTATION, variables: { input: { assignments } } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[multishipping/assign] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to assign addresses" }, { status: 400 });
        }

        return NextResponse.json({ success: json?.data?.kleverMultishippingAssign ?? false });
    } catch (error: any) {
        console.error("[multishipping/assign] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
