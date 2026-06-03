import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl, getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_BUSINESS_OVERVIEW_QUERY } from "@/src/graphql/queries";

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

// PUT — Update business overview. Still REST (mutation: kleverUpdateBusinessOverview),
// left as-is per the read-only conversion scope; convert separately.
export async function PUT(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const res = await fetch(`${baseUrl}/business-overview`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[business-overview PUT] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Magento API error", details: errBody }, { status: res.status });
        }
        return NextResponse.json(await res.json());
    } catch (error: any) {
        console.error("[business-overview PUT] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
