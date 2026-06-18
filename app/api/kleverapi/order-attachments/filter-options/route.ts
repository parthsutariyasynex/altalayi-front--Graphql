import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_ORDER_UPLOAD_FILTER_OPTIONS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — order-upload filter options (GraphQL: kleverOrderUploadFilterOptions).
// Replaces REST /orderupload/filter-options. Returns { document_types, invoice_due_options,
// company_options } each as [{ label, value }] — the shape the order-attachments page reads
// (filterOptionsData.document_types / .invoice_due_options).
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
            body: JSON.stringify({ query: KLEVER_ORDER_UPLOAD_FILTER_OPTIONS_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[order-attachments/filter-options] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to fetch filter options" }, { status: 502 });
        }

        const r = json?.data?.kleverOrderUploadFilterOptions;
        return NextResponse.json({
            document_types: Array.isArray(r?.document_types) ? r.document_types : [],
            invoice_due_options: Array.isArray(r?.invoice_due_options) ? r.invoice_due_options : [],
            company_options: Array.isArray(r?.company_options) ? r.company_options : [],
        });
    } catch (error: any) {
        console.error("[order-attachments/filter-options] error:", error.message);
        return NextResponse.json({ message: error.message || "Server error fetching filter options" }, { status: 500 });
    }
}
