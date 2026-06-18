import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import { KLEVER_SUBACCOUNT_BY_ID_QUERY } from "@/src/graphql/queries";
import { KLEVER_UPDATE_SUBACCOUNT_MUTATION, KLEVER_DELETE_SUBACCOUNT_MUTATION } from "@/src/graphql/mutations";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// GET — single subaccount by id (GraphQL: kleverSubaccount(subaccountId: Int!)).
// Returns the subaccount object at the top level (same shape as the old REST proxy).
//
// `permissions` is requested (it validates), but the resolver may throw a type error on
// it (schema types it [Int] yet returns string codes — same bug as the list API). We
// handle that SAFELY: if the subaccount object is present we return it even when the
// errors[] array only contains permissions-related field errors; we only fail when no
// usable data came back.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Authorization required" }, { status: 401 });

        const { id } = await params;
        const subaccountId = parseInt(id, 10);
        if (Number.isNaN(subaccountId)) {
            return NextResponse.json({ message: "Invalid subaccount id" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_SUBACCOUNT_BY_ID_QUERY, variables: { subaccountId } }),
            cache: "no-store",
        });

        const json = await res.json();
        const subaccount = json?.data?.kleverSubaccount;
        const errors: any[] = Array.isArray(json?.errors) ? json.errors : [];

        // Is this error specifically the known `permissions` field-type bug? The backend
        // types permissions as [Int] but returns string codes, so the coercion error's
        // path points at `permissions` (message mentions "Int"). We ONLY tolerate this one.
        const isPermissionsFieldError = (e: any): boolean => {
            const path = Array.isArray(e?.path) ? e.path.join(".").toLowerCase() : "";
            const msg = (e?.message || "").toLowerCase();
            return path.includes("permissions") || msg.includes("permissions");
        };
        const onlyPermissionErrors = errors.length > 0 && errors.every(isPermissionsFieldError);

        // Return the subaccount only when there are no errors, OR the sole error(s) are the
        // tolerated permissions bug. Any OTHER GraphQL error is surfaced as 502.
        if (subaccount && (errors.length === 0 || onlyPermissionErrors)) {
            if (onlyPermissionErrors) {
                console.warn("[subaccounts/:id] ignoring known permissions field-type error; returning data.");
            }
            return NextResponse.json(subaccount);
        }

        if (errors.length > 0) {
            console.error("[subaccounts/:id] GraphQL error:", JSON.stringify(errors).slice(0, 300));
            return NextResponse.json({ message: "Magento GraphQL error", details: errors }, { status: 502 });
        }

        return NextResponse.json({ message: "Subaccount not found" }, { status: 404 });
    } catch (error: any) {
        console.error("[subaccounts/:id] error:", error.message);
        return NextResponse.json({ message: error.message || "Server-side error fetching sub account." }, { status: 500 });
    }
}

// PUT — update a subaccount (GraphQL: kleverUpdateSubaccount(subaccountId, input)).
// Body carries the editable fields; the route builds the KleverSubaccountInput object
// (email/firstname/lastname are required; is_active/permissions coerced to Int; password
// and taxvat optional). Returns the updated subaccount { id, firstname, lastname, email,
// is_active }. NOT executed during migration — data-changing; schema-validated + tsc only.
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Authorization required" }, { status: 401 });

        const { id } = await params;
        const subaccountId = parseInt(id, 10);
        if (Number.isNaN(subaccountId)) {
            return NextResponse.json({ message: "Invalid subaccount id" }, { status: 400 });
        }

        const body = await request.json();
        if (!body?.email || !body?.firstname || !body?.lastname) {
            return NextResponse.json({ message: "email, firstname and lastname are required" }, { status: 400 });
        }

        // Build KleverSubaccountInput — required strings + optional fields only when provided.
        const input: Record<string, any> = {
            email: String(body.email),
            firstname: String(body.firstname),
            lastname: String(body.lastname),
        };
        if (body.is_active != null) input.is_active = Number(body.is_active);
        // permissions is [Int] on the schema — accept an array or a single value.
        if (body.permissions != null) input.permissions = Array.isArray(body.permissions) ? body.permissions.map(Number) : [Number(body.permissions)];
        if (body.password) input.password = String(body.password);
        if (body.taxvat != null && body.taxvat !== "") input.taxvat = String(body.taxvat);

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_UPDATE_SUBACCOUNT_MUTATION, variables: { subaccountId, input } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[subaccounts/:id PUT] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to update sub account" }, { status: 400 });
        }
        return NextResponse.json(json?.data?.kleverUpdateSubaccount ?? {});
    } catch (error: any) {
        console.error("[subaccounts/:id PUT] error:", error.message);
        return NextResponse.json({ message: "Server-side error updating sub account." }, { status: 500 });
    }
}

// DELETE — remove a subaccount (GraphQL: kleverDeleteSubaccount(subaccountId: Int!)).
// Returns { success, message } (KleverActionResponse). NOT executed during migration —
// data-changing; schema-validated + tsc only.
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Authorization required" }, { status: 401 });

        const { id } = await params;
        const subaccountId = parseInt(id, 10);
        if (Number.isNaN(subaccountId)) {
            return NextResponse.json({ message: "Invalid subaccount id" }, { status: 400 });
        }

        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Store: getLocaleFromRequest(request),
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query: KLEVER_DELETE_SUBACCOUNT_MUTATION, variables: { subaccountId } }),
            cache: "no-store",
        });

        const json = await res.json();
        if (Array.isArray(json?.errors) && json.errors.length > 0) {
            console.error("[subaccounts/:id DELETE] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
            return NextResponse.json({ message: json.errors[0]?.message || "Failed to delete sub account" }, { status: 400 });
        }
        // Returns { success, message } — same shape as the kleverDeleteSubaccount response.
        return NextResponse.json(json?.data?.kleverDeleteSubaccount ?? { success: false });
    } catch (error: any) {
        console.error("[subaccounts/:id DELETE] error:", error.message);
        return NextResponse.json({ message: "Server-side error deleting sub account." }, { status: 500 });
    }
}
