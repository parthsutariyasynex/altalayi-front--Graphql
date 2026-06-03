import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_QUICK_ORDER_UPLOAD_CSV_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — upload a quick-order CSV (GraphQL: kleverQuickOrderUploadCsv). The client
// already base64-encodes the file and sends { fileContent, fileName }. Returns
// { grand_total, items: [{ sku, name, qty, price, is_valid, error_message }] }.
// NOT executed during this migration — schema-validated + build-verified only.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const fileContent = body?.fileContent ?? "";
        if (!fileContent) return NextResponse.json({ message: "fileContent is required" }, { status: 400 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_QUICK_ORDER_UPLOAD_CSV_MUTATION, variables: { fileContent } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[quick-order/upload-csv] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Upload failed" }, { status: 400 });
        }
        const r = json?.data?.kleverQuickOrderUploadCsv;
        return NextResponse.json({
            grand_total: r?.grand_total ?? 0,
            items: Array.isArray(r?.items) ? r.items : [],
        });
    } catch (error: any) {
        console.error("[quick-order/upload-csv] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
