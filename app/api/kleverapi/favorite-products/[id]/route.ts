import { NextResponse } from 'next/server';
import { CUSTOMER_WISHLIST_QUERY } from '@/src/graphql/queries';
import { REMOVE_PRODUCTS_FROM_WISHLIST_MUTATION } from '@/src/graphql/mutations';

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// DELETE — remove a favourite via native removeProductsFromWishlist. The path `id` is the
// wishlist ITEM id (the list route surfaces it as `favorite_id`). Needs the wishlist id, so we
// resolve it first.
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('Authorization');
        const locale = request.headers.get('x-locale') || 'en';
        if (!authHeader) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        // Resolve the wishlist id.
        const wlRes = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Store: locale, Authorization: authHeader },
            body: JSON.stringify({ query: CUSTOMER_WISHLIST_QUERY, variables: { currentPage: 1, pageSize: 1 } }),
            cache: 'no-store',
        });
        const wlJson = await wlRes.json();
        const wishlistId = wlJson?.data?.customer?.wishlists?.[0]?.id;
        if (!wishlistId) {
            return NextResponse.json({ message: 'No wishlist available for this customer.' }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Store: locale, Authorization: authHeader },
            body: JSON.stringify({
                query: REMOVE_PRODUCTS_FROM_WISHLIST_MUTATION,
                variables: { wishlistId, itemIds: [String(id)] },
            }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[favorite-products/:id DELETE] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || 'Failed to remove favourite.' }, { status: 400 });
        }
        const out = json?.data?.removeProductsFromWishlist;
        const userErr = out?.user_errors?.[0];
        if (userErr) {
            return NextResponse.json({ message: userErr.message || 'Failed to remove favourite.' }, { status: 400 });
        }
        return NextResponse.json({ success: true, items_count: out?.wishlist?.items_count ?? null });
    } catch (error: any) {
        console.error('[favorite-products/:id DELETE] error:', error.message);
        return NextResponse.json({ message: 'Server-side error removing favourite.' }, { status: 500 });
    }
}
