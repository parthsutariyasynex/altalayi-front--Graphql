import { NextResponse } from 'next/server';
import { CUSTOMER_ADDRESSES_QUERY } from '@/src/graphql/queries';
import { UPDATE_CUSTOMER_ADDRESS_MUTATION, DELETE_CUSTOMER_ADDRESS_MUTATION } from '@/src/graphql/mutations';

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// Local helpers (mirrors the list route) — Next.js route files can't import non-handler exports
// from another route, and must not export extra names, so these are duplicated locally.
function mapAddress(a: any) {
    if (!a) return a;
    return {
        ...a,
        id: a.id,
        entity_id: a.id,
        country_id: a.country_code ?? null,
        region_id: a?.region?.region_id ?? null,
        custom_attributes: [],
    };
}

function buildAddressInput(src: any) {
    const input: Record<string, any> = {};
    if (src?.firstname != null) input.firstname = String(src.firstname);
    if (src?.lastname != null) input.lastname = String(src.lastname);
    if (src?.telephone != null) input.telephone = String(src.telephone);
    if (src?.city != null) input.city = String(src.city);
    if (src?.postcode != null) input.postcode = String(src.postcode);
    if (src?.company != null) input.company = String(src.company);
    if (src?.vat_id != null) input.vat_id = String(src.vat_id);
    if (src?.street != null) {
        input.street = Array.isArray(src.street) ? src.street.map(String) : [String(src.street)];
    }
    const cc = src?.country_code ?? src?.country_id;
    if (cc) input.country_code = String(cc);

    const r: Record<string, any> = {};
    const regObj = typeof src?.region === 'object' && src.region ? src.region : {};
    const regionName = regObj.region ?? (typeof src?.region === 'string' ? src.region : undefined);
    const regionId = regObj.region_id ?? src?.region_id;
    const regionCode = regObj.region_code ?? src?.region_code;
    if (regionName != null && regionName !== '') r.region = String(regionName);
    if (regionCode != null && regionCode !== '') r.region_code = String(regionCode);
    if (regionId != null && Number(regionId) > 0) r.region_id = Number(regionId);
    if (Object.keys(r).length > 0) input.region = r;

    if (typeof src?.default_billing === 'boolean') input.default_billing = src.default_billing;
    if (typeof src?.default_shipping === 'boolean') input.default_shipping = src.default_shipping;
    return input;
}

// GET — single address: fetch customer.addresses (GraphQL) and filter by id. Magento has no
// single-address query, so we read the list and pick the match (preserves the REST behavior).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('Authorization');
        const locale = request.headers.get('x-locale') || 'en';
        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Store: locale, Authorization: authHeader },
            body: JSON.stringify({ query: CUSTOMER_ADDRESSES_QUERY }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[addresses/:id GET] GraphQL error:', JSON.stringify(json.errors).slice(0, 200));
            return NextResponse.json({ message: 'Magento GraphQL error', details: json.errors }, { status: 502 });
        }

        const addresses = json?.data?.customer?.addresses ?? [];
        const match = addresses.find((a: any) => String(a?.id) === String(id));
        if (!match) {
            return NextResponse.json({ message: 'Address not found' }, { status: 404 });
        }
        return NextResponse.json(mapAddress(match));
    } catch (error: any) {
        console.error('[addresses/:id GET] error:', error.message);
        return NextResponse.json({ message: 'Server-side error fetching address.' }, { status: 500 });
    }
}

// PUT — update an address (GraphQL: updateCustomerAddress(id: Int!, input: CustomerAddressInput!)).
// Accepts the existing UI payload ({ address: {...} } or a flat body).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const addressId = parseInt(id, 10);
        if (Number.isNaN(addressId)) {
            return NextResponse.json({ message: 'Invalid address id' }, { status: 400 });
        }
        const authHeader = request.headers.get('Authorization');
        const locale = request.headers.get('x-locale') || 'en';
        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const body = await request.json();
        const input = buildAddressInput(body?.address ?? body ?? {});

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Store: locale, Authorization: authHeader },
            body: JSON.stringify({ query: UPDATE_CUSTOMER_ADDRESS_MUTATION, variables: { id: addressId, input } }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[addresses/:id PUT] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || 'Failed to update address.' }, { status: 400 });
        }
        return NextResponse.json(mapAddress(json?.data?.updateCustomerAddress ?? {}));
    } catch (error: any) {
        console.error('[addresses/:id PUT] error:', error.message);
        return NextResponse.json({ message: 'Server-side error updating address.' }, { status: 500 });
    }
}

// DELETE — remove an address (GraphQL: deleteCustomerAddress(id: Int!): Boolean).
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const addressId = parseInt(id, 10);
        if (Number.isNaN(addressId)) {
            return NextResponse.json({ message: 'Invalid address id' }, { status: 400 });
        }
        const authHeader = request.headers.get('Authorization');
        const locale = request.headers.get('x-locale') || 'en';
        if (!authHeader) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Store: locale, Authorization: authHeader },
            body: JSON.stringify({ query: DELETE_CUSTOMER_ADDRESS_MUTATION, variables: { id: addressId } }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[addresses/:id DELETE] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || 'Failed to delete address.' }, { status: 400 });
        }
        return NextResponse.json({ success: json?.data?.deleteCustomerAddress ?? false });
    } catch (error: any) {
        console.error('[addresses/:id DELETE] error:', error.message);
        return NextResponse.json({ message: 'Server-side error deleting address.' }, { status: 500 });
    }
}
