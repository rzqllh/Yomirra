"use client";

import * as React from "react"
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { MangaCard } from "@/components/manga/manga-card";
import { MagnifyingGlass, CircleNotch, BookmarkSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const activeSourceId = "shinigami";

  const { data: popular, isLoading: isLoadingPopular } = useQuery({
    queryKey: ["popular", activeSourceId],
    queryFn: () => apiClient.getPopular(activeSourceId, 1),
  });

  const { 
    data: latest, 
    isLoading: isLoadingLatest,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["latest", activeSourceId],
    queryFn: ({ pageParam }) => apiClient.getLatest(activeSourceId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => lastPage.hasNextPage ? allPages.length + 1 : undefined,
  });

  React.useEffect(() => {
    if (!loadMoreRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px" }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const latestMangas = latest?.pages.flatMap(p => p.mangas) || [];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
     
        <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`); }} className="md:hidden flex items-center gap-3 rounded-full bg-surface-raised px-4 py-2.5 transition-all duration-[var(--motion-fast)] focus-within:bg-surface-overlay focus-within:ring-2 focus-within:ring-accent/50 border border-border-subtle mx-4 mt-4">
          <MagnifyingGlass className="size-5 text-text-muted shrink-0" weight="bold" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul..." 
            className="flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
          />
        </form>

      <div className="px-4 py-6 space-y-10">
        {/* Continue Reading */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
            Lanjut Baca
          </h2>
          <EmptyState
            variant="compact"
            icon={<BookmarkSimple size={32} className="text-text-muted" weight="duotone" />}
            title="Belum ada riwayat baca"
            description="Buka chapter dan progresmu akan muncul di sini."
            className="bg-surface-raised rounded-[var(--radius-xl)] border border-border-subtle border-dashed"
          />
        </section>

        {/* Popular Section */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
            Populer di Shinigami
          </h2>
          {isLoadingPopular ? (
            <div className="flex h-48 items-center justify-center bg-surface-raised rounded-[var(--radius-xl)]">
              <CircleNotch className="h-8 w-8 animate-spin text-text-muted" weight="bold" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {popular?.mangas.slice(0, 6).map((manga, index) => (
                <MangaCard 
                  key={manga.id} 
                  manga={manga} 
                  sourceId={activeSourceId} 
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </section>

        {/* Latest Section */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
            Update Terbaru
          </h2>
          {isLoadingLatest && latestMangas.length === 0 ? (
            <div className="flex h-48 items-center justify-center bg-surface-raised rounded-[var(--radius-xl)]">
              <CircleNotch className="h-8 w-8 animate-spin text-text-muted" weight="bold" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {latestMangas.map((manga, idx) => (
                  <MangaCard key={`${manga.id}-${idx}`} manga={manga} sourceId={activeSourceId} />
                ))}
              </div>
              
              {/* Infinite Scroll Trigger / Load More */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="mt-8 flex justify-center pb-8">
                  <Button 
                    variant="secondary" 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    className="rounded-full px-8"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                        Memuat...
                      </>
                    ) : "Muat lebih banyak"}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
