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

interface RecommendedManga {
  manga: MangaItem;
  sourceId: string;
}

export function MangaRecommendations({
  sourceId: currentSourceId,
  currentMangaId,
  genres = [],
}: MangaRecommendationsProps) {
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["recommendations", currentSourceId, currentMangaId, genres],
    queryFn: async () => {
      const TARGET_COUNT = 10;
      const results: RecommendedManga[] = [];
      const seenTitles = new Set<string>();
      const seenKeys = new Set<string>();

      // Exclude current manga
      seenKeys.add(`${currentSourceId}::${currentMangaId}`);

      const addItems = (items: MangaItem[], srcId: string) => {
        for (const item of items) {
          if (results.length >= TARGET_COUNT) break;
          const key = `${srcId}::${item.id}`;
          const normalizedTitle = item.title.trim().toLowerCase();

          if (seenKeys.has(key) || seenTitles.has(normalizedTitle)) continue;

          seenKeys.add(key);
          seenTitles.add(normalizedTitle);
          results.push({ manga: item, sourceId: srcId });
        }
      };

      const primaryGenres = genres.slice(0, 2);

      // 1. Primary genre search on current source (1–2 primary genres)
      if (primaryGenres.length > 0) {
        try {
          const searchRes = await apiClient.search(currentSourceId, "", 1, {
            "genre[]": primaryGenres,
            sort: "latest",
          });
          addItems(searchRes.results || [], currentSourceId);
        } catch {
          // Suppress error to allow fallback
        }

        if (results.length < TARGET_COUNT) {
          try {
            const singleGenreRes = await apiClient.search(currentSourceId, "", 1, {
              "genre[]": [primaryGenres[0]],
            });
            addItems(singleGenreRes.results || [], currentSourceId);
          } catch {
            // Suppress error to allow fallback
          }
        }
      }

      // 2. Fallback to popular/latest on current source
      if (results.length < TARGET_COUNT) {
        try {
          const popularRes = await apiClient.getPopular(currentSourceId, 1);
          addItems(popularRes.mangas || (popularRes as any).results || [], currentSourceId);
        } catch {
          // Suppress error
        }
      }

      if (results.length < TARGET_COUNT) {
        try {
          const latestRes = await apiClient.getLatest(currentSourceId, 1);
          addItems(latestRes.mangas || (latestRes as any).results || [], currentSourceId);
        } catch {
          // Suppress error
        }
      }

      // 3. Fallback to other active sources if still under target
      if (results.length < TARGET_COUNT) {
        try {
          const sources = await apiClient.getSources();
          const otherSources = (sources || []).filter(
            (s) => s.id !== currentSourceId && s.isEnabled && !s.isNsfw
          );

          for (const otherSource of otherSources) {
            if (results.length >= TARGET_COUNT) break;

            if (primaryGenres.length > 0) {
              try {
                const otherSearchRes = await apiClient.search(otherSource.id, "", 1, {
                  "genre[]": [primaryGenres[0]],
                });
                addItems(otherSearchRes.results || [], otherSource.id);
              } catch {
                // Suppress error
              }
            }

            if (results.length < TARGET_COUNT) {
              try {
                const otherPopularRes = await apiClient.getPopular(otherSource.id, 1);
                addItems(otherPopularRes.mangas || (otherPopularRes as any).results || [], otherSource.id);
              } catch {
                // Suppress error
              }
            }
          }
        } catch {
          // Suppress error
        }
      }

      return results.slice(0, TARGET_COUNT);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading) {
    return (
      <div className="mt-6 mb-2">
        <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-3">Komik Serupa</h3>
        <div className="flex gap-3 md:gap-4">
          <div className="h-[195px] w-[130px] md:w-[140px] bg-surface-raised animate-pulse rounded-2xl shrink-0" />
          <div className="h-[195px] w-[130px] md:w-[140px] bg-surface-raised animate-pulse rounded-2xl shrink-0" />
          <div className="h-[195px] w-[130px] md:w-[140px] bg-surface-raised animate-pulse rounded-2xl shrink-0 hidden sm:block" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-6 mb-2">
      <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-3">Komik Serupa</h3>
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
        {recommendations.map((item) => (
          <div key={`${item.sourceId}-${item.manga.id}`} className="w-[130px] md:w-[140px] shrink-0 snap-start">
            <ShelfCard sourceId={item.sourceId} manga={item.manga} />
          </div>
        ))}
      </div>
    </div>
  );
}
