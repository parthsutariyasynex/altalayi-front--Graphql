import { NextRequest, NextResponse } from "next/server";
import { getRequestToken } from "@/lib/api/auth-helper";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { KLEVER_TYRE_SIZE_RIM_QUERY } from "@/src/graphql/queries";

// Tyre-size rim options via Magento GraphQL (kleverTyreSizeRim(width, height)),
// replacing the old REST /tyre-size/rim. Response: { status, options: [{ value, label }] }.
// Cached by locale + width + height (catalog-wide, not customer-specific).
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { body: any; expires: number }>();

export async function GET(request: NextRequest) {
    const token = await getRequestToken(request);
    const locale = getLocaleFromRequest(request);
    const { searchParams } = new URL(request.url);
    const width = searchParams.get("width") || "";
    const height = searchParams.get("height") || "";

    const now = Date.now();
    const cacheKey = `${locale}|${width}|${height}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > now) {
        return NextResponse.json(cached.body, { headers: { "X-Cache": "HIT" } });
    }

    try {
        // Omit empty args — an empty string is treated as a filter value (→ 0 results),
        // whereas omitting an arg returns the broader set (all rims, or rims by width
        // only). Matches HorizontalFilter's cascade: no args → all, width → by width,
        // width+height → by both.
        const variables: Record<string, string> = {};
        if (width) variables.width = width;
        if (height) variables.height = height;

        const domain = process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com";
        const res = await fetch(`${domain}/graphql`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: locale,
                ...(token && token !== "null" && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ query: KLEVER_TYRE_SIZE_RIM_QUERY, variables }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[tyre-size/rim] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ status: "error", options: [] }, { status: 502 });
        }

        const raw = json?.data?.kleverTyreSizeRim;
        const body = { status: raw?.status, options: Array.isArray(raw?.options) ? raw.options : [] };

        cache.set(cacheKey, { body, expires: now + CACHE_TTL_MS });
        return NextResponse.json(body, { headers: { "X-Cache": "MISS" } });
    } catch (err: any) {
        console.error("[tyre-size/rim] Fetch exception:", err?.message);
        return NextResponse.json(
            { status: "error", options: [], message: err?.message || "Fetch failed" },
            { status: 500 }
        );
    }
}
