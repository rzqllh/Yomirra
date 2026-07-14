"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { ShelfCard } from "@/components/manga/card/shelf-card";
import { useMemo } from "react";
import { MangaItem } from "@/shared/types/source";

interface MangaRecommendationsProps {
  sourceId: string;
  currentMangaId: string;
  genres: string[];
}

export function MangaRecommendations({ sourceId, currentMangaId, genres }: MangaRecommendationsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["recommendations", sourceId, currentMangaId],
    queryFn: async () => {
      // Fetch popular manga from the same source to use as a recommendation pool
      return apiClient.getPopular(sourceId, 1);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const recommendations = useMemo(() => {
    if (!data || !data.mangas || data.mangas.length === 0) return [];
    
    // Calculate genre overlap score for each manga
    const scored = data.mangas
      .filter((m: MangaItem) => m.id !== currentMangaId)
      .map((manga: MangaItem) => {
        // If the source doesn't provide genres in the summary item, we can't do exact matching easily.
        // As a fallback, we just show popular ones, or if they have some tag info, we match.
        // Assuming some sources might return basic info, if no genre is available we just return it with 0 score (as fallback popular suggestions).
        let score = 0;
        // Currently, MangaItem might not have `genres` fully populated from getPopular.
        // If not, we just show popular ones as recommendations.
        return { manga, score };
      });

    // Sort by score descending (if we had scores), then take top 10
    return scored
      .sort((a: {manga: MangaItem, score: number}, b: {manga: MangaItem, score: number}) => b.score - a.score)
      .slice(0, 10)
      .map((s: {manga: MangaItem, score: number}) => s.manga);
  }, [data, currentMangaId]);

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
        {recommendations.map((manga: MangaItem) => (
          <div key={manga.id} className="w-[120px] md:w-[150px] shrink-0 snap-start">
            <ShelfCard sourceId={sourceId} manga={manga} />
          </div>
        ))}
      </div>
    </div>
  );
}
