import { getSession } from "next-auth/react";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

const BASE_URL = "/api";
const MAX_AUTH_RETRIES = 3;
const AUTH_RETRY_DELAY = 800;

/**
 * Read the current locale — checks URL first (most up-to-date during switch),
 * then falls back to cookie.
 */
export function getClientLocale(): string {
    if (typeof window === "undefined") return "en";
    // URL is the source of truth (cookie may lag behind during language switch)
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    if (pathSegments[0] === "ar") return "ar";
    if (pathSegments[0] === "en") return "en";
    // Fallback to cookie
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    return match?.[1] || "en";
}

/**
 * Get auth token — tries NextAuth session first, falls back to localStorage.
 * If no token found, waits briefly and retries (handles post-login race condition).
 */
// Short-lived auth-token cache. Without this, getSession() fires a /api/auth/session
// network request on EVERY API call — a page load with ~8 parallel calls produced
// ~8 duplicate session requests. We cache the resolved token briefly and dedupe
// concurrent lookups so the session is fetched at most once per window.
let _tokenCache: { value: string; expires: number } | null = null;
let _tokenInflight: Promise<string | null> | null = null;
const TOKEN_CACHE_TTL = 30_000; // 30s

// Invalidate the cache (e.g. after a 401) so the next call re-resolves the token.
export function clearAuthTokenCache() {
    _tokenCache = null;
    _tokenInflight = null;
}

async function resolveAuthToken(): Promise<string | null> {
    // localStorage first — avoids a /api/auth/session network round trip on every
    // load. ProtectedLayout persists the token here once the session is authenticated
    // (and removes it on logout/expiry), so for an already-logged-in user this is the
    // fast path and means the ONLY session fetch is the SessionProvider's own hydration.
    if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("token");
        if (localToken) return localToken;
    }
    // Fallback: read from the NextAuth session (first login, before localStorage syncs).
    try {
        const session: any = await getSession();
        if (session?.accessToken) return session.accessToken;
    } catch {
        // getSession() can fail in non-browser contexts
    }
    return null;
}

export async function getAuthToken(attempt = 0): Promise<string | null> {
    // Serve a recently-resolved token without another session round trip.
    if (_tokenCache && _tokenCache.expires > Date.now()) return _tokenCache.value;

    // Dedupe concurrent lookups — all callers await the same in-flight promise.
    if (!_tokenInflight) {
        _tokenInflight = resolveAuthToken().finally(() => { _tokenInflight = null; });
    }
    const token = await _tokenInflight;

    if (token) {
        _tokenCache = { value: token, expires: Date.now() + TOKEN_CACHE_TTL };
        return token;
    }

    // No token found — wait and retry (session may still be initializing after login).
    // Never cache a null result, so post-login requests resolve as soon as it lands.
    if (attempt < 2) {
        await new Promise(r => setTimeout(r, 500));
        return getAuthToken(attempt + 1);
    }

    return null;
}

async function apiClient(
    endpoint: string,
    { method = "GET", body, headers = {}, _retryCount = 0, ...customConfig }: any = {}
) {
    const token = await getAuthToken();

    const isFormData = body instanceof FormData;

    const config: any = {
        method,
        ...customConfig,
        headers: {
            ...(!isFormData && { "Content-Type": "application/json" }),
            // Pass the current locale to API routes via a custom header
            "x-locale": getClientLocale(),
            ...headers,
        },
    };

    if (token) {
        config.headers.Authorization = `Bearer ${token.replace(/['"]/g, "").trim()}`;
    }

    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    // Request timing — logs duration of every API call (network round trip).
    const __t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const __now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        const __ms = Math.round(__now() - __t0);
        console.log(`[api-timing] ${method} ${endpoint} → ${response.status}${_retryCount ? ` (retry ${_retryCount})` : ""} in ${__ms}ms`);

        let data: any = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            // Non-JSON response (e.g., HTML error page)
            const text = await response.text();
            console.error(`[api-client] Received non-JSON response from ${endpoint}:`, text.substring(0, 100));

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return text; // Or handle as needed
        }

        if (response.ok) {
            return data;
        }

        // Handle 401 — retry with fresh token before giving up
        if (response.status === 401 && _retryCount < MAX_AUTH_RETRIES) {
            clearAuthTokenCache(); // drop the (now-invalid) cached token so the retry re-resolves
            await new Promise(r => setTimeout(r, AUTH_RETRY_DELAY));
            return apiClient(endpoint, {
                method,
                body,
                headers,
                ...customConfig,
                _retryCount: _retryCount + 1,
            });
        }

        // Final 401 after retries — redirect to login
        if (response.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                const locale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
                window.location.href = `/${locale}/login`;
            }
            throw new Error("Session expired. Please login again.");
        }

        throw new Error(data?.message || `API Error ${response.status}: ${response.statusText}`);
    } catch (error: any) {
        const __ms = Math.round(__now() - __t0);
        console.error(`[api-timing] ${method} ${endpoint} → ERROR in ${__ms}ms`);
        console.error(`[api-client] Fetch Error at ${endpoint}:`, error);
        return Promise.reject(error.message || error);
    }
}

export const api = {
    get: (endpoint: string, config = {}) => apiClient(endpoint, { ...config, method: "GET" }),
    post: (endpoint: string, body: any, config = {}) => apiClient(endpoint, { ...config, body, method: "POST" }),
    put: (endpoint: string, body: any, config = {}) => apiClient(endpoint, { ...config, body, method: "PUT" }),
    delete: (endpoint: string, config = {}) => apiClient(endpoint, { ...config, method: "DELETE" }),
};
