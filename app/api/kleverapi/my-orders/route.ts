import { NextRequest, NextResponse } from "next/server";
import { getRequestToken } from "@/lib/api/auth-helper";
import { CUSTOMER_ORDERS_QUERY, KLEVER_ORDER_FILTER_OPTIONS_QUERY } from "@/src/graphql/queries";

const MAGENTO_GRAPHQL = (process.env.NEXT_PUBLIC_MAGENTO_BASE_URL || "https://altalayi-demo.btire.com") + "/graphql";

// native customer.orders.status returns the status LABEL ("Check Pending"); the filter dropdown
// + counts use status CODES ("approval_pending"). Build the label→code map DYNAMICALLY from the
// backend's kleverOrderFilterOptions.status_options { value(code), label } — no static table.
// Cached in-memory (1h; the option list is stable + shared across customers).
let _statusMapCache: { value: Record<string, string>; expires: number } | null = null;

async function getStatusLabelToCode(token: string): Promise<Record<string, string>> {
    const now = Date.now();
    if (_statusMapCache && _statusMapCache.expires > now) return _statusMapCache.value;
    const map: Record<string, string> = {};
    try {
        const res = await fetch(MAGENTO_GRAPHQL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Store: "en", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ query: KLEVER_ORDER_FILTER_OPTIONS_QUERY }),
            cache: "no-store",
        });
        const json = await res.json();
        for (const o of json?.data?.kleverOrderFilterOptions?.status_options ?? []) {
            if (o?.label && o?.value) map[String(o.label).trim()] = String(o.value);
        }
        _statusMapCache = { value: map, expires: now + 60 * 60 * 1000 };
    } catch { /* fall back to empty map → statusToCode uses the lowercase heuristic */ }
    return map;
}

// Resolve an order's status label → code via the dynamic map, with a lowercase/underscore fallback.
const statusToCode = (label: any, map: Record<string, string>): string => {
    const l = String(label ?? "").trim();
    return map[l] ?? l.toLowerCase().replace(/\s+/g, "_");
};

// GET — customer order history (GraphQL: native customer.orders). Replaces REST /my-orders.
// Maps native fields back to the legacy shape the page reads: id → entity_id,
// number → increment_id, order_date → created_at (+order_date), total.grand_total.value →
// grand_total. Returns { items, total_count }.
//
// FILTER NOTE: native customer.orders only filters by order number. The legacy `status`
// and `companyCode` filters have NO native equivalent and are ignored here (no server-side
// support) — see migration note.
export async function GET(request: NextRequest) {
    try {
        const token = await getRequestToken(request);
        if (!token) return NextResponse.json({ message: "Unauthorized", items: [], total_count: 0 }, { status: 401 });

        const sp = new URL(request.url).searchParams;
        const pageSize = parseInt(sp.get("pageSize") || "10", 10) || 10;
        const currentPage = parseInt(sp.get("currentPage") || "1", 10) || 1;
        const orderNumber = sp.get("orderNumber");
        const statusFilter = sp.get("status");

        const baseFilter: Record<string, any> = {};
        if (orderNumber && orderNumber !== "All" && orderNumber.trim() !== "") {
            baseFilter.filter = { number: { match: orderNumber.trim() } };
        }

        // Native customer.orders is paginated OLDEST-FIRST, has NO `sort` arg, and is STORE-SCOPED
        // (the Store header limits results to one store view — e.g. 159 on "en" + 12 on "ar").
        // To match Magento's full website order history, fetch ALL orders across BOTH store views,
        // merge + dedupe by order number, sort newest-first, then slice the requested page.
        // PERF: stores are fetched IN PARALLEL, and the batch is large so most customers need 1
        // call per store; the status map (cached) is fetched concurrently too.
        const STORES = ["en", "ar"];
        const BATCH = 200;

        const isAuthError = (msg: string) => /not authoriz|isn't authoriz|unauthor|invalid token|token expired|graphql-authorization/i.test(msg || "");

        const fetchStore = async (store: string): Promise<{ items: any[]; authError: boolean }> => {
            const headers = { "Content-Type": "application/json", Store: store, Authorization: `Bearer ${token}` };
            const acc: any[] = [];
            let authError = false;
            for (let p = 1; p <= 100; p++) {
                const res = await fetch(MAGENTO_GRAPHQL, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ query: CUSTOMER_ORDERS_QUERY, variables: { pageSize: BATCH, currentPage: p, ...baseFilter } }),
                    cache: "no-store",
                });
                const json = await res.json();
                if (Array.isArray(json?.errors) && json.errors.length > 0) {
                    const msg = json.errors[0]?.message || "";
                    console.error("[my-orders] GraphQL error:", JSON.stringify(json.errors).slice(0, 300));
                    if (isAuthError(msg)) authError = true;
                    break; // one store erroring shouldn't kill the whole list
                }
                const batch = json?.data?.customer?.orders?.items;
                const arr = Array.isArray(batch) ? batch : [];
                acc.push(...arr);
                if (arr.length < BATCH) break;
            }
            return { items: acc, authError };
        };

        const [statusMap, ...storeResults] = await Promise.all([
            getStatusLabelToCode(token),
            ...STORES.map(fetchStore),
        ]);

        // Merge + dedupe by order number across stores.
        const byNumber = new Map<string, any>();
        let anyAuthError = false;
        for (const r of storeResults) {
            if (r.authError) anyAuthError = true;
            for (const o of r.items) if (o?.number) byNumber.set(o.number, o);
        }
        let rawAll = Array.from(byNumber.values());

        // Empty ONLY because of an auth failure (e.g. expired session token)? Surface 401 so the
        // frontend can prompt re-login — instead of a misleading "no orders found" empty list.
        if (rawAll.length === 0 && anyAuthError) {
            return NextResponse.json({ message: "Session expired — please sign in again.", items: [], total_count: 0 }, { status: 401 });
        }

        // Apply the status filter in-memory (label→code), since customer.orders has no status arg.
        if (statusFilter && statusFilter !== "All" && statusFilter.trim() !== "") {
            rawAll = rawAll.filter((o) => statusToCode(o.status, statusMap) === statusFilter);
        }

        const total = rawAll.length;

        // Sort newest-first on the raw ISO order_date.
        rawAll.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());

        // Slice the requested page out of the globally-sorted (and status-filtered) list.
        const start = (currentPage - 1) * pageSize;
        const pageItems = rawAll.slice(start, start + pageSize);

        // Map native order fields → the legacy REST shape the page consumes (status = label for
        // display, status_code = normalized code the dropdown/counts key on).
        const items = pageItems.map((o: any) => ({
            entity_id: o.id,
            increment_id: o.number,
            created_at: o.order_date,
            order_date: o.order_date,
            status: o.status,
            status_code: statusToCode(o.status, statusMap),
            grand_total: o.total?.grand_total?.value ?? 0,
            currency: o.total?.grand_total?.currency ?? null,
        }));

        return NextResponse.json({
            items,
            total_count: total || items.length,
        });
    } catch (error: any) {
        console.error("[my-orders] error:", error.message);
        return NextResponse.json({ message: error.message || "Server error fetching orders", items: [], total_count: 0 }, { status: 500 });
    }
}
