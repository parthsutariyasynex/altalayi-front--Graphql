import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { KLEVER_LOGIN_WITH_OTP_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — OTP login (GraphQL: kleverLoginWithOtp). Public (pre-login).
// Response shape preserved: { token, customer { email firstname lastname } } so the
// caller can read data.token (or data.customer.token).
// NOTE: the live OTP login UI goes through NextAuth signIn → auth-options (also
// migrated to kleverLoginWithOtp). This standalone route mirrors that for the
// Redux authActions.loginWithOtp path.
export async function POST(req: Request) {
    try {
        const { mobile, otp, countryCode } = await req.json();

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req) },
            body: JSON.stringify({ query: KLEVER_LOGIN_WITH_OTP_MUTATION, variables: { mobile, otp, countryCode } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Invalid OTP" }, { status: 401 });
        }
        const r = json?.data?.kleverLoginWithOtp;
        if (!r?.token) {
            return NextResponse.json({ message: "Invalid OTP" }, { status: 401 });
        }
        return NextResponse.json(r);
    } catch (error: any) {
        console.error("Login OTP Error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
