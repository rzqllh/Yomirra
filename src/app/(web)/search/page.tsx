"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { MagnifyingGlass, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Image from "next/image";
import { SearchResultSkeleton } from "@/components/skeletons/search-result-skeleton";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { TopBar } from "@/components/app/top-bar";
import { useSearchParams } from "next/navigation";

export default function SearchPage() {
  return (
    <React.Suspense fallback={
      <main className="min-h-screen pb-[calc(56px+env(safe-area-inset-bottom))] bg-background">
        <TopBar title="Hasil Pencarian" showBack />
        <div className="px-4 py-6">
          <SearchResultSkeleton />
        </div>
      </main>
    }>
      <SearchContent />
    </React.Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  
  const activeSourceId = "shinigami";

  const { data: searchResponse, isLoading: isLoadingSearch, error: searchError } = useQuery({
    queryKey: ["search", activeSourceId, query],
    queryFn: () => apiClient.search(activeSourceId, query),
    enabled: query.length > 0,
  });

  return (
    <main className="min-h-screen pb-[calc(56px+env(safe-area-inset-bottom))] bg-background">
      <TopBar title="Hasil Pencarian" showBack />
      
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary">Pencarian untuk &quot;{query}&quot;</h1>
          <p className="text-sm text-text-muted mt-1">Mencari dari sumber: Shinigami</p>
        </div>

        {query.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-raised rounded-[var(--radius-xl)] border border-border-subtle">
            <MagnifyingGlass size={40} className="mb-3 text-text-muted" weight="duotone" />
            <p className="text-sm font-medium text-text-primary">Masukkan kata kunci untuk mencari.</p>
          </div>
        ) : isLoadingSearch ? (
          <SearchResultSkeleton />
        ) : searchError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-raised rounded-[var(--radius-xl)] border border-border-subtle">
            <WarningCircle size={40} className="mb-3 text-error" weight="duotone" />
            <p className="text-sm font-medium text-text-primary">Sumber tidak merespon.</p>
            <p className="text-xs text-text-muted mt-1">Coba lagi atau ganti sumber.</p>
          </div>
        ) : searchResponse?.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-raised rounded-[var(--radius-xl)] border border-border-subtle">
            <MagnifyingGlass size={40} className="mb-3 text-text-muted" weight="duotone" />
            <p className="text-sm font-medium text-text-primary">Tidak ada manga yang cocok.</p>
            <p className="text-xs text-text-muted mt-1">Coba kata kunci lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {searchResponse?.results.map((manga) => (
              <Link 
                key={manga.id} 
                href={getMangaDetailHref(activeSourceId, manga.id)}
                className="group flex flex-col gap-2 relative"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-md)] bg-surface-raised border border-border-subtle">
                  <Image
                    src={manga.coverUrl}
                    alt={manga.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 33vw, 20vw"
                  />
                </div>
                {manga.latestChapter && (
                  <div className="absolute top-1 left-1 rounded-sm bg-background/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
                    {manga.latestChapter}
                  </div>
                )}
                <h3 className="line-clamp-2 text-[11px] font-medium leading-snug text-text-primary group-hover:text-accent">
                  {manga.title}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
