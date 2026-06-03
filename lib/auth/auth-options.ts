import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { isValidLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { GENERATE_CUSTOMER_TOKEN_MUTATION, KLEVER_LOGIN_WITH_OTP_MUTATION } from "@/src/graphql/mutations";

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

                try {
                    let token: string | null = null;

                    if (isOtp) {
                        // OTP login via GraphQL kleverLoginWithOtp.
                        const res = await fetch(getMagentoGraphqlUrl(), {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Store: locale,
                            },
                            body: JSON.stringify({
                                query: KLEVER_LOGIN_WITH_OTP_MUTATION,
                                variables: {
                                    mobile: (credentials as any).mobile,
                                    otp: (credentials as any).otp,
                                    countryCode: (credentials as any).countryCode,
                                },
                            }),
                        });
                        const data = await res.json();
                        if (Array.isArray(data?.errors) && data.errors.length > 0) {
                            console.error("kleverLoginWithOtp error:", JSON.stringify(data.errors).slice(0, 300));
                        }
                        token = data?.data?.kleverLoginWithOtp?.token ?? null;
                    } else {
                        // Email/password login via GraphQL generateCustomerToken.
                        const res = await fetch(getMagentoGraphqlUrl(), {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                // Select the store view for the requested locale.
                                Store: locale,
                            },
                            body: JSON.stringify({
                                query: GENERATE_CUSTOMER_TOKEN_MUTATION,
                                variables: {
                                    email: (credentials as any).email,
                                    password: (credentials as any).password,
                                },
                            }),
                        });
                        const data = await res.json();
                        if (Array.isArray(data?.errors) && data.errors.length > 0) {
                            // Invalid credentials or backend error — surface for logs, fail auth.
                            console.error(
                                "generateCustomerToken error:",
                                JSON.stringify(data.errors).slice(0, 300)
                            );
                        }
                        token = data?.data?.generateCustomerToken?.token ?? null;
                    }

                    if (!token) {
                        console.error("No token found in successful response.");
                        return null;
                    }

                    const trimmedToken = String(token).trim();

                    return {
                        id: (credentials as any).email || (credentials as any).mobile,
                        email: (credentials as any).email || "",
                        name: (credentials as any).email || (credentials as any).mobile,
                        token: trimmedToken,
                    };
                } catch (error) {
                    console.error("Auth Error:", error);
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
            } catch {}
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
