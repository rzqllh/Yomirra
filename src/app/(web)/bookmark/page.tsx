"use client";

import React from "react";
import Link from "next/link";
import { MobilePageShell } from "@/components/app/mobile-page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { MangaCard } from "@/components/manga/manga-card";
import { HistoryRow } from "@/components/history/history-row";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/shared/hooks/use-mounted";
import { getHomeHref } from "@/shared/lib/routes";
import { BookBookmark, Compass, Clock, Play, SortDescending, SortAscending } from "@phosphor-icons/react";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { SearchInput } from "@/components/ui/search-input";

export default function BookmarkPage() {
  const isMounted = useMounted();
  
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
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const removeHistoryItem = useHistoryStore((state) => state.removeHistoryItem);
  
  const historyItems = isMounted ? getHistoryList() : [];

  if (!isMounted) {
    return (
      <MobilePageShell title="Bookmark">
        <div className="hidden md:block px-4 py-6 max-w-3xl mx-auto w-full">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Bookmark</h1>
        </div>
      </MobilePageShell>
    );
  }

  return (
    <DirectionalTransition>
      <MobilePageShell title="Bookmark">
        <div className="hidden md:block px-4 py-6 max-w-3xl mx-auto w-full">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Bookmark</h1>
        </div>

        <Tabs defaultValue="readlist" className="w-full">
          <div className="px-4 py-2 max-w-3xl mx-auto w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="readlist">Readlist</TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="readlist" className="mt-0 outline-none">
            {libraryItems.length === 0 ? (
              <EmptyState
                icon={<BookBookmark size={48} className="text-text-muted" weight="duotone" />}
                title="Readlist masih kosong"
                description="Simpan judul dari halaman detail untuk menemukannya lagi di sini."
                action={
                  <Button asChild variant="default" className="rounded-full">
                    <Link href={getHomeHref()}>
                      <Compass size={20} weight="bold" />
                      Cari Manga
                    </Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="px-4 py-2 flex flex-col sm:flex-row gap-3 max-w-7xl mx-auto w-full">
                  <div className="flex-1">
                    <SearchInput
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari di Readlist..."
                      containerClassName="h-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "updatedAt" | "title")}
                      className="h-10 rounded-[var(--radius-full)] bg-surface-raised px-4 py-2 text-sm text-text-primary border border-border-default focus:ring-1 focus:ring-accent outline-none appearance-none"
                      style={{ WebkitAppearance: 'none', backgroundImage: 'none' }}
                    >
                      <option value="updatedAt">Terbaru Ditambahkan</option>
                      <option value="title">Judul Buku</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised border border-border-default text-text-primary hover:bg-surface-hover transition-colors"
                      aria-label="Toggle sort order"
                    >
                      {sortOrder === "desc" ? <SortDescending size={20} /> : <SortAscending size={20} />}
                    </button>
                  </div>
                </div>

                {filteredAndSortedLibraryItems.length === 0 ? (
                  <div className="py-12 flex items-center justify-center text-text-muted">
                    Tidak ada hasil yang cocok dengan &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 p-4 max-w-7xl mx-auto w-full">
                    {filteredAndSortedLibraryItems.map((item) => (
                      <MangaCard
                        key={`${item.sourceId}::${item.mangaId}`}
                        manga={{
                          id: item.mangaId,
                          title: item.title,
                          coverUrl: item.coverUrl || "",
                          status: item.status,
                        }}
                        sourceId={item.sourceId}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0 outline-none">
            {historyItems.length > 0 && (
              <div className="px-4 py-2 flex justify-end max-w-3xl mx-auto w-full">
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Hapus semua riwayat baca?")) {
                      clearHistory();
                    }
                  }}
                >
                  Hapus semua
                </Button>
              </div>
            )}
            
            {historyItems.length === 0 ? (
              <EmptyState
                icon={<Clock size={48} className="text-text-muted" weight="duotone" />}
                title="Belum ada riwayat baca"
                description="Buka chapter untuk mulai membaca. Progres bacaanmu akan muncul di sini."
                action={
                  <Button asChild variant="default" className="rounded-full">
                    <Link href="/">
                      <Play size={20} weight="fill" />
                      Mulai Membaca
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-3 p-4 max-w-3xl mx-auto w-full">
                {historyItems.map((item) => (
                  <HistoryRow
                    key={`${item.sourceId}::${item.mangaId}::${item.chapterId}`}
                    item={item}
                    onRemove={removeHistoryItem}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </MobilePageShell>
    </DirectionalTransition>
  );
}
