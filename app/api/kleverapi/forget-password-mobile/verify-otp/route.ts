import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { KLEVER_FORGET_PASSWORD_VERIFY_OTP_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — verify mobile reset OTP (GraphQL: kleverForgetPasswordVerifyOtp → String).
// Public. Returns the raw reset-token string; the caller handles
// `typeof data === "string" ? data : (data.resetToken || data.token)`.
export async function POST(req: Request) {
    try {
        const { mobile, otp, countryCode } = await req.json();

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req) },
            body: JSON.stringify({ query: KLEVER_FORGET_PASSWORD_VERIFY_OTP_MUTATION, variables: { mobile, otp, countryCode } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "OTP verification failed" }, { status: 400 });
        }
        const token = json?.data?.kleverForgetPasswordVerifyOtp;
        if (!token) {
            return NextResponse.json({ message: "OTP verification failed" }, { status: 400 });
        }
        // Preserve the old shape: the reset token is returned directly.
        return NextResponse.json(token);
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Server Error" }, { status: 500 });
    }
}
