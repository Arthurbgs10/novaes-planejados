import type { NextConfig } from "next";

// Only the Supabase project host needs to be reachable from the browser
// (Server Actions / Server Components call Supabase from the server, not
// the client, so most of the app needs no external connect-src at all).
// img-src also needs it: portfolio photos are served from Supabase Storage.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).origin : "";

const csp = [
  "default-src 'self'",
  // The App Router streams the RSC payload through inline
  // `<script>self.__next_f.push(...)</script>` tags on every page, so
  // script-src needs 'unsafe-inline' too — the strict alternative (a
  // per-request nonce set from middleware) forces every page to render
  // dynamically, which would drop static generation/CDN caching for the
  // public landing page. Nothing in this app renders raw HTML from user
  // input (no dangerouslySetInnerHTML with unescaped user input — the only
  // dynamic HTML come from the fixed chat script strings below), so this is
  // the tradeoff Next.js's own docs recommend for apps without a strict CSP
  // compliance requirement.
  // 'unsafe-eval' is added only outside production: Next.js dev mode wraps
  // every module in eval() for Fast Refresh, so a strict CSP in dev breaks
  // all client-side JS (hydration silently fails, no handler ever fires).
  // Production builds don't use eval, so the real deployed CSP stays strict.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
  // Same reasoning: the landing page relies on React inline `style` props.
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data:${supabaseHost ? ` ${supabaseHost}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${supabaseHost ? ` ${supabaseHost}` : ""}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
