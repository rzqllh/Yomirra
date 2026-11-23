import type { MangaItem } from "@/shared/sources/source-types";
import { matchAgainstAlternates, type TitleCandidate } from "@/shared/lib/title-matcher";
import { canonicalSourceKey } from "@/shared/lib/canonical-identity";

export interface HomeFeedManga extends MangaItem {
  sourceId: string;
  sourceName: string;
}

function toTitleCandidate(item: HomeFeedManga): TitleCandidate {
  return {
    sourceId: item.sourceId,
    mangaId: item.id,
    title: item.title,
    alternativeTitles: [
      ...(item.originalTitle ? [item.originalTitle] : []),
      ...(item.alternativeTitles ?? []),
    ],
    author: item.author,
    coverUrl: item.coverUrl,
  };
}

export function isConfidentHomeDuplicate(
  left: HomeFeedManga,
  right: HomeFeedManga
): boolean {
  if (left.sourceId === right.sourceId && left.id === right.id) {
    return true;
  }

  if (!left.author?.trim() || !right.author?.trim()) {
    return false;
  }

  const forward = matchAgainstAlternates(
    left.title,
    toTitleCandidate(right),
    left.author
  );
  const reverse = matchAgainstAlternates(
    right.title,
    toTitleCandidate(left),
    right.author
  );

  return (
    forward.confidence === "HIGH_CONFIDENCE" ||
    reverse.confidence === "HIGH_CONFIDENCE"
  );
}

/**
 * Verified-only production projection: identical source IDs or a common
 * confirmed-work ID may hide a duplicate. A matching author is insufficient.
 */
function isVerifiedHomeDuplicate(
  left: HomeFeedManga, right: HomeFeedManga,
  verifiedIndex: ReadonlyMap<string, string>,
): boolean {
  if (left.sourceId === right.sourceId && left.id === right.id) return true;
  const a = verifiedIndex.get(canonicalSourceKey(left.sourceId, left.id));
  const b = verifiedIndex.get(canonicalSourceKey(right.sourceId, right.id));
  return Boolean(a && b && a === b);
}

function uniqueEligibleItems(
  items: HomeFeedManga[],
  verifiedIndex?: ReadonlyMap<string, string>,
): HomeFeedManga[] {
  const unique: HomeFeedManga[] = [];

  for (const item of items) {
    if (!item.coverUrl || !item.title) continue;
    if (unique.some(existing => verifiedIndex
      ? isVerifiedHomeDuplicate(existing, item, verifiedIndex)
      : isConfidentHomeDuplicate(existing, item)
    )) {
      continue;
    }
    unique.push(item);
  }

  return unique;
}

export function selectSpotlightItems(
  items: HomeFeedManga[],
  limit = 5,
  verifiedIndex?: ReadonlyMap<string, string>,
): HomeFeedManga[] {
  const unique = uniqueEligibleItems(items, verifiedIndex);
  const selected: HomeFeedManga[] = [];
  const selectedSources = new Set<string>();

  for (const item of unique) {
    if (selected.length >= limit) break;
    if (selectedSources.has(item.sourceId)) continue;

    selected.push(item);
    selectedSources.add(item.sourceId);
  }

  if (selected.length >= limit) return selected;

  for (const item of unique) {
    if (selected.length >= limit) break;
    if (selected.includes(item)) continue;
    selected.push(item);
  }

  return selected;
}

export function selectHeroCandidates(
  items: HomeFeedManga[],
  spotlightItems: HomeFeedManga[],
  limit = 15,
  verifiedIndex?: ReadonlyMap<string, string>,
): HomeFeedManga[] {
  const unique = uniqueEligibleItems(items, verifiedIndex);
  const preferred = unique.filter(
    (item) =>
      !spotlightItems.some((spotlight) =>
        verifiedIndex
          ? isVerifiedHomeDuplicate(item, spotlight, verifiedIndex)
          : isConfidentHomeDuplicate(item, spotlight)
      )
  );

  if (preferred.length >= limit) {
    return preferred.slice(0, limit);
  }

  const fallback = unique.filter((item) => !preferred.includes(item));
  return [...preferred, ...fallback].slice(0, limit);
}
