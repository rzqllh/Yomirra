import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  experimental: { viewTransition: true },
  // Turbopack is enabled by default in Next.js 15 dev mode
  reactStrictMode: true,
  images: {
    qualities: [25, 50, 75, 85, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.shinigami.asia",
      },
      {
        protocol: "https",
        hostname: "*.shngm.id",
      },
      {
        protocol: "https",
        hostname: "*.shngm.io",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    localPatterns: [
      {
        pathname: "/api/proxy/image",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/browse",
        destination: "/sources",
        permanent: true,
      },
    ];
  },
};

export default withSerwist(nextConfig);
