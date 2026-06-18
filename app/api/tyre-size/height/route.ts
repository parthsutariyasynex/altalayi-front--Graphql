import { NextRequest, NextResponse } from "next/server";
import { getRequestToken } from "@/lib/api/auth-helper";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { KLEVER_TYRE_SIZE_HEIGHT_QUERY } from "@/src/graphql/queries";

// Tyre-size height options via Magento GraphQL (kleverTyreSizeHeight(width)),
// replacing the old REST /tyre-size/height. Response: { status, options: [{ value, label }] }.
// Cached by locale + width (catalog-wide, not customer-specific).
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { body: any; expires: number }>();

export async function GET(request: NextRequest) {
    const token = await getRequestToken(request);
    const locale = getLocaleFromRequest(request);
    const width = new URL(request.url).searchParams.get("width") || "";

    const now = Date.now();
    const cacheKey = `${locale}|${width}`;
    const cached = cache.get(cacheKey);
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
            // Omit `width` when empty — the resolver treats an empty string as a
            // filter value (→ 0 results), whereas an omitted/null arg returns ALL
            // heights (what HorizontalFilter expects on initial load / reset).
            body: JSON.stringify({ query: KLEVER_TYRE_SIZE_HEIGHT_QUERY, variables: width ? { width } : {} }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[tyre-size/height] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ status: "error", options: [] }, { status: 502 });
        }

        const raw = json?.data?.kleverTyreSizeHeight;
        const body = { status: raw?.status, options: Array.isArray(raw?.options) ? raw.options : [] };

        cache.set(cacheKey, { body, expires: now + CACHE_TTL_MS });
        return NextResponse.json(body, { headers: { "X-Cache": "MISS" } });
    } catch (err: any) {
        console.error("[tyre-size/height] Fetch exception:", err?.message);
        return NextResponse.json(
            { status: "error", options: [], message: err?.message || "Fetch failed" },
            { status: 500 }
        );
    }
}
