import { isContentVisible, isSourceContentVisible } from "@/shared/sources/content-policy";
import { isSearchSourceSystemEligible } from "@/shared/sources/discovery-source-policy";
import type { SearchCatalogCandidate } from "@/shared/lib/search-intelligence";
import type { SourceMetadata } from "@/shared/sources/source-types";

export function filterCatalogContent<T extends SearchCatalogCandidate>(records: T[], sources: SourceMetadata[], hideNsfw = true): T[] {
  const eligible = new Map(sources
    .filter((source) => isSearchSourceSystemEligible(source) && isSourceContentVisible(source, hideNsfw))
    .map((source) => [source.id, source]));

  // UNKNOWN is not SAFE: consumers must show a warning and mask unverified covers.
  // Source eligibility still excludes confirmed adult-only providers.
  return records
    .filter((record) => eligible.has(record.sourceId) && isContentVisible(record, hideNsfw))
    .map((record) => ({
      ...record,
      sourceBindings: record.sourceBindings?.filter((binding) => eligible.has(binding.sourceId)),
    }));
}
