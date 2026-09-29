import { createHash } from "node:crypto";
import { redis } from "@/server/lib/cache/redis";
import { logger } from "@/shared/logger";
import type { MangaItem } from "@/shared/sources/source-types";
import type { SearchCatalogCandidate } from "@/shared/lib/search-intelligence";

const INDEX_KEY = "yomirra:search:catalog:index";
const RECORD_PREFIX = "yomirra:search:catalog:record:";
const RECORD_TTL_SECONDS = 90 * 24 * 60 * 60;
const MAX_RECORDS = 1200;

export interface StoredSearchCatalogRecord extends SearchCatalogCandidate {
  embedding?: number[];
  embeddingTextHash?: string;
  updatedAt: number;
}

export function buildTrustedCatalogCandidate(
  sourceId: string,
  manga: MangaItem
): SearchCatalogCandidate {
  return {
    canonicalKey: `source:${sourceId}:${manga.id}`,
    sourceId,
    mangaId: manga.id,
    title: manga.title,
    coverUrl: manga.coverUrl,
    originalTitle: manga.originalTitle,
    alternativeTitles: manga.alternativeTitles,
    author: manga.author,
    description: manga.description,
    format: manga.format,
    status: manga.status,
    score: manga.score,
    sourceBindings: [
      {
        sourceId,
        mangaId: manga.id,
        title: manga.title,
        coverUrl: manga.coverUrl,
        latestChapter: manga.latestChapter,
        language: manga.language,
        format: manga.format,
        score: manga.score,
      },
    ],
  };
}

function recordKey(canonicalKey: string): string {
  const hash = createHash("sha256").update(canonicalKey).digest("hex").slice(0, 24);
  return `${RECORD_PREFIX}${hash}`;
}

export function hashEmbeddingText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function upsertSearchCatalogRecords(
  candidates: SearchCatalogCandidate[],
  embeddings: Map<string, { values: number[]; textHash: string }> = new Map()
): Promise<void> {
  if (candidates.length === 0) return;

  try {
    const unique = Array.from(
      new Map(candidates.map((candidate) => [candidate.canonicalKey, candidate])).values()
    ).slice(0, 50);
    const keys = unique.map((candidate) => recordKey(candidate.canonicalKey));
    const existing = await redis.mget(keys);
    const now = Date.now();
    const pipeline = redis.pipeline();

    unique.forEach((candidate, index) => {
      let previous: StoredSearchCatalogRecord | null = null;
      if (existing[index]) {
        try {
          previous = JSON.parse(existing[index] as string) as StoredSearchCatalogRecord;
        } catch {
          previous = null;
        }
      }

      const nextEmbedding = embeddings.get(candidate.canonicalKey);
      const record: StoredSearchCatalogRecord = {
        ...previous,
        ...candidate,
        sourceBindings:
          candidate.sourceBindings && candidate.sourceBindings.length > 0
            ? candidate.sourceBindings
            : previous?.sourceBindings,
        embedding: nextEmbedding?.values ?? previous?.embedding,
        embeddingTextHash: nextEmbedding?.textHash ?? previous?.embeddingTextHash,
        updatedAt: now,
      };

      pipeline.set(recordKey(candidate.canonicalKey), JSON.stringify(record), "EX", RECORD_TTL_SECONDS);
      pipeline.zadd(INDEX_KEY, now, candidate.canonicalKey);
    });

    await pipeline.exec();

    const count = await redis.zcard(INDEX_KEY);
    if (count > MAX_RECORDS) {
      const removeCount = count - MAX_RECORDS;
      const staleKeys = await redis.zrange(INDEX_KEY, 0, removeCount - 1);
      if (staleKeys.length > 0) {
        const cleanup = redis.pipeline();
        staleKeys.forEach((canonicalKey) => cleanup.del(recordKey(canonicalKey)));
        cleanup.zremrangebyrank(INDEX_KEY, 0, removeCount - 1);
        await cleanup.exec();
      }
    }
  } catch (error) {
    logger.debug("Search catalog persistence skipped", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getSearchCatalogRecord(
  canonicalKey: string
): Promise<StoredSearchCatalogRecord | null> {
  try {
    const raw = await redis.get(recordKey(canonicalKey));
    return raw ? (JSON.parse(raw) as StoredSearchCatalogRecord) : null;
  } catch {
    return null;
  }
}

export async function getRecentSearchCatalogRecords(
  limit = 250
): Promise<StoredSearchCatalogRecord[]> {
  try {
    const ids = await redis.zrevrange(INDEX_KEY, 0, Math.max(0, Math.min(limit, MAX_RECORDS) - 1));
    if (ids.length === 0) return [];
    const values = await redis.mget(ids.map(recordKey));
    return values.flatMap((value) => {
      if (!value) return [];
      try {
        return [JSON.parse(value) as StoredSearchCatalogRecord];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}
