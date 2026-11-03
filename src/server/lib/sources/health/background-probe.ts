import { isRedisConfigured, redis } from "@/server/lib/cache/redis";
import { probeAllSourcesHealth } from "./probe";
import { sourceHealthStore } from "./health-store";
import { toPublicSourceHealth, type PublicSourceHealth } from "./public-health";
import { logger } from "@/shared/logger";

const CACHE_KEY = "yomirra:sources:health:v7";
const TTL_SECONDS = 600;
const PROBE_LOCK_KEY = "yomirra:lock:sources:health:probe";
const PROBE_LOCK_TTL_SECONDS = 120; // 2 minutes max
const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export interface HealthResponseMeta {
  cached: boolean;
  stale?: boolean;
  checkedAt: string;
  probeType: "functional";
}

export interface CachedHealthPayload {
  data: Record<string, PublicSourceHealth>;
  meta: HealthResponseMeta;
}

let inMemoryLockToken: string | null = null;
let inMemoryCachedPayload: CachedHealthPayload | null = null;

export function getInMemoryCachedPayload(): CachedHealthPayload | null {
  return inMemoryCachedPayload;
}

export function setInMemoryCachedPayload(payload: CachedHealthPayload | null): void {
  inMemoryCachedPayload = payload;
}

/**
 * Triggers functional source health probe in the background if atomic mutex is available.
 * Protected against thundering herd by atomic Redis SET NX with TTL and token ownership.
 */
export async function triggerBackgroundProbe(): Promise<boolean> {
  const token =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  if (isRedisConfigured) {
    try {
      const acquired = await redis.set(PROBE_LOCK_KEY, token, "EX", PROBE_LOCK_TTL_SECONDS, "NX");
      if (acquired !== "OK") {
        return false;
      }
    } catch (err) {
      logger.warn("Redis error acquiring probe lock", { error: err });
      return false;
    }
  } else {
    if (inMemoryLockToken) return false;
    inMemoryLockToken = token;
  }

  // Execute probe in the background asynchronously without blocking the request
  (async () => {
    try {
      const snapshots = await probeAllSourcesHealth({ deep: false });
      const data: Record<string, PublicSourceHealth> = {};

      for (const [sourceId, snapshot] of Object.entries(snapshots)) {
        const stats = await sourceHealthStore.getRollingStats(sourceId);
        data[sourceId] = toPublicSourceHealth(snapshot, stats);
      }

      const checkedAt =
        Object.values(snapshots)
          .map((s) => s.lastCheckedAt)
          .sort()
          .at(-1) ?? new Date().toISOString();

      const freshPayload: CachedHealthPayload = {
        data,
        meta: {
          cached: true,
          stale: false,
          checkedAt,
          probeType: "functional",
        },
      };

      inMemoryCachedPayload = freshPayload;

      if (isRedisConfigured) {
        try {
          await redis.setex(CACHE_KEY, TTL_SECONDS, JSON.stringify(freshPayload));
        } catch (error) {
          logger.warn("Redis setex failed in background probe", { error });
        }
      }
    } catch (error) {
      logger.error("Background functional source health check failed", { error });
    } finally {
      if (isRedisConfigured) {
        try {
          await redis.eval(RELEASE_LOCK_LUA, 1, PROBE_LOCK_KEY, token);
        } catch (err) {
          logger.warn("Failed to release Redis probe lock", { error: err });
        }
      } else {
        if (inMemoryLockToken === token) {
          inMemoryLockToken = null;
        }
      }
    }
  })().catch((err) => {
    logger.error("Unhandled error in background probe executor", { error: err });
  });

  return true;
}
