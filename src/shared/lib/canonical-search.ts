import { MangaItem } from "@/shared/sources/source-types";
import {
  matchTitles,
  matchAgainstAlternates,
  normalizeTitle,
  type MatchConfidence,
  type TitleCandidate,
} from "./title-matcher";

export interface SourceBinding {
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl?: string;
  latestChapter?: string;
  language?: string;
  format?: string;
  score?: number | string;
}

export interface CanonicalSearchResult {
  canonicalKey: string;
  primaryResult: MangaItem & { sourceId: string; sourceBindings?: SourceBinding[] };
  sourceBindings: SourceBinding[];
  matchConfidence: MatchConfidence;
}

/**
 * Clusters flat multi-source search items into deduplicated canonical results.
 * Deduplication runs purely in-memory on normalized results after per-source calls return.
 * 
 * Rules:
 * - Only merges on HIGH_CONFIDENCE (or CONFIRMED).
 * - AMBIGUOUS matches are NEVER merged automatically; they remain separate items.
 * - Same title with conflicting known authors is never merged.
 * - MangaDex language binding is stored as metadata on the binding, not a separate source.
 * - Stable, deterministic ordering is preserved.
 */
export function clusterCanonicalResults(
  items: Array<{ manga: MangaItem; sourceId: string }>
): CanonicalSearchResult[] {
  const clusters: CanonicalSearchResult[] = [];

  for (const { manga, sourceId } of items) {
    if (!manga || !manga.id || !manga.title) continue;

    const candidateBinding: SourceBinding = {
      sourceId,
      mangaId: manga.id,
      title: manga.title,
      coverUrl: manga.coverUrl,
      latestChapter: manga.latestChapter,
      language: manga.language ?? (sourceId === "mangadex" ? "id" : undefined),
      format: manga.format,
      score: manga.score,
    };

    const candidateForMatching: TitleCandidate = {
      sourceId,
      mangaId: manga.id,
      title: manga.title,
      alternativeTitles: [manga.originalTitle, ...(manga.alternativeTitles ?? [])].filter(Boolean) as string[],
      author: manga.author,
      coverUrl: manga.coverUrl,
    };

    let matchedCluster: CanonicalSearchResult | null = null;
    let highestConfidence: MatchConfidence = "NO_MATCH";

    for (const cluster of clusters) {
      // Avoid binding the same source multiple times to one cluster
      if (cluster.sourceBindings.some((b) => b.sourceId === sourceId)) {
        continue;
      }

      const clusterPrimary = cluster.primaryResult;
      const primaryCandidate: TitleCandidate = {
        sourceId: clusterPrimary.sourceId,
        mangaId: clusterPrimary.id,
        title: clusterPrimary.title,
        alternativeTitles: [clusterPrimary.originalTitle, ...(clusterPrimary.alternativeTitles ?? [])].filter(Boolean) as string[],
        author: clusterPrimary.author,
      };

      let match = matchTitles(
        candidateForMatching.title,
        primaryCandidate.title,
        candidateForMatching.author,
        primaryCandidate.author
      );

      if (
        match.confidence !== "HIGH_CONFIDENCE" &&
        ((candidateForMatching.alternativeTitles && candidateForMatching.alternativeTitles.length > 0) ||
          (primaryCandidate.alternativeTitles && primaryCandidate.alternativeTitles.length > 0))
      ) {
        const altMatch1 = matchAgainstAlternates(
          candidateForMatching.title,
          primaryCandidate,
          candidateForMatching.author
        );
        const altMatch2 = matchAgainstAlternates(
          primaryCandidate.title,
          candidateForMatching,
          primaryCandidate.author
        );
        const bestAlt = altMatch1.score >= altMatch2.score ? altMatch1 : altMatch2;
        if (bestAlt.confidence === "HIGH_CONFIDENCE") {
          match = bestAlt;
        }
      }

      // Strict merge gate: only merge when HIGH_CONFIDENCE
      if (match.confidence === "HIGH_CONFIDENCE") {
        matchedCluster = cluster;
        highestConfidence = "HIGH_CONFIDENCE";
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.sourceBindings.push(candidateBinding);
      matchedCluster.primaryResult.sourceBindings = matchedCluster.sourceBindings;
    } else {
      const canonicalKey = `canonical:${normalizeTitle(manga.title) || `${sourceId}-${manga.id}`}`;
      const primaryWithSource = {
        ...manga,
        sourceId,
        sourceBindings: [candidateBinding],
      };
      clusters.push({
        canonicalKey,
        primaryResult: primaryWithSource,
        sourceBindings: [candidateBinding],
        matchConfidence: highestConfidence === "NO_MATCH" ? "HIGH_CONFIDENCE" : highestConfidence,
      });
    }
  }

  return clusters;
}

/**
 * Convenience helper to cluster from a resultsBySource map (used by search API).
 */
export function deduplicateResultsBySource(
  resultsBySource: Record<string, { results: MangaItem[]; error?: string }>
): CanonicalSearchResult[] {
  // Flatten in source-interleaved order for balanced multi-source representation
  const flattened: Array<{ manga: MangaItem; sourceId: string }> = [];
  const sourceEntries = Object.entries(resultsBySource).filter(([_, data]) => !data.error && Array.isArray(data.results));

  let maxLen = 0;
  sourceEntries.forEach(([_, data]) => {
    if (data.results.length > maxLen) maxLen = data.results.length;
  });

  for (let i = 0; i < maxLen; i++) {
    for (const [sourceId, data] of sourceEntries) {
      if (data.results[i]) {
        flattened.push({ manga: data.results[i], sourceId });
      }
    }
  }

  return clusterCanonicalResults(flattened);
}
