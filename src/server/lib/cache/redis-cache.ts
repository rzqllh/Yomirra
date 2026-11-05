import { isRedisConfigured, isRedisCommandAllowed, redis } from "./redis";
import { logger } from "@/shared/logger";

export const CACHE_TTL = {
  SEARCH: 60 * 60, // 1 hour
  DISCOVERY: 60 * 30, // 30 minutes
  DETAIL: 60 * 60 * 24, // 24 hours
  CHAPTERS: 60 * 30, // 30 minutes
  PAGES: 60 * 60 * 24 * 7, // 7 days
};

import crypto from "node:crypto";
import type { SourceMetadata } from "@/shared/sources/source-types";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const FLIGHT_LIFETIME_MS = 30_000;
const MAX_IN_FLIGHT = 1024;
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Brief, bounded per-isolate read-through cache for public cache-keyed content.
 * This reduces repeated paid Redis GETs without retaining entries beyond their
 * original active TTL. Values are serialized to prevent cross-request mutation.
 * The 10-second cap bounds lag after an out-of-process cache invalidation.
 */
const NEAR_TTL_MS = 10_000;
const NEAR_MAX_ENTRIES = 256;
const NEAR_MAX_BYTES = 8 * 1024 * 1024;
const NEAR_MAX_ENTRY_BYTES = 128 * 1024;
type NearEntry = { serialized: string; expiresAt: number; bytes: number };
const nearCache = new Map<string, NearEntry>();
let nearCacheBytes = 0;

function discardNear(key: string): void {
  const entry = nearCache.get(key);
  if (entry) nearCacheBytes -= entry.bytes;
  nearCache.delete(key);
}

export function _resetNearCacheForTesting(): void {
  nearCache.clear();
  nearCacheBytes = 0;
}

function rememberNear(key: string, serialized: string, originalExpiresAt: number): void {
  discardNear(key);
  const now = Date.now();
  const expiresAt = Math.min(originalExpiresAt, now + NEAR_TTL_MS);
  const bytes = serialized.length * 2; // Conservative UTF-16 memory estimate.
  if (!Number.isFinite(expiresAt) || expiresAt <= now ||
      bytes > NEAR_MAX_ENTRY_BYTES || key.length > 1024) return;
  while (nearCache.size >= NEAR_MAX_ENTRIES || nearCacheBytes + bytes > NEAR_MAX_BYTES) {
    const oldest = nearCache.keys().next().value;
    if (oldest === undefined) break;
    discardNear(oldest);
  }
  nearCache.set(key, { serialized, expiresAt, bytes });
  nearCacheBytes += bytes;
}

function readNear<T>(key: string): { data: T } | null {
  const entry = nearCache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    discardNear(key);
    return null;
  }
  try {
    const parsed = JSON.parse(entry.serialized) as CacheEntry<T>;
    if (Date.now() >= parsed.expiresAt) {
      discardNear(key);
      return null;
    }
    // LRU: keep frequently accessed keys rather than one-off crawler keys.
    nearCache.delete(key);
    nearCache.set(key, entry);
    return { data: parsed.data };
  } catch {
    discardNear(key);
    return null;
  }
}


export function getSourceCacheKey(source: SourceMetadata, operation: string, params: string): string {
  if (source.isDynamic) {
    const raw = `${source.id}:${source.version || "0.0.0"}:${source.baseUrl || ""}`;
    const fingerprint = crypto.createHash("sha256").update(raw).digest("hex").substring(0, 12);
    return `source:dynamic:${fingerprint}:${source.id}:${operation}:${params}`;
  }
  return `source:${source.id}:${operation}:${params}`;
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number,
  options: { allowStaleOnError?: boolean } = {}
): Promise<T> {
  const activeTtlSeconds = Math.max(1, Math.floor(ttlSeconds));
  const flightKey = JSON.stringify([key, activeTtlSeconds, options.allowStaleOnError !== false]);
  const existing = inFlight.get(flightKey);
  if (existing) return existing as Promise<T>;
  if (inFlight.size >= MAX_IN_FLIGHT) {
    throw new Error("Cache in-flight capacity exceeded");
  }

  const timeoutError = new Error(`Cache request timed out after ${FLIGHT_LIFETIME_MS}ms`);
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(timeoutError), FLIGHT_LIFETIME_MS);
  });
  const isCurrent = () => inFlight.get(flightKey) === request;
  const work = Promise.resolve().then(() =>
    readThroughCache(key, flightKey, fetcher, activeTtlSeconds, options, isCurrent, timeoutError),
  );
  const request: Promise<T> = Promise.race([work, timeout]).finally(() => {
    clearTimeout(timer);
    if (isCurrent()) inFlight.delete(flightKey);
  });
  inFlight.set(flightKey, request);
  return request;
}

async function readThroughCache<T>(
  key: string,
  flightKey: string,
  fetcher: () => Promise<T>,
  activeTtlSeconds: number,
  options: { allowStaleOnError?: boolean },
  isCurrent: () => boolean,
  timeoutError: Error,
): Promise<T> {
  const near = readNear<T>(flightKey);
  if (near) return near.data;
  let staleEntry: CacheEntry<T> | null = null;
  // Stale data is only useful for a short, bounded outage. The previous
  // blanket 7-day Redis retention could resurrect weeks-old source data.
  const staleGraceSeconds = options.allowStaleOnError === false
    ? 0
    : Math.min(activeTtlSeconds, 60 * 60);

  if (isRedisConfigured && isRedisCommandAllowed()) try {
    const cached = await redis.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object' && 'expiresAt' in parsed && 'data' in parsed) {
        staleEntry = parsed as CacheEntry<T>;
        if (Date.now() < staleEntry.expiresAt) {
          // A late Redis GET must not warm local cache after its flight timed out.
          if (isCurrent()) rememberNear(flightKey, cached, staleEntry.expiresAt);
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

  if (!isCurrent()) throw timeoutError;
  try {
    const data = await fetcher();

    if (isCurrent() && data) {
      try {
        const entry: CacheEntry<T> = {
          data,
          expiresAt: Date.now() + (activeTtlSeconds * 1000),
        };
        const serialized = JSON.stringify(entry);
        rememberNear(flightKey, serialized, entry.expiresAt);
        if (isRedisConfigured && isRedisCommandAllowed()) {
          // Physical retention matches active TTL plus permitted stale grace.
          await redis.setex(key, activeTtlSeconds + staleGraceSeconds, serialized);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.warn(`Redis set bypassed for key ${key}: ${msg}`);
      }
    }

    return data;
  } catch (error) {
    if (
      staleEntry &&
      staleGraceSeconds > 0 &&
      Date.now() >= staleEntry.expiresAt &&
      Date.now() - staleEntry.expiresAt <= staleGraceSeconds * 1000
    ) {
      logger.warn(`Fetcher failed for ${key}, falling back to bounded stale cache`);
      return staleEntry.data;
    }
    throw error;
  }
}
