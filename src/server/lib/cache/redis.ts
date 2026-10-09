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

let connectionPromise: Promise<void> | null = null;

const isRedisReady = () => redis.status === "ready";

const waitForRedisReady = () =>
  new Promise<void>((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;
    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      redis.removeListener("ready", handleReady);
      redis.removeListener("end", handleEnd);
    };
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const handleEnd = () => {
      cleanup();
      reject(new Error("Redis connection ended before becoming ready"));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error("Redis connection timed out waiting for ready state"));
    }, 2500);

    redis.once("ready", handleReady);
    redis.once("end", handleEnd);

    if (isRedisReady()) handleReady();
    else if (redis.status === "end") handleEnd();
  });

const establishRedisConnection = async () => {
  if (isRedisReady()) return;

  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  } else {
    await waitForRedisReady();
  }

  if (!isRedisReady()) {
    throw new Error("Redis unavailable after connection attempt");
  }
};

export const ensureRedisReady = async () => {
  if (!isRedisConfigured) {
    throw new Error("Redis is not configured");
  }

  if (isRedisReady()) return;

  if (!connectionPromise) {
    connectionPromise = establishRedisConnection().finally(() => {
      connectionPromise = null;
    });
  }

  await connectionPromise;
};

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;
