import Redis from "ioredis";
import { env } from "@/env";
import { logger } from "@/shared/logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

const createRedisClient = () => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  client.on("error", (error) => {
    logger.error("Redis connection error", { error });
  });

  client.on("connect", () => {
    logger.info("Connected to Redis");
  });

  return client;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;
