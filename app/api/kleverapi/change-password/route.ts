import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { CHANGE_CUSTOMER_PASSWORD_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — change password for the logged-in customer (GraphQL: changeCustomerPassword
// → Customer { id email }). Requires auth. Caller checks status 200 (success) and
// data.message (error). Body: { currentPassword, newPassword }.
export async function POST(req: NextRequest) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { currentPassword, newPassword } = await req.json();

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(req),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: CHANGE_CUSTOMER_PASSWORD_MUTATION, variables: { currentPassword, newPassword } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to change password" }, { status: 400 });
        }
        // Customer { id email } on success.
        return NextResponse.json(json?.data?.changeCustomerPassword ?? { success: true });
    } catch (error) {
        console.error("Change Password Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
