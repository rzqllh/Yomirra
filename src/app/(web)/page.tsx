"use client";

import * as React from "react"
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { MangaCard } from "@/components/manga/manga-card";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";
import { MagnifyingGlass, CircleNotch, BookmarkSimple, Play } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getLibraryHref, getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import { useHistoryStore } from "@/shared/store/history-store";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  
  const activeSourceId = "shinigami";
  const sourceName = activeSourceId.charAt(0).toUpperCase() + activeSourceId.slice(1);

  const { data: popular, isLoading: isLoadingPopular } = useQuery({
    queryKey: ["popular", activeSourceId],
    queryFn: () => apiClient.getPopular(activeSourceId, 1),
  });

  const { data: latest, isLoading: isLoadingLatest } = useQuery({
    queryKey: ["latest", activeSourceId],
    queryFn: () => apiClient.getLatest(activeSourceId, 1),
  });

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const getContinueReading = useHistoryStore(state => state.getContinueReading);
  const continueReadingItems = getContinueReading(1);
  const latestHistory = isMounted ? continueReadingItems[0] : undefined;

  return (
    <main className="min-h-screen bg-background pb-12">
      {/* Mobile Header / Search */}
      <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border-subtle pt-[env(safe-area-inset-top)] pb-3 px-4">
        <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`); }} className="flex items-center gap-3 rounded-full bg-surface-raised px-4 py-2.5 transition-all duration-[var(--motion-fast)] focus-within:bg-surface-overlay focus-within:ring-1 focus-within:ring-accent border border-border-subtle mt-2 shadow-sm">
          <MagnifyingGlass className="size-5 text-text-muted shrink-0" weight="bold" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari manga, manhwa..." 
            className="flex-1 bg-transparent text-[15px] font-medium text-text-primary outline-none placeholder:text-text-muted"
          />
        </form>
      </div>

      {/* Main Content Area */}
      <div className="px-4 md:px-8 py-6 md:py-10 space-y-14 max-w-7xl mx-auto">
        
        {/* Continue Reading Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] font-bold tracking-tight text-text-primary">
              Lanjut Baca
            </h2>
            {latestHistory && (
              <Link href="/history" className="text-[13px] font-bold text-accent hover:text-accent-hover transition-colors">
                Lihat Semua
              </Link>
            )}
          </div>
          
          {latestHistory ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 sm:p-6 bg-surface-raised rounded-2xl border border-border-subtle group hover:border-border-strong transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {latestHistory.coverUrl && (
                <div className="relative w-24 h-32 rounded-lg overflow-hidden shrink-0 shadow-md">
                  <Image 
                    src={latestHistory.coverUrl} 
                    alt={latestHistory.mangaTitle || "Cover"} 
                    fill 
                    className="object-cover"
                    unoptimized 
                  />
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-center min-w-0 z-10 w-full text-center sm:text-left">
                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Riwayat Terakhir</p>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary line-clamp-1 mb-1 group-hover:text-accent transition-colors">
                  <Link href={getMangaDetailHref(latestHistory.sourceId, latestHistory.mangaId)} className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {latestHistory.mangaTitle}
                  </Link>
                </h3>
                <p className="text-sm font-medium text-text-muted mb-6">
                  {latestHistory.chapterTitle || `Chapter ${latestHistory.chapterId}`}
                </p>
                
                <Button 
                  asChild
                  variant="accent" 
                  className="rounded-full w-full sm:w-auto h-11 px-6 font-bold shadow-sm relative z-20"
                >
                  <Link href={getReaderHref(latestHistory.sourceId, latestHistory.mangaId, latestHistory.chapterId)}>
                    <Play className="h-4 w-4 mr-2" weight="fill" />
                    Lanjutkan Membaca
                  </Link>
                </Button>
              </div>
            </div>
          ) : isMounted ? (
            <EmptyState
              variant="compact"
              icon={<BookmarkSimple size={28} className="text-text-muted" weight="duotone" />}
              title="Belum ada riwayat baca"
              description="Buka chapter komik manapun dan progresmu akan otomatis muncul di sini."
              className="bg-surface-raised/50 rounded-2xl py-12"
            />
          ) : (
            <div className="w-full h-[200px] animate-pulse bg-surface-raised/50 rounded-2xl" />
          )}
        </section>

        {/* Popular Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] font-bold tracking-tight text-text-primary">
              Populer di {sourceName}
            </h2>
          </div>
          {isLoadingPopular ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <MangaCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] font-bold tracking-tight text-text-primary">
              Update Terbaru
            </h2>
          </div>
          {isLoadingLatest ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <MangaCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                {latest?.mangas.slice(0, 12).map((manga) => (
                  <MangaCard key={manga.id} manga={manga} sourceId={activeSourceId} />
                ))}
              </div>
              
              <div className="mt-12 flex justify-center pb-8">
                <Button 
                  asChild
                  variant="outline" 
                  className="rounded-full px-8 py-6 font-bold text-[15px] border-border-strong hover:bg-surface-raised transition-all"
                >
                  <Link href={getLibraryHref()}>
                    Eksplorasi Katalog Library
                  </Link>
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
