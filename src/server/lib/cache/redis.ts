import Redis from "ioredis";
import { env } from "@/env";
import { logger } from "@/shared/logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

let hasLoggedConnError = false;

/**
 * Redis is optional for normal reader flows. env.REDIS_URL keeps a local
 * development default, but production/preview code must not interpret that
 * default as a configured remote cache.
 */
export const isRedisConfigured = Boolean(process.env.REDIS_URL);

const createRedisClient = () => {
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 2) {
        // Stop retrying quickly in environments without a local Redis server
        return null;
      }
      return 200;
    },
  });

  client.on("error", (error) => {
    // Only log the first connection refusal to avoid flooding test logs and serverless console
    if (!hasLoggedConnError) {
      hasLoggedConnError = true;
      if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
        logger.debug("Redis unavailable, graceful in-memory fallback/bypass active", { error: error.message });
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

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;
