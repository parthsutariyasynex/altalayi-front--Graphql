import { NextRequest, NextResponse } from "next/server";
import { KLEVER_CREDIT_ACCOUNT_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — credit account info (GraphQL: kleverCreditAccount). Pure GraphQL, no REST.
// Returns the credit shape at the top level (total/used/available_credit_limit, currency,
// has_permission, is_visible, success, message) — same fields the CreditLimit widget reads.
// On any GraphQL error, returns an empty no-permission shape with 200 so the widget simply
// shows nothing (no auth error / no retry loop) — same graceful behavior as the old route.
export async function GET(request: NextRequest) {
    try {
        // Same token/session handling as before: forward the client's Authorization header.
        const authHeader = request.headers.get("authorization");
        const locale = request.headers.get("x-locale") || "en";

        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: locale,
                Authorization: authHeader,
            },
            body: JSON.stringify({ query: KLEVER_CREDIT_ACCOUNT_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.warn("[credit-account-info] GraphQL error — empty credit (200):", JSON.stringify(json.errors).slice(0, 200));
            return NextResponse.json({ has_permission: false, is_visible: false });
        }

        // Preserve the existing top-level shape the CreditLimit widget consumes.
        return NextResponse.json(json?.data?.kleverCreditAccount ?? { has_permission: false, is_visible: false });
    } catch (error: any) {
        console.error("[credit-account-info] error:", error.message);
        return NextResponse.json(
            { error: "Internal Server Error", message: error.message },
            { status: 500 }
        );
    }
}
