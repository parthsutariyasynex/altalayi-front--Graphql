import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getMagentoBaseUrl, isValidLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { GENERATE_CUSTOMER_TOKEN_MUTATION } from "@/src/graphql/mutations";
import { CUSTOMER_QUERY } from "@/src/graphql/queries";

/**
 * Resolve the Magento GraphQL endpoint (locale is selected via the `Store` header).
 */
function getMagentoGraphqlUrl(): string {
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://altalayi-demo.btire.com";
    return `${domain}/graphql`;
}


/** 
 * Decode a Magento JWT token to read its expiry time.
...
 * Returns the `exp` timestamp (seconds) or null if unreadable.
 */
function getMagentoTokenExpiry(token: string): number | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8")
        );
        return payload.exp || null;
    } catch {
        return null;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Magento",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials) return null;

                const isOtp = !!(credentials as any).otp;
                // Read locale from credentials (passed from login form)
                const credLocale = (credentials as any).locale;
                const locale: Locale = credLocale && isValidLocale(credLocale) ? credLocale : defaultLocale;
                const magentoBase = getMagentoBaseUrl(locale);

                // ── Password login → GraphQL generateCustomerToken ──
                // The host's WAF blocks server-side REST (/login/email returns a 403 HTML
                // challenge), but the GraphQL endpoint is reachable. generateCustomerToken
                // returns the same customer bearer token, so we use it for password auth.
                if (!isOtp) {
                    try {
                        const res = await fetch(getMagentoGraphqlUrl(), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Store: locale },
                            body: JSON.stringify({
                                query: GENERATE_CUSTOMER_TOKEN_MUTATION,
                                variables: {
                                    email: (credentials as any).email,
                                    password: (credentials as any).password,
                                },
                            }),
                        });
                        const json = await res.json();
                        if (Array.isArray(json?.errors) && json.errors.length > 0) {
                            console.error("Auth (GraphQL) error:", JSON.stringify(json.errors).slice(0, 150));
                            return null;
                        }
                        const token = json?.data?.generateCustomerToken?.token;
                        if (!token) {
                            console.error("Auth: no token from generateCustomerToken");
                            return null;
                        }

                        // Fetch the customer's real name (native customer query — works via
                        // /graphql even when REST /my-account is WAF-blocked) so the session
                        // shows the name, not the email. Falls back to email on any failure.
                        let displayName = (credentials as any).email || "";
                        try {
                            const meRes = await fetch(getMagentoGraphqlUrl(), {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Store: locale, Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ query: CUSTOMER_QUERY }),
                            });
                            const meJson = await meRes.json();
                            const c = meJson?.data?.customer;
                            const full = `${c?.firstname || ""} ${c?.lastname || ""}`.trim();
                            if (full) displayName = full;
                        } catch { /* keep email fallback */ }

                        return {
                            id: (credentials as any).email,
                            email: (credentials as any).email || "",
                            name: displayName,
                            token: String(token).trim(),
                        };
                    } catch (error) {
                        console.error("Auth (GraphQL) error:", error);
                        return null;
                    }
                }

                // ── OTP login → REST /login/otp ──
                const url = `${magentoBase}/login/otp`;
                const body = {
                    mobile: (credentials as any).mobile,
                    otp: (credentials as any).otp,
                    countryCode: (credentials as any).countryCode,
                };

                try {
                    const res = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", platform: "web" },
                        body: JSON.stringify(body),
                    });

                    // Defensive parse: the upstream may return non-JSON (nginx/Cloudflare HTML
                    // or an empty body) — yield a clean auth failure instead of a SyntaxError.
                    const rawText = await res.text();
                    let data: any = null;
                    try {
                        data = rawText ? JSON.parse(rawText) : null;
                    } catch {
                        console.error("Auth: non-JSON OTP response", res.status, rawText.slice(0, 200));
                        return null;
                    }

                    if (res.ok && data) {
                        const token = data.token || (data.customer && data.customer.token);
                        if (!token) {
                            console.error("No token found in OTP response.");
                            return null;
                        }
                        return {
                            id: (credentials as any).email || (credentials as any).mobile,
                            email: (credentials as any).email || "",
                            name: (credentials as any).email || (credentials as any).mobile,
                            token: String(token).trim(),
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("Auth Error (OTP):", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            try {
                const parsed = new URL(url);
                // Trust any localhost port — dev server may run on a dynamic port
                if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
                    return url;
                }
                if (parsed.origin === new URL(baseUrl).origin) return url;
            } catch { }
            return baseUrl;
        },
        async jwt({ token, user }) {
            // First login — save the Magento token
            if (user) {
                token.accessToken = (user as any).token;
                // Store the Magento token expiry so we can detect when it expires
                const exp = getMagentoTokenExpiry((user as any).token);
                if (exp) {
                    token.magentoTokenExp = exp;
                }
            }

            // Check if the Magento token has expired
            if (token.magentoTokenExp) {
                const now = Math.floor(Date.now() / 1000);
                if (now >= (token.magentoTokenExp as number)) {
                    // Magento token expired — force user to re-login
                    // Clear the token so the session becomes invalid
                    console.warn("Magento token expired, forcing re-login");
                    token.accessToken = undefined;
                    token.error = "MagentoTokenExpired";
                }
            }

            return token;
        },
        async session({ session, token }) {
            (session as any).accessToken = token.accessToken;
            (session as any).error = token.error;
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "yoursecret",
};
