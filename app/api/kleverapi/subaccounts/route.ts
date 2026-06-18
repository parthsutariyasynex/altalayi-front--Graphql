import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
// KLEVER_SUBACCOUNTS_QUERY omits the buggy `permissions` field — see the note on
// the const in src/graphql/queries.ts (backend types it [Int] but returns strings).
import { KLEVER_SUBACCOUNTS_QUERY } from "@/src/graphql/queries";
import { KLEVER_CREATE_SUBACCOUNT_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — list subaccounts (GraphQL: kleverSubaccounts)
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) {
            return NextResponse.json({ message: "Authentication required. Authorization header is missing." }, { status: 401 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_SUBACCOUNTS_QUERY }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[subaccounts] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: json.errors }, { status: 502 });
        }

        const r = json?.data?.kleverSubaccounts;
        // Preserve the existing REST shape: { items, total_count }.
        return NextResponse.json({
            items: Array.isArray(r?.items) ? r.items : [],
            total_count: r?.total_count ?? 0,
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Server-side error fetching sub accounts." }, { status: 500 });
    }
}

// POST — create a subaccount (GraphQL: kleverCreateSubaccount(input: KleverSubaccountInput!)).
// Body carries the new account fields; the route builds the KleverSubaccountInput object
// (email/firstname/lastname/password required; is_active/permissions coerced to Int; taxvat
// optional). Returns the created subaccount (list-item shape, permissions omitted). NOT
// executed during migration — data-changing; schema-validated + tsc only.
export async function POST(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

        const body = await request.json();
        // Required fields validated before hitting GraphQL (email/firstname/lastname are
        // String! on the schema; password is required to create a usable login).
        const missing = ["email", "firstname", "lastname", "password"].filter((k) => !body?.[k]);
        if (missing.length > 0) {
            return NextResponse.json({ message: `Missing required field(s): ${missing.join(", ")}` }, { status: 400 });
        }

        const input: Record<string, any> = {
            email: String(body.email),
            firstname: String(body.firstname),
            lastname: String(body.lastname),
            password: String(body.password),
        };
        if (body.is_active != null) input.is_active = Number(body.is_active);
        // permissions is [Int] on the schema — accept an array or a single value.
        if (body.permissions != null) input.permissions = Array.isArray(body.permissions) ? body.permissions.map(Number) : [Number(body.permissions)];
        if (body.taxvat != null && body.taxvat !== "") input.taxvat = String(body.taxvat);

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_CREATE_SUBACCOUNT_MUTATION, variables: { input } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[subaccounts POST] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to create sub account" }, { status: 400 });
        }
        return NextResponse.json(json?.data?.kleverCreateSubaccount ?? {});
    } catch (error: any) {
        console.error("[subaccounts POST] error:", error.message);
        return NextResponse.json({ message: "Server-side error creating sub account." }, { status: 500 });
    }
}
