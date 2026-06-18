import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_ORDER_ATTACHMENTS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — attachments for a single order (GraphQL: kleverOrderAttachments(orderId: Int!)).
// Replaces REST /order/{orderId}/attachments. Returns { attachments: [{ attachment_id,
// file_name, file_url, upload_date, document_type, payment_status, invoice_due }] } —
// the shape the order-detail page reads (data.attachments).
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
            body: JSON.stringify({ query: KLEVER_ORDER_ATTACHMENTS_QUERY, variables: { orderId: id } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[order/:id/attachments] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to fetch order attachments" }, { status: 502 });
        }

        const r = json?.data?.kleverOrderAttachments;
        return NextResponse.json({
            attachments: Array.isArray(r?.attachments) ? r.attachments : [],
        });
    } catch (error: any) {
        console.error("[order/:id/attachments] error:", error.message);
        return NextResponse.json({ message: error.message || "Server error fetching order attachments" }, { status: 500 });
    }
}
