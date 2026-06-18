import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_ACCOUNT_SIDEBAR_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — account-section sidebar menu (GraphQL: kleverAccountSidebar). Replaces the
// WAF-blocked REST /account-sidebar. Returns { user_type, items: [{ code, label, url,
// is_visible, sort_order }] } — absolute Magento URLs normalized to paths, same as before.
// Graceful empty fallback so the account layout never errors.
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ user_type: "Guest", items: [] }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_ACCOUNT_SIDEBAR_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.warn("[account-sidebar] GraphQL error — empty fallback:", JSON.stringify(json.errors).slice(0, 200));
            return NextResponse.json({ user_type: "Guest", items: [] });
        }

        const sidebar = json?.data?.kleverAccountSidebar;
        const rawItems = Array.isArray(sidebar?.items) ? sidebar.items : [];

        // Normalize absolute Magento URLs → paths (same as the old REST route).
        const items = rawItems.map((item: any) => {
            let url = item?.url || "#";
            try {
                if (url.startsWith("http")) {
                    const parsed = new URL(url);
                    url = (parsed.pathname || "#") + parsed.search;
                }
            } catch { /* keep as-is */ }
            return {
                ...item,
                url,
                is_visible: item?.is_visible !== false,
                sort_order: Number(item?.sort_order) || 0,
            };
        });

        return NextResponse.json({
            user_type: sidebar?.user_type || "Customer",
            items,
        });
    } catch (error: any) {
        console.error("[account-sidebar] error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", items: [] }, { status: 500 });
    }
}
