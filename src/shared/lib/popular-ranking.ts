import type { MangaItem } from "@/shared/sources/source-types";
import type { SourceBinding } from "@/shared/lib/canonical-search";
import { normalizeTitle } from "@/shared/lib/title-matcher";

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
  aliases: Set<string>;
  author?: string;
  representative: MangaItem;
  representativeSourceId: string;
  representativeSourceName: string;
  bestNativeRank: number;
  score: number;
  sourceIds: Set<string>;
  bindings: SourceBinding[];
};

function aliasesFor(manga: MangaItem): Set<string> {
  return new Set(
    [
      manga.title,
      manga.originalTitle,
      ...(manga.alternativeTitles || []),
    ]
      .map((title) => normalizeTitle(title))
      .filter(Boolean)
  );
}

function authorsCompatible(a?: string, b?: string): boolean {
  if (!a || !b) return true;
  return normalizeTitle(a) === normalizeTitle(b);
}

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) return true;
  }
  return false;
}

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
  };
}

/**
 * Aggregates source-native rankings without comparing provider-specific raw
 * popularity metrics. Exact normalized title/alias matches may merge, but
 * fuzzy title similarity never does. Each source contributes 1 / (K + rank).
 */
export function aggregatePopularFeeds(
  feeds: PopularSourceFeed[]
): AggregatedPopularItem[] {
  const clusters: WorkingCluster[] = [];

  for (const feed of feeds) {
    feed.mangas.forEach((manga, index) => {
      if (!manga?.id || !manga?.title) return;
      const nativeRank = index + 1;
      const aliases = aliasesFor(manga);
      if (aliases.size === 0) return;

      let cluster = clusters.find(
        (candidate) =>
          intersects(candidate.aliases, aliases) &&
          authorsCompatible(candidate.author, manga.author)
      );

      if (!cluster) {
        cluster = {
          aliases: new Set(aliases),
          author: manga.author,
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
        for (const alias of aliases) cluster.aliases.add(alias);
        if (!cluster.author && manga.author) cluster.author = manga.author;

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
