"use client";

import * as React from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { YomirraPageHeader } from "@/components/app/yomirra-header";
import { MangaCard } from "@/components/manga/manga-card";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { WarningCircle, Compass } from "@phosphor-icons/react/dist/ssr";

import { DirectionalTransition } from "@/components/ui/directional-transition";

export const dynamic = "force-dynamic";

export default function SourceBrowsePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const unwrappedParams = React.use(params);
  const sourceId = unwrappedParams.sourceId;
  const searchParams = useSearchParams();
  const sort = searchParams?.get("sort") === "popular" ? "popular" : "latest";

  const { ref, inView } = useInView();

  const { data: sourceInfo } = useQuery({
    queryKey: ["source", sourceId],
    queryFn: async () => {
      const sources = await apiClient.getSources();
      return sources.find(s => s.id === sourceId);
    }
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ["sourceBrowse", sourceId, sort],
    queryFn: ({ pageParam = 1 }) => 
      sort === "popular" 
        ? apiClient.getPopular(sourceId, pageParam)
        : apiClient.getLatest(sourceId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sourceName = sourceInfo?.name || sourceId;

  return (
    <DirectionalTransition>
      <main className="min-h-screen bg-surface-base">
        <YomirraPageHeader title={sort === "popular" ? `Populer di ${sourceName}` : `Terbaru di ${sourceName}`} showBack variant="auto" />
        
        <div className="px-4 py-6 max-w-7xl mx-auto">
          {status === "pending" ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
            </div>
          ) : status === "error" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-raised rounded-xl border border-border-subtle">
              <WarningCircle size={48} className="mb-4 text-semantic-error" weight="duotone" />
              <p className="text-base font-medium text-text-primary">Gagal memuat data dari {sourceName}.</p>
              <p className="text-sm text-text-muted mt-1">{(error as Error).message}</p>
            </div>
          ) : data?.pages[0]?.mangas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-raised rounded-xl border border-border-subtle">
              <Compass size={48} className="mb-4 text-text-muted" weight="duotone" />
              <p className="text-base font-medium text-text-primary">Tidak ada manga yang ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {data.pages.map((page, i) => (
                <React.Fragment key={i}>
                  {page.mangas.map((manga) => (
                    <MangaCard 
                      key={manga.id}
                      manga={manga}
                      sourceId={sourceId}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Loading trigger for next page */}
          {isFetchingNextPage && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 mt-4">
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
            </div>
          )}
          <div ref={ref} className="h-10 mt-4" />
        </div>
      </main>
    </DirectionalTransition>
  );
}
