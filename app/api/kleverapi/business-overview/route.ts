import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_BUSINESS_OVERVIEW_QUERY } from "@/src/graphql/queries";
import { KLEVER_UPDATE_BUSINESS_OVERVIEW_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — Fetch business overview (GraphQL: kleverBusinessOverview)
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_BUSINESS_OVERVIEW_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[business-overview] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ error: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }
        // Preserve the existing REST shape: overview fields at the top level.
        return NextResponse.json(json?.data?.kleverBusinessOverview ?? {});
    } catch (error: any) {
        console.error("[business-overview GET] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Update business overview (GraphQL: kleverUpdateBusinessOverview(input:
// KleverBusinessOverviewInput!)). Builds the input with ALL 5 snake_case fields (default ""
// for any not sent) so the resolver — which reads each without isset — doesn't throw an
// "Undefined index" notice. Accepts camelCase or snake_case keys from the client.
export async function PUT(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const input = {
            total_employees: String(body?.total_employees ?? body?.totalEmployees ?? ""),
            trucks: String(body?.trucks ?? ""),
            annual_revenue: String(body?.annual_revenue ?? body?.annualRevenue ?? ""),
            business_model: String(body?.business_model ?? body?.businessModel ?? ""),
            products_offered: String(body?.products_offered ?? body?.productsOffered ?? ""),
        };

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_UPDATE_BUSINESS_OVERVIEW_MUTATION, variables: { input } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[business-overview PUT] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ success: false, message: json.errors[0]?.message || "Update failed" }, { status: 400 });
        }
        return NextResponse.json(json?.data?.kleverUpdateBusinessOverview ?? { success: false });
    } catch (error: any) {
        console.error("[business-overview PUT] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
