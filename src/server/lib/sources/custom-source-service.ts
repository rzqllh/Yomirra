import * as cheerio from "cheerio";
import { isRedisConfigured, redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import { safeFetch } from "@/server/lib/security/outbound-policy";
import { CustomSourceSchema, type CustomSourceDefinition } from "@/shared/sources/custom-source-schema";
import type { SourceMetadata, MangaItem } from "@/shared/sources/source-types";
import type { ParserTestResult } from "@/shared/types/admin";

const CUSTOM_SOURCE_PREFIX = "yomirra:sources:custom:";
const CUSTOM_SOURCE_INDEX = "yomirra:sources:custom:index";

const inMemoryCustomSources = new Map<string, CustomSourceDefinition>();

/**
 * Mengambil semua custom dynamic source dari Redis (dengan fallback ke memory).
 */
export async function getCustomSources(): Promise<CustomSourceDefinition[]> {
  if (isRedisConfigured) {
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
    try {
      const raw = await redis.get(`${CUSTOM_SOURCE_PREFIX}${normalizedId}`);
      if (raw) {
        return CustomSourceSchema.parse(JSON.parse(raw));
      }
    } catch {
      // fallback
    }
  }
  return inMemoryCustomSources.get(normalizedId) || null;
}

/**
 * Menyimpan atau memperbarui custom source di Redis.
 */
export async function saveCustomSource(source: CustomSourceDefinition): Promise<CustomSourceDefinition> {
  const validated = CustomSourceSchema.parse({
    ...source,
    id: source.id.toLowerCase().trim(),
    updatedAt: new Date().toISOString(),
    createdAt: source.createdAt || new Date().toISOString(),
  });

  inMemoryCustomSources.set(validated.id, validated);

  if (isRedisConfigured) {
    try {
      await redis.set(`${CUSTOM_SOURCE_PREFIX}${validated.id}`, JSON.stringify(validated));
      await redis.sadd(CUSTOM_SOURCE_INDEX, validated.id);
    } catch (err) {
      logger.error("Failed to persist custom source to Redis", { id: validated.id, err });
    }
  }

  return validated;
}

/**
 * Menghapus custom source dari Redis.
 */
export async function deleteCustomSource(id: string): Promise<boolean> {
  const normalizedId = id.toLowerCase().trim();
  inMemoryCustomSources.delete(normalizedId);

  if (isRedisConfigured) {
    try {
      await redis.del(`${CUSTOM_SOURCE_PREFIX}${normalizedId}`);
      await redis.srem(CUSTOM_SOURCE_INDEX, normalizedId);
      // Flush cache jika ada
      const cacheKeys = await redis.keys(`yomirra:*:${normalizedId}:*`);
      if (cacheKeys.length > 0) {
        await redis.del(...cacheKeys);
      }
      return true;
    } catch (err) {
      logger.error("Failed to delete custom source from Redis", { id: normalizedId, err });
      return false;
    }
  }

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
