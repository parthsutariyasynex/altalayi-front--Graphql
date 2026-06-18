import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_EXPORT_ORDERS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — export orders to a file (GraphQL: kleverExportOrders). Replaces REST /orders/export.
// No args. Returns { success, filename, base64, mime_type, total_orders, total_rows } as
// JSON — the page reads data.base64 + data.filename and decodes the base64 to download.
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
            body: JSON.stringify({ query: KLEVER_EXPORT_ORDERS_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[orders/export] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to export orders" }, { status: 502 });
        }

        const r = json?.data?.kleverExportOrders;
        if (!r?.base64) {
            return NextResponse.json({ message: r?.success === false ? "Export not available" : "No file content received" }, { status: 404 });
        }
        // { success, filename, base64, mime_type, total_orders, total_rows }
        return NextResponse.json(r);
    } catch (error: any) {
        console.error("[orders/export] error:", error.message);
        return NextResponse.json({ message: error.message || "Server error exporting orders" }, { status: 500 });
    }
}
