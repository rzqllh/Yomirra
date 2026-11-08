import { Redis } from "@upstash/redis";

export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL || "https://placeholder.upstash.io",
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "placeholder",
      });

export default redis;
