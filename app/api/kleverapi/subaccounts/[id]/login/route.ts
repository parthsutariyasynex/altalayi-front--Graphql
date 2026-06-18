import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_LOGIN_AS_SUBACCOUNT_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — log in as a subaccount / impersonate (GraphQL: kleverLoginAsSubaccount).
// Returns { token, customer } at the top level — `token` is where the subaccounts manage
// page reads it from the stored response, so the shape is preserved.
//
// NOT executed during this migration — this is an auth-changing mutation (issues an
// impersonation token); schema-validated + build-verified only.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Authorization required" }, { status: 401 });

        const { id } = await params;
        const subaccountId = parseInt(id, 10);
        if (Number.isNaN(subaccountId)) {
            return NextResponse.json({ message: "Invalid subaccount id" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_LOGIN_AS_SUBACCOUNT_MUTATION, variables: { subaccountId } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[subaccounts/:id/login] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to log in as sub account" }, { status: 400 });
        }

        // Return { token, customer } at top level (matches what the manage page stores/reads).
        return NextResponse.json(json?.data?.kleverLoginAsSubaccount ?? {});
    } catch (error: any) {
        console.error("[subaccounts/:id/login] error:", error.message);
        return NextResponse.json({ message: "Server-side error logging into sub account." }, { status: 500 });
    }
}
