import { NextResponse } from 'next/server';
import { CUSTOMER_WISHLIST_QUERY, PRODUCT_ATTRIBUTE_OPTIONS_QUERY } from '@/src/graphql/queries';
import { ADD_PRODUCTS_TO_WISHLIST_MUTATION } from '@/src/graphql/mutations';

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// Native product images come back as a /cache/<hash>/ path that 404s; the un-cached path works.
function fixImageUrl(url?: string | null): string | null {
    if (!url) return null;
    return url.replace(/\/cache\/[^/]+\//, '/');
}

// pattern/origin come back as attribute-option IDs; resolve to labels via customAttributeMetadata.
// Cached in-memory (1h) since the option lists are static and shared across all customers.
type AttrMaps = { pattern: Record<string, string>; origin: Record<string, string> };
let _attrMapsCache: { value: AttrMaps; expires: number } | null = null;

async function getAttributeMaps(): Promise<AttrMaps> {
    const now = Date.now();
    if (_attrMapsCache && _attrMapsCache.expires > now) return _attrMapsCache.value;
    const maps: AttrMaps = { pattern: {}, origin: {} };
    try {
        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: PRODUCT_ATTRIBUTE_OPTIONS_QUERY }),
            cache: 'no-store',
        });
        const json = await res.json();
        for (const it of json?.data?.customAttributeMetadata?.items ?? []) {
            const m: Record<string, string> = {};
            for (const o of it?.attribute_options ?? []) if (o?.value != null) m[String(o.value)] = o.label;
            if (it?.attribute_code === 'pattern') maps.pattern = m;
            if (it?.attribute_code === 'origin') maps.origin = m;
        }
        _attrMapsCache = { value: maps, expires: now + 60 * 60 * 1000 };
    } catch { /* fall back to empty maps — pattern/origin just stay blank */ }
    return maps;
}

// Map a native wishlist item → the favourites REST-ish shape the UI consumes (favorite_id is
// the wishlist ITEM id, used by the DELETE route; product fields are flattened).
//
// NOTE on fidelity vs the old klever REST /favorite-products:
//  - tyre_size / year / brand are PARSED FROM THE PRODUCT NAME (e.g. "Bridgestone 215/55 R16 ... 2025").
//    Native ProductInterface returns these as numeric attribute-option IDs (pattern: 1991, origin:
//    1168, …), NOT labels — so `pattern`/`origin` can't be shown and stay blank.
//  - The native `product.image.url` points at an uncached path that 404s; klever's resolved
//    image_url differs. Full parity needs a backend `kleverFavoriteProducts` op returning resolved
//    labels + working image_url (see route footer note).
function mapWishlistItem(it: any, maps: AttrMaps) {
    const p = it?.product || {};
    const fp = p?.price_range?.minimum_price?.final_price?.value ?? 0;
    const rp = p?.price_range?.minimum_price?.regular_price?.value ?? 0;
    const name: string = p?.name || '';
    const sizeMatch = name.match(/(\d+\/\d+\s*R\d+(?:\.\d+)?)/i);
    const yearMatch = name.match(/\b(20\d{2})\b/);
    const image = fixImageUrl(p?.image?.url);
    return {
        favorite_id: it?.id,
        product_id: p?.id,
        id: p?.id,
        sku: p?.sku,
        item_code: p?.sku,
        name,
        url_key: p?.url_key,
        image_url: image,
        image,
        final_price: fp,
        price: rp || fp,
        stock_status: p?.stock_status,
        stock_qty: p?.stock_status === 'IN_STOCK' ? 1 : 0,
        qty: it?.quantity ?? 1,
        // brand/size/year parsed from the name; pattern/origin resolved from option IDs → labels.
        brand: name ? name.split(' ')[0] : '',
        tyre_size: sizeMatch ? sizeMatch[1].replace(/\s+/g, ' ') : '',
        year: yearMatch ? yearMatch[1] : '',
        pattern: p?.pattern != null ? (maps.pattern[String(p.pattern)] || '') : '',
        origin: p?.origin != null ? (maps.origin[String(p.origin)] || '') : '',
    };
}

async function fetchWishlist(authHeader: string, locale: string, currentPage: number, pageSize: number) {
    const res = await fetch(MAGENTO_GRAPHQL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Store: locale, Authorization: authHeader },
        body: JSON.stringify({ query: CUSTOMER_WISHLIST_QUERY, variables: { currentPage, pageSize } }),
        cache: 'no-store',
    });
    return res.json();
}

// GET — favourite products via native customer wishlist. Returns { products, total_count },
// same shape the favourites UI reads. On error returns an empty list (200) — graceful, as before.
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const locale = request.headers.get('x-locale') || 'en';
        if (!authHeader) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const currentPage = parseInt(searchParams.get('currentPage') || '1', 10) || 1;
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;

        const [json, maps] = await Promise.all([
            fetchWishlist(authHeader, locale, currentPage, pageSize),
            getAttributeMaps(),
        ]);
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.warn('[favorite-products GET] GraphQL error — empty list (200):', JSON.stringify(json.errors).slice(0, 200));
            return NextResponse.json({ products: [], total_count: 0 });
        }

        const wl = json?.data?.customer?.wishlists?.[0];
        const items = wl?.items_v2?.items ?? [];
        return NextResponse.json({
            products: items.map((it: any) => mapWishlistItem(it, maps)),
            total_count: wl?.items_count ?? items.length,
        });
    } catch (error: any) {
        console.error('[favorite-products GET] error:', error.message);
        return NextResponse.json({ message: error.message || 'Server-side error fetching favourites.' }, { status: 500 });
    }
}

// POST — add to favourites via addProductsToWishlist. Native wishlist add requires a SKU
// (WishlistItemInput.sku), so the body must include `sku` (the products page sends it).
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const locale = request.headers.get('x-locale') || 'en';
        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const body = await request.json();
        const sku = body?.sku;
        if (!sku) {
            return NextResponse.json(
                { message: 'sku is required to add to wishlist (native addProductsToWishlist needs a SKU, not product_id).' },
                { status: 400 }
            );
        }
        const quantity = Number(body?.qty ?? body?.quantity ?? 1) || 1;

        // Resolve the customer's wishlist id (addProductsToWishlist requires it).
        const wlJson = await fetchWishlist(authHeader, locale, 1, 1);
        const wishlistId = wlJson?.data?.customer?.wishlists?.[0]?.id;
        if (!wishlistId) {
            return NextResponse.json({ message: 'No wishlist available for this customer.' }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Store: locale, Authorization: authHeader },
            body: JSON.stringify({
                query: ADD_PRODUCTS_TO_WISHLIST_MUTATION,
                variables: { wishlistId, items: [{ sku: String(sku), quantity }] },
            }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[favorite-products POST] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || 'Failed to add favourite.' }, { status: 400 });
        }
        const out = json?.data?.addProductsToWishlist;
        const userErr = out?.user_errors?.[0];
        if (userErr) {
            return NextResponse.json({ message: userErr.message || 'Failed to add favourite.' }, { status: 400 });
        }
        return NextResponse.json({ success: true, items_count: out?.wishlist?.items_count ?? null });
    } catch (error: any) {
        console.error('[favorite-products POST] error:', error.message);
        return NextResponse.json({ message: 'Server-side error adding favourite.' }, { status: 500 });
    }
}
