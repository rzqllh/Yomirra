import type { FilterList, SourceFilter } from "@/shared/sources/source-types";

export interface MergedFilter {
  id: string;
  label: string;
  supportedBy: string[];
}

export interface MergedFilterList {
  genres: MergedFilter[];
  formats: MergedFilter[];
  statuses: MergedFilter[];
  sorts: MergedFilter[];
}

/**
 * Merges filters from multiple sources, deduplicating by ID (canonical value).
 * Tracks which sources support each filter.
 */
export function mergeFilters(sourceFilters: { sourceId: string; filters: FilterList }[]): MergedFilterList {
  const genresMap = new Map<string, MergedFilter>();
  const formatsMap = new Map<string, MergedFilter>();
  const statusesMap = new Map<string, MergedFilter>();
  const sortsMap = new Map<string, MergedFilter>();

  const processCategory = (map: Map<string, MergedFilter>, items: SourceFilter[] | undefined, sourceId: string) => {
    if (!items) return;
    for (const item of items) {
      const canonicalId = item.id.toLowerCase();
      if (map.has(canonicalId)) {
        const existing = map.get(canonicalId)!;
        if (!existing.supportedBy.includes(sourceId)) {
          existing.supportedBy.push(sourceId);
        }
      } else {
        map.set(canonicalId, {
          id: item.id,
          label: item.name,
          supportedBy: [sourceId]
        });
      }
    }
  };

  for (const { sourceId, filters } of sourceFilters) {
    processCategory(genresMap, filters.genres, sourceId);
    processCategory(formatsMap, filters.formats, sourceId);
    processCategory(statusesMap, filters.statuses, sourceId);
    processCategory(sortsMap, filters.sorts, sourceId);
  }

  const toArray = (map: Map<string, MergedFilter>) => Array.from(map.values());

  const genres = toArray(genresMap).sort((a, b) => a.label.localeCompare(b.label));
  const formats = toArray(formatsMap);
  const statuses = toArray(statusesMap);
  const sorts = toArray(sortsMap);

  return { genres, formats, statuses, sorts };
}

/**
 * Given current selected filters and the newly merged filter capabilities,
 * return a new set of selected filters containing ONLY those supported by at least one active source.
 */
export function pruneUnsupportedFilters(
  currentSelected: string[],
  mergedAvailable: MergedFilter[]
): string[] {
  const availableIds = new Set(mergedAvailable.map(f => f.id.toLowerCase()));
  return currentSelected.filter(id => availableIds.has(id.toLowerCase()));
}

/**
 * Filter payload builder.
 * Returns only filters supported by the specific source.
 */
export function buildPayloadForSource(
  sourceId: string,
  mergedFilters: MergedFilterList,
  activeFilters: { genres: string[], formats: string[], status: string, sort: string }
): Record<string, string | string[]> {
  const payload: Record<string, string | string[]> = {};

  // Helper to check if a filter value is supported by this source
  const isSupported = (category: MergedFilter[], value: string) => {
    if (!value) return false;
    const lowerVal = value.toLowerCase();
    const found = category.find(c => c.id.toLowerCase() === lowerVal);
    return found ? found.supportedBy.includes(sourceId) : false;
  };

  const validGenres = activeFilters.genres.filter(g => isSupported(mergedFilters.genres, g));
  if (validGenres.length > 0) payload["genre[]"] = validGenres;

  const validFormats = activeFilters.formats.filter(f => isSupported(mergedFilters.formats, f));
  if (validFormats.length > 0) payload["format[]"] = validFormats;

  if (isSupported(mergedFilters.statuses, activeFilters.status)) {
    payload["status"] = activeFilters.status;
  }

  // Sort is usually a special case, if it's supported we pass it
  if (isSupported(mergedFilters.sorts, activeFilters.sort)) {
    payload["sort"] = activeFilters.sort;
  }

  return payload;
}
