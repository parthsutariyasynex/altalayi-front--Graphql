import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_CHECKOUT_PO_FILES_QUERY } from "@/src/graphql/queries";
import { KLEVER_CHECKOUT_PO_UPLOAD_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — list uploaded PO files (GraphQL: kleverGetPoFiles → array). Returns the array.
export async function GET(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_CHECKOUT_PO_FILES_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ error: "Failed to get PO files", details: json.errors }, { status: 502 });
        }
        return NextResponse.json(json?.data?.kleverGetPoFiles ?? []);
    } catch (error: any) {
        console.error("PO Upload GET Error:", error);
        return NextResponse.json({ message: "Internal server error", details: error.message }, { status: 500 });
    }
}

// POST — upload a PO file (GraphQL: kleverUploadPoFile). The multipart file is read
// and base64-encoded into the mutation (fileName, fileContent, type).
// NOT executed during this migration — schema-validated + build-verified only.
export async function POST(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });

        const formData = await req.formData();
        const file = (formData.get("file") || formData.get("po_file") || [...formData.values()].find((v) => v instanceof File)) as File | null;
        if (!file) return NextResponse.json({ message: "No file provided" }, { status: 400 });

        const fileContent = Buffer.from(await file.arrayBuffer()).toString("base64");
        const type = (formData.get("type") as string) || "po";

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                query: KLEVER_CHECKOUT_PO_UPLOAD_MUTATION,
                variables: { fileName: file.name, fileContent, type },
            }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Upload failed" }, { status: 400 });
        }
        return NextResponse.json({ success: true, result: json?.data?.kleverUploadPoFile ?? null });
    } catch (error) {
        console.error("PO Upload POST Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
