import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import defaultCache from "next-pwa/cache";

const isAdminUrl = ({ url }: { url: URL }) =>
  url.pathname === "/admin" ||
  url.pathname.startsWith("/admin/") ||
  url.pathname === "/api/admin" ||
  url.pathname.startsWith("/api/admin/");

const withPWA = withPWAInit({
  dest: "public",
  register: false,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: false,
  reloadOnOnline: true,
  dynamicStartUrl: false,
  runtimeCaching: [
    {
      urlPattern: isAdminUrl,
      handler: "NetworkOnly",
    },
    ...defaultCache,
  ],
});

const noStoreHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000",
                },
              ]
            : []),
        ],
      },
      {
        source: "/admin",
        headers: [
          ...noStoreHeaders,
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          ...noStoreHeaders,
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: noStoreHeaders,
      },
    ];
  },
};

export default withPWA(nextConfig);
