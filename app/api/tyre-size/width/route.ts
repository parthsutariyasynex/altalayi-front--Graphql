import { NextRequest, NextResponse } from "next/server";
import { getRequestToken } from "@/lib/api/auth-helper";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { KLEVER_TYRE_SIZE_WIDTH_QUERY } from "@/src/graphql/queries";

// Tyre-size width options via Magento GraphQL (kleverTyreSizeWidth), replacing the
// old REST /tyre-size/width. Response: { status, options: [{ value, label }] }.
//
// Catalog-wide + stable, so cached by locale (not token) and shared across users.
// The backend resolver is slow (~6-8s); caching keeps the cascade snappy.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { body: any; expires: number }>();

export async function GET(request: NextRequest) {
    const token = await getRequestToken(request);
    const locale = getLocaleFromRequest(request);

    const now = Date.now();
    const cached = cache.get(locale);
    if (cached && cached.expires > now) {
        return NextResponse.json(cached.body, { headers: { "X-Cache": "HIT" } });
    }

    try {
        const domain = process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com";
        const res = await fetch(`${domain}/graphql`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: locale,
                ...(token && token !== "null" && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ query: KLEVER_TYRE_SIZE_WIDTH_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[tyre-size/width] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ status: "error", options: [] }, { status: 502 });
        }

        const raw = json?.data?.kleverTyreSizeWidth;
        const body = { status: raw?.status, options: Array.isArray(raw?.options) ? raw.options : [] };

        cache.set(locale, { body, expires: now + CACHE_TTL_MS });
        return NextResponse.json(body, { headers: { "X-Cache": "MISS" } });
    } catch (err: any) {
        console.error("[tyre-size/width] Fetch exception:", err?.message);
        return NextResponse.json(
            { status: "error", options: [], message: err?.message || "Fetch failed" },
            { status: 500 }
        );
    }
}
