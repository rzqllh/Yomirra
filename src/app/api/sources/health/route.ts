import { NextResponse } from "next/server";
import { isRedisConfigured, redis } from "@/server/lib/cache/redis";
import { probeAllSourcesHealth } from "@/server/lib/sources/health/probe";
import {
  toPublicSourceHealth,
  type PublicSourceHealth,
} from "@/server/lib/sources/health/public-health";
import { logger } from "@/shared/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CACHE_KEY = "yomirra:sources:health:v7";
const TTL_SECONDS = 600;

interface HealthResponseMeta {
  cached: boolean;
  checkedAt: string;
  probeType: "functional";
}

interface CachedHealthPayload {
  data: Record<string, PublicSourceHealth>;
  meta: HealthResponseMeta;
}

function withCacheState(payload: CachedHealthPayload, cached: boolean): CachedHealthPayload {
  return {
    ...payload,
    meta: {
      ...payload.meta,
      cached,
    },
  };
}

export async function GET() {
  if (isRedisConfigured) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        const payload = JSON.parse(cached) as CachedHealthPayload;
        return NextResponse.json(withCacheState(payload, true));
      }
    } catch (error) {
      logger.warn("Redis get failed in sources health route", { error });
    }
  }

  try {
    const snapshots = await probeAllSourcesHealth({ deep: false });
    const data = Object.fromEntries(
      Object.entries(snapshots).map(([sourceId, snapshot]) => [
        sourceId,
        toPublicSourceHealth(snapshot),
      ])
    );
    const checkedAt = Object.values(snapshots)
      .map((snapshot) => snapshot.lastCheckedAt)
      .sort()
      .at(-1) ?? new Date().toISOString();
    const payload: CachedHealthPayload = {
      data,
      meta: {
        cached: false,
        checkedAt,
        probeType: "functional",
      },
    };

    if (isRedisConfigured) {
      try {
        await redis.setex(CACHE_KEY, TTL_SECONDS, JSON.stringify(payload));
      } catch (error) {
        logger.warn("Redis setex failed in sources health route", { error });
      }
    }

    return NextResponse.json(payload);
  } catch (error) {
    logger.error("Functional source health check failed", { error });
    return NextResponse.json({ error: "Failed to check health" }, { status: 500 });
  }
}
