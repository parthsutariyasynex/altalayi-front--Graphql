import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { GENERATE_CUSTOMER_TOKEN_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — email/password login (GraphQL: generateCustomerToken(email, password) { token }).
// Replaces REST /login/email. The login page reads only the token (magentoData?.token), so
// returning { token } preserves the consumer contract. On bad credentials, returns the
// GraphQL error message + 401.
//
// NOTE: this route is the login page's token pre-fetch; the actual NextAuth session is
// established by the credentials provider in lib/auth/auth-options.ts (still REST — see
// migration note). Must be live-verified once the Cloudflare block clears.
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = body?.username || body?.email;
        const password = body?.password;
        if (!email || !password) {
            return NextResponse.json({ message: "email and password are required" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
            },
            body: JSON.stringify({ query: GENERATE_CUSTOMER_TOKEN_MUTATION, variables: { email, password } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[login] GraphQL error:", JSON.stringify(json.errors).slice(0, 200));
            return NextResponse.json({ message: json.errors[0]?.message || "Login failed" }, { status: 401 });
        }

        const token = json?.data?.generateCustomerToken?.token;
        if (!token) {
            return NextResponse.json({ message: "Login failed" }, { status: 401 });
        }
        // Return { token } — the login page reads magentoData?.token.
        return NextResponse.json({ token });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Login failed" }, { status: 500 });
    }
}
