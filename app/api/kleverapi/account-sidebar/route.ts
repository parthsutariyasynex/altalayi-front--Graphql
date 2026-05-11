import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";

/**
 * Proxy route for Magento account sidebar API.
 * Fetches the dynamic sidebar configuration based on the authenticated user.
 */
export async function GET(request: NextRequest) {
    try {
        const BASE_URL = getBaseUrl(request);
        const token = await getRequestToken(request);

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Call Magento /account-sidebar endpoint
        const res = await fetch(`${BASE_URL}/account-sidebar`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[account-sidebar] Magento error:", res.status, errBody);
            
            // Return empty items as graceful fallback if API fails
            return NextResponse.json({ 
                user_type: "Guest", 
                items: [] 
            });
        }

        const data = await res.json();
        
        // Ensure structure: { user_type: string, items: [...] }
        const rawItems = Array.isArray(data?.items) ? data.items : [];
        
        // Normalize URLs to paths if they are absolute Magento URLs
        const items = rawItems.map((item: any) => {
            let url = item.url || "#";
            try {
                if (url.startsWith("http")) {
                    const parsed = new URL(url);
                    url = (parsed.pathname || "#") + parsed.search;
                }
            } catch {
                // Keep as is if parsing fails
            }
            
            return {
                ...item,
                url,
                // Default visibility to true if not specified
                is_visible: item.is_visible !== false,
                sort_order: Number(item.sort_order) || 0
            };
        });

        return NextResponse.json({
            user_type: data?.user_type || "Customer",
            items
        });

    } catch (error: any) {
        console.error("[account-sidebar] Route error:", error.message);
        return NextResponse.json({ 
            error: "Internal Server Error",
            items: [] 
        }, { status: 500 });
    }
}
