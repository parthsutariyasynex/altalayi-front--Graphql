import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function GET(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        const authHeader = request.headers.get("authorization");
        const locale = request.headers.get("x-locale") || "en";

        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const magentoUrl = `${baseUrl}/credit-account-info`;

        const res = await fetch(magentoUrl, {
            method: "GET",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json",
                "x-locale": locale
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            return NextResponse.json(
                { error: "Magento API error", status: res.status, detail: errBody },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[credit-account-info] Proxy error:", error.message);
        return NextResponse.json(
            { error: "Internal Server Error", message: error.message },
            { status: 500 }
        );
    }
}
