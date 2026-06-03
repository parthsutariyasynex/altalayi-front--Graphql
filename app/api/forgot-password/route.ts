import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { REQUEST_PASSWORD_RESET_EMAIL_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — email password reset (GraphQL: requestPasswordResetEmail → Boolean). Public.
// Caller checks res.ok (success) and data.message (error). true → 200, otherwise 400.
export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request) },
            body: JSON.stringify({ query: REQUEST_PASSWORD_RESET_EMAIL_MUTATION, variables: { email } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Unable to send reset link" }, { status: 400 });
        }
        if (json?.data?.requestPasswordResetEmail === true) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ message: "Unable to send reset link" }, { status: 400 });
    } catch (error: any) {
        console.error(">>> forgot-password error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
