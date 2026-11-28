import type { FilterList, SourceFilter } from "@/shared/sources/source-types";
import {
  canonicalizeFilterValue,
  resolveSearchTag,
  type SearchTagCategory,
} from "@/shared/lib/search-intelligence";
import { normalizeTitle } from "@/shared/lib/title-matcher";

const CATCH_ALL_TOKENS = new Set([
  "all",
  "alltypes",
  "alltype",
  "allstatus",
  "semua",
  "semuatipe",
  "semuastatus",
]);

function isCatchAllOption(id: string, label: string): boolean {
  const normId = normalizeTitle(id).replace(/\s+/g, "");
  const normLabel = normalizeTitle(label).replace(/\s+/g, "");
  return CATCH_ALL_TOKENS.has(normId) || CATCH_ALL_TOKENS.has(normLabel);
}

const SORT_ALIASES = [
  { id: "popular", label: "Populer", terms: ["popular", "populer", "popularity"] },
  { id: "latest", label: "Terbaru", terms: ["latest update", "latest", "update", "terbaru"] },
  { id: "rating", label: "Rating Tertinggi", terms: ["highest rating", "rating tertinggi", "rating"] },
  { id: "alphabetical", label: "A-Z", terms: ["a-z", "az", "alphabetical", "alphabet", "title asc"] },
  { id: "reverse-alphabetical", label: "Z-A", terms: ["z-a", "za", "title desc"] },
];

function canonicalizeSortOption(id: string, name: string): { id: string; label: string } {
  const raw = `${id} ${name}`.toLowerCase();
  const spaced = raw.replace(/[_-]+/g, " ");
  const normalized = normalizeTitle(spaced);
  const match = SORT_ALIASES.find((alias) =>
    alias.terms.some((term) => raw.includes(term) || normalized.includes(normalizeTitle(term)))
  );
  if (match) return { id: match.id, label: match.label };
  return { id, label: name };
}

export interface MergedFilter {
  id: string;
  label: string;
  supportedBy: string[];
  sourceValues: Record<string, string>;
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

  const processCategory = (
    map: Map<string, MergedFilter>,
    items: SourceFilter[] | undefined,
    sourceId: string,
    category?: SearchTagCategory | "sort"
  ) => {
    if (!items) return;
    for (const item of items) {
      if (isCatchAllOption(item.id, item.name)) continue;
      const canonical =
        category === "sort"
          ? canonicalizeSortOption(item.id, item.name)
          : category
            ? canonicalizeFilterValue(category, item.id, item.name)
            : { id: item.id, label: item.name };
      const canonicalId = canonical.id.toLowerCase();
      if (map.has(canonicalId)) {
        const existing = map.get(canonicalId)!;
        if (!existing.supportedBy.includes(sourceId)) {
          existing.supportedBy.push(sourceId);
        }
        existing.sourceValues[sourceId] = item.id;
      } else {
        map.set(canonicalId, {
          id: canonical.id,
          label: canonical.label,
          supportedBy: [sourceId],
          sourceValues: { [sourceId]: item.id },
        });
      }
    }
  };

  for (const { sourceId, filters } of sourceFilters) {
    processCategory(genresMap, filters.genres, sourceId, "genre");
    processCategory(formatsMap, filters.formats, sourceId, "format");
    processCategory(statusesMap, filters.statuses, sourceId, "status");
    processCategory(sortsMap, filters.sorts, sourceId, "sort");
  }

  const toArray = (map: Map<string, MergedFilter>) => Array.from(map.values());

  const allGenres = toArray(genresMap).sort((a, b) => a.label.localeCompare(b.label));
  const genreIds = new Set(allGenres.map((genre) => genre.id.toLowerCase()));
  const genres = allGenres.filter((genre) => {
    const words = normalizeTitle(genre.label).split(" ").filter(Boolean);
    if (words.length < 2) return true;
    const resolved = words
      .map((word) => resolveSearchTag(word))
      .filter((tag) => tag?.category === "genre")
      .map((tag) => tag!.id.toLowerCase());
    const unique = Array.from(new Set(resolved));
    return unique.length < 2 || !unique.every((id) => genreIds.has(id));
  });
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

  const sourceValue = (category: MergedFilter[], value: string) => {
    const found = category.find((item) => item.id.toLowerCase() === value.toLowerCase());
    return found?.sourceValues[sourceId] ?? value;
  };

  const validGenres = activeFilters.genres.filter(g => isSupported(mergedFilters.genres, g));
  if (validGenres.length > 0) {
    payload["genre[]"] = validGenres.map((genre) => sourceValue(mergedFilters.genres, genre));
  }

  const validFormats = activeFilters.formats.filter(f => isSupported(mergedFilters.formats, f));
  if (validFormats.length > 0) {
    payload["format[]"] = validFormats.map((format) => sourceValue(mergedFilters.formats, format));
  }

  if (isSupported(mergedFilters.statuses, activeFilters.status)) {
    payload["status"] = sourceValue(mergedFilters.statuses, activeFilters.status);
  }

  if (isSupported(mergedFilters.sorts, activeFilters.sort)) {
    payload["sort"] = sourceValue(mergedFilters.sorts, activeFilters.sort);
  }

  return payload;
}
