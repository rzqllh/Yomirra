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
import { getLibraryHref, getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import { BookBookmark, Compass, Clock, Play, SortDescending, SortAscending, CaretRight, CaretDown, List, SquaresFour } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { DirectionalTransition } from "@/components/ui/directional-transition";
import { SearchInput } from "@/components/ui/search-input";
import { YomirraSurface } from "@/components/ui/layout";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/header";
import { HorizontalScrollContainer } from "@/components/ui/horizontal-scroll-container";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/shared/utils/cn";
function getRelativeTime(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 60) return `${diffInMins} mnt lalu`;
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  if (diffInDays < 30) return `${diffInDays} hr lalu`;
  return date.toLocaleDateString('id-ID');
}

export default function BookmarkPage() {
  const isMounted = useMounted();
  const pathname = usePathname();
  
  // Readlist state
  const libraryItemsMap = useLibraryStore((state) => state.items);
  const libraryItems = Object.values(libraryItemsMap);
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc");
  const [sortBy, setSortBy] = React.useState<"updatedAt" | "title">("updatedAt");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

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
      latestReadAt: number;
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
      if (item.readAt > groups[key].latestReadAt) {
        groups[key].latestReadAt = item.readAt;
      }
    });

    return Object.values(groups).sort((a, b) => b.latestReadAt - a.latestReadAt);
  }, [historyItems]);

  const [activeTab, setActiveTab] = React.useState<"reading" | "collection">("reading");

  // Undo functionality state
  const [pendingDeletions, setPendingDeletions] = React.useState<Set<string>>(new Set());
  const deleteTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});

  const [itemToDelete, setItemToDelete] = React.useState<{sourceId: string, mangaId: string, mangaTitle: string} | null>(null);

  const handleRemoveHistory = React.useCallback((sourceId: string, mangaId: string, mangaTitle: string) => {
    setItemToDelete({ sourceId, mangaId, mangaTitle });
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (!itemToDelete) return;
    
    const { sourceId, mangaId, mangaTitle } = itemToDelete;
    const key = `${sourceId}::${mangaId}`;
    setPendingDeletions(prev => new Set(prev).add(key));
    setItemToDelete(null);
    
    const timeoutId = setTimeout(() => {
      removeMangaHistory(sourceId, mangaId);
      setPendingDeletions(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      delete deleteTimeouts.current[key];
    }, 5000); // 5 detik delay sesuai request
    
    deleteTimeouts.current[key] = timeoutId;
    
    toast(`Riwayat "${mangaTitle}" dihapus`, {
      duration: 5000,
      action: {
        label: "Batal",
        onClick: () => {
          clearTimeout(timeoutId);
          delete deleteTimeouts.current[key];
          setPendingDeletions(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }
      }
    });
  }, [itemToDelete, removeMangaHistory]);

  const visibleHistory = React.useMemo(() => {
    return groupedHistory.filter(g => !pendingDeletions.has(`${g.sourceId}::${g.mangaId}`));
  }, [groupedHistory, pendingDeletions]);

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
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
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto md:pb-8">
          <div className="px-4 pt-[calc(var(--safe-top)+24px)] pb-4">
            <DesktopPageTitle 
              title="Rak Buku" 
              description="Koleksi dan riwayat bacaan personal Anda." 
              icon={<BookBookmark size={32} weight="duotone" />}
            />
          </div>

          <div className="px-4 py-4 w-full md:max-w-md">
            <div className="relative flex bg-surface-muted/50 p-1 rounded-full border border-border-subtle/50 ">
              {["reading", "collection"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "reading" | "collection")}
                  className={`relative flex-1 py-2 text-sm font-bold rounded-full transition-colors z-10 ${
                    activeTab === tab 
                      ? "text-text-primary" 
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="bookmark-tab-indicator"
                      className="absolute inset-0 bg-surface-overlay ring-1 ring-border-default rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {tab === "reading" ? "Sedang Dibaca" : "Koleksi"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 outline-none">
            {activeTab === "reading" && (
              <DirectionalTransition key="reading">
                {visibleHistory.length === 0 ? (
                  <EmptyState
                    icon={<Clock size={48} className="text-text-muted" weight="duotone" />}
                    title="Belum ada riwayat baca"
                    description="Buka chapter untuk mulai membaca. Progres bacaanmu akan muncul di sini."
                    action={
                      <Button asChild variant="accent" className="rounded-full shadow-sm font-bold mt-4">
                        <Link href={getLibraryHref()}>
                          <Compass size={20} weight="bold" className="mr-1.5" />
                          Eksplor Manga
                        </Link>
                      </Button>
                    }
                  />
                ) : (
                  <div className="px-4 mt-4 mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {visibleHistory.map((group) => {
                        const item = group.chapters[0]; // get the latest read chapter
                        const timeText = getRelativeTime(new Date(item.readAt).toISOString());
                        const progress = item.progressPercent || 0;
                        const targetHref = getReaderHref(group.sourceId, group.mangaId, item.chapterId);
                        
                        return (
                          <Link 
                            key={`${group.sourceId}::${group.mangaId}`}
                            href={targetHref}
                            className="relative w-full bg-surface-glass backdrop-blur-sm rounded-2xl overflow-hidden border-border-subtle group shadow-sm hover:-md hover:--default transition-all vt-hover"
                            style={{ '--vt-name': `manga-cover-${group.sourceId}-${group.mangaId}` } as React.CSSProperties}
                          >
                            <div className="flex p-4 gap-4">
                              <div className="w-[80px] shrink-0 aspect-[2/3] rounded-lg overflow-hidden shadow-sm bg-surface-muted">
                                {group.coverUrl && (
                                  <img 
                                    src={group.coverUrl} 
                                    alt={group.mangaTitle} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                              </div>
                              <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                                <h4 className="font-bold text-sm line-clamp-2 text-text-primary group-hover:text-accent transition-colors">{group.mangaTitle}</h4>
                                <p className="text-xs font-medium text-text-muted mt-1 truncate">{item.chapterTitle || "Chapter ?"}</p>
                                <p className="text-[10px] text-text-muted/60 mt-0.5">{timeText || "Baru saja"}</p>
                                
                                <div className="mt-auto pt-3 flex justify-between items-center">
                                  <button className="bg-surface-overlay border border-border-default hover:bg-surface-hover text-text-primary rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors">
                                    <Play weight="fill" /> Lanjut
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleRemoveHistory(group.sourceId, group.mangaId, group.mangaTitle);
                                    }}
                                    className="text-text-muted hover:text-semantic-danger px-2 py-1 transition-colors z-20"
                                    aria-label="Hapus dari riwayat"
                                  >
                                    <span className="text-xs font-semibold">Hapus</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="h-1 bg-surface-muted w-full absolute bottom-0 left-0 right-0">
                              <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
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
                          <Link href="/">
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
                          />
                        </div>
                        <div className="flex gap-2 relative z-50">
                          <CustomSelect
                            align="left"
                            value={sortBy}
                            onChange={(val) => setSortBy(val as "updatedAt" | "title")}
                            options={[
                              { value: "updatedAt", label: "Terbaru Ditambahkan" },
                              { value: "title", label: "Judul Buku" }
                            ]}
                          />
                          <button
                            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-glass backdrop-blur-md text-text-primary hover:bg-surface-glass transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.05)] dark:-[0_4px_16px_rgba(0,0,0,0.2)]"
                            aria-label="Toggle sort order"
                          >
                            {sortOrder === "desc" ? <SortDescending size={20} weight="bold" /> : <SortAscending size={20} weight="bold" />}
                          </button>
                          
                          <div className="hidden sm:flex bg-surface-glass backdrop-blur-md rounded-full p-1 border border-border-subtle shadow-sm h-[44px]">
                            <button
                              type="button"
                              onClick={() => setViewMode("grid")}
                              className={cn("flex items-center justify-center w-10 h-full rounded-full transition-colors", viewMode === "grid" ? "bg-accent text-accent-on" : "text-text-muted hover:text-text-primary")}
                              aria-label="Grid view"
                            >
                              <SquaresFour size={18} weight={viewMode === "grid" ? "fill" : "bold"} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode("list")}
                              className={cn("flex items-center justify-center w-10 h-full rounded-full transition-colors", viewMode === "list" ? "bg-accent text-accent-on" : "text-text-muted hover:text-text-primary")}
                              aria-label="List view"
                            >
                              <List size={18} weight={viewMode === "list" ? "fill" : "bold"} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {filteredAndSortedLibraryItems.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-text-muted">
                          <span className="font-medium">Tidak ada hasil yang cocok dengan &quot;{searchQuery}&quot;</span>
                        </div>
                      ) : (
                        <motion.div 
                          layout 
                          className={cn(
                            viewMode === "grid" 
                              ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5" 
                              : "flex flex-col gap-3",
                            "max-h-[70vh] overflow-y-auto pr-2 -mr-2 [scrollbar-width:thin]"
                          )}
                        >
                          <AnimatePresence>
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
                                variant={viewMode === "grid" ? "shelf" : "history"}
                                priority={index < 6}
                              />
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </DirectionalTransition>
            )}
          </div>
        </YomirraSurface>
      </div>

      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-6 sm:max-w-sm">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl">Hapus Riwayat?</DialogTitle>
            <DialogDescription className="text-base">
              Yakin mau menghapus <strong className="text-text-primary">{itemToDelete?.mangaTitle}</strong> dari rak buku kamu?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row justify-end gap-3 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => setItemToDelete(null)}
              className="flex-1 rounded-full font-bold h-12"
            >
              Nanti aja
            </Button>
            <Button
              variant="accent"
              onClick={confirmDelete}
              className="flex-1 rounded-full font-bold h-12 bg-red-500 hover:bg-red-600 text-white"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DirectionalTransition>
  );
}
