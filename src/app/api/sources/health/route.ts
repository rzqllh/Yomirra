import { NextResponse } from "next/server";
import { isRedisConfigured, isRedisCommandAllowed, redis } from "@/server/lib/cache/redis";
import { sourceHealthStore } from "@/server/lib/sources/health/health-store";
import {
  toPublicSourceHealth,
  createUnknownPublicSourceHealth,
  type PublicSourceHealth,
} from "@/server/lib/sources/health/public-health";
import {
  triggerBackgroundProbe,
  SOURCE_HEALTH_CACHE_KEY,
  getInMemoryCachedPayload,
  type CachedHealthPayload,
} from "@/server/lib/sources/health/background-probe";
import { getRuntimeSources } from "@/server/lib/sources/runtime-sources";
import { getAllSourceMetadata } from "@/shared/sources/source-registry";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LOCAL_HEALTH_TTL_MS = 10_000;
let lastPayload: { value: CachedHealthPayload; expiresAt: number } | undefined;
let inFlight: Promise<CachedHealthPayload> | undefined;

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

async function loadHealthPayload(): Promise<CachedHealthPayload> {
  // 1. Try Redis cache first
  if (isRedisConfigured && isRedisCommandAllowed()) {
    try {
      const cached = await redis.get(SOURCE_HEALTH_CACHE_KEY);
      if (cached) {
        const payload = JSON.parse(cached) as CachedHealthPayload;
        return withCacheState(payload, true, false);
      }
    } catch (error) {
      logger.warn("Redis get failed in sources health route", { error });
    }
  }

  // 2. Check in-memory cache
  const inMemoryCached = getInMemoryCachedPayload();
  if (inMemoryCached) {
    void triggerBackgroundProbe();
    return withCacheState(inMemoryCached, true, true);
  }

  // 3. Cache miss: Non-blocking response using stored snapshots and rolling stats
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

  return payload;
}

export async function GET() {
  if (lastPayload && lastPayload.expiresAt > Date.now()) {
    return NextResponse.json(lastPayload.value);
  }
  try {
    inFlight ??= loadHealthPayload().then((value) => {
      lastPayload = { value, expiresAt: Date.now() + LOCAL_HEALTH_TTL_MS };
      return value;
    }).finally(() => { inFlight = undefined; });
    return NextResponse.json(await inFlight);
  } catch (error) {
    logger.error("Failed to build non-blocking source health payload", { error });
    return NextResponse.json({ error: "Failed to retrieve source health" }, { status: 500 });
  }
}
