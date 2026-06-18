import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_REMOVE_NOTIFICATION_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — remove a notification (GraphQL: kleverRemoveNotification(notificationId: Int!)).
// Returns { success, message }. NOT executed during migration — schema-validated + tsc only.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const notificationId = parseInt(id, 10);
        if (Number.isNaN(notificationId)) {
            return NextResponse.json({ message: "Invalid notification id" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_REMOVE_NOTIFICATION_MUTATION, variables: { notificationId } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[notifications/:id/remove] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ success: false, message: json.errors[0]?.message || "Failed to remove notification" }, { status: 400 });
        }
        return NextResponse.json(json?.data?.kleverRemoveNotification ?? { success: false });
    } catch (error: any) {
        console.error("[notifications/:id/remove] error:", error.message);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}
