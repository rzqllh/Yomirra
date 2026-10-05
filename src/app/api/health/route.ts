import { NextResponse } from "next/server";
import { redis } from "@/server/lib/cache/redis";
import { probeAllSourcesHealth } from "@/server/lib/sources/health/probe";
import { toLivenessSourceHealth } from "@/server/lib/sources/health/public-health";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  let isDegraded = false;
  let redisStatus: "ok" | "slow" | "down" = "ok";

  try {
    const start = Date.now();
    await redis.ping();
    if (Date.now() - start > 1000) redisStatus = "slow";
  } catch (error) {
    redisStatus = "down";
    isDegraded = true;
    logger.error("Redis health check failed", { error });
  }

  const snapshots = await probeAllSourcesHealth({ deep: false });
  const sources = Object.fromEntries(
    Object.entries(snapshots).map(([sourceId, snapshot]) => {
      const health = toLivenessSourceHealth(snapshot);
      if (health.status === "down") isDegraded = true;
      return [sourceId, health];
    })
  );

  return NextResponse.json(
    {
      status: isDegraded ? "degraded" : "ok",
      redis: redisStatus,
      sources,
      timestamp: new Date().toISOString(),
    },
    {
      status: isDegraded ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
