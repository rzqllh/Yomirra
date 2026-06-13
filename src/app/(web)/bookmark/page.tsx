"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { MangaCard } from "@/components/manga/manga-card";
import { HistoryRow } from "@/components/history/history-row";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/shared/hooks/use-mounted";
import { getHomeHref, getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import { BookBookmark, Compass, Clock, Play, SortDescending, SortAscending, CaretRight } from "@phosphor-icons/react";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { SearchInput } from "@/components/ui/search-input";
import { YomirraSurface } from "@/components/ui/yomirra-layout";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/yomirra-header";
import { HorizontalScrollContainer } from "@/components/ui/horizontal-scroll-container";

export default function BookmarkPage() {
  const isMounted = useMounted();
  const pathname = usePathname();
  
  // Readlist state
  const libraryItemsMap = useLibraryStore((state) => state.items);
  const libraryItems = Object.values(libraryItemsMap);
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc");
  const [sortBy, setSortBy] = React.useState<"updatedAt" | "title">("updatedAt");

  const filteredAndSortedLibraryItems = React.useMemo(() => {
    let result = [...libraryItems];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => item.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "updatedAt") {
        comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      }
      
      return sortOrder === "asc" ? -comparison : comparison;
    });

    return result;
  }, [libraryItems, searchQuery, sortBy, sortOrder]);

  // History state
  const getHistoryList = useHistoryStore((state) => state.getHistoryList);
  useHistoryStore((state) => state.items);
  const removeHistoryItem = useHistoryStore((state) => state.removeHistoryItem);
  
  const historyItems = isMounted ? getHistoryList() : [];
  
  const continueReading = historyItems.length > 0 ? historyItems[0] : null;
  const recentHistory = historyItems.length > 1 ? historyItems.slice(1, 15) : [];

  const [activeTab, setActiveTab] = React.useState<"reading" | "collection">("reading");

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="md:hidden">
          <YomirraPageHeader title="Rak Buku" variant="auto" />
        </div>
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto">
          <div className="hidden md:block px-4 py-8">
            <h1 className="text-3xl font-black text-text-primary tracking-tight">Rak Buku</h1>
          </div>
        </YomirraSurface>
      </div>
    );
  }

  return (
    <DirectionalTransition>
      <div className="flex flex-col min-h-screen pb-24">
        <div className="md:hidden">
          <YomirraPageHeader title="Rak Buku" variant="auto" />
        </div>

        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
          <div className="hidden md:block px-4 py-8 pb-4">
            <DesktopPageTitle 
              title="Rak Buku" 
              description="Koleksi dan riwayat bacaan personal Anda." 
              icon={<BookBookmark size={32} weight="duotone" />}
            />
          </div>

          <div className="px-4 py-4 w-full md:max-w-md">
            <div className="flex bg-surface-muted/50 p-1 rounded-full border border-border-subtle/50 shadow-inner">
              <button
                onClick={() => setActiveTab("reading")}
                className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${
                  activeTab === "reading" 
                    ? "bg-surface-overlay text-text-primary shadow-sm ring-1 ring-border-default" 
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover/50"
                }`}
              >
                Sedang Dibaca
              </button>
              <button
                onClick={() => setActiveTab("collection")}
                className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${
                  activeTab === "collection" 
                    ? "bg-surface-overlay text-text-primary shadow-sm ring-1 ring-border-default" 
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover/50"
                }`}
              >
                Koleksi
              </button>
            </div>
          </div>

          <div className="mt-2 outline-none">
            {activeTab === "reading" && (
              <DirectionalTransition key="reading">
                {historyItems.length === 0 ? (
                  <EmptyState
                    icon={<Clock size={48} className="text-text-muted" weight="duotone" />}
                    title="Belum ada riwayat baca"
                    description="Buka chapter untuk mulai membaca. Progres bacaanmu akan muncul di sini."
                    action={
                      <Button asChild variant="accent" className="rounded-full shadow-sm font-bold">
                        <Link href={getHomeHref()}>
                          <Compass size={20} weight="bold" className="mr-1.5" />
                          Eksplor Manga
                        </Link>
                      </Button>
                    }
                  />
                ) : (
                  <>
                    {continueReading && (
                      <div className="px-4 mb-8 mt-2">
                        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                          <Play size={20} weight="fill" className="text-accent" />
                          Lanjutkan Membaca
                        </h2>
                        
                        <Link 
                          href={getReaderHref(continueReading.sourceId, continueReading.mangaId, continueReading.chapterId)}
                          className="group relative flex flex-col md:flex-row items-stretch md:items-center gap-4 rounded-2xl bg-surface-overlay border border-border-default shadow-sm hover:shadow-md transition-all overflow-hidden p-4"
                        >
                          <div className="flex items-center gap-4 md:flex-1">
                            <div className="relative h-24 w-16 md:h-28 md:w-20 shrink-0 overflow-hidden rounded-md bg-surface-muted shadow-sm">
                              {continueReading.coverUrl ? (
                                <Image 
                                  src={continueReading.coverUrl} 
                                  alt={continueReading.mangaTitle} 
                                  fill 
                                  sizes="(max-width: 768px) 64px, 80px"
                                  priority
                                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                  unoptimized={continueReading.coverUrl.startsWith("http")}
                                />
                              ) : (
                                <div className="h-full w-full bg-surface-muted" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <span className="text-xs font-black uppercase tracking-wider text-accent mb-1">Terakhir Dibaca</span>
                              <h3 className="truncate font-bold text-text-primary text-base md:text-lg leading-tight mb-1 group-hover:text-accent transition-colors">
                                {continueReading.mangaTitle}
                              </h3>
                              <p className="truncate text-sm font-medium text-text-muted">
                                {continueReading.chapterTitle || "Chapter"}
                              </p>
                              
                              <div className="mt-3 flex items-center gap-3">
                                {continueReading.progressPercent !== undefined && continueReading.progressPercent > 0 && (
                                  <div className="flex-1 max-w-[150px] h-1.5 rounded-full bg-surface-muted overflow-hidden">
                                    <div 
                                      className="h-full bg-accent rounded-full" 
                                      style={{ width: `${continueReading.progressPercent}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="hidden md:flex shrink-0 items-center justify-center rounded-full h-12 w-12 bg-accent text-background shadow-md group-hover:scale-105 group-active:scale-95 transition-transform ml-auto">
                            <Play className="h-6 w-6 ml-1" weight="fill" />
                          </div>
                        </Link>
                      </div>
                    )}

                    {recentHistory.length > 0 && (
                      <div className="mb-10 mt-6">
                        <div className="px-4 mb-4 flex items-center justify-between">
                          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Clock size={20} className="text-text-muted" weight="bold" />
                            Riwayat Sebelumnya
                          </h2>
                        </div>
                        <HorizontalScrollContainer>
                          {recentHistory.map((item, index) => (
                            <div key={`${item.sourceId}::${item.mangaId}::${item.chapterId}`} className="w-[280px] shrink-0">
                              <HistoryRow
                                item={item}
                                onRemove={removeHistoryItem}
                                priority={index < 3}
                              />
                            </div>
                          ))}
                        </HorizontalScrollContainer>
                      </div>
                    )}
                  </>
                )}
              </DirectionalTransition>
            )}

            {activeTab === "collection" && (
              <DirectionalTransition key="collection">
                <div className="px-4 mt-2">
                  {libraryItems.length === 0 ? (
                    <EmptyState
                      icon={<BookBookmark size={48} className="text-text-muted" weight="duotone" />}
                      title="Koleksi masih kosong"
                      description="Simpan judul dari halaman detail untuk menemukannya lagi di sini."
                      action={
                        <Button asChild variant="accent" className="rounded-full shadow-sm font-bold">
                          <Link href={getHomeHref()}>
                            <Compass size={20} weight="bold" className="mr-1.5" />
                            Eksplor Manga
                          </Link>
                        </Button>
                      }
                    />
                  ) : (
                    <>
                      <div className="py-2 flex flex-col sm:flex-row gap-3 w-full mb-6">
                        <div className="flex-1">
                          <SearchInput
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari di koleksi..."
                            containerClassName="h-11 rounded-full bg-surface-muted focus-within:bg-surface-overlay border-none focus-within:ring-2 focus-within:ring-accent/50"
                          />
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "updatedAt" | "title")}
                            className="h-11 rounded-full bg-surface-muted px-4 py-2 text-sm text-text-primary border border-transparent focus:ring-2 focus:ring-accent/50 outline-none font-medium hover:bg-surface-overlay transition-colors appearance-none"
                          >
                            <option value="updatedAt">Terbaru Ditambahkan</option>
                            <option value="title">Judul Buku</option>
                          </select>
                          <button
                            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-primary hover:bg-surface-overlay transition-colors"
                            aria-label="Toggle sort order"
                          >
                            {sortOrder === "desc" ? <SortDescending size={20} weight="bold" /> : <SortAscending size={20} weight="bold" />}
                          </button>
                        </div>
                      </div>

                      {filteredAndSortedLibraryItems.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-text-muted">
                          <span className="font-medium">Tidak ada hasil yang cocok dengan &quot;{searchQuery}&quot;</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 max-h-[70vh] overflow-y-auto pr-2 -mr-2 [scrollbar-width:thin]">
                          {filteredAndSortedLibraryItems.map((item, index) => (
                            <MangaCard
                              key={`${item.sourceId}::${item.mangaId}`}
                              manga={{
                                id: item.mangaId,
                                title: item.title,
                                coverUrl: item.coverUrl || "",
                                status: item.status,
                              }}
                              sourceId={item.sourceId}
                              variant="shelf"
                              priority={index < 6}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </DirectionalTransition>
            )}
          </div>
        </YomirraSurface>
      </div>
    </DirectionalTransition>
  );
}
