import { CUSTOMER_CART_ID_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// Resolves the logged-in customer's masked cart id (the `cart_id` that Magento-native
// cart queries/mutations require) via `customerCart { id }`, cached briefly per token
// so cart-dependent checkout routes don't each pay a round trip. The id is stable for
// the active quote; it changes when the quote is replaced (e.g. after an order), so the
// short TTL bounds staleness, and callers can clearCustomerCartId(token) explicitly.
const CART_ID_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { id: string; expires: number }>();

export function clearCustomerCartId(token?: string) {
    if (token) cache.delete(token);
    else cache.clear();
}

export async function getCustomerCartId(token: string, locale: string): Promise<string | null> {
    const now = Date.now();
    const hit = cache.get(token);
    if (hit && hit.expires > now) return hit.id;

    try {
        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: locale,
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: CUSTOMER_CART_ID_QUERY }),
            cache: "no-store",
        });
        const json = await res.json();
        const id: string | null = json?.data?.customerCart?.id ?? null;
        if (id) cache.set(token, { id, expires: now + CART_ID_TTL_MS });
        return id;
    } catch (err) {
        console.error("[getCustomerCartId] error:", err);
        return null;
    }
}
