import { normalizeTitle } from "./title-matcher";
import { reconcileCatalogRows, type CatalogSearchRow } from "./canonical-search";
import { classifyContent } from "@/shared/sources/content-policy";
import type { ExternalWorkIds, MangaItem } from "@/shared/sources/source-types";
import { compareExternalWorkIds, normalizeExternalWorkIds } from "./external-work-ids";

export type ComicFormat = "manga" | "manhwa" | "manhua";
export interface MetadataWork {
  provider: "mangabaka";
  externalId: number;
  title: string;
  aliases: string[];
  format: ComicFormat;
  contentRating: NonNullable<MangaItem["contentRating"]>;
  authors?: string[];
  description?: string;
  externalWorkIds?: ExternalWorkIds;
}

export function comicFormat(value?: string): ComicFormat | undefined {
  const format = value?.trim().toLowerCase();
  return format === "manga" || format === "manhwa" || format === "manhua" ? format : undefined;
}

function aliases(values: Array<string | undefined>): Set<string> {
  return new Set(values.map(normalizeTitle).filter(Boolean));
}

/** Rating can only be inherited after stronger identity evidence than
 * an alias-only discovery candidate. Never downgrade source restrictions. */
export function matchCanonicalMetadata(item: MangaItem, works: readonly MetadataWork[]): MetadataWork | undefined {
  const format = comicFormat(item.format);
  if (!format) return undefined;
  const names = aliases([item.title,item.originalTitle,...(item.alternativeTitles??[])]);
  const author = normalizeTitle(item.author);
  const itemIds=normalizeExternalWorkIds(item.externalWorkIds);
  const trackerKeys=Object.keys(itemIds??{}) as (keyof ExternalWorkIds)[];
  // A partially matching tracker with contradictory IDs or format is a veto,
  // not permission to fall back to a weaker alias-only candidate.
  const linked=works.filter(work=>{
    const ids=normalizeExternalWorkIds(work.externalWorkIds);
    return trackerKeys.some(key=>itemIds?.[key]===ids?.[key]);
  });
  if(linked.length){
    if(linked.length!==1)return undefined;
    const work=linked[0];
    const authorNames=aliases(work.authors??[]);
    if(work.format!==format||compareExternalWorkIds(itemIds,work.externalWorkIds)!=="match"||
       (author&&authorNames.size&&!authorNames.has(author)))return undefined;
    return work;
  }
  const possible=works.filter(work=>work.format===format&&
    [...aliases([work.title,...work.aliases])].some(name=>names.has(name)));
  // Keep ambiguous aliases and known contradictions unresolved.
  if(possible.length!==1)return undefined;
  const work=possible[0];
  if(compareExternalWorkIds(itemIds,work.externalWorkIds)==="conflict")return undefined;
  const authorNames=aliases(work.authors??[]);
  return author&&authorNames.has(author)?work:undefined;
}

const ratingOrder = {unknown:0,safe:1,suggestive:2,erotica:3,pornographic:4} as const;
export function inheritCanonicalRating<T extends MangaItem>(item:T,work:MetadataWork|undefined):T {
  if (!work || work.contentRating === "unknown") return item;
  const original = item.contentRating && Object.hasOwn(ratingOrder,item.contentRating) ? item.contentRating : "unknown";
  const rating = ratingOrder[original] >= ratingOrder[work.contentRating] ? original : work.contentRating;
  return {...item,contentRating:rating,isNsfw:item.isNsfw===true || ratingOrder[rating]>ratingOrder.safe};
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
  rows = rows.map(row => {
    const manga=inheritCanonicalRating(row.manga,matchCanonicalMetadata(row.manga,works));
    return {...row,manga,sourceBindings:row.sourceBindings?.map(binding=>
      binding.sourceId===row.sourceId && binding.mangaId===row.manga.id ?
      {...binding,contentRating:classifyContent(binding)==="NSFW"?binding.contentRating:manga.contentRating,isNsfw:binding.isNsfw===true||manga.isNsfw===true} : binding)};
  });
  const index = new Map<string, string>();
  const byIdentity = new Map<string, MetadataWork>();
  const rowMatches = new Map<string, MetadataWork>();
  for (const row of rows) {
    if (classifyContent(row.manga) === "NSFW") continue;
    const work = matchCanonicalMetadata(row.manga,works);
    if (!work || work.contentRating !== "safe") continue;
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
    if (group.some((row, i) => group.slice(i + 1).some(other => compareExternalWorkIds(row.manga.externalWorkIds, other.manga.externalWorkIds) === "conflict"))) continue;
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

/** Metadata-only cards are discovery, not source bindings or reading access. */
export function metadataOnlyWorks(rows:readonly CatalogSearchRow[],works:readonly MetadataWork[]):MetadataWork[]{
  const matched=new Set(rows.flatMap(row=>{
    const work=matchCanonicalMetadata(row.manga,works);
    return work?[work.externalId]:[];
  }));
  const seen=new Set<number>();
  return works.filter(work=>{
    if(work.contentRating!=="safe"||matched.has(work.externalId)||seen.has(work.externalId))return false;
    seen.add(work.externalId);return true;
  }).slice(0,20);
}
