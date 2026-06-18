import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_ORDER_FILTER_OPTIONS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — available order statuses. There is no dedicated status op; the statuses are the
// status_options of kleverOrderFilterOptions, so this route derives them from that query.
// Returns an array of { label, value } with an "All" entry prepended (matching the legacy
// shape). On any failure it falls back to a minimal list so the filter UI never breaks.
const FALLBACK = [{ label: "All", value: "All" }, { label: "Check Pending", value: "Check Pending" }];

export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_ORDER_FILTER_OPTIONS_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[order-statuses] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            // Preserve the old graceful fallback so the UI doesn't break.
            return NextResponse.json(FALLBACK);
        }

        const statusOptions = json?.data?.kleverOrderFilterOptions?.status_options;
        const items = Array.isArray(statusOptions) ? statusOptions : [];

        // Ensure an "All" entry is present at the start (mirrors the legacy behaviour).
        const hasAll = items.some((o: any) =>
            String(o?.value ?? "").toLowerCase() === "all" || String(o?.label ?? "").toLowerCase() === "all"
        );
        const result = hasAll ? items : [{ label: "All", value: "All" }, ...items];

        return NextResponse.json(result.length > 0 ? result : FALLBACK);
    } catch (error: any) {
        console.error("[order-statuses] error:", error.message);
        return NextResponse.json(FALLBACK);
    }
}
