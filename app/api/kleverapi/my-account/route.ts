import { NextRequest, NextResponse } from 'next/server';
import { getLocaleFromRequest } from '@/lib/api/magento-url';
import { getRequestToken } from '@/lib/api/auth-helper';
import { CUSTOMER_QUERY } from '@/src/graphql/queries';
import { UPDATE_CUSTOMER_MUTATION } from '@/src/graphql/mutations';

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// Pure GraphQL — no REST. The native `customer` query backs GET; `updateCustomer` backs POST.
// Klever-only fields the old REST /my-account returned (group_id, custom_attributes,
// extension_attributes) are not exposed by GraphQL, so we add safe defaults to the response
// shape so the My Account UI keeps rendering without those.
const SAFE_DEFAULTS = {
    group_id: null,
    custom_attributes: [] as any[],
    extension_attributes: {} as Record<string, any>,
};

// GET — customer profile via native `customer` GraphQL (firstname/lastname/email/addresses +
// default_billing/default_shipping). Returns the customer object at the top level, matching the
// shape the profile UI / Redux customer slice expects.
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) {
            return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: CUSTOMER_QUERY }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[my-account GET] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: 'Magento GraphQL error', details: json.errors }, { status: 502 });
        }

        const customer = json?.data?.customer;
        if (!customer) {
            return NextResponse.json({ message: 'Customer profile not available.' }, { status: 404 });
        }

        // Preserve the old top-level shape; add safe defaults for the fields GraphQL can't provide.
        return NextResponse.json({ ...SAFE_DEFAULTS, ...customer });
    } catch (error: any) {
        console.error('[my-account GET] error:', error.message);
        return NextResponse.json(
            { message: error.message || 'Server-side error fetching account details.' },
            { status: 500 }
        );
    }
}

// POST — update the profile (firstname/lastname/email) via native `updateCustomer` GraphQL.
// Accepts the existing UI payload { customer: { firstname, lastname, email, ... } } (or a flat
// body). `email`/`password` are forwarded only when present (email change may need password).
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) {
            return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
        }

        const body = await request.json();
        const src = body?.customer ?? body ?? {};

        const input: Record<string, any> = {};
        if (src.firstname != null) input.firstname = String(src.firstname);
        if (src.lastname != null) input.lastname = String(src.lastname);
        if (src.email != null && src.email !== '') input.email = String(src.email);
        if (src.password != null && src.password !== '') input.password = String(src.password);

        if (Object.keys(input).length === 0) {
            return NextResponse.json({ message: 'No updatable profile fields provided.' }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: UPDATE_CUSTOMER_MUTATION, variables: { input } }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[my-account POST] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || 'Failed to update profile.' }, { status: 400 });
        }

        const customer = json?.data?.updateCustomer?.customer;
        return NextResponse.json({ ...SAFE_DEFAULTS, ...(customer ?? {}) });
    } catch (error: any) {
        console.error('[my-account POST] error:', error.message);
        return NextResponse.json(
            { message: error.message || 'Server-side error updating account details.' },
            { status: 500 }
        );
    }
}
