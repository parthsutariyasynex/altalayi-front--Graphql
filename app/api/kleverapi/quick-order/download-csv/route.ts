import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_QUICK_ORDER_DOWNLOAD_CSV_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — quick-order sample CSV (GraphQL: kleverQuickOrderDownloadCsv).
// Returns JSON { file_name, file_content (base64), content_type, total_products };
// the client decodes file_content and triggers the download. Optional ?categoryId=.
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const categoryIdParam = new URL(request.url).searchParams.get("categoryId");
        const variables: Record<string, number> = {};
        if (categoryIdParam) variables.categoryId = parseInt(categoryIdParam, 10);

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_QUICK_ORDER_DOWNLOAD_CSV_QUERY, variables }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[quick-order/download-csv] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Download failed" }, { status: 502 });
        }
        return NextResponse.json(json?.data?.kleverQuickOrderDownloadCsv ?? {});
    } catch (error: any) {
        console.error("[quick-order/download-csv] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
