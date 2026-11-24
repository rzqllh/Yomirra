import { normalizeTitle } from "./title-matcher";
import { reconcileCatalogRows, type CatalogSearchRow } from "./canonical-search";
import { classifyContent } from "@/shared/sources/content-policy";

export type ComicFormat = "manga" | "manhwa" | "manhua";
export interface MetadataWork {
  provider: "mangabaka";
  externalId: number;
  title: string;
  aliases: string[];
  format: ComicFormat;
  contentRating: "safe";
}

export function comicFormat(value?: string): ComicFormat | undefined {
  const format = value?.trim().toLowerCase();
  return format === "manga" || format === "manhwa" || format === "manhua" ? format : undefined;
}

function aliases(values: Array<string | undefined>): Set<string> {
  return new Set(values.map(normalizeTitle).filter(Boolean));
}

/** Read-only, reversible discovery projection. This is not an authoritative
 * global work ID, nor permission to mutate bookmarks or chapter cursors.
 * Require exact catalog aliases, a known compatible comic type, unique work
 * match, and no conflicting provider editions. No fuzzy title-only merge.
 */
export function projectMetadataCatalogRows(
  rows: readonly CatalogSearchRow[],
  works: readonly MetadataWork[],
): CatalogSearchRow[] {
  if (!works.length) return [...rows];
  const index = new Map<string, string>();
  const byIdentity = new Map<string, MetadataWork>();
  const rowMatches = new Map<string, MetadataWork>();
  for (const row of rows) {
    const format = comicFormat(row.manga.format);
    if (!format || classifyContent(row.manga) === "NSFW") continue;
    const names = aliases([row.manga.title, row.manga.originalTitle, ...(row.manga.alternativeTitles ?? [])]);
    const candidates = works.filter(work => work.format === format && work.contentRating === "safe" &&
      [...aliases([work.title, ...work.aliases])].some(name => names.has(name)));
    if (candidates.length !== 1) continue;
    const work = candidates[0];
    const ref = JSON.stringify([row.sourceId, row.manga.id]);
    rowMatches.set(ref, work);
  }
  // Never use a metadata work to bridge distinct editions in the same provider.
  // Also retain existing verified multi-source clusters without changing their identity.
  const groups = new Map<string, CatalogSearchRow[]>();
  for (const row of rows) {
    const work = rowMatches.get(JSON.stringify([row.sourceId, row.manga.id]));
    if (!work || (row.sourceBindings?.length ?? 0) > 1) continue;
    const identity = `metadata:mangabaka:${work.externalId}`;
    const group = groups.get(identity) ?? [];
    group.push(row);
    groups.set(identity, group);
    byIdentity.set(identity, work);
  }
  for (const [identity, group] of groups) {
    if (new Set(group.map(row => row.sourceId)).size !== group.length || group.length < 2) continue;
    // Known provider author disagreements are a veto, even with a shared alias.
    const authors = aliases(group.map(row => row.manga.author));
    if (authors.size > 1) continue;
    for (const row of group) index.set(JSON.stringify([row.sourceId, row.manga.id]), identity);
  }
  const projected = reconcileCatalogRows(rows, [], index);
  return projected.map(row => {
    const identity = index.get(JSON.stringify([row.sourceId, row.manga.id]));
    const work = identity && byIdentity.get(identity);
    if (!identity || !work || (row.sourceBindings?.length ?? 0) < 2) return row;
    return {
      ...row,
      canonicalKey: identity,
      manga: {
        ...row.manga,
        title: work.title,
        alternativeTitles: [...new Set([row.manga.title, ...(row.manga.alternativeTitles ?? []), ...work.aliases])],
      },
    };
  });
}
