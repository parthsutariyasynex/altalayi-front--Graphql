import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_MY_STATEMENT_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — resolves the statement PDF URL via GraphQL (kleverMyStatement), then streams
// the PDF back so the route's binary response shape is unchanged.
export async function GET(request: Request) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get("fromDate") || "2025-01-01";
        const toDate = searchParams.get("toDate") || "2026-03-16";
        // REST used `type`; GraphQL arg is `statementType`. Default to SAP06
        // ("Account Statement") — the GraphQL resolver only accepts valid codes
        // (SAP06, ZSP06, ZSPH6), unlike the old REST default "account_statement".
        const statementType = searchParams.get("type") || "SAP06";

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_MY_STATEMENT_QUERY, variables: { fromDate, toDate, statementType } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[my-statement] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }

        const pdfUrl = json?.data?.kleverMyStatement?.pdf_url;
        if (!pdfUrl) {
            // No PDF available — return the JSON payload as-is (matches old behavior).
            return NextResponse.json(json?.data?.kleverMyStatement ?? {});
        }

        // Download the PDF and stream it back (same binary response as the old route).
        const pdfResponse = await fetch(pdfUrl, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (pdfResponse.ok) {
            const buffer = await pdfResponse.arrayBuffer();
            return new Response(buffer, {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="statement_${fromDate}_${toDate}.pdf"`,
                },
            });
        }
        return NextResponse.json({ pdf_url: pdfUrl });
    } catch (error: any) {
        console.error("[my-statement] Server error:", error);
        return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
    }
}
