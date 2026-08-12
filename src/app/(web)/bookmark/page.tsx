"use client";

import React from "react";
import Link from "next/link";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { ShelfCard } from "@/components/manga/card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/shared/hooks/use-mounted";
import { getLibraryHref, getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import {
  BookBookmark,
  Compass,
  Clock,
  Play,
  Trash,
  CheckCircle,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { SearchInput } from "@/components/ui/search-input";
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
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { PageHeader } from "@/components/app/header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

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
  return date.toLocaleDateString("id-ID");
}

export default function BookmarkPage() {
  const isMounted = useMounted();

  // Collection state
  const libraryItemsMap = useLibraryStore((state) => state.items);
  const libraryItems = Object.values(libraryItemsMap);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"updatedAt" | "title">("updatedAt");
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [collectionPage, setCollectionPage] = React.useState(1);
  const ITEMS_PER_PAGE = 24;
  const removeFromLibrary = useLibraryStore((state) => state.removeFromLibrary);
  const hideNsfw = useSettingsStore((state) => state.hideNsfw);
  const nsfwSourceIds = useNsfwSourceIds();
  const { isSourceDisabled } = useSourcePreferencesStore();

  const isFromNsfwSource = React.useCallback(
    (sourceId: string, itemIsNsfw?: boolean) =>
      itemIsNsfw === true || nsfwSourceIds.has(sourceId),
    [nsfwSourceIds]
  );

  const filteredAndSortedLibraryItems = React.useMemo(() => {
    if (!isMounted) return [];
    let result = [...libraryItems];

    result = result.filter((item) => {
      if (isSourceDisabled(item.sourceId)) return false;
      const source = dynamicSourceRegistry.get(item.sourceId);
      if (source && source.status === "unavailable") return false;
      return true;
    });

    if (hideNsfw) {
      result = result.filter(
        (item) => !isFromNsfwSource(item.sourceId, item.isNsfw)
      );
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.title.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "updatedAt") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [isMounted, libraryItems, searchQuery, sortBy, hideNsfw, isFromNsfwSource, isSourceDisabled]);

  // Reset pagination when search or sort changes
  React.useEffect(() => {
    setCollectionPage(1);
  }, [searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedLibraryItems.length / ITEMS_PER_PAGE));
  const paginatedCollection = React.useMemo(() => {
    const start = (collectionPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedLibraryItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedLibraryItems, collectionPage]);

  // History state
  const getHistoryList = useHistoryStore((state) => state.getHistoryList);
  useHistoryStore((state) => state.items);
  const removeMangaHistory = useHistoryStore((state) => state.removeMangaHistory);

  const rawHistoryItems = isMounted ? getHistoryList() : [];

  let historyItems = rawHistoryItems.filter((item) => {
    if (isSourceDisabled(item.sourceId)) return false;
    const source = dynamicSourceRegistry.get(item.sourceId);
    if (source && source.status === "unavailable") return false;
    return true;
  });

  if (hideNsfw) {
    historyItems = historyItems.filter(
      (item) => !isFromNsfwSource(item.sourceId, item.isNsfw)
    );
  }

  const groupedHistory = React.useMemo(() => {
    const groups: Record<
      string,
      {
        sourceId: string;
        mangaId: string;
        mangaTitle: string;
        coverUrl?: string;
        sourceName?: string;
        latestReadAt: number;
        chapters: typeof historyItems;
      }
    > = {};

    historyItems.forEach((item) => {
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

  // Undo / delete state
  const [pendingDeletions, setPendingDeletions] = React.useState<Set<string>>(new Set());
  const deleteTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});
  const [itemToDelete, setItemToDelete] = React.useState<{
    sourceId: string;
    mangaId: string;
    mangaTitle: string;
  } | null>(null);

  const handleRemoveHistory = React.useCallback(
    (sourceId: string, mangaId: string, mangaTitle: string) => {
      setItemToDelete({ sourceId, mangaId, mangaTitle });
    },
    []
  );

  const confirmDelete = React.useCallback(() => {
    if (!itemToDelete) return;
    const { sourceId, mangaId, mangaTitle } = itemToDelete;
    const key = `${sourceId}::${mangaId}`;
    setPendingDeletions((prev) => new Set(prev).add(key));
    setItemToDelete(null);

    const timeoutId = setTimeout(() => {
      removeMangaHistory(sourceId, mangaId);
      setPendingDeletions((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      delete deleteTimeouts.current[key];
    }, 5000);

    deleteTimeouts.current[key] = timeoutId;

    toast(`Riwayat "${mangaTitle}" dihapus`, {
      duration: 5000,
      action: {
        label: "Batal",
        onClick: () => {
          clearTimeout(timeoutId);
          delete deleteTimeouts.current[key];
          setPendingDeletions((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        },
      },
    });
  }, [itemToDelete, removeMangaHistory]);

  const visibleHistory = React.useMemo(
    () =>
      groupedHistory.filter(
        (g) => !pendingDeletions.has(`${g.sourceId}::${g.mangaId}`)
      ),
    [groupedHistory, pendingDeletions]
  );

  // ── Skeleton shell (pre-mount) ──────────────────────────────────────────
  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen pb-[calc(var(--bottom-nav-height,80px)+24px)]">
        <h1 className="sr-only">Rak Buku Yomirra</h1>
        {/* Header Skeleton */}
        <div className="px-4 pt-[calc(var(--safe-top)+16px)] pb-4 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-44 rounded-md" />
          </div>
        </div>
        {/* Tab Skeleton */}
        <div className="px-4 pt-1 pb-4">
          <Skeleton className="h-[46px] w-full rounded-full" />
        </div>
        {/* Reading Card Skeletons */}
        <div className="px-4 mt-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <MangaCardSkeleton key={i} variant="history" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen pb-[calc(var(--bottom-nav-height,80px)+24px)]">
        {/* ── Document Flow Header ── */}
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
          <PageHeader
            title="Rak Buku"
            description="Bacaan & koleksi kamu"
            icon={<BookBookmark size={32} weight="duotone" />}
          />
        </div>

        {/* ── Segmented Control ── */}
        <div
          role="tablist"
          aria-label="Rak Buku"
          className="px-4 pt-1 pb-4 w-full"
        >
          <SegmentedControl
            options={[
              { value: "reading", label: "Sedang Dibaca" },
              { value: "collection", label: "Koleksi" },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val as "reading" | "collection")}
            variant="glass-floating"
            fullWidth
            className="h-[46px]"
            layoutId="bookmark-tab-pill"
          />
        </div>

        {/* ── Tab Content ── */}
        <div className="px-4 mt-1 outline-none">
          {/* ────────────────── SEDANG DIBACA ────────────────── */}
          {activeTab === "reading" && (
            <div
              role="tabpanel"
              id="tabpanel-reading"
              aria-labelledby="tab-reading"
              className="space-y-4"
            >
              {visibleHistory.length === 0 ? (
                <EmptyState
                  icon={<Clock size={48} className="text-text-muted" weight="duotone" />}
                  title="Belum ada bacaan aktif"
                  description="Komik yang kamu baca akan muncul di sini."
                  action={
                    <Button
                      asChild
                      variant="accent"
                      className="rounded-full shadow-sm font-bold mt-4"
                    >
                      <Link href={getLibraryHref()}>
                        <Compass size={20} weight="bold" className="mr-1.5" />
                        Eksplor Manga
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <>
                  {/* Optional Summary */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      {visibleHistory.length} Bacaan Aktif
                    </span>
                    <span className="text-2xs text-text-muted/60">
                      Terakhir dibaca
                    </span>
                  </div>

                  {/* Reading Cards Grid/List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleHistory.map((group) => {
                      const item = group.chapters[0];
                      const timeText = getRelativeTime(
                        new Date(item.readAt).toISOString()
                      );
                      const progress = item.progressPercent || 0;
                      const detailHref = getMangaDetailHref(
                        group.sourceId,
                        group.mangaId,
                        "/bookmark"
                      );
                      const readerHref = getReaderHref(
                        group.sourceId,
                        group.mangaId,
                        item.chapterId,
                        "/bookmark"
                      );

                      return (
                        <div
                          key={`${group.sourceId}::${group.mangaId}`}
                          className="group relative flex flex-col bg-surface-raised/20 hover:bg-surface-raised/50 border border-border-subtle/50 rounded-2xl p-3 shadow-none transition-all duration-200"
                        >
                          <div className="flex gap-3 items-start">
                            {/* Cover -> Manga Detail */}
                            <Link
                              href={detailHref}
                              className="w-[68px] shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-surface-muted border border-border-subtle/40 shadow-2xs group-hover:scale-[1.02] transition-transform duration-300"
                            >
                              {group.coverUrl && (
                                <img
                                  src={group.coverUrl}
                                  alt={group.mangaTitle}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </Link>

                            {/* Info -> Manga Detail */}
                            <div className="flex-1 flex flex-col min-w-0 py-0.5 justify-between self-stretch">
                              <div className="flex items-start justify-between gap-1.5">
                                <Link href={detailHref} className="min-w-0 flex-1 group/title">
                                  <h3 className="font-bold text-sm leading-snug text-text-primary group-hover/title:text-accent transition-colors line-clamp-2">
                                    {group.mangaTitle}
                                  </h3>
                                  <p className="text-xs font-semibold text-accent mt-1 truncate">
                                    {item.chapterTitle || "Chapter ?"}
                                  </p>
                                  <p className="text-[11px] text-text-muted mt-0.5">
                                    {timeText || "Baru saja"}
                                  </p>
                                </Link>

                                {/* Explicit Trash Delete Action */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveHistory(
                                      group.sourceId,
                                      group.mangaId,
                                      group.mangaTitle
                                    )
                                  }
                                  className="p-1.5 -mr-1 -mt-1 rounded-xl text-text-muted/60 hover:text-semantic-error hover:bg-semantic-error/10 transition-colors shrink-0"
                                  aria-label={`Hapus ${group.mangaTitle} dari riwayat`}
                                >
                                  <Trash size={16} weight="bold" />
                                </button>
                              </div>

                              {/* Progress bar & Continue CTA -> Reader */}
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <Link href={readerHref}>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 px-3 rounded-full text-xs font-bold text-accent border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors"
                                  >
                                    <Play size={11} weight="fill" className="mr-1" />
                                    Lanjutkan
                                  </Button>
                                </Link>

                                {progress > 0 && (
                                  <span className="text-[11px] font-semibold text-text-muted/70">
                                    {Math.round(progress)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Progress Line */}
                          {progress > 0 && (
                            <div className="h-1 bg-surface-muted/60 rounded-full overflow-hidden w-full mt-3">
                              <div
                                className="h-full bg-accent rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ────────────────── KOLEKSI ────────────────── */}
          {activeTab === "collection" && (
            <div
              role="tabpanel"
              id="tabpanel-collection"
              aria-labelledby="tab-collection"
              className="space-y-4"
            >
              {libraryItems.length === 0 ? (
                <EmptyState
                  icon={
                    <BookBookmark
                      size={48}
                      className="text-text-muted"
                      weight="duotone"
                    />
                  }
                  title="Belum ada komik tersimpan"
                  description="Simpan manga dari halaman detail untuk menemukannya di sini."
                  action={
                    <Button
                      asChild
                      variant="accent"
                      className="rounded-full shadow-sm font-bold mt-4"
                    >
                      <Link href="/">
                        <Compass size={20} weight="bold" className="mr-1.5" />
                        Eksplor Manga
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <>
                  {/* Toolbar Row 1: Full-width Search */}
                  <SearchInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => setSearchQuery("")}
                    placeholder="Cari di koleksi..."
                    aria-label="Cari di koleksi"
                    containerClassName="border border-border-default/50 shadow-2xs h-11"
                  />

                  {/* Toolbar Row 2: Sort + Selection Toggle */}
                  <div className="flex gap-2 items-center">
                    <CustomSelect
                      align="left"
                      value={sortBy}
                      onChange={(val) =>
                        setSortBy(val as "updatedAt" | "title")
                      }
                      options={[
                        { value: "updatedAt", label: "Terbaru Ditambahkan" },
                        { value: "title", label: "Judul Buku" },
                      ]}
                      className="flex-1"
                      buttonClassName="w-full h-11"
                    />

                    <Button
                      variant={isSelectionMode ? "accent" : "secondary"}
                      className="rounded-xl h-11 px-4 font-bold shrink-0 shadow-2xs border-border-default/40"
                      onClick={() => {
                        if (isSelectionMode) {
                          setIsSelectionMode(false);
                          setSelectedItems(new Set());
                        } else {
                          setIsSelectionMode(true);
                        }
                      }}
                    >
                      {isSelectionMode ? "Batal" : "Pilih"}
                    </Button>
                  </div>

                  {/* Grid or Empty Search Result */}
                  {filteredAndSortedLibraryItems.length === 0 ? (
                    <EmptyState
                      icon={
                        <MagnifyingGlass
                          size={48}
                          className="text-text-muted"
                          weight="duotone"
                        />
                      }
                      title="Tidak ada manga yang cocok"
                      description={`Coba kata kunci lain untuk "${searchQuery}"`}
                      className="my-8"
                    />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-7 pt-1">
                      {paginatedCollection.map((item, index) => {
                        const itemId = `${item.sourceId}::${item.mangaId}`;
                        const enrichedManga = {
                          id: item.mangaId,
                          title: item.title,
                          coverUrl: item.coverUrl || "",
                          status: item.status,
                          latestChapter:
                            item.lastReadChapterTitle || undefined,
                        };
                        return (
                          <div
                            key={itemId}
                            className="relative group select-none"
                            onClickCapture={(e) => {
                              if (isSelectionMode) {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedItems((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(itemId)) next.delete(itemId);
                                  else next.add(itemId);
                                  return next;
                                });
                              }
                            }}
                          >
                            <ShelfCard
                              manga={enrichedManga}
                              sourceId={item.sourceId}
                              priority={index < 6}
                            />

                            {isSelectionMode && (
                              <div className="absolute inset-0 bg-black/40 z-30 flex items-center justify-center rounded-2xl transition-all cursor-pointer">
                                {selectedItems.has(itemId) ? (
                                  <CheckCircle
                                    weight="fill"
                                    size={44}
                                    className="text-accent drop-shadow-md"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full border-2 border-white/70 bg-black/20" />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 pb-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCollectionPage((p) => Math.max(1, p - 1))}
                              aria-disabled={collectionPage === 1}
                              className={cn(collectionPage === 1 && "pointer-events-none opacity-50")}
                            />
                          </PaginationItem>

                          {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= collectionPage - 1 && page <= collectionPage + 1)
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    isActive={page === collectionPage}
                                    onClick={() => setCollectionPage(page)}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }

                            if (
                              page === collectionPage - 2 ||
                              page === collectionPage + 2
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }

                            return null;
                          })}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCollectionPage((p) => Math.min(totalPages, p + 1))}
                              aria-disabled={collectionPage === totalPages}
                              className={cn(collectionPage === totalPages && "pointer-events-none opacity-50")}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}

              {/* Selection Bulk Action Bar */}
              <AnimatePresence>
                {isSelectionMode && selectedItems.size > 0 && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-surface-overlay/95 backdrop-blur-md border border-border-strong px-4 py-2.5 rounded-full shadow-heavy"
                    style={{ bottom: "calc(var(--bottom-nav-height, 80px) + 24px)" }}
                  >
                    <span className="font-bold text-sm text-text-primary">
                      {selectedItems.size} dipilih
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-full font-bold shadow-xs px-4"
                      onClick={() => {
                        selectedItems.forEach((id) => {
                          const [src, manga] = id.split("::");
                          removeFromLibrary(src, manga);
                        });
                        setIsSelectionMode(false);
                        setSelectedItems(new Set());
                        toast.success(
                          `${selectedItems.size} komik dihapus dari koleksi`
                        );
                      }}
                    >
                      Hapus
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <DialogContent className="max-w-xs rounded-3xl p-6 sm:max-w-sm">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl font-bold">Hapus Riwayat?</DialogTitle>
            <DialogDescription className="text-sm text-text-muted">
              Yakin mau menghapus{" "}
              <strong className="text-text-primary">
                {itemToDelete?.mangaTitle}
              </strong>{" "}
              dari rak buku kamu?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row justify-end gap-3 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => setItemToDelete(null)}
              className="flex-1 rounded-full font-bold h-11"
            >
              Nanti aja
            </Button>
            <Button
              variant="accent"
              onClick={confirmDelete}
              className="flex-1 rounded-full font-bold h-11 bg-semantic-error hover:bg-semantic-error/90 text-white"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
