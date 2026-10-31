import { isContentVisible, isSourceContentVisible } from "@/shared/sources/content-policy";
import { isSearchSourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import type { SearchCatalogCandidate } from "@/shared/lib/search-intelligence";
import type { SourceMetadata } from "@/shared/sources/source-types";

export function filterCatalogContent<T extends SearchCatalogCandidate>(records: T[], sources: SourceMetadata[], hideNsfw = true): T[] {
  const eligible = new Map(sources.filter((source) => isSearchSourceSystemEligible(source) && isSourceContentVisible(source, hideNsfw)).map((source) => [source.id, source]));
  return records.filter((record) => eligible.has(record.sourceId) && isContentVisible(record, hideNsfw) &&
    // Old mixed-source catalog records have no rating evidence; do not infer safety from title.
    (!hideNsfw || record.sourceId !== "mangadex" || record.contentRating === "safe"))
    .map((record) => ({ ...record, sourceBindings: record.sourceBindings?.filter((binding) => eligible.has(binding.sourceId) &&
      (!hideNsfw || binding.sourceId !== "mangadex" || (record.sourceId === "mangadex" && record.contentRating === "safe"))) }));
}
