import { MangaItem } from "@/shared/sources/source-types";
import { classifyContent } from "@/shared/sources/content-policy";
import { extendCatalogEvidence } from "./catalog-evidence";
import { compareExternalWorkIds } from "./external-work-ids";
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
  isNsfw?: boolean;
  contentRating?: MangaItem["contentRating"];
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
export interface CanonicalSearchOptions {
  /** Preserve the legacy heuristic mode for callers that explicitly use it. */
  mergePolicy?: "heuristic" | "verified-only";
  /** Indexed exact provider references from CONFIRMED canonical provenance. */
  verifiedIndex?: ReadonlyMap<string, string>;
}

/** Stable catalog identity. Display titles are not work IDs. */
export function verifiedCatalogKey(
  sourceId: string,
  mangaId: string,
  verifiedIndex?: ReadonlyMap<string, string>,
): string {
  const ref = JSON.stringify([sourceId, mangaId]);
  const verified = verifiedIndex?.get(ref);
  return verified ? `verified:${verified}` : `source:${sourceId}:${mangaId}`;
}

/** Live metadata takes precedence over cache. Legacy title keys cannot
 * collapse independent provider records. This never mutates stored data.
 */
export interface CatalogSearchRow {
  canonicalKey: string;
  sourceId: string;
  manga: MangaItem & { sourceId?: string; sourceBindings?: SourceBinding[] };
  sourceBindings?: SourceBinding[];
}

function catalogRowBindings(row: CatalogSearchRow): SourceBinding[] {
  return row.sourceBindings?.length ? row.sourceBindings : [{
    sourceId: row.sourceId,
    mangaId: row.manga.id,
    title: row.manga.title,
    coverUrl: row.manga.coverUrl,
    format: row.manga.format,
    isNsfw: row.manga.isNsfw,
    contentRating: row.manga.contentRating,
  }];
}

function refKey(binding: { sourceId: string; mangaId: string }): string {
  return JSON.stringify([binding.sourceId, binding.mangaId]);
}

export function reconcileCatalogRows(
  live: readonly CatalogSearchRow[],
  cached: readonly CatalogSearchRow[],
  verifiedIndex: ReadonlyMap<string, string> = new Map(),
): CatalogSearchRow[] {
  verifiedIndex = extendCatalogEvidence([...live,...cached].filter(row=>(row.sourceBindings?.length??0)<=1),verifiedIndex);
  const keys = new Set<string>();
  const output: CatalogSearchRow[] = [];
  for (const row of [...live, ...cached]) {
    const primaryRef = refKey({ sourceId: row.sourceId, mangaId: row.manga.id });
    const bindings = catalogRowBindings(row);
    const verified = verifiedIndex.get(primaryRef);
    const match = verified ? output.findIndex(existing => {
      if (verifiedIndex.get(refKey({ sourceId: existing.sourceId, mangaId: existing.manga.id })) !== verified) return false;
      if (compareExternalWorkIds(existing.manga.externalWorkIds,row.manga.externalWorkIds)==="conflict") return false;
      const existingSafety = classifyContent(existing.manga);
      const rowSafety = classifyContent(row.manga);
      if ((existingSafety === "NSFW") !== (rowSafety === "NSFW")) return false;
      if (existing.manga.format && row.manga.format &&
          normalizeTitle(existing.manga.format) !== normalizeTitle(row.manga.format)) return false;
      // An ambiguous same-provider edition is not an interchangeable binding.
      const existingBindings = catalogRowBindings(existing);
      return !bindings.some(binding => existingBindings.some(previous =>
        previous.sourceId === binding.sourceId && previous.mangaId !== binding.mangaId
      ));
    }) : -1;
    if (match >= 0) {
      const existing = output[match];
      const merged = new Map(catalogRowBindings(existing).map(binding => [refKey(binding), binding]));
      for (const binding of bindings) {
        const key = refKey(binding);
        if (verifiedIndex.get(key) === verified && !merged.has(key)) merged.set(key, binding);
      }
      const sourceBindings = [...merged.values()];
      output[match] = {
        ...existing,
        sourceBindings,
        manga: {
          ...existing.manga,
          sourceBindings,
          ...(verified?.startsWith("tracker:") && sourceBindings.length > 1
            ? { verifiedCatalogIdentity: { workId: verified, refs: sourceBindings.map(({ sourceId, mangaId }) => ({ sourceId, mangaId })) } }
            : {}),
        },
      };
      continue;
    }
    if (output.some(existing => catalogRowBindings(existing).some(binding => refKey(binding) === primaryRef))) continue;
    const canonicalKey = keys.has(row.canonicalKey)
      ? `${row.canonicalKey}:source:${primaryRef}`
      : row.canonicalKey;
    keys.add(canonicalKey);
    output.push(canonicalKey === row.canonicalKey ? row : { ...row, canonicalKey });
  }
  return output;
}

export function clusterCanonicalResults(
  items: Array<{ manga: MangaItem; sourceId: string }>,
  options: CanonicalSearchOptions = {},
): CanonicalSearchResult[] {
  if (options.mergePolicy === "verified-only") options = {...options,verifiedIndex:extendCatalogEvidence(items,options.verifiedIndex)};
  const clusters: CanonicalSearchResult[] = [];
  const seenSourceReferences = new Set<string>();

  for (const { manga, sourceId } of items) {
    if (!manga || !manga.id || !manga.title) continue;
    // Repeated rows of the same provider item are not independent works.
    const sourceReference = JSON.stringify([sourceId, manga.id]);
    if (seenSourceReferences.has(sourceReference)) continue;
    seenSourceReferences.add(sourceReference);

    const candidateBinding: SourceBinding = {
      sourceId,
      mangaId: manga.id,
      title: manga.title,
      coverUrl: manga.coverUrl,
      latestChapter: manga.latestChapter,
      language: manga.language ?? (sourceId === "mangadex" ? "id" : undefined),
      format: manga.format,
      score: manga.score,
      ...(manga.isNsfw !== undefined ? { isNsfw: manga.isNsfw } : {}),
      ...(manga.contentRating !== undefined ? { contentRating: manga.contentRating } : {}),
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

    for (const cluster of clusters) {
      // Avoid binding the same source multiple times to one cluster
      if (cluster.sourceBindings.some((b) => b.sourceId === sourceId)) {
        continue;
      }

      const clusterPrimary = cluster.primaryResult;
      if (compareExternalWorkIds(manga.externalWorkIds,clusterPrimary.externalWorkIds)==="conflict") continue;
      // Do not let a known adult item borrow an otherwise safe cover/card
      // through heuristic cross-provider title matching.
      const leftSafety = classifyContent(manga);
      const rightSafety = classifyContent(clusterPrimary);
      if ((leftSafety === "SAFE" && rightSafety === "NSFW") ||
          (leftSafety === "NSFW" && rightSafety === "SAFE")) continue;
      // Matching title/author is insufficient when known media types conflict:
      // a novel and a manga adaptation must remain distinct catalog entries.
      if (
        manga.format &&
        clusterPrimary.format &&
        normalizeTitle(manga.format) !== normalizeTitle(clusterPrimary.format)
      ) {
        continue;
      }
      if (options.mergePolicy === "verified-only") {
        const verifiedKey = options.verifiedIndex?.get(sourceReference);
        if (verifiedKey && cluster.sourceBindings.some(ref =>
          options.verifiedIndex?.get(refKey(ref)) === verifiedKey
        )) {
          matchedCluster = cluster;
          break;
        }
        continue;
      }
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

      if (match.confidence === "HIGH_CONFIDENCE") {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.sourceBindings.push(candidateBinding);
      matchedCluster.primaryResult.sourceBindings = matchedCluster.sourceBindings;
      // Confidence describes an observed cross-provider identity match,
      // not merely the presence of a single provider result.
      const identity = options.verifiedIndex?.get(sourceReference);
      if (options.mergePolicy === "verified-only" && identity?.startsWith("tracker:")) {
        matchedCluster.primaryResult.verifiedCatalogIdentity = {
          workId: identity,
          refs: matchedCluster.sourceBindings.map(({ sourceId, mangaId }) => ({ sourceId, mangaId })),
        };
      }
      matchedCluster.matchConfidence = options.mergePolicy === "verified-only" && !identity?.startsWith("tracker:")
        ? "CONFIRMED" : "HIGH_CONFIDENCE";
    } else {
      const normalizedTitle = normalizeTitle(manga.title) || `${sourceId}-${manga.id}`;
      const normalizedAuthor = normalizeTitle(manga.author || "");
      const baseKey = options.mergePolicy === "verified-only"
        ? verifiedCatalogKey(sourceId, manga.id, options.verifiedIndex)
        : normalizedAuthor
          ? `canonical:${normalizedTitle}:author:${normalizedAuthor}`
          : `canonical:${normalizedTitle}`;
      const canonicalKey = clusters.some((cluster) => cluster.canonicalKey === baseKey)
        ? `${baseKey}:source:${sourceId}:${manga.id}`
        : baseKey;
      const primaryWithSource = {
        ...manga,
        sourceId,
        sourceBindings: [candidateBinding],
      };
      clusters.push({
        canonicalKey,
        primaryResult: primaryWithSource,
        sourceBindings: [candidateBinding],
        matchConfidence: "NO_MATCH",
      });
    }
  }

  return clusters;
}

/**
 * Convenience helper to cluster from a resultsBySource map (used by search API).
 */
export function deduplicateResultsBySource(
  resultsBySource: Record<string, { results: MangaItem[]; error?: string }>,
  options: CanonicalSearchOptions = {},
): CanonicalSearchResult[] {
  // Flatten in source-interleaved order for balanced multi-source representation
  const flattened: Array<{ manga: MangaItem; sourceId: string }> = [];
  const sourceEntries = Object.entries(resultsBySource).filter(([, data]) => !data.error && Array.isArray(data.results));

  let maxLen = 0;
  sourceEntries.forEach(([, data]) => {
    if (data.results.length > maxLen) maxLen = data.results.length;
  });

  for (let i = 0; i < maxLen; i++) {
    for (const [sourceId, data] of sourceEntries) {
      if (data.results[i]) {
        flattened.push({ manga: data.results[i], sourceId });
      }
    }
  }

  return clusterCanonicalResults(flattened, options);
}

/**
 * A cached search-intelligence candidate may have inherited heuristic source
 * links from an older index. Only keep alternates with the same verified work
 * identity as the selected source; otherwise expose that one source alone.
 */
export function filterVerifiedSourceBindings<T extends { sourceId: string; mangaId: string }>(
  candidates: readonly T[],
  selected: T,
  verifiedIndex: ReadonlyMap<string, string>,
): T[] {
  const selectedRef = JSON.stringify([selected.sourceId, selected.mangaId]);
  const verifiedWork = verifiedIndex.get(selectedRef);
  const seen = new Set<string>();
  const safe = [selected, ...candidates].filter(candidate => {
    const ref = JSON.stringify([candidate.sourceId, candidate.mangaId]);
    if (seen.has(ref)) return false;
    seen.add(ref);
    return ref === selectedRef || Boolean(verifiedWork && verifiedIndex.get(ref) === verifiedWork);
  });
  return safe;
}
