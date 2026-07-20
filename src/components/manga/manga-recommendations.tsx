"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { ShelfCard } from "@/components/manga/card/shelf-card";
import { MangaItem } from "@/shared/types/source";



interface MangaRecommendationsProps {
  sourceId: string;
  currentMangaId: string;
  genres: string[];
}

export function MangaRecommendations({ sourceId: currentSourceId, currentMangaId, genres }: MangaRecommendationsProps) {

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["recommendations", currentSourceId, currentMangaId, genres],
    queryFn: async () => {
      let results: { manga: MangaItem, sourceId: string }[] = [];

      // Try fetching by genre from the exact same source
      if (genres && genres.length > 0) {
        try {
          // Sort by latest so recommendations stay fresh
          const searchRes = await apiClient.search(currentSourceId, "", 1, { "genre[]": genres, "sort": "latest" });
          const searched = (searchRes.results || []).filter(m => m.id !== currentMangaId);
          if (searched.length >= 3) {
            results = searched.map(m => ({ manga: m, sourceId: currentSourceId }));
          }
        } catch (err) {
          console.log("Source does not support genre search or failed:", err);
        }
      }

      return results.slice(0, 10);
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
