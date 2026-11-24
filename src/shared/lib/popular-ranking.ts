import type { MangaItem } from "@/shared/sources/source-types";
import type { SourceBinding } from "@/shared/lib/canonical-search";
import { normalizeTitle } from "@/shared/lib/title-matcher";
import { canonicalSourceKey } from "./canonical-identity";
import { getReviewedCatalogIndex } from "./reviewed-catalog";
import { classifyContent } from "@/shared/sources/content-policy";

const RECIPROCAL_RANK_K = 60;

export interface PopularSourceFeed {
  sourceId: string;
  sourceName: string;
  mangas: MangaItem[];
  loadFailed?: boolean;
}

export interface AggregatedPopularItem {
  manga: MangaItem;
  sourceId: string;
  sourceName: string;
  sourceBindings: SourceBinding[];
  reciprocalRankScore: number;
  contributingSources: number;
  bestNativeRank: number;
}

type WorkingCluster = {
  identity: string;
  representative: MangaItem;
  representativeSourceId: string;
  representativeSourceName: string;
  bestNativeRank: number;
  score: number;
  sourceIds: Set<string>;
  bindings: SourceBinding[];
};

function toBinding(sourceId: string, manga: MangaItem): SourceBinding {
  return {
    sourceId,
    mangaId: manga.id,
    title: manga.title,
    coverUrl: manga.coverUrl,
    latestChapter: manga.latestChapter,
    language: manga.language,
    format: manga.format,
    score: manga.score,
    contentRating: manga.contentRating,
    isNsfw: manga.isNsfw,
  };
}

/**
 * Aggregates source-native rankings without comparing provider-specific raw
 * popularity metrics. Only exact source identity or reviewed work evidence
 * can merge. Each eligible provider contributes at most once.
 */
export function aggregatePopularFeeds(
  feeds: PopularSourceFeed[],
  verifiedIndex: ReadonlyMap<string, string> = getReviewedCatalogIndex(),
): AggregatedPopularItem[] {
  const clusters: WorkingCluster[] = [];

  for (const feed of feeds) {
    if (feed.loadFailed) continue;
    feed.mangas.forEach((manga, index) => {
      if (!manga?.id || !manga?.title) return;
      const nativeRank = index + 1;
      const ref = canonicalSourceKey(feed.sourceId, manga.id);
      const identity = verifiedIndex.get(ref) ?? ref;

      let cluster = clusters.find(candidate =>
        candidate.identity === identity &&
        !candidate.bindings.some(binding => binding.sourceId === feed.sourceId && binding.mangaId !== manga.id) &&
        ((classifyContent(candidate.representative) === "NSFW") === (classifyContent(manga) === "NSFW")) &&
        (!candidate.representative.format || !manga.format ||
          normalizeTitle(candidate.representative.format) === normalizeTitle(manga.format))
      );

      if (!cluster) {
        cluster = {
          identity,
          representative: manga,
          representativeSourceId: feed.sourceId,
          representativeSourceName: feed.sourceName,
          bestNativeRank: nativeRank,
          score: 0,
          sourceIds: new Set<string>(),
          bindings: [],
        };
        clusters.push(cluster);
      } else {
         if (
          nativeRank < cluster.bestNativeRank ||
          (nativeRank === cluster.bestNativeRank &&
            feed.sourceId.localeCompare(cluster.representativeSourceId) < 0)
        ) {
          cluster.representative = manga;
          cluster.representativeSourceId = feed.sourceId;
          cluster.representativeSourceName = feed.sourceName;
          cluster.bestNativeRank = nativeRank;
        }
      }

      const bindingKey = `${feed.sourceId}::${manga.id}`;
      if (
        !cluster.bindings.some(
          (binding) => `${binding.sourceId}::${binding.mangaId}` === bindingKey
        )
      ) {
        cluster.bindings.push(toBinding(feed.sourceId, manga));
      }

      // One title contributes at most once per source even if an upstream feed
      // accidentally repeats it.
      if (!cluster.sourceIds.has(feed.sourceId)) {
        cluster.sourceIds.add(feed.sourceId);
        cluster.score += 1 / (RECIPROCAL_RANK_K + nativeRank);
      }
    });
  }

  return clusters
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.bestNativeRank !== b.bestNativeRank) {
        return a.bestNativeRank - b.bestNativeRank;
      }
      const titleA = normalizeTitle(a.representative.title);
      const titleB = normalizeTitle(b.representative.title);
      if (titleA !== titleB) return titleA.localeCompare(titleB);
      return a.representativeSourceId.localeCompare(b.representativeSourceId);
    })
    .map((cluster, index) => ({
      manga: {
        ...cluster.representative,
        rank: index + 1,
      },
      sourceId: cluster.representativeSourceId,
      sourceName: cluster.representativeSourceName,
      sourceBindings: cluster.bindings,
      reciprocalRankScore: cluster.score,
      contributingSources: cluster.sourceIds.size,
      bestNativeRank: cluster.bestNativeRank,
    }));
}
