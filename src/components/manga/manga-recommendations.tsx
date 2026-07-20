"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { ShelfCard } from "@/components/manga/card/shelf-card";
import { useMemo } from "react";
import { MangaItem } from "@/shared/types/source";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";

interface MangaRecommendationsProps {
  sourceId: string;
  currentMangaId: string;
  genres: string[];
}

export function MangaRecommendations({ sourceId: currentSourceId, currentMangaId, genres }: MangaRecommendationsProps) {
  const disabledSources = useSourcePreferencesStore(state => state.disabledSources);
  const activeSourceIds = useMemo(() => {
    return sourceRegistry
      .filter(s => s.isEnabled && s.isInstalled && s.status !== "unavailable" && !disabledSources.includes(s.id))
      .map(s => s.id);
  }, [disabledSources]);

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["recommendations", "global", currentMangaId, genres, activeSourceIds],
    queryFn: async () => {
      let results: { manga: MangaItem, sourceId: string }[] = [];

      // 1. Try to fetch by genre across ALL active sources
      if (genres && genres.length > 0 && activeSourceIds.length > 0) {
        try {
          const res = await apiClient.searchGlobal("", activeSourceIds, 1, false, { "genre[]": genres });
          const allManga = Object.entries(res.resultsBySource).flatMap(([srcId, data]) => {
            return (data.results || []).map(m => ({ manga: m, sourceId: srcId }));
          });
          // Mix sources randomly
          results = allManga.sort(() => Math.random() - 0.5);
        } catch (err) {
          console.error("Failed to fetch global recommendations by genre:", err);
        }
      }

      // 2. Exclude current manga (if it matches the same ID and Source)
      results = results.filter(r => !(r.manga.id === currentMangaId && r.sourceId === currentSourceId));

      // 3. Backfill with popular from the ORIGINAL source if we don't have enough
      if (results.length < 10) {
        try {
          const pop = await apiClient.getPopular(currentSourceId, 1);
          const popResults = (pop.mangas || [])
            .filter(m => m.id !== currentMangaId && !results.some(r => r.manga.id === m.id && r.sourceId === currentSourceId))
            .map(m => ({ manga: m, sourceId: currentSourceId }));
          results = [...results, ...popResults];
        } catch (err) {
          console.error("Failed to backfill recommendations with popular:", err);
        }
      }

      // 4. Ensure uniqueness by ID across mixed sources
      const uniqueResults: { manga: MangaItem, sourceId: string }[] = [];
      const seenTitles = new Set<string>();
      
      for (const item of results) {
        const titleKey = item.manga.title.toLowerCase().trim();
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          uniqueResults.push(item);
        }
      }

      return uniqueResults.slice(0, 10);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });



  if (isLoading) {
    return (
      <div className="mt-8">
        <h3 className="text-lg md:text-xl font-bold text-text-primary mb-4">Mungkin Kamu Juga Suka</h3>
        <div className="h-[200px] bg-surface-base animate-pulse rounded-lg" />
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-8 md:mt-12">
      <h3 className="text-lg md:text-xl font-bold text-text-primary mb-4">Mungkin Kamu Juga Suka</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
        {recommendations.map((item) => (
          <div key={`${item.sourceId}-${item.manga.id}`} className="w-[120px] md:w-[150px] shrink-0 snap-start">
            <ShelfCard sourceId={item.sourceId} manga={item.manga} />
          </div>
        ))}
      </div>
    </div>
  );
}
