import { NextRequest, NextResponse } from 'next/server';
import { getLocaleFromRequest } from '@/lib/api/magento-url';
import { getRequestToken } from '@/lib/api/auth-helper';
import { KLEVER_FORECAST_LIST_QUERY } from '@/src/graphql/queries';
import { KLEVER_UPLOAD_FORECAST_MUTATION } from '@/src/graphql/mutations';

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — forecast file list (GraphQL: kleverForecastList(pageSize, currentPage)).
// Replaces REST /forecast. Returns { items[{forecast_id, file_name, file_url,
// uploaded_date}], total_count, page_size, current_page, total_pages, message }.
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
        const currentPage = parseInt(searchParams.get('currentPage') || '1', 10) || 1;

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_FORECAST_LIST_QUERY, variables: { pageSize, currentPage } }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[forecast] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: 'Failed to fetch forecast files', details: json.errors }, { status: 502 });
        }

        const r = json?.data?.kleverForecastList;
        return NextResponse.json({
            items: Array.isArray(r?.items) ? r.items : [],
            total_count: r?.total_count ?? 0,
            page_size: r?.page_size ?? pageSize,
            current_page: r?.current_page ?? currentPage,
            total_pages: r?.total_pages ?? 0,
            message: r?.message ?? null,
        });
    } catch (error: any) {
        console.error('[forecast] Error:', error.message);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

// POST — upload a forecast file (GraphQL: kleverUploadForecast(fileName, fileContent)).
// The client posts multipart FormData with a `file`; the route reads it, base64-encodes the
// bytes, and sends fileName + fileContent. Returns the refreshed list { items, total_count,
// message } (the page just checks res.ok then re-pulls). NOT executed during migration —
// upload op; schema-validated + tsc only.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file || typeof file === 'string') {
            return NextResponse.json({ message: 'file is required' }, { status: 400 });
        }

        const fileName = (file as File).name;
        const fileContent = Buffer.from(await (file as File).arrayBuffer()).toString('base64');

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_UPLOAD_FORECAST_MUTATION, variables: { fileName, fileContent } }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[forecast-upload] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || 'Upload failed' }, { status: 400 });
        }

        const r = json?.data?.kleverUploadForecast;
        return NextResponse.json({
            items: Array.isArray(r?.items) ? r.items : [],
            total_count: r?.total_count ?? 0,
            message: r?.message ?? null,
        });
    } catch (error: any) {
        console.error('[forecast-upload] Error:', error.message);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}


