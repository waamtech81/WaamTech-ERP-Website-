import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://translate.google.com https://translate.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://www.gstatic.com https://translate.googleapis.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://www.gstatic.com https://translate.googleapis.com https://translate.google.com https://www.google.com https://fonts.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://www.google.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://translate.googleapis.com https://translate.google.com https://www.gstatic.com https://clients5.google.com https://translation.googleapis.com",
      "frame-src https://www.google.com https://recaptcha.google.com https://www.gstatic.com https://translate.google.com https://maps.google.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
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
    ];
  },
};

export default nextConfig;
