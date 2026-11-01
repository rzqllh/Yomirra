import { NextResponse } from "next/server";
import { isRedisConfigured, redis } from "@/server/lib/cache/redis";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { toLivenessSourceHealth, type LivenessSourceHealth } from "@/server/lib/sources/health/public-health";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Liveness checks must never initiate upstream provider requests. Source health
// is measured separately by /api/sources/health and stored by scheduled probes.
const MAX_SOURCE_SNAPSHOT_AGE_MS = 10 * 60 * 1000;

export async function GET() {
  let isDegraded = false;
  let redisStatus: "ok" | "slow" | "down" | "unconfigured" =
    isRedisConfigured ? "ok" : "unconfigured";

  if (isRedisConfigured) {
    try {
      const start = Date.now();
      await redis.ping();
      if (Date.now() - start > 1000) redisStatus = "slow";
    } catch (error) {
      redisStatus = "down";
      isDegraded = true;
      logger.error("Redis health check failed", { error });
    }
  }

  // Only in-process observations are read. Missing or stale observations are
  // omitted rather than presented as current health or triggering fresh probes.
  let sources: Record<string, LivenessSourceHealth> = {};
  try {
    const snapshots = await sourceHealthStore.getAllSnapshots();
    const now = Date.now();
    sources = Object.fromEntries(
      Object.entries(snapshots)
        .filter(([, snapshot]) => {
          const checkedAt = Date.parse(snapshot.lastCheckedAt);
          return Number.isFinite(checkedAt) &&
            checkedAt <= now &&
            now - checkedAt <= MAX_SOURCE_SNAPSHOT_AGE_MS;
        })
        .map(([sourceId, snapshot]) => [sourceId, toLivenessSourceHealth(snapshot)])
    );
  } catch (error) {
    // Optional diagnostic data must not break a liveness response.
    logger.warn("Recent source snapshots unavailable to liveness check", { error });
  }

  return NextResponse.json(
    {
      status: isDegraded ? "degraded" : "ok",
      redis: redisStatus,
      sources,
      sourceObservations: "recent-snapshots-only",
      timestamp: new Date().toISOString(),
    },
    {
      status: isDegraded ? 503 : 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
