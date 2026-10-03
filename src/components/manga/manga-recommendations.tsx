"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { ShelfCard } from "@/components/manga/card/shelf-card";
import { MangaItem } from "@/shared/types/source";
import { normalizeTitle } from "@/shared/lib/title-matcher";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import {
  buildRecommendationProfile,
  rankRecommendationCandidates,
} from "@/shared/lib/recommendations";
import type { SearchCatalogCandidate } from "@/shared/lib/search-intelligence";

interface MangaRecommendationsProps {
  sourceId: string;
  currentMangaId: string;
  title: string;
  genres: string[];
  description?: string;
  author?: string;
  format?: string;
  status?: string;
  originalTitle?: string;
  alternativeTitles?: string[];
  coverUrl?: string;
}

interface RecommendedManga {
  manga: MangaItem;
  sourceId: string;
  similarityReason?: string;
}

function inferSimilarityReason(
  candidate: SearchCatalogCandidate,
  targetGenres: string[],
  targetAuthor?: string
): string | undefined {
  if (!candidate) return undefined;

  if (targetAuthor && candidate.author) {
    const tA = normalizeTitle(targetAuthor);
    const cA = normalizeTitle(candidate.author);
    if (tA && cA && tA === cA) return "Karya kreator yang sama";
  }

  if (targetGenres.length > 0 && candidate.genres && candidate.genres.length > 0) {
    const targetSet = new Set(targetGenres.map((g) => g.toLowerCase().trim()));
    const overlap = candidate.genres.filter((g) => targetSet.has(g.toLowerCase().trim()));
    if (overlap.length >= 3) return "Genre sangat mirip";
    if (overlap.length >= 2) return "Premis serupa";
    if (overlap.length >= 1) return "Tema serupa";
  }

  return undefined;
}

export function MangaRecommendations({
  sourceId: currentSourceId,
  currentMangaId,
  title,
  genres = [],
  description,
  author,
  format,
  status,
  originalTitle,
  alternativeTitles,
  coverUrl,
}: MangaRecommendationsProps) {
  const libraryItems = useLibraryStore((state) => state.items);
  const historyItems = useHistoryStore((state) => state.items);
  const profile = useMemo(
    () =>
      buildRecommendationProfile(
        Object.values(libraryItems),
        Object.values(historyItems)
      ),
    [libraryItems, historyItems]
  );

  const { data: candidatePool = [], isLoading } = useQuery({
    queryKey: ["recommendations", currentSourceId, currentMangaId, genres, title],
    queryFn: async () => {
      const CANDIDATE_LIMIT = 30;
      const results: RecommendedManga[] = [];
      const initialTitle = normalizeTitle(title);
      const seenTitles = new Set<string>(initialTitle ? [initialTitle] : []);
      const seenKeys = new Set<string>([`${currentSourceId}::${currentMangaId}`]);

      const addItems = (items: MangaItem[], srcId: string, reason?: string) => {
        for (const item of items) {
          if (results.length >= CANDIDATE_LIMIT) break;
          const key = `${srcId}::${item.id}`;
          const normalizedItemTitle = normalizeTitle(item.title);

          if (seenKeys.has(key) || (normalizedItemTitle && seenTitles.has(normalizedItemTitle))) continue;

          seenKeys.add(key);
          if (normalizedItemTitle) seenTitles.add(normalizedItemTitle);
          results.push({ manga: item, sourceId: srcId, similarityReason: reason });
        }
      };

      // Primary: server-side hybrid ranker (semantic catalog + metadata similarity)
      try {
        const related = await apiClient.getRelatedTitles(
          {
            canonicalKey: `${currentSourceId}::${currentMangaId}::${encodeURIComponent(title)}`,
            sourceId: currentSourceId,
            mangaId: currentMangaId,
            title,
            coverUrl,
            originalTitle,
            alternativeTitles,
            author,
            description,
            genres,
            format,
            status,
          },
          12
        );

        if (related && related.length > 0) {
          for (const candidate of related) {
            if (results.length >= CANDIDATE_LIMIT) break;
            const key = `${candidate.sourceId}::${candidate.mangaId}`;
            const normalizedItemTitle = normalizeTitle(candidate.title);

            if (seenKeys.has(key) || (normalizedItemTitle && seenTitles.has(normalizedItemTitle))) continue;

            seenKeys.add(key);
            if (normalizedItemTitle) seenTitles.add(normalizedItemTitle);

            const reason = inferSimilarityReason(candidate, genres, author);
            results.push({
              manga: {
                id: candidate.mangaId,
                title: candidate.title,
                coverUrl: candidate.coverUrl,
                author: candidate.author,
                genres: candidate.genres,
                format: candidate.format,
                status: candidate.status,
              } as MangaItem,
              sourceId: candidate.sourceId,
              similarityReason: reason,
            });
          }
        }
      } catch {
        // Catalog may be cold or unavailable — fall through to genre-based fallback
      }

      // Fallback: genre-scoped search on current source
      const primaryGenres = genres.slice(0, 2);
      if (primaryGenres.length > 0 && results.length < CANDIDATE_LIMIT) {
        try {
          const searchRes = await apiClient.search(currentSourceId, "", 1, {
            "genre[]": primaryGenres,
            sort: "latest",
          });
          addItems(searchRes.results || [], currentSourceId, "Genre serupa");
        } catch {
          // Suppress
        }

        if (results.length < CANDIDATE_LIMIT) {
          try {
            const singleGenreRes = await apiClient.search(currentSourceId, "", 1, {
              "genre[]": [primaryGenres[0]],
            });
            addItems(singleGenreRes.results || [], currentSourceId, "Genre serupa");
          } catch {
            // Suppress
          }
        }
      }

      // Fallback: popular / latest from current source
      if (results.length < CANDIDATE_LIMIT) {
        try {
          const popularRes = await apiClient.getPopular(currentSourceId, 1);
          addItems(popularRes.mangas || (popularRes as unknown as { results: MangaItem[] }).results || [], currentSourceId);
        } catch {
          // Suppress
        }
      }

      if (results.length < CANDIDATE_LIMIT) {
        try {
          const latestRes = await apiClient.getLatest(currentSourceId, 1);
          addItems(latestRes.mangas || (latestRes as unknown as { results: MangaItem[] }).results || [], currentSourceId);
        } catch {
          // Suppress
        }
      }

      // Fallback: genre search across other sources
      if (results.length < CANDIDATE_LIMIT) {
        try {
          const sources = await apiClient.getSources();
          const otherSources = (sources || []).filter(
            (s) => s.id !== currentSourceId && s.isEnabled && !s.isNsfw
          );

          for (const otherSource of otherSources) {
            if (results.length >= CANDIDATE_LIMIT) break;

            if (primaryGenres.length > 0) {
              try {
                const otherSearchRes = await apiClient.search(otherSource.id, "", 1, {
                  "genre[]": [primaryGenres[0]],
                });
                addItems(otherSearchRes.results || [], otherSource.id, "Genre serupa");
              } catch {
                // Suppress
              }
            }

            if (results.length < CANDIDATE_LIMIT) {
              try {
                const otherPopularRes = await apiClient.getPopular(otherSource.id, 1);
                addItems(
                  otherPopularRes.mangas || (otherPopularRes as unknown as { results: MangaItem[] }).results || [],
                  otherSource.id
                );
              } catch {
                // Suppress
              }
            }
          }
        } catch {
          // Suppress
        }
      }

      return results.slice(0, CANDIDATE_LIMIT);
    },
    staleTime: 1000 * 60 * 30,
  });

  const recommendations = useMemo(
    () =>
      rankRecommendationCandidates(candidatePool, {
        currentTitle: title,
        currentSourceId,
        currentGenres: genres,
        currentFormat: format,
        currentStatus: status,
        profile,
      }).slice(0, 10),
    [candidatePool, currentSourceId, format, genres, profile, status, title]
  );

  if (isLoading) {
    return (
      <div className="mt-6 mb-2">
        <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-3">Komik Serupa</h3>
        <div className="flex gap-3 md:gap-4">
          <div className="h-[195px] w-[130px] md:w-[140px] bg-surface-raised animate-pulse rounded-sm shrink-0" />
          <div className="h-[195px] w-[130px] md:w-[140px] bg-surface-raised animate-pulse rounded-sm shrink-0" />
          <div className="h-[195px] w-[130px] md:w-[140px] bg-surface-raised animate-pulse rounded-sm shrink-0 hidden sm:block" />
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
            <ShelfCard
              sourceId={item.sourceId}
              manga={item.manga}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
