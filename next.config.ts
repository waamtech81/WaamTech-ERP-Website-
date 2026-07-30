import type { NextConfig } from "next";

/** Tawk.to widget — https://help.tawk.to/article/why-are-images-not-showing-up-in-the-widget */
const tawkScript = "https://embed.tawk.to https://*.tawk.to https://cdn.jsdelivr.net";
const tawkConnect = "https://embed.tawk.to https://*.tawk.to wss://*.tawk.to";
const tawkFrame = "https://embed.tawk.to https://*.tawk.to";
const tawkImg = "https://embed.tawk.to https://*.tawk.to https://cdn.jsdelivr.net https://tawk.link https://s3.amazonaws.com";
const tawkStyle = "https://embed.tawk.to https://*.tawk.to https://cdn.jsdelivr.net";
const tawkFont = "https://embed.tawk.to https://*.tawk.to";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), local-network=(), loopback-network=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.googletagmanager.com https://www.google-analytics.com https://www.paypal.com https://www.paypalobjects.com https://static.cloudflareinsights.com " +
        tawkScript,
      "style-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.paypalobjects.com " +
        tawkStyle,
      "img-src 'self' data: blob: https://images.unsplash.com https://www.gstatic.com https://www.google.com https://fonts.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com https://www.paypal.com https://www.paypalobjects.com https://checkout.paypal.com " +
        tawkImg,
      "font-src 'self' data: https://fonts.gstatic.com https://www.paypalobjects.com " + tawkFont,
      // Same-origin only for XHR/fetch — Control Center identity is server-side via /api/auth/*.
      // No localhost in connect-src: prevents Chrome Apps-on-device (loopback-network) prompts.
      "connect-src 'self' https://www.google.com https://recaptcha.google.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://www.gstatic.com https://www.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.sandbox.paypal.com https://sandbox.paypal.com https://cloudflareinsights.com " +
        tawkConnect,
      "frame-src https://www.google.com https://www.google.com/recaptcha/ https://recaptcha.google.com https://www.gstatic.com https://maps.google.com https://www.paypal.com https://www.sandbox.paypal.com https://sandbox.paypal.com https://checkout.paypal.com https://c.paypal.com https://www.paypalobjects.com " +
        tawkFrame,
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      // Allow Super Admin SSO form POST to License Engine Admin Portal only.
      // Never allow localhost/127.0.0.1 form-action from production pages —
      // that triggers Chrome Apps-on-device (loopback-network) permission prompts.
      "form-action 'self' https://license.waamto.com https://embed.tawk.to https://*.tawk.to",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Prefer WebP for smaller files + sharp quality (AVIF as progressive enhancement)
    formats: ["image/webp", "image/avif"],
    qualities: [70, 75],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1400],
    imageSizes: [96, 128, 256, 320, 384, 640],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Static marketing assets (favicons, logos, OG images) — not content-hashed,
        // so a long-but-not-immutable TTL avoids stale caches after a manual replace
        // (e.g. og/waamto-share.webp) while still cutting repeat-visit origin hits.
        source: "/:all*(webp|png|jpg|jpeg|ico|svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "https://doc.waamto.com",
        permanent: true,
      },
      {
        source: "/knowledge-base",
        destination: "https://doc.waamto.com",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
