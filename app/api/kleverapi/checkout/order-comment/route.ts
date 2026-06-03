import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_CHECKOUT_ORDER_COMMENT_QUERY } from "@/src/graphql/queries";
import { KLEVER_CHECKOUT_SET_ORDER_COMMENT_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — order comment (GraphQL: kleverGetOrderComment → scalar string/null).
// Returns { comment } to match the route's prior shape (consumer reads data.comment).
export async function GET(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_CHECKOUT_ORDER_COMMENT_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ error: "Failed to get order comment", details: json.errors }, { status: 502 });
        }
        return NextResponse.json({ comment: json?.data?.kleverGetOrderComment ?? "" });
    } catch (error: any) {
        console.error("Order Comment GET Error:", error);
        return NextResponse.json({ message: "Internal server error", details: error.message }, { status: 500 });
    }
}

// POST — set order comment (GraphQL: kleverSetOrderComment). Caller checks res.ok.
export async function POST(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { comment } = await req.json();

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_CHECKOUT_SET_ORDER_COMMENT_MUTATION, variables: { comment } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to set order comment" }, { status: 400 });
        }
        return NextResponse.json({ success: true, result: json?.data?.kleverSetOrderComment ?? null });
    } catch (error) {
        console.error("Order Comment POST Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
