import { NextResponse, NextRequest } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_TARGETS_ACHIEVEMENTS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — targets & achievements (GraphQL: kleverTargetsAchievements)
export async function GET(req: NextRequest) {
    try {
        const token = await getRequestToken(req);
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const year = new URL(req.url).searchParams.get("year");
        const variables: Record<string, number> = {};
        if (year) variables.year = parseInt(year, 10);

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(req),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_TARGETS_ACHIEVEMENTS_QUERY, variables }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[targets-achievements] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }
        // Preserve the existing REST shape: { available_years, years }.
        return NextResponse.json(json?.data?.kleverTargetsAchievements ?? {});
    } catch (error) {
        console.error("Proxy Targets & Achievements Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
