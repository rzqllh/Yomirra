"use client";

import * as React from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { PageHeader } from "@/components/app/header";
import { ShelfCard } from "@/components/manga/card";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { useSearchParams } from "next/navigation";
import { WarningCircle, Compass } from "@phosphor-icons/react/dist/ssr";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { House } from "@phosphor-icons/react/dist/ssr";

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
    placeholderData: keepPreviousData,
  });

  const sourceName = sourceInfo?.name || sourceId;

  const { isSourceHiddenFromHome, toggleHomeSource } = useSourcePreferencesStore();
  const isHiddenFromHome = isSourceHiddenFromHome(sourceId);

  return (
    <main className="min-h-screen bg-surface-base flex flex-col">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
        <PageHeader title={sourceInfo?.name || sourceId} showBack={true} />
      </div>

      <div className="px-4 pt-2 pb-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between bg-surface-raised p-4 rounded-xl border border-border-subtle mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <House size={24} weight="duotone" />
            </div>
            <div>
              <p className="font-bold text-text-primary">Tampilkan di Beranda</p>
              <p className="text-xs text-text-muted">Munculkan komik populer dan terbaru dari sumber ini di halaman utama</p>
            </div>
          </div>
          <ToggleSwitch
            checked={!isHiddenFromHome}
            onCheckedChange={() => toggleHomeSource(sourceId)}
          />
        </div>

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
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10 lg:grid-cols-5 xl:grid-cols-6 flex-1 content-start">
              {data.mangas.map((manga) => (
                <ShelfCard
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
  );
}
