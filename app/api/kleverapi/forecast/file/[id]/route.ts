import { NextResponse } from 'next/server';
import { getLocaleFromRequest } from '@/lib/api/magento-url';
import { KLEVER_FORECAST_FILE_QUERY } from '@/src/graphql/queries';

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — download a forecast file. Pure GraphQL: kleverForecastFile(forecastId) returns
// { success, filename, mime_type, base64 }; we decode the base64 and stream it as an attachment
// (same download UX as the old REST/blob proxy). The path `id` is the forecast_id.
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const forecastId = parseInt(id, 10);
        if (Number.isNaN(forecastId)) {
            return NextResponse.json({ message: 'Invalid forecast id' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized: Missing customer token' }, { status: 401 });
        }

        // Optional filename override from the query (kept for backward-compat with callers).
        const fallbackName = new URL(request.url).searchParams.get('file_name') || 'forecast';

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Store: getLocaleFromRequest(request),
                Authorization: authHeader,
            },
            body: JSON.stringify({ query: KLEVER_FORECAST_FILE_QUERY, variables: { forecastId } }),
            cache: 'no-store',
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error('[forecast/file] GraphQL error:', JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || 'Unable to open forecast file.' }, { status: 502 });
        }

        const file = json?.data?.kleverForecastFile;
        if (!file || file.success === false || !file.base64) {
            return NextResponse.json(
                { message: 'Unable to open forecast file. File not accessible.' },
                { status: 404 }
            );
        }

        const buffer = Buffer.from(file.base64, 'base64');
        const filename = file.filename || fallbackName;
        const mime = file.mime_type || 'application/octet-stream';

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': mime,
                'Content-Length': String(buffer.length),
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        console.error('[forecast/file] error:', error.message);
        return NextResponse.json({ message: error.message || 'Server error downloading file' }, { status: 500 });
    }
}
