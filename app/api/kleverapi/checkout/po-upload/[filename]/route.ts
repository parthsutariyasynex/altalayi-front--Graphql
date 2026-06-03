import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_CHECKOUT_PO_REMOVE_FILE_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// DELETE — remove a PO file (GraphQL: kleverRemovePoFile). Caller checks res.ok.
// NOT executed during this migration — schema-validated + build-verified only.
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { filename } = await params;

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_CHECKOUT_PO_REMOVE_FILE_MUTATION, variables: { fileName: filename } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to remove file" }, { status: 400 });
        }
        return NextResponse.json({ success: true, result: json?.data?.kleverRemovePoFile ?? null });
    } catch (error) {
        console.error("PO Delete Error:", error);
        return NextResponse.json({ message: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
    }
}
