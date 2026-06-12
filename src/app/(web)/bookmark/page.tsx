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
import { BookBookmark, Compass, Clock, Play } from "@phosphor-icons/react";
import { DirectionalTransition } from "@/components/ui/directional-transition";

export default function BookmarkPage() {
  const isMounted = useMounted();
  
  // Readlist state
  const libraryItemsMap = useLibraryStore((state) => state.items);
  const libraryItems = Object.values(libraryItemsMap);
  const sortedLibraryItems = libraryItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // History state
  const getHistoryList = useHistoryStore((state) => state.getHistoryList);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const removeHistoryItem = useHistoryStore((state) => state.removeHistoryItem);
  
  const historyItems = isMounted ? getHistoryList() : [];

  if (!isMounted) {
    return (
      <MobilePageShell title="Bookmark">
        <div className="hidden md:block px-4 py-6">
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
            {sortedLibraryItems.length === 0 ? (
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 p-4 max-w-7xl mx-auto w-full">
                {sortedLibraryItems.map((item) => (
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
