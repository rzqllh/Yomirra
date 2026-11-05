import type { RedisOptions } from "ioredis";
import { env } from "@/env";
import { logger } from "@/shared/logger";
import { redisKeyNamespace } from "./redis-key-scope";
import { RedisCircuitGuard, isQuotaExceededError, waitForRedisReady } from "./redis-circuit";

const globalForRedis = globalThis as unknown as {
  redis: RedisCircuitGuard | undefined;
};

let hasLoggedConnError = false;

export const isRedisConfigured = Boolean(process.env.REDIS_URL);

const createRedisClient = (): RedisCircuitGuard => {
  const baseOptions: RedisOptions = {
    ...(redisKeyNamespace ? { keyPrefix: redisKeyNamespace } : {}),
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    retryStrategy(times: number) {
      if (times > 2) return null;
      return 200;
    },
  };
  const client = new RedisCircuitGuard(env.REDIS_URL, baseOptions);
  client.on("error", (error: unknown) => {
    if (isQuotaExceededError(error)) return;
    if (!hasLoggedConnError) {
      hasLoggedConnError = true;
      if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
        logger.debug("Redis unavailable, graceful in-memory fallback/bypass active", {
          error: error instanceof Error ? error.message : String(error),
        });
      } else {
        logger.error("Redis connection error", { error });
      }
    }
  });
  client.on("connect", () => {
    hasLoggedConnError = false;
    logger.info("Connected to Redis");
  });
  return client;
};

export const redis = globalForRedis.redis ?? createRedisClient();

// These checks also kick one shared recovery without delaying fallback callers.
export const isRedisCircuitOpen = (): boolean => redis.isCircuitOpen();
export const isRedisCommandAllowed = (): boolean => redis.isCommandAllowed();
export const isRedisReady = (): boolean => redis.status === "ready" && isRedisCommandAllowed();

let connectionPromise: Promise<void> | null = null;

const establishRedisConnection = async () => {
  if (!isRedisCommandAllowed()) {
    throw new Error("Redis unavailable: quota circuit breaker is open or in half-open state");
  }
  if (isRedisReady()) return;
  await waitForRedisReady(redis);
  if (!isRedisReady()) throw new Error("Redis unavailable after connection attempt");
};

export const ensureRedisReady = async (): Promise<void> => {
  if (!isRedisConfigured) throw new Error("Redis is not configured");
  if (!isRedisCommandAllowed()) {
    throw new Error("Redis unavailable: quota circuit breaker is open or in half-open state");
  }
  if (isRedisReady()) return;
  if (!connectionPromise) {
    connectionPromise = establishRedisConnection().finally(() => { connectionPromise = null; });
  }
  await connectionPromise;
};

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;
