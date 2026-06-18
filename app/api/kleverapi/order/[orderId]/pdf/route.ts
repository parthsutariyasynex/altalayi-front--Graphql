import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_ORDER_PDF_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — order PDF (GraphQL: kleverOrderPdf(orderId: Int!)). Replaces REST /order/{orderId}/pdf.
// Returns { success, filename, base64, mime_type } as JSON — the page reads data.base64 +
// data.filename and decodes the base64 client-side (no binary streaming needed).
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { orderId } = await params;
        // orderId may be a numeric entity_id ("222") or a base64 GraphQL order id ("MjIy" → "222").
        const id = /^\d+$/.test(orderId) ? parseInt(orderId, 10) : parseInt(Buffer.from(decodeURIComponent(orderId), "base64").toString("utf8"), 10);
        if (Number.isNaN(id)) {
            return NextResponse.json({ message: "Invalid order id" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_ORDER_PDF_QUERY, variables: { orderId: id } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[order/:id/pdf] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to fetch order PDF" }, { status: 502 });
        }

        const r = json?.data?.kleverOrderPdf;
        if (!r?.base64) {
            return NextResponse.json({ message: r?.success === false ? "PDF not available" : "No PDF content received" }, { status: 404 });
        }
        // { success, filename, base64, mime_type } — matches the page's data.base64 / data.filename reads.
        return NextResponse.json(r);
    } catch (error: any) {
        console.error("[order/:id/pdf] error:", error.message);
        return NextResponse.json({ message: error.message || "Server error fetching order PDF" }, { status: 500 });
    }
}
