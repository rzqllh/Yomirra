import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const cspScriptSrc =
  process.env.NODE_ENV === "development"
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";

// Report-only first: capture compatibility gaps before enforcing CSP.
// The baseline intentionally covers current Next.js inline bootstrapping,
// Firebase/browser auth flows, remote HTTPS assets, WebSocket/API calls,
// and Serwist workers without enumerating provider-specific hosts.
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src ${cspScriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Turbopack is enabled by default in Next.js 15 dev mode
  reactStrictMode: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  serverExternalPackages: ["firebase-admin", "ioredis"],
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    qualities: [25, 50, 60, 75, 85, 100],
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
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
      },
      {
        protocol: "https",
        hostname: "*.mangadex.network",
      },
      {
        protocol: "https",
        hostname: "content.komiku.me",
      },
      {
        protocol: "https",
        hostname: "cdnkomiku.xyz",
      },
      {
        protocol: "https",
        hostname: "cdn.asurascans.com",
      },
      {
        protocol: "https",
        hostname: "data.cdnesia.my.id",
      },
      {
        protocol: "https",
        hostname: "proxy.cdnesia.my.id",
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
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: contentSecurityPolicyReportOnly,
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

export default process.env.NODE_ENV === "development" ? nextConfig : withSerwist(nextConfig);
