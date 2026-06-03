import { NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { CUSTOMER_CART_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// item uid is base64 of the numeric quote item id (verified: atob("MTEzOTE0")="113914").
function uidToItemId(uid: string): number {
    try { return Number(Buffer.from(uid, "base64").toString("utf-8")) || 0; } catch { return 0; }
}

// GraphQL product image URLs point at the Magento image CACHE path
// (…/media/catalog/product/cache/<hash>/…) which 404s when the resized variant
// was never generated. Strip the cache segment to the direct media path (the URL
// REST returned), which resolves correctly.
function directImageUrl(url: string | undefined): string {
    if (!url) return "/images/tyre-sample.png";
    return url.replace(/\/media\/catalog\/product\/cache\/[^/]+\//, "/media/catalog/product/");
}

// size_display / pattern_display have NO GraphQL field anywhere in the schema, so we
// reconstruct them (best-effort) from the product name to keep the cart 100% GraphQL.
// e.g. "Bridgestone T 215/70 R15C R624Z 109S TL 2025" → size "215/70 R15C 2025", pattern "R624Z TL".
function parseDisplays(name: string): { size_display: string; pattern_display: string } {
    const sizeMatch = name.match(/(\d{2,3}\/\d{2,3}\s*R?\s*\d{2,3}[A-Z]?)/i);
    const yearMatch = name.match(/\b(20\d{2})\b/);
    const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, " ").trim() : "";
    const year = yearMatch ? yearMatch[1] : "";
    const size_display = [size, year].filter(Boolean).join(" ");
    let pattern_display = "";
    if (sizeMatch) {
        // Pattern lives between the size token and the load-index/year; keep "TL"/"TT" if present.
        let rest = name.slice((sizeMatch.index ?? 0) + sizeMatch[0].length).trim();
        if (year) rest = rest.replace(year, "").trim();
        rest = rest.replace(/\b\d{2,3}[A-Z]\b/g, " ").replace(/\s+/g, " ").trim(); // strip load index e.g. 109S
        pattern_display = rest;
    }
    return { size_display, pattern_display };
}

// GET — customer cart (GraphQL: customerCart). Mapped to the CartContext shape.
export async function GET(req: Request) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: getLocaleFromRequest(req), Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: CUSTOMER_CART_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[cart] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }

        const cart = json?.data?.customerCart;
        if (!cart) return NextResponse.json({ items: [], items_count: 0, subtotal: 0, tax_amount: 0, tax_label: "Tax", grand_total: 0, currency_code: "SAR", cart_id: null });

        const items = (Array.isArray(cart.items) ? cart.items : []).map((it: any) => {
            const name = it.product?.name ?? "";
            const { size_display, pattern_display } = parseDisplays(name);
            const url_key = it.product?.url_key;
            return {
                item_id: uidToItemId(it.uid),     // numeric, what CartContext + UI use
                cart_item_uid: it.uid,            // raw uid (additive; for GraphQL mutations)
                sku: it.product?.sku ?? "",
                name,
                price: Number(it.prices?.price?.value ?? 0),
                qty: Number(it.quantity ?? 0),
                image_url: directImageUrl(it.product?.thumbnail?.url),
                product_url: url_key ? `/products/${url_key}` : undefined,
                size_display,
                pattern_display,
                row_total: Number(it.prices?.row_total?.value ?? 0),
            };
        });

        const grand_total = Number(cart.prices?.grand_total?.value ?? 0);
        const subtotal = Number(cart.prices?.subtotal_excluding_tax?.value ?? 0);
        return NextResponse.json({
            items,
            items_count: Number(cart.total_quantity ?? items.reduce((s: number, i: any) => s + i.qty, 0)),
            subtotal,
            // No tax breakdown in this query → derive from grand_total - subtotal.
            tax_amount: Math.max(0, grand_total - subtotal),
            tax_label: "Tax",
            grand_total,
            currency_code: cart.prices?.grand_total?.currency ?? "SAR",
            cart_id: cart.id ?? null,
        });
    } catch (error) {
        console.error("Cart GET Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
