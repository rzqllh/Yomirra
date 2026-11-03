import { NextResponse } from "next/server";
import { isRedisConfigured, redis } from "@/server/lib/cache/redis";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import {
  toPublicSourceHealth,
  createUnknownPublicSourceHealth,
  type PublicSourceHealth,
} from "@/server/lib/sources/health/public-health";
import {
  triggerBackgroundProbe,
  getInMemoryCachedPayload,
  type CachedHealthPayload,
} from "@/server/lib/sources/health/background-probe";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CACHE_KEY = "yomirra:sources:health:v7";

function withCacheState(
  payload: CachedHealthPayload,
  cached: boolean,
  stale: boolean = false
): CachedHealthPayload {
  return {
    ...payload,
    meta: {
      ...payload.meta,
      cached,
      stale,
    },
  };
}

export async function GET() {
  // 1. Try Redis cache first
  if (isRedisConfigured) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        const payload = JSON.parse(cached) as CachedHealthPayload;
        return NextResponse.json(withCacheState(payload, true, false));
      }
    } catch (error) {
      logger.warn("Redis get failed in sources health route", { error });
    }
  }

  // 2. Check in-memory cache
  const inMemoryCached = getInMemoryCachedPayload();
  if (inMemoryCached) {
    void triggerBackgroundProbe();
    return NextResponse.json(withCacheState(inMemoryCached, true, true));
  }

  // 3. Cache miss: Non-blocking response using stored snapshots and rolling stats
  try {
    const runtimeSources = await getRuntimeSources().catch(() => getAllSourceMetadata());
    const knownSourceIds = runtimeSources.map((s) => s.id);
    const existingSnapshots = await sourceHealthStore.getAllSnapshots(knownSourceIds);

    const data: Record<string, PublicSourceHealth> = {};
    let latestCheckedAt = "";

    for (const source of runtimeSources) {
      const snapshot = existingSnapshots[source.id.toLowerCase().trim()];
      if (snapshot) {
        const stats = await sourceHealthStore.getRollingStats(source.id);
        data[source.id] = toPublicSourceHealth(snapshot, stats);
        if (!latestCheckedAt || snapshot.lastCheckedAt > latestCheckedAt) {
          latestCheckedAt = snapshot.lastCheckedAt;
        }
      } else {
        data[source.id] = createUnknownPublicSourceHealth(source.id);
      }
    }

    const payload: CachedHealthPayload = {
      data,
      meta: {
        cached: false,
        stale: true,
        checkedAt: latestCheckedAt || new Date().toISOString(),
        probeType: "functional",
      },
    };

    // Trigger background probe asynchronously without blocking
    void triggerBackgroundProbe();

    return NextResponse.json(payload);
  } catch (error) {
    logger.error("Failed to build non-blocking source health payload", { error });
    return NextResponse.json({ error: "Failed to retrieve source health" }, { status: 500 });
  }
}
