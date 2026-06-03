import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_NOTIFICATIONS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — list notifications (GraphQL: kleverNotifications)
export async function GET(req: NextRequest) {
    try {
        const token = await getRequestToken(req);
        if (!token) {
            return NextResponse.json({ message: "Unauthorized: Missing or invalid customer token" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const pageSize = parseInt(searchParams.get("pageSize") || "15", 10);
        const currentPage = parseInt(searchParams.get("currentPage") || "1", 10);

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(req),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_NOTIFICATIONS_QUERY, variables: { pageSize, currentPage } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[notifications] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }

        const r = json?.data?.kleverNotifications;
        // Preserve the existing REST shape exactly.
        return NextResponse.json({
            items: Array.isArray(r?.items) ? r.items : [],
            total_count: r?.total_count ?? 0,
            unread_count: r?.unread_count ?? 0,
        });
    } catch (error) {
        console.error("Proxy GET Notifications Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
