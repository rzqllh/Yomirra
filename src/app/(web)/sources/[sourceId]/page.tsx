"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { YomirraPageHeader } from "@/components/app/yomirra-header";
import { MangaCard } from "@/components/manga/manga-card";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { useSearchParams } from "next/navigation";
import { WarningCircle, Compass } from "@phosphor-icons/react/dist/ssr";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";

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
  const pageStr = searchParams?.get("page") || "1";
  const currentPage = parseInt(pageStr, 10) || 1;

  const { data: sourceInfo } = useQuery({
    queryKey: ["source", sourceId],
    queryFn: async () => {
      const sources = await apiClient.getSources();
      return sources.find(s => s.id === sourceId);
    }
  });

  const {
    data,
    isLoading,
    isFetching,
    status,
    error
  } = useQuery({
    queryKey: ["sourceBrowse", sourceId, sort, currentPage],
    queryFn: () => 
      sort === "popular" 
        ? apiClient.getPopular(sourceId, currentPage)
        : apiClient.getLatest(sourceId, currentPage),
  });

  const sourceName = sourceInfo?.name || sourceId;

  return (
    <DirectionalTransition>
      <main className="min-h-screen bg-surface-base flex flex-col">
        <YomirraPageHeader title={sort === "popular" ? `Populer di ${sourceName}` : `Terbaru di ${sourceName}`} showBack variant="auto" />
        
        <div className="px-4 py-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {status === "pending" || isLoading ? (
            <div className="flex flex-col gap-10">
              <SearchResultSkeleton />
              <SearchResultSkeleton />
            </div>
          ) : status === "error" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-raised rounded-xl border border-border-subtle">
              <WarningCircle size={48} className="mb-4 text-semantic-error" weight="duotone" />
              <p className="text-base font-medium text-text-primary">Gagal memuat data dari {sourceName}.</p>
              <p className="text-sm text-text-muted mt-1">{(error as Error).message}</p>
            </div>
          ) : data?.mangas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-raised rounded-xl border border-border-subtle">
              <Compass size={48} className="mb-4 text-text-muted" weight="duotone" />
              <p className="text-base font-medium text-text-primary">Tidak ada manga yang ditemukan.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 flex-1 content-start">
                {data.mangas.map((manga) => (
                  <MangaCard 
                    key={manga.id}
                    manga={manga}
                    sourceId={sourceId}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="mt-10 flex items-center justify-center gap-4 py-4">
                <Link
                  href={`/sources/${sourceId}?sort=${sort}&page=${Math.max(1, currentPage - 1)}`}
                  className={cn(
                    "px-4 py-2 rounded-full font-bold text-sm transition-all",
                    currentPage <= 1 
                      ? "opacity-50 pointer-events-none bg-surface-raised text-text-muted" 
                      : "bg-surface-glass border border-border-subtle text-text-primary hover:bg-surface-glass/80"
                  )}
                  aria-disabled={currentPage <= 1}
                >
                  Sebelumnya
                </Link>
                <div className="px-4 py-2 rounded-full bg-accent text-accent-on font-bold text-sm min-w-[40px] text-center">
                  {currentPage}
                </div>
                <Link
                  href={`/sources/${sourceId}?sort=${sort}&page=${currentPage + 1}`}
                  className={cn(
                    "px-4 py-2 rounded-full font-bold text-sm transition-all",
                    !data?.hasNextPage 
                      ? "opacity-50 pointer-events-none bg-surface-raised text-text-muted" 
                      : "bg-surface-glass border border-border-subtle text-text-primary hover:bg-surface-glass/80"
                  )}
                  aria-disabled={!data?.hasNextPage}
                >
                  Selanjutnya
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </DirectionalTransition>
  );
}
