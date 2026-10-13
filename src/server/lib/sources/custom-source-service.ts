import * as cheerio from "cheerio";
import { isRedisConfigured, isRedisReady, redis, ensureRedisReady } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import { safeFetch } from "@/server/lib/security/outbound-policy";
import { CustomSourceSchema, type CustomSourceDefinition } from "@/shared/sources/custom-source-schema";
import type { SourceMetadata } from "@/shared/sources/source-types";
import type { ParserTestResult } from "@/shared/types/admin";

const CUSTOM_SOURCE_PREFIX = "yomirra:sources:custom:";
const CUSTOM_SOURCE_INDEX = "yomirra:sources:custom:index";

const inMemoryCustomSources = new Map<string, CustomSourceDefinition>();

export function _resetCustomSourcesForTesting(): void {
  inMemoryCustomSources.clear();
}

/**
 * Cursor-based non-blocking SCAN helper to avoid blocking Redis keyspace in production.
 */
export async function scanRedisKeys(pattern: string, maxKeys = 1000): Promise<string[]> {
  let cursor = "0";
  const matchedKeys: string[] = [];

  do {
    const res = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    if (!res || !Array.isArray(res)) break;
    const [nextCursor, keys] = res;
    cursor = nextCursor;
    if (keys && Array.isArray(keys) && keys.length > 0) {
      matchedKeys.push(...keys);
      if (matchedKeys.length >= maxKeys) {
        break;
      }
    }
  } while (cursor !== "0");

  return matchedKeys;
}

/**
 * Mengambil semua custom dynamic source dari Redis (dengan fallback ke memory).
 */
export async function getCustomSources(): Promise<CustomSourceDefinition[]> {
  if (isRedisConfigured) {
    if (!isRedisReady()) {
      void ensureRedisReady().catch(() => {});
      return Array.from(inMemoryCustomSources.values());
    }

    try {
      const ids = await redis.smembers(CUSTOM_SOURCE_INDEX);
      if (ids.length === 0) {
        return Array.from(inMemoryCustomSources.values());
      }

      const keys = ids.map((id) => `${CUSTOM_SOURCE_PREFIX}${id}`);
      const rawItems = await redis.mget(...keys);

      const list: CustomSourceDefinition[] = [];
      for (const raw of rawItems) {
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const validated = CustomSourceSchema.parse(parsed);
          list.push(validated);
          // Sync valid records to in-memory cache for cold-start recovery
          inMemoryCustomSources.set(validated.id, validated);
        } catch {
          // ignore corrupted record
        }
      }
      return list;
    } catch (err) {
      logger.warn("Failed to load custom sources from Redis, fallback to in-memory", { err });
      return Array.from(inMemoryCustomSources.values());
    }
  }

  return Array.from(inMemoryCustomSources.values());
}

/**
 * Mengambil satu custom source berdasarkan ID.
 */
export async function getCustomSourceById(id: string): Promise<CustomSourceDefinition | null> {
  const normalizedId = id.toLowerCase().trim();
  if (isRedisConfigured) {
    if (!isRedisReady()) {
      void ensureRedisReady().catch(() => {});
      return inMemoryCustomSources.get(normalizedId) || null;
    }

    try {
      const raw = await redis.get(`${CUSTOM_SOURCE_PREFIX}${normalizedId}`);
      if (raw) {
        const validated = CustomSourceSchema.parse(JSON.parse(raw));
        inMemoryCustomSources.set(validated.id, validated);
        return validated;
      }
    } catch {
      // fallback
    }
  }
  return inMemoryCustomSources.get(normalizedId) || null;
}

/**
 * Menyimpan atau memperbarui custom source di Redis dengan fail-closed durability.
 */
export async function saveCustomSource(source: CustomSourceDefinition): Promise<CustomSourceDefinition> {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && !isRedisConfigured) {
    logger.error("Admin custom source mutation rejected: Redis durable storage is required in production");
    throw new Error("Failed to persist custom source: durable storage is required in production");
  }

  const validated = CustomSourceSchema.parse({
    ...source,
    id: source.id.toLowerCase().trim(),
    updatedAt: new Date().toISOString(),
    createdAt: source.createdAt || new Date().toISOString(),
  });

  if (isRedisConfigured) {
    await ensureRedisReady();

    try {
      const pipeline = redis.multi();
      pipeline.set(`${CUSTOM_SOURCE_PREFIX}${validated.id}`, JSON.stringify(validated));
      pipeline.sadd(CUSTOM_SOURCE_INDEX, validated.id);
      const results = await pipeline.exec();

      if (!results || results.some(([err]) => err !== null)) {
        throw new Error("Redis multi execution failed for custom source save");
      }

      // Update in-memory state ONLY after successful Redis persistence
      inMemoryCustomSources.set(validated.id, validated);
    } catch (err) {
      logger.error("Failed to persist custom source to Redis", { id: validated.id, err });
      throw new Error("Failed to persist custom source to durable storage", { cause: err });
    }
  } else {
    // Explicitly scoped development/test memory fallback
    inMemoryCustomSources.set(validated.id, validated);
  }

  return validated;
}

/**
 * Menghapus custom source dari Redis secara atomik dengan fail-closed durability.
 */
export async function deleteCustomSource(id: string): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && !isRedisConfigured) {
    logger.error("Admin custom source deletion rejected: Redis durable storage is required in production");
    throw new Error("Failed to delete custom source: durable storage is required in production");
  }

  const normalizedId = id.toLowerCase().trim();

  if (isRedisConfigured) {
    await ensureRedisReady();

    try {
      const pipeline = redis.multi();
      pipeline.del(`${CUSTOM_SOURCE_PREFIX}${normalizedId}`);
      pipeline.srem(CUSTOM_SOURCE_INDEX, normalizedId);
      const results = await pipeline.exec();

      if (!results || results.some(([err]) => err !== null)) {
        throw new Error("Redis multi execution failed for custom source deletion");
      }

      // Flush associated cache using cursor-based SCAN instead of unbounded KEYS
      try {
        const cacheKeys = await scanRedisKeys(`yomirra:*:${normalizedId}:*`);
        if (cacheKeys.length > 0) {
          await redis.del(...cacheKeys);
        }
      } catch (cacheErr) {
        logger.warn("Non-fatal: failed to flush associated cache keys on custom source deletion", {
          id: normalizedId,
          cacheErr,
        });
      }

      // Evict from in-memory state ONLY after successful Redis persistence
      inMemoryCustomSources.delete(normalizedId);
      return true;
    } catch (err) {
      logger.error("Failed to delete custom source from Redis", { id: normalizedId, err });
      throw new Error("Failed to delete custom source from durable storage", { cause: err });
    }
  }

  inMemoryCustomSources.delete(normalizedId);
  return true;
}

/**
 * Mengonversi CustomSourceDefinition menjadi format SourceMetadata untuk registry aplikasi.
 */
export function customSourceToMetadata(source: CustomSourceDefinition): SourceMetadata {
  return {
    id: source.id,
    name: source.name,
    description: `Dynamic source kustom (${source.type.toUpperCase()})`,
    language: source.lang,
    baseUrl: source.baseUrl,
    version: source.version,
    isEnabled: source.isEnabled,
    isInstalled: true,
    status: "online",
    isNsfw: source.isNsfw,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
    },
    isDynamic: true,
  };
}

/**
 * Menguji selector HTML atau API secara live sandbox dari dashboard admin.
 */
export async function testCustomSourceParser(source: CustomSourceDefinition): Promise<ParserTestResult> {
  const start = performance.now();
  try {
    if (source.type === "html") {
      const selectors = source.selectors;
      if (!selectors) {
        throw new Error("Selector HTML belum dikonfigurasi.");
      }

      const targetPath = selectors.popularPath.startsWith("/") ? selectors.popularPath : `/${selectors.popularPath}`;
      const targetUrl = `${source.baseUrl.replace(/\/$/, "")}${targetPath}`;

      const res = await safeFetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: Gagal memuat halaman sumber di ${targetUrl}`);
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      const items: Array<{ title: string; coverUrl?: string; mangaId?: string }> = [];
      $(selectors.popularListSelector).each((_, el) => {
        if (items.length >= 10) return; // batasi 10 sampel
        const $el = $(el);

        const title = $el.find(selectors.titleSelector).first().text().trim() ||
                      $el.find(selectors.titleSelector).first().attr("title")?.trim() || "";

        let coverUrl = $el.find(selectors.coverSelector).first().attr("src") ||
                       $el.find(selectors.coverSelector).first().attr("data-src") || "";

        if (coverUrl.startsWith("//")) coverUrl = `https:${coverUrl}`;
        else if (coverUrl.startsWith("/")) coverUrl = `${source.baseUrl.replace(/\/$/, "")}${coverUrl}`;

        const link = $el.find(selectors.linkSelector).first().attr("href") || "";
        const mangaId = link.replace(source.baseUrl, "").replace(/^\/+/, "").replace(/\/+$/, "") || link;

        if (title) {
          items.push({ title, coverUrl: coverUrl || undefined, mangaId });
        }
      });

      const latencyMs = Math.round(performance.now() - start);

      if (items.length === 0) {
        return {
          success: false,
          latencyMs,
          extractedCount: 0,
          items: [],
          errorMessage: `Halaman berhasil diunduh (${res.status}), tetapi tidak ada item yang cocok dengan selector '${selectors.popularListSelector}'. Periksa kembali selector CSS Anda.`,
        };
      }

      return {
        success: true,
        latencyMs,
        extractedCount: items.length,
        items,
      };
    } else {
      // Type API
      const endpoint = source.endpoints?.popular || "/";
      const targetUrl = endpoint.startsWith("http") ? endpoint : `${source.baseUrl.replace(/\/$/, "")}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

      const res = await safeFetch(targetUrl, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status} saat memanggil endpoint API`);
      }

      const data = await res.json();
      const latencyMs = Math.round(performance.now() - start);

      const rawItems = Array.isArray(data) ? data : (data.data || data.mangas || data.items || []);
      const items = rawItems.slice(0, 10).map((it: any) => ({
        title: it.title || it.name || "Manga",
        coverUrl: it.coverUrl || it.cover || it.image,
        mangaId: String(it.id || it.slug || ""),
      }));

      return {
        success: true,
        latencyMs,
        extractedCount: items.length,
        items,
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      latencyMs,
      extractedCount: 0,
      items: [],
      errorMessage: err.message || "Gagal menguji source parser",
    };
  }
}
