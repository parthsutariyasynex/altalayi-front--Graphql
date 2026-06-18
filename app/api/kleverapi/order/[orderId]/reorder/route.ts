import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { REORDER_ITEMS_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// POST — re-add a past order's items to the cart (GraphQL: reorderItems(orderNumber: String!)).
//
// IMPORTANT: reorderItems expects the order NUMBER (increment id, e.g. "AUT0000160"),
// NOT the numeric entity_id. The [orderId] path segment is forwarded as orderNumber, so the
// caller must pass the order number. (The current frontend passes order.entity_id — see the
// migration note; that call-site needs order.number/increment_id for this to resolve.)
//
// Returns the same success/error contract the page relies on: on success the cart was
// updated (page calls refetchCart + redirects); userInputErrors are surfaced as a 400 with
// `message` so the existing `!res.ok` toast path works.
//
// NOT executed during migration — cart-changing; schema-validated + tsc only.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { orderId } = await params;
        const orderNumber = decodeURIComponent(orderId);

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: REORDER_ITEMS_MUTATION, variables: { orderNumber } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[order/:id/reorder] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to reorder" }, { status: 400 });
        }

        const result = json?.data?.reorderItems;
        // Surface per-item issues (out of stock, etc.) the same way the old route's
        // non-OK path did — the page reads `data.message` on failure.
        const inputErrors = Array.isArray(result?.userInputErrors) ? result.userInputErrors : [];
        if (inputErrors.length > 0) {
            return NextResponse.json({ message: inputErrors[0]?.message || "Some items could not be reordered", userInputErrors: inputErrors }, { status: 400 });
        }

        return NextResponse.json(result ?? {});
    } catch (error: any) {
        console.error("[order/:id/reorder] error:", error.message);
        return NextResponse.json({ message: error.message || "Server error during reorder" }, { status: 500 });
    }
}
