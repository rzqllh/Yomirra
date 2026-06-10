import { redis } from "./redis";
import { logger } from "@/shared/logger";

export const CACHE_TTL = {
  SEARCH: 60 * 60, // 1 hour
  DISCOVERY: 60 * 30, // 30 minutes
  DETAIL: 60 * 60 * 24, // 24 hours
  CHAPTERS: 60 * 30, // 30 minutes
  PAGES: 60 * 60 * 24 * 7, // 7 days
};

export async function swrCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    logger.error(`Redis get error for key ${key}`, { error });
  }

  const data = await fetcher();

  try {
    if (data) {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    }
  } catch (error) {
    logger.error(`Redis set error for key ${key}`, { error });
  }

  return data;
}
