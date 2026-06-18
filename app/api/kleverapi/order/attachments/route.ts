import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_ORDER_ATTACHMENTS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — order attachments with optional document_type / invoice_due filters
// (GraphQL: kleverOrderAttachments(orderId: Int!)). Replaces REST /order/attachments.
// The op accepts only orderId, so the document_type / invoice_due filters (which the REST
// endpoint took as query params) are applied in-route on the returned items — those carry
// document_type / invoice_due. Returns { attachments: [...] } (same shape as the per-order
// attachments route).
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const sp = new URL(request.url).searchParams;
        const orderIdParam = sp.get("order_id");
        const documentType = sp.get("document_type");
        const invoiceDue = sp.get("invoice_due");

        const orderId = parseInt(orderIdParam || "", 10);
        if (Number.isNaN(orderId)) {
            return NextResponse.json({ message: "order_id is required" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_ORDER_ATTACHMENTS_QUERY, variables: { orderId } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[order/attachments] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to fetch order attachments" }, { status: 502 });
        }

        let attachments: any[] = Array.isArray(json?.data?.kleverOrderAttachments?.attachments)
            ? json.data.kleverOrderAttachments.attachments
            : [];

        // Apply the legacy query-param filters in-route (the op has no filter args).
        if (documentType && documentType !== "All") {
            attachments = attachments.filter((a) => a?.document_type === documentType);
        }
        if (invoiceDue && invoiceDue !== "All") {
            attachments = attachments.filter((a) => String(a?.invoice_due) === invoiceDue);
        }

        return NextResponse.json({ attachments });
    } catch (error: any) {
        console.error("[order/attachments] error:", error.message);
        return NextResponse.json({ message: error.message || "Server error fetching order attachments" }, { status: 500 });
    }
}
