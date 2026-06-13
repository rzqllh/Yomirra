import { redis } from "./redis";
import { logger } from "@/shared/logger";

export const CACHE_TTL = {
  SEARCH: 60 * 60, // 1 hour
  DISCOVERY: 60 * 30, // 30 minutes
  DETAIL: 60 * 60 * 24, // 24 hours
  CHAPTERS: 60 * 30, // 30 minutes
  PAGES: 60 * 60 * 24 * 7, // 7 days
};

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export async function swrCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  let staleEntry: CacheEntry<T> | null = null;
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object' && 'expiresAt' in parsed && 'data' in parsed) {
        staleEntry = parsed as CacheEntry<T>;
        if (Date.now() < staleEntry.expiresAt) {
          return staleEntry.data;
        }
      } else {
        // Legacy cache format
        return parsed as T;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`Redis get bypassed for key ${key}: ${msg}`);
  }

  try {
    const data = await fetcher();
    
    try {
      if (data) {
        const entry: CacheEntry<T> = {
          data,
          expiresAt: Date.now() + (ttlSeconds * 1000)
        };
        // Store in Redis for 7 days to allow stale fallback
        await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(entry));
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`Redis set bypassed for key ${key}: ${msg}`);
    }

    return data;
  } catch (error) {
    if (staleEntry) {
      logger.warn(`Fetcher failed for ${key}, falling back to stale cache`);
      return staleEntry.data;
    }
    throw error;
  }
}
