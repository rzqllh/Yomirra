"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { MangaCard } from "@/components/manga/manga-card";
import { HistoryRow } from "@/components/history/history-row";
import { HistoryMangaGroup } from "@/components/history/history-manga-group";
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
  const removeMangaHistory = useHistoryStore((state) => state.removeMangaHistory);
  
  const historyItems = isMounted ? getHistoryList() : [];
  
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, {
      sourceId: string;
      mangaId: string;
      mangaTitle: string;
      coverUrl?: string;
      sourceName?: string;
      latestReadAt: string;
      chapters: typeof historyItems;
    }> = {};

    historyItems.forEach(item => {
      const key = `${item.sourceId}::${item.mangaId}`;
      if (!groups[key]) {
        groups[key] = {
          sourceId: item.sourceId,
          mangaId: item.mangaId,
          mangaTitle: item.mangaTitle,
          coverUrl: item.coverUrl,
          sourceName: item.sourceName,
          latestReadAt: item.readAt,
          chapters: [],
        };
      }
      groups[key].chapters.push(item);
      if (new Date(item.readAt).getTime() > new Date(groups[key].latestReadAt).getTime()) {
        groups[key].latestReadAt = item.readAt;
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.latestReadAt).getTime() - new Date(a.latestReadAt).getTime());
  }, [historyItems]);

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
                {groupedHistory.length === 0 ? (
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
                  <div className="px-4 mt-4">
                    {groupedHistory.map((group) => (
                      <HistoryMangaGroup
                        key={`${group.sourceId}::${group.mangaId}`}
                        {...group}
                        onRemoveManga={removeMangaHistory}
                        onRemoveChapter={removeHistoryItem}
                      />
                    ))}
                  </div>
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
