import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_SUBMIT_ENQUIRY_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — submit a product enquiry (GraphQL: kleverSubmitEnquiry(input: KleverEnquiryInput!)).
// The client sends camelCase { productSku, productName, qty, comment, notifyStock, phone };
// the route maps them to the snake_case KleverEnquiryInput. Returns { success: Boolean }.
// NOT executed during migration — submit op; schema-validated + tsc only.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });

        const body = await request.json();
        const productSku = body?.productSku ?? body?.product_sku;
        const productName = body?.productName ?? body?.product_name;
        const qty = Number(body?.qty);
        if (!productSku || !productName || Number.isNaN(qty)) {
            return NextResponse.json({ message: "product_sku, product_name and qty are required" }, { status: 400 });
        }

        // Build KleverEnquiryInput (snake_case); include optional fields only when present.
        const input: Record<string, any> = {
            product_sku: String(productSku),
            product_name: String(productName),
            qty,
        };
        const comment = body?.comment;
        const phone = body?.phone;
        const notifyStock = body?.notifyStock ?? body?.notify_stock;
        if (comment != null && comment !== "") input.comment = String(comment);
        if (phone != null && phone !== "") input.phone = String(phone);
        if (notifyStock != null) input.notify_stock = Boolean(notifyStock);

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_SUBMIT_ENQUIRY_MUTATION, variables: { input } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[enquiry] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ success: false, message: json.errors[0]?.message || "Failed to submit enquiry" }, { status: 400 });
        }

        return NextResponse.json({ success: json?.data?.kleverSubmitEnquiry ?? false });
    } catch (error: any) {
        console.error("[enquiry] error:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
