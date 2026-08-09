import { NextResponse } from "next/server";
import { sourceRegistry } from "@/shared/sources/source-registry";
import type { SourceMetadata } from "@/shared/sources/source-types";
import { redis } from "@/server/lib/cache/redis";

import { logger } from "@/shared/logger";

export const revalidate = 0; // Disable Next.js cache, we use Redis

const CACHE_KEY = "yomirra:sources:health:v6";
const TTL_SECONDS = 600; // 10 minutes

async function pingSource(source: SourceMetadata) {
  const start = Date.now();

  if (source.status === "unavailable") {
    return {
      id: source.id,
      status: source.status,
      latency: source.healthStats?.latency || "-",
      uptime: source.healthStats?.uptime || "-",
      message: source.healthStats?.message || "Sumber sedang dinonaktifkan dari sistem.",
    };
  }

  const targetUrl = source.healthCheckUrl || source.baseUrl || "";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    };

    if (targetUrl.includes("mangadex.org")) {
      headers["User-Agent"] = "Yomirra/1.0";
      headers["Accept"] = "application/json,*/*";
    }

    const res = await fetch(targetUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const latency = Date.now() - start;

    // 200-299, 301-302 redirect = online
    if (res.ok || (res.status >= 301 && res.status <= 302)) {
      return {
        id: source.id,
        status: "online",
        latency: `${latency}ms`,
        uptime: "99.9%",
        message: "Server merespons dengan baik.",
      };
    }
    
    // 401, 403 = Access Denied (scraper blocked)
    if (res.status === 401 || res.status === 403) {
      return {
        id: source.id,
        status: "unavailable",
        latency: "-",
        uptime: "0%",
        message: `Akses ditolak (HTTP ${res.status}).`,
      };
    }

    // 503, 522, 521 = Cloudflare challenge / server down
    if (res.status === 503 || res.status === 522 || res.status === 521) {
      return {
        id: source.id,
        status: "unavailable",
        latency: "-",
        uptime: "-",
        message: "Terhalang proteksi Cloudflare.",
      };
    }

    return {
      id: source.id,
      status: "unavailable",
      latency: "-",
      uptime: "-",
      message: `HTTP Error: ${res.status}`,
    };
  } catch (err: any) {
    const isTimeout = err.name === "AbortError" || err.message?.includes("aborted");
    const errCode = err.code || err.cause?.code;

    // Log internal error details with logger without leaking sensitive headers to public
    logger.warn("Source health ping failed", {
      sourceId: source.id,
      targetUrl,
      errorName: err.name,
      errorMessage: err.message,
      errorCode: errCode,
      causeMessage: err.cause?.message,
    });

    let safeMessage = "Gagal menghubungi server.";
    if (isTimeout) {
      safeMessage = "Koneksi ke server timeout.";
    } else if (errCode === "CERT_HAS_EXPIRED" || errCode === "ERR_TLS_CERT_ALTNAME_INVALID") {
      safeMessage = "Sertifikat SSL/TLS server tidak valid atau kadaluarsa.";
    } else if (errCode === "ENOTFOUND") {
      safeMessage = "Domain tidak dapat ditemukan (DNS Error).";
    }

    return {
      id: source.id,
      status: "unavailable",
      latency: "-",
      uptime: "0%",
      message: safeMessage,
    };
  }
}

export async function GET() {
  try {
    // 1. Try Cache
    if (redis) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return NextResponse.json({ data: JSON.parse(cached) });
      }
    }

    // 2. Gather all sources
    const allSources = [...sourceRegistry];

    // 3. Ping in parallel
    const results = await Promise.all(allSources.map(pingSource));

    const healthData = results.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {} as Record<string, any>);

    // 4. Set Cache
    if (redis) {
      await redis.setex(CACHE_KEY, TTL_SECONDS, JSON.stringify(healthData));
    }

    return NextResponse.json({ data: healthData });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ error: "Failed to check health" }, { status: 500 });
  }
}
