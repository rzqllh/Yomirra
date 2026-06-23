import { NextResponse } from "next/server";
import { redis } from "@/server/lib/cache/redis";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { sourceManager } from "@/server/lib/sources/source-manager";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic"; // Always fresh ping
export const revalidate = 0;

export async function GET() {
  const sourcesStatus: Record<string, { status: "ok" | "slow" | "down"; latencyMs?: number; error?: string }> = {};
  let isDegraded = false;

  // 1. Ping Redis
  let redisStatus = "ok";
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    if (latency > 1000) redisStatus = "slow";
  } catch (error) {
    redisStatus = "down";
    isDegraded = true;
    logger.error("Redis health check failed", { error });
  }

  // 2. Ping Curated Sources
  const activeSources = getAllSourceMetadata().filter((s) => s.isEnabled && s.isInstalled);
  
  await Promise.all(
    activeSources.map(async (meta) => {
      try {
        const start = Date.now();
        const adapter = sourceManager.getSource(meta.id);
        if (!adapter) throw new Error("Adapter not found");

        // Ping by fetching popular page 1
        await adapter.getPopular(1);
        
        const latency = Date.now() - start;
        let status: "ok" | "slow" | "down" = "ok";
        
        if (latency > 3000) {
          status = "down";
          isDegraded = true;
        } else if (latency > 1000) {
          status = "slow";
        }
        
        sourcesStatus[meta.id] = { status, latencyMs: latency };
      } catch (error) {
        sourcesStatus[meta.id] = { 
          status: "down", 
          error: error instanceof Error ? error.message : "Unknown error" 
        };
        isDegraded = true;
      }
    })
  );

  const payload = {
    status: isDegraded ? "degraded" : "ok",
    redis: redisStatus,
    sources: sourcesStatus,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, {
    status: isDegraded ? 503 : 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
