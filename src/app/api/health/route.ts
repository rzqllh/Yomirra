import { NextResponse } from "next/server";
import { Command } from "ioredis";
import { ensureRedisReady, isRedisConfigured, isRedisCircuitOpen, isRedisCommandAllowed, redis } from "@/server/lib/cache/redis";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import { toLivenessSourceHealth, type LivenessSourceHealth } from "@/server/lib/sources/health/public-health";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Readiness checks must never initiate upstream provider requests. Source health
// is measured separately by /api/sources/health and stored by scheduled probes.
const MAX_SOURCE_SNAPSHOT_AGE_MS = 10 * 60 * 1000;
const REDIS_PROBE_INTERVAL_MS = 10_000;
type RedisProbeResult = "ok" | "slow" | "down";
let redisHealthCheck: Promise<RedisProbeResult> | undefined;
let lastRedisProbe: { status: RedisProbeResult; expiresAt: number } | undefined;

function checkRedisHealth(): Promise<RedisProbeResult> {
  if (lastRedisProbe && Date.now() < lastRedisProbe.expiresAt) {
    return Promise.resolve(lastRedisProbe.status);
  }
  redisHealthCheck ??= (async () => {
    const start = Date.now();
    let status: RedisProbeResult;
    try {
      await ensureRedisReady();
      const ping = new Command("ping");
      ping.setTimeout(1_500);
      if (await redis.sendCommand(ping) !== "PONG") {
        throw new Error("Unexpected Redis PING response");
      }
      status = Date.now() - start > 1_000 ? "slow" : "ok";
    } catch (error) {
      status = "down";
      if (!isRedisCircuitOpen()) {
        logger.error("Redis health check failed", { error });
      }
    }
    lastRedisProbe = { status, expiresAt: Date.now() + REDIS_PROBE_INTERVAL_MS };
    return status;
  })().finally(() => { redisHealthCheck = undefined; });
  return redisHealthCheck;
}

export async function GET() {
  let redisStatus: RedisProbeResult | "unconfigured" = "unconfigured";
  if (isRedisConfigured) {
    if (isRedisCommandAllowed()) {
      redisStatus = await checkRedisHealth();
    } else {
      lastRedisProbe = undefined;
      redisStatus = "down";
    }
  }
  const isDegraded = redisStatus === "down" || redisStatus === "unconfigured";

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
    // Optional diagnostic data must not break readiness reporting.
    logger.warn("Recent source snapshots unavailable to readiness check", { error });
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
