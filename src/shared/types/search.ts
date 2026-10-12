import type { MangaItem, SourceErrorCode } from "@/shared/sources/source-types";
import type { CanonicalSearchResult } from "@/shared/lib/canonical-search";

export interface GlobalSearchResponse {
  resultsBySource: Record<string, {
    results: MangaItem[];
    hasNextPage?: boolean;
    error?: string;
    errorCode?: SourceErrorCode;
  }>;
  canonicalResults?: CanonicalSearchResult[];
}
