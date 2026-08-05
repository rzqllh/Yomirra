import * as React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { FilterList } from "@/shared/sources/source-types";
import type { MergedFilterList } from "@/shared/utils/filter-helpers";

export interface UseSearchPruningProps {
  activeSelectedSources: string[];
  isStillLoading: boolean;
  hasError: boolean;
  isCapabilitiesLoaded: boolean;
  dynamicFilters: MergedFilterList;
  pruneFilters: (genres: string[], formats: string[], statuses: string[], sorts: string[]) => void;
}

export function useSearchPruning({
  activeSelectedSources,
  isStillLoading,
  hasError,
  isCapabilitiesLoaded,
  dynamicFilters,
  pruneFilters
}: UseSearchPruningProps) {

  React.useEffect(() => {
    // If no active sources, don't prune.
    // We preserve user filters so when they re-enable a source, their filters are still there if supported.
    if (activeSelectedSources.length === 0) return;

    // Prune only if ALL active sources have successfully loaded their capabilities.
    if (isStillLoading || hasError || !isCapabilitiesLoaded) {
      return;
    }

    pruneFilters(
      dynamicFilters.genres.map(g => g.id),
      dynamicFilters.formats.map(f => f.id),
      dynamicFilters.statuses.map(s => s.id),
      dynamicFilters.sorts.map(s => s.id)
    );
  }, [isStillLoading, hasError, isCapabilitiesLoaded, dynamicFilters, activeSelectedSources, pruneFilters]);
}
