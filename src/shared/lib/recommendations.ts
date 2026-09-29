import type { MangaItem } from "@/shared/sources/source-types";
import { normalizeTitle } from "@/shared/lib/title-matcher";

export interface RecommendationCandidate {
  sourceId: string;
  manga: MangaItem;
}

interface LibrarySignal {
  sourceId: string;
  title: string;
  format?: string;
  userRating?: number;
}

interface HistorySignal {
  sourceId: string;
  mangaId: string;
  mangaTitle: string;
  readAt: number;
  savedTitleId?: string;
}

export interface RecommendationProfile {
  seenTitles: Set<string>;
  sourceWeights: Map<string, number>;
  formatWeights: Map<string, number>;
}

function addWeight(map: Map<string, number>, key: string | undefined, amount: number) {
  if (!key) return;
  const normalized = key.trim().toLowerCase();
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) ?? 0) + amount);
}

export function buildRecommendationProfile(
  libraryItems: LibrarySignal[],
  historyItems: HistorySignal[]
): RecommendationProfile {
  const seenTitles = new Set<string>();
  const sourceWeights = new Map<string, number>();
  const formatWeights = new Map<string, number>();

  for (const item of libraryItems) {
    const normalizedTitle = normalizeTitle(item.title);
    if (normalizedTitle) seenTitles.add(normalizedTitle);

    const rating = Math.max(0, Math.min(10, item.userRating ?? 0));
    const weight = 1 + rating / 10;
    addWeight(sourceWeights, item.sourceId, weight);
    addWeight(formatWeights, item.format, weight);
  }

  const latestPerTitle = new Map<string, HistorySignal>();
  for (const item of historyItems) {
    const key = item.savedTitleId ?? `${item.sourceId}::${item.mangaId}`;
    const current = latestPerTitle.get(key);
    if (!current || item.readAt > current.readAt) latestPerTitle.set(key, item);
  }

  const recent = Array.from(latestPerTitle.values())
    .sort((a, b) => b.readAt - a.readAt)
    .slice(0, 20);

  recent.forEach((item, index) => {
    const normalizedTitle = normalizeTitle(item.mangaTitle);
    if (normalizedTitle) seenTitles.add(normalizedTitle);

    // ponytail: recent unique titles get a small source preference signal.
    addWeight(sourceWeights, item.sourceId, 1 - index / 40);
  });

  return { seenTitles, sourceWeights, formatWeights };
}

function relativeWeight(map: Map<string, number>, key: string | undefined): number {
  if (!key || map.size === 0) return 0;
  const normalized = key.trim().toLowerCase();
  const value = map.get(normalized) ?? 0;
  if (value <= 0) return 0;
  const max = Math.max(...map.values());
  return max > 0 ? value / max : 0;
}

export function rankRecommendationCandidates<T extends RecommendationCandidate>(
  candidates: T[],
  options: {
    currentTitle: string;
    currentSourceId: string;
    currentFormat?: string;
    currentStatus?: string;
    profile: RecommendationProfile;
  }
): T[] {
  const currentTitle = normalizeTitle(options.currentTitle);
  const currentFormat = options.currentFormat?.trim().toLowerCase();
  const currentStatus = options.currentStatus?.trim().toLowerCase();

  return candidates
    .map((candidate, index) => {
      const normalizedTitle = normalizeTitle(candidate.manga.title);
      if (!normalizedTitle || normalizedTitle === currentTitle) return null;
      if (options.profile.seenTitles.has(normalizedTitle)) return null;

      const format = candidate.manga.format?.trim().toLowerCase();
      const status = candidate.manga.status?.trim().toLowerCase();
      const rating = typeof candidate.manga.score === "number"
        ? Math.max(0, Math.min(10, candidate.manga.score))
        : 0;

      let score = 0;
      if (candidate.sourceId === options.currentSourceId) score += 3;
      if (currentFormat && format === currentFormat) score += 4;
      if (currentStatus && status === currentStatus) score += 0.5;

      score += relativeWeight(options.profile.sourceWeights, candidate.sourceId) * 2;
      score += relativeWeight(options.profile.formatWeights, format) * 2;
      score += (rating / 10) * 1.5;

      return { candidate, score, index };
    })
    .filter((entry): entry is { candidate: T; score: number; index: number } => entry !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.candidate);
}
