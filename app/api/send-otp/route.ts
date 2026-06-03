import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { KLEVER_SEND_OTP_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — send login/reset OTP to a mobile (GraphQL: kleverSendOtp).
// Public (pre-login) — no auth token. Response shape preserved:
// { success, message, resend_count }; status 400 when success === false so the
// caller's res.ok check keeps working.
export async function POST(request: Request) {
    try {
        const { mobile, countryCode } = await request.json();

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(request) },
            body: JSON.stringify({ query: KLEVER_SEND_OTP_MUTATION, variables: { mobile, countryCode } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Error sending OTP" }, { status: 400 });
        }
        const r = json?.data?.kleverSendOtp ?? {};
        return NextResponse.json(r, { status: r.success === false ? 400 : 200 });
    } catch (error: any) {
        console.error("Send OTP Error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
