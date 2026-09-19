import { apiClient } from "@/shared/api-client";
import { useLibraryStore, type LibraryItem } from "@/shared/store/library-store";
import { useUpdateStore, getUpdateKey } from "@/shared/store/update-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useSourceHealthStore } from "@/shared/store/source-health-store";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { parseChapterNumber } from "@/shared/lib/chapter-parser";
import type { Chapter } from "@/shared/sources/source-types";

export const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
export const CONCURRENCY_LIMIT = 3;

export interface ScanOptions {
  forceRefresh?: boolean;
  cooldownMs?: number;
  signal?: AbortSignal;
  maxItems?: number;
  prioritizeRecent?: boolean;
}

export interface ScanError {
  sourceId: string;
  mangaId: string;
  error: string;
}

export interface ScanResult {
  totalScanned: number;
  updatesDetected: number;
  skippedCooldown: number;
  errors: ScanError[];
}

export async function scanLibraryUpdates(options: ScanOptions = {}): Promise<ScanResult> {
  let libraryItems = Object.values(useLibraryStore.getState().items || {})
    .filter((item) => Boolean(item && item.sourceId && item.mangaId));
  const updateItems = useUpdateStore.getState().items || {};
  const cooldown = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const now = Date.now();

  const result: ScanResult = {
    totalScanned: 0,
    updatesDetected: 0,
    skippedCooldown: 0,
    errors: [],
  };

  if (libraryItems.length === 0) {
    return result;
  }

  // Prioritize recently read or updated items if requested
  if (options.prioritizeRecent) {
    libraryItems = [...libraryItems].sort((a, b) => {
      const timeA = Date.parse(a.lastReadAt || a.updatedAt || a.addedAt || "0");
      const timeB = Date.parse(b.lastReadAt || b.updatedAt || b.addedAt || "0");
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }

  // Limit number of items to scan if requested
  if (options.maxItems !== undefined && options.maxItems > 0) {
    libraryItems = libraryItems.slice(0, options.maxItems);
  }

  // Filter items needing scan
  const itemsToScan: LibraryItem[] = [];

  for (const item of libraryItems) {
    if (options.signal?.aborted) break;

    // Check cooldown unless forceRefresh is true
    if (!options.forceRefresh) {
      const key = getUpdateKey(item.sourceId, item.mangaId);
      const existingUpdate =
        (item.id ? updateItems[item.id] : undefined) || updateItems[key];
      if (existingUpdate?.lastCheckedAt) {
        const lastCheckedTime = Date.parse(existingUpdate.lastCheckedAt);
        if (!isNaN(lastCheckedTime) && now - lastCheckedTime < cooldown) {
          result.skippedCooldown++;
          result.totalScanned++;
          continue;
        }
      }
    }

    itemsToScan.push(item);
  }

  // Helper for bounded concurrency pool
  async function poolWorker(items: LibraryItem[]) {
    for (const item of items) {
      if (options.signal?.aborted) break;

      result.totalScanned++;
      const savedTitleId = item.id || getUpdateKey(item.sourceId, item.mangaId);
      const existingUpdate =
        (item.id ? updateItems[item.id] : undefined) ||
        updateItems[getUpdateKey(item.sourceId, item.mangaId)];

      // 1. Resolve candidate sources based on Phase 6 preferences & linked sources
      const settings = useSettingsStore.getState();
      const explicitPref =
        (item.id ? settings.perTitleSourcePreferences?.[item.id] : undefined) ||
        settings.perTitleSourcePreferences?.[savedTitleId] ||
        settings.perTitleSourcePreferences?.[getUpdateKey(item.sourceId, item.mangaId)];

      const healthState = useSourceHealthStore.getState().healthBySource || {};
      const isSourceHealthy = (srcId: string) => {
        const h = healthState[srcId]?.status;
        return h !== "offline" && h !== "degraded";
      };

      interface CandidateTarget {
        sourceId: string;
        mangaId: string;
        sourceName?: string;
        priority: number;
        isPrimary: boolean;
      }

      const candidates: CandidateTarget[] = [];
      // Primary
      candidates.push({
        sourceId: item.sourceId,
        mangaId: item.mangaId,
        sourceName: item.sourceName,
        isPrimary: true,
        priority: 10,
      });

      // Linked sources
      if (item.linkedSources && item.linkedSources.length > 0) {
        for (const ref of item.linkedSources) {
          if (!ref.sourceId || !ref.mangaId) continue;
          if (ref.matchConfidence === "NO_MATCH") continue;

          let basePriority = 2;
          if (ref.matchConfidence === "CONFIRMED") basePriority = 8;
          else if (ref.matchConfidence === "HIGH_CONFIDENCE") basePriority = 6;

          candidates.push({
            sourceId: ref.sourceId,
            mangaId: ref.mangaId,
            sourceName: getSourceMetadata(ref.sourceId)?.name ?? ref.sourceId,
            isPrimary: false,
            priority: basePriority,
          });
        }
      }

      // Apply explicit user choice & health adjustments
      candidates.forEach((c) => {
        if (explicitPref && c.sourceId === explicitPref) {
          c.priority += 100;
        }
        if (!isSourceHealthy(c.sourceId)) {
          c.priority -= 50;
        }
      });

      // Deduplicate by sourceId keeping highest priority
      const candidateMap = new Map<string, CandidateTarget>();
      for (const c of candidates) {
        const existing = candidateMap.get(c.sourceId);
        if (!existing || c.priority > existing.priority) {
          candidateMap.set(c.sourceId, c);
        }
      }

      // Sort candidates by priority descending
      const sortedCandidates = Array.from(candidateMap.values()).sort(
        (a, b) => b.priority - a.priority
      );

      // Bounded fan-out: Poll at most top 2 candidates per item
      const targetsToPoll = sortedCandidates.slice(0, 2);

      type DiscoveredChapter = {
        chapter: Chapter;
        normalizedNumber: number;
        sourceId: string;
        sourceName?: string;
      };

      const discoveredChapters: DiscoveredChapter[] = [];
      const pollErrors: Array<{ sourceId: string; mangaId: string; error: string }> = [];

      for (const target of targetsToPoll) {
        if (options.signal?.aborted) break;
        try {
          const chapters = await apiClient.getChapters(target.sourceId, target.mangaId, {
            signal: options.signal,
          });
          if (chapters && chapters.length > 0) {
            for (const ch of chapters) {
              const parsedNum = parseChapterNumber(ch.title);
              const normNum =
                parsedNum ?? (typeof ch.number === "number" && !isNaN(ch.number) ? ch.number : 0);
              discoveredChapters.push({
                chapter: ch,
                normalizedNumber: normNum,
                sourceId: target.sourceId,
                sourceName: target.sourceName,
              });
            }
          }
        } catch (err: any) {
          if (err.name === "AbortError" || options.signal?.aborted) break;
          const msg = err?.message || "Gagal memuat chapter";
          pollErrors.push({
            sourceId: target.sourceId,
            mangaId: target.mangaId,
            error: msg,
          });
        }
      }

      // Self-heal: If item.title is missing, corrupted into a chapter label, or coverUrl is missing
      let resolvedTitle = item.title;
      let resolvedCoverUrl = item.coverUrl;
      const isCorruptedTitle = !resolvedTitle || /^chapter\s*\d+/i.test(resolvedTitle.trim());
      const needsHealing = isCorruptedTitle || !resolvedCoverUrl;
      if (needsHealing) {
        try {
          const detail = await apiClient.getDetail(item.sourceId, item.mangaId, {
            signal: options.signal,
          });
          if (detail?.title) {
            resolvedTitle = detail.title;
            resolvedCoverUrl = detail.coverUrl || resolvedCoverUrl;
            useLibraryStore.getState().updateLibraryItem(item.sourceId, item.mangaId, {
              title: resolvedTitle,
              coverUrl: resolvedCoverUrl,
            });
          }
        } catch {
          // Non-blocking fallback
        }
      }

      if (discoveredChapters.length > 0) {
        // Dedup: find latest chapter by normalizedNumber, tie-breaking in favor of primary/preferred source
        const latest = discoveredChapters.reduce((prev, curr) => {
          if (curr.normalizedNumber > prev.normalizedNumber) return curr;
          if (curr.normalizedNumber === prev.normalizedNumber) {
            if (curr.sourceId === item.sourceId && prev.sourceId !== item.sourceId) return curr;
          }
          return prev;
        }, discoveredChapters[0]);

        const isFirstScan = !existingUpdate;
        const isNewChapter =
          !isFirstScan &&
          Boolean(
            existingUpdate.latestChapterId &&
            latest.chapter.id &&
            (latest.normalizedNumber > (existingUpdate.latestChapterNumber ?? 0) ||
              (existingUpdate.latestChapterId !== latest.chapter.id &&
                latest.normalizedNumber === (existingUpdate.latestChapterNumber ?? 0)))
          );

        if (isNewChapter) {
          result.updatesDetected++;
        }

        const checkTimeIso = new Date().toISOString();
        const resolvedSeenAt = isNewChapter ? undefined : (existingUpdate?.seenAt || checkTimeIso);
        const resolvedDetectedAt = isNewChapter
          ? checkTimeIso
          : (existingUpdate?.detectedAt || checkTimeIso);

        useUpdateStore.getState().upsertUpdate({
          savedTitleId: item.id,
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          mangaTitle: resolvedTitle,
          coverUrl: resolvedCoverUrl,
          sourceName: item.sourceName,
          lastKnownChapterId: item.lastReadChapterId,
          lastKnownChapterTitle: item.lastReadChapterTitle,
          latestChapterId: latest.chapter.id,
          latestChapterNumber: latest.normalizedNumber,
          latestChapterTitle: latest.chapter.title,
          detectedSourceId: latest.sourceId,
          detectedSourceName: latest.sourceName || latest.sourceId,
          isAlternateSource: latest.sourceId !== item.sourceId,
          lastCheckedAt: checkTimeIso,
          detectedAt: resolvedDetectedAt,
          seenAt: resolvedSeenAt,
        });
      } else if (pollErrors.length > 0) {
        // All candidate polls errored -> record isolated error
        const primaryError =
          pollErrors.find((e) => e.sourceId === item.sourceId)?.error || pollErrors[0].error;
        result.errors.push({
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          error: primaryError,
        });

        useUpdateStore.getState().upsertUpdate({
          savedTitleId: item.id,
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          mangaTitle: item.title,
          coverUrl: item.coverUrl,
          sourceName: item.sourceName,
          lastCheckedAt: new Date().toISOString(),
          error: primaryError,
        });
      } else {
        // 0 chapters returned without error
        useUpdateStore.getState().upsertUpdate({
          savedTitleId: item.id,
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          mangaTitle: resolvedTitle,
          coverUrl: resolvedCoverUrl,
          sourceName: item.sourceName,
          lastCheckedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Divide work into CONCURRENCY_LIMIT chunks
  const chunks: LibraryItem[][] = Array.from({ length: CONCURRENCY_LIMIT }, () => []);
  itemsToScan.forEach((item, index) => {
    chunks[index % CONCURRENCY_LIMIT].push(item);
  });

  await Promise.all(chunks.map((chunk) => poolWorker(chunk)));

  return result;
}
