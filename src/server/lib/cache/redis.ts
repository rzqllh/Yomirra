import Redis from "ioredis";
import { env } from "@/env";
import { logger } from "@/shared/logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

redis.on("error", (error) => {
  logger.error("Redis connection error", { error });
});

redis.on("connect", () => {
  logger.info("Connected to Redis");
});

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;
