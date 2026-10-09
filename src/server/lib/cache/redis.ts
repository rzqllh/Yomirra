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

const waitForRedisReady = (connectPromise?: Promise<void>) =>
  new Promise<void>((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;
    let settled = false;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      redis.removeListener("ready", handleReady);
      redis.removeListener("end", handleEnd);
    };
    const handleReady = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const handleEnd = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Redis connection ended before becoming ready"));
    };

    timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Redis connection timed out waiting for ready state"));
    }, 2500);

    redis.once("ready", handleReady);
    redis.once("end", handleEnd);

    if (connectPromise) {
      connectPromise
        .then(() => {
          handleReady();
        })
        .catch((error: unknown) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(
            error instanceof Error
              ? error
              : new Error("Redis connection ended before becoming ready")
          );
        });
    }

    if (isRedisReady()) handleReady();
    else if (redis.status === "end" && !connectPromise) handleEnd();
  });

const establishRedisConnection = async () => {
  if (isRedisReady()) return;

  if (redis.status === "wait" || redis.status === "end") {
    let connectPromise: Promise<void> | undefined;
    try {
      connectPromise = redis.connect();
    } catch (error) {
      connectPromise = Promise.reject(error);
    }
    await waitForRedisReady(connectPromise);
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
