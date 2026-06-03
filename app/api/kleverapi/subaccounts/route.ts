import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
// KLEVER_SUBACCOUNTS_QUERY omits the buggy `permissions` field — see the note on
// the const in src/graphql/queries.ts (backend types it [Int] but returns strings).
import { KLEVER_SUBACCOUNTS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — list subaccounts (GraphQL: kleverSubaccounts)
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) {
            return NextResponse.json({ message: "Authentication required. Authorization header is missing." }, { status: 401 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_SUBACCOUNTS_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[subaccounts] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }

        const r = json?.data?.kleverSubaccounts;
        // Preserve the existing REST shape: { items, total_count }.
        return NextResponse.json({
            items: Array.isArray(r?.items) ? r.items : [],
            total_count: r?.total_count ?? 0,
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Server-side error fetching sub accounts." }, { status: 500 });
    }
}
