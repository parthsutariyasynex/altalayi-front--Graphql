import { NextResponse } from 'next/server';
import { CUSTOMER_ADDRESSES_QUERY } from '@/src/graphql/queries';
import { CREATE_CUSTOMER_ADDRESS_MUTATION } from '@/src/graphql/mutations';

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// Map a native GraphQL CustomerAddress → the REST-ish shape the address-book UI consumes
// (adds entity_id, country_id, top-level region_id, and a custom_attributes default).
// NOTE: kept local (not exported) — Next.js route files must not export non-HTTP-method names.
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

// Build a CustomerAddressInput from the incoming UI payload (REST or GraphQL shaped).
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

    // Region: accept an object { region, region_id, region_code } or flat fields. Only include
    // when there's meaningful data (avoids sending an empty region_id:0 with no name).
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

// GET — list customer addresses (GraphQL: customer { addresses }). Returns an array, same as
// the old REST /addresses. On GraphQL error returns an empty list (200) so the UI shows
// "no addresses" instead of crashing — same graceful behavior as before.
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const locale = request.headers.get('x-locale') || 'en';
        if (!authHeader) {
            return NextResponse.json({ message: 'Authentication required. Authorization header is missing.' }, { status: 401 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Store: locale, Authorization: authHeader },
            body: JSON.stringify({ query: CUSTOMER_ADDRESSES_QUERY }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.warn('[addresses GET] GraphQL error — empty list (200):', JSON.stringify(json.errors).slice(0, 200));
            return NextResponse.json([], { status: 200 });
        }

        const addresses = json?.data?.customer?.addresses;
        return NextResponse.json(Array.isArray(addresses) ? addresses.map(mapAddress) : []);
    } catch (error: any) {
        console.error('[addresses GET] error:', error.message);
        return NextResponse.json({ message: error.message || 'Server-side error fetching addresses.' }, { status: 500 });
    }
}

// POST — create a customer address (GraphQL: createCustomerAddress(input: CustomerAddressInput!)).
// Accepts the existing UI payload ({ address: {...} } or a flat body).
export async function POST(request: Request) {
    try {
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
            body: JSON.stringify({ query: CREATE_CUSTOMER_ADDRESS_MUTATION, variables: { input } }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[addresses POST] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || 'Failed to add address.' }, { status: 400 });
        }
        return NextResponse.json(mapAddress(json?.data?.createCustomerAddress ?? {}));
    } catch (error: any) {
        console.error('[addresses POST] error:', error.message);
        return NextResponse.json({ message: 'Server-side error adding address.' }, { status: 500 });
    }
}
