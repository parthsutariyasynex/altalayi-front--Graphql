// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//     // No rewrites — all API calls go through local route handlers in app/api/
//     // which use getBaseUrl(request) to build locale-aware Magento URLs.
//     //
//     // Previously had hardcoded /rest/en/ rewrites here which broke Arabic store view.
// };

// export default nextConfig;

import type { NextConfig } from "next";

// All 83 API routes have local route handlers in app/api/
// No rewrites needed — route handlers use getBaseUrl(request) for locale-aware Magento URLs
// reactStrictMode is disabled intentionally: in dev, StrictMode double-invokes
// effects, which made every mount-time fetch (session, menu, cart, tyre-size, etc.)
// appear twice in the network tab. This has NO effect on production (React never
// double-invokes there). Disabling it makes the dev network waterfall match prod.
// Re-enable if you want StrictMode's dev-time checks back (at the cost of the 2× dev calls).
const nextConfig: NextConfig = { reactStrictMode: false };

export default nextConfig;