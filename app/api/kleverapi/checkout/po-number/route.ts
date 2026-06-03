import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_CHECKOUT_SET_PO_NUMBER_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — set PO number (GraphQL: kleverSetPoNumber). Caller checks res.ok.
export async function POST(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { poNumber } = await req.json();

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_CHECKOUT_SET_PO_NUMBER_MUTATION, variables: { poNumber } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to set PO number" }, { status: 400 });
        }
        return NextResponse.json({ success: true, result: json?.data?.kleverSetPoNumber ?? null });
    } catch (error) {
        console.error("PO Number Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
