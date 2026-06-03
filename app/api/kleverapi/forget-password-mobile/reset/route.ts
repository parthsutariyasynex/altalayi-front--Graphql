import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { KLEVER_RESET_PASSWORD_BY_MOBILE_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — reset password via mobile reset token (GraphQL: kleverResetPasswordByMobile
// → Boolean). Public. Caller checks res.ok + data.message. true → 200, else 400.
export async function POST(req: Request) {
    try {
        const { resetToken, newPassword, confirmPassword } = await req.json();

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req) },
            body: JSON.stringify({
                query: KLEVER_RESET_PASSWORD_BY_MOBILE_MUTATION,
                variables: { resetToken, newPassword, confirmPassword },
            }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Password reset failed" }, { status: 400 });
        }
        if (json?.data?.kleverResetPasswordByMobile === true) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ message: "Password reset failed" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Server Error" }, { status: 500 });
    }
}
