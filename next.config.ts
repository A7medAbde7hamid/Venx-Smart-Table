import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: false,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  dynamicStartUrl: false,
});

const noStoreHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
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
