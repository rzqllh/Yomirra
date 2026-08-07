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
  List,
  SquaresFour,
  CheckCircle,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { SearchInput } from "@/components/ui/search-input";
import { YomirraSurface } from "@/components/ui/layout";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/header";
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
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [collectionPage, setCollectionPage] = React.useState(1);
  const ITEMS_PER_PAGE = 30;
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
  }, [libraryItems, searchQuery, sortBy, hideNsfw, isFromNsfwSource, isSourceDisabled]);

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
      <div className="flex flex-col min-h-screen pb-[var(--page-bottom-safe)]">
        <h1 className="sr-only">Rak Buku Yomirra</h1>
        <YomirraPageHeader
          title="Rak Buku"
          variant="transparent"
          icon={<BookBookmark size={24} weight="duotone" />}
        />
        <YomirraSurface variant="base" className="flex-1 w-full max-w-7xl mx-auto">
          <div className="hidden md:block px-4 py-8">
            <h1 className="text-3xl font-black text-text-primary tracking-tight">
              Rak Buku
            </h1>
          </div>
          {/* Tab skeleton */}
          <div className="px-4 pt-2 pb-3">
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
          {/* Reading card skeletons */}
          <div className="px-4 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <MangaCardSkeleton key={i} variant="history" />
            ))}
          </div>
        </YomirraSurface>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen pb-[var(--page-bottom-safe)]">
        <h1 className="sr-only">Rak Buku Yomirra</h1>
        <YomirraPageHeader
          title="Rak Buku"
          variant="transparent"
          icon={<BookBookmark size={24} weight="duotone" />}
        />
        <YomirraSurface
          variant="base"
          className="flex-1 w-full max-w-7xl mx-auto md:pb-8"
        >
          {/* Desktop title — hidden on mobile, YomirraPageHeader handles mobile */}
          <div className="hidden md:block px-4 pt-[calc(var(--safe-top)+24px)] pb-4">
            <DesktopPageTitle
              title="Rak Buku"
              description="Koleksi dan riwayat bacaan personal Anda."
              icon={<BookBookmark size={32} weight="duotone" />}
            />
          </div>

          {/* ── Segmented tabs ── */}
          <div
            role="tablist"
            aria-label="Rak Buku"
            className="px-4 pt-2 pb-3 w-full"
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
              layoutId="bookmark-tab-pill"
            />
          </div>

          {/* ── Tab content ── */}
          <div className="mt-4 outline-none">

            {/* ────────────────── SEDANG DIBACA ────────────────── */}
            {activeTab === "reading" && (
              <div
                role="tabpanel"
                id="tabpanel-reading"
                aria-labelledby="tab-reading"
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
                  <div className="px-4 mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {visibleHistory.map((group) => {
                        const item = group.chapters[0];
                        const timeText = getRelativeTime(
                          new Date(item.readAt).toISOString()
                        );
                        const progress = item.progressPercent || 0;
                        const targetHref = getReaderHref(
                          group.sourceId,
                          group.mangaId,
                          item.chapterId,
                          "/bookmark"
                        );

                        return (
                          <Link
                            key={`${group.sourceId}::${group.mangaId}`}
                            href={targetHref}
                            className="relative w-full bg-surface-glass backdrop-blur-sm rounded-xl overflow-hidden border border-border-subtle group shadow-sm hover:shadow-md hover:border-border-default transition-all vt-hover"
                            style={
                              {
                                "--vt-name": `manga-cover-${group.sourceId}-${group.mangaId}`,
                              } as React.CSSProperties
                            }
                          >
                            <div className="flex p-3 gap-3">
                              {/* Cover */}
                              <div className="w-[68px] shrink-0 aspect-[2/3] rounded-lg overflow-hidden shadow-sm bg-surface-muted">
                                {group.coverUrl && (
                                  <img
                                    src={group.coverUrl}
                                    alt={group.mangaTitle}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                                <div className="flex items-start justify-between gap-1 min-w-0">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-sm line-clamp-2 text-text-primary group-hover:text-accent transition-colors leading-snug">
                                      {group.mangaTitle}
                                    </h4>
                                    <p className="text-xs font-medium text-text-muted mt-1 truncate">
                                      {item.chapterTitle || "Chapter ?"}
                                    </p>
                                    <p className="text-[10px] text-text-muted/60 mt-0.5">
                                      {timeText || "Baru saja"}
                                    </p>
                                  </div>
                                  {/* Delete icon — triggers confirm dialog */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveHistory(
                                        group.sourceId,
                                        group.mangaId,
                                        group.mangaTitle
                                      );
                                    }}
                                    className="shrink-0 text-text-muted hover:text-semantic-error p-1.5 -mr-1 -mt-0.5 rounded-full hover:bg-surface-hover transition-colors"
                                    aria-label={`Hapus ${group.mangaTitle} dari riwayat`}
                                  >
                                    <Trash size={16} weight="bold" />
                                  </button>
                                </div>

                                {/* Lanjut CTA */}
                                <div className="mt-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full font-bold pointer-events-none"
                                    tabIndex={-1}
                                  >
                                    <Play size={11} weight="fill" />
                                    Lanjut
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            {progress > 0 && (
                              <div className="h-[3px] bg-surface-muted w-full">
                                <div
                                  className="h-full bg-accent rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ────────────────── KOLEKSI ────────────────── */}
            {activeTab === "collection" && (
              <div
                role="tabpanel"
                id="tabpanel-collection"
                aria-labelledby="tab-collection"
                className="px-4"
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
                    title="Rak koleksi masih kosong"
                    description="Simpan manga dari halaman detail untuk menemukannya di sini."
                    action={
                      <Button
                        asChild
                        variant="accent"
                        className="rounded-full shadow-sm font-bold"
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
                    {/* ── Toolbar ── */}
                    <div className="py-2 flex flex-col gap-2 w-full mb-4">
                      {/* Search — full width */}
                      <SearchInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery("")}
                        placeholder="Cari di koleksi..."
                        aria-label="Cari di koleksi"
                        containerClassName="border border-border-subtle shadow-sm"
                      />
                      {/* Sort + View toggle + Select */}
                      <div className="flex gap-2 items-center relative z-50">
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
                          buttonClassName="w-full"
                        />

                        {/* Grid/list toggle — desktop only */}
                        <div className="hidden sm:flex bg-surface-glass backdrop-blur-md rounded-full p-1 border border-border-subtle shadow-sm h-[44px]">
                          <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                              "flex items-center justify-center w-10 h-full rounded-full transition-colors",
                              viewMode === "grid"
                                ? "bg-accent text-accent-on"
                                : "text-text-muted hover:text-text-primary"
                            )}
                            aria-label="Tampilan grid"
                          >
                            <SquaresFour
                              size={18}
                              weight={viewMode === "grid" ? "fill" : "bold"}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            className={cn(
                              "flex items-center justify-center w-10 h-full rounded-full transition-colors",
                              viewMode === "list"
                                ? "bg-accent text-accent-on"
                                : "text-text-muted hover:text-text-primary"
                            )}
                            aria-label="Tampilan list"
                          >
                            <List
                              size={18}
                              weight={viewMode === "list" ? "fill" : "bold"}
                            />
                          </button>
                        </div>

                        <Button
                          variant={isSelectionMode ? "accent" : "secondary"}
                          className="rounded-full h-[44px] font-bold shrink-0 shadow-sm border-border-subtle"
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
                    </div>

                    {/* ── Grid / List ── */}
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
                      />
                    ) : (
                      <motion.div
                        layout
                        className={cn(
                          viewMode === "grid"
                            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-7"
                            : "flex flex-col gap-3"
                        )}
                      >
                        <AnimatePresence>
                          {paginatedCollection.map((item, index) => {
                            const itemId = `${item.sourceId}::${item.mangaId}`;
                            // Enrich: use lastReadChapterTitle if no latestChapter
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
                                className="relative group"
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
                                  <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center rounded-[var(--radius-md)] sm:rounded-[var(--radius-lg)] transition-all cursor-pointer">
                                    {selectedItems.has(itemId) ? (
                                      <CheckCircle
                                        weight="fill"
                                        size={48}
                                        className="text-accent drop-shadow-md"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-full border-2 border-white/70 bg-black/20" />
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-8 pb-16">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setCollectionPage(p => Math.max(1, p - 1))}
                                aria-disabled={collectionPage === 1}
                                className={cn(collectionPage === 1 && "pointer-events-none opacity-50")}
                              />
                            </PaginationItem>

                            {/* Simple pagination logic for mobile-friendly view */}
                            {[...Array(totalPages)].map((_, i) => {
                              const page = i + 1;
                              // Show first, last, current, and adjacent pages
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

                              // Show ellipsis
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
                                onClick={() => setCollectionPage(p => Math.min(totalPages, p + 1))}
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

                {/* ── Selection bulk action bar ── */}
                <AnimatePresence>
                  {isSelectionMode && selectedItems.size > 0 && (
                    <motion.div
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      className="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-surface-overlay border border-border-strong p-3 rounded-full shadow-heavy"
                      style={{ bottom: "calc(var(--bottom-nav-height) + 24px)" }}
                    >
                      <span className="font-bold px-2 text-text-primary">
                        {selectedItems.size} dipilih
                      </span>
                      <Button
                        variant="destructive"
                        className="rounded-full font-bold shadow-sm"
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
        </YomirraSurface>
      </div>

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <DialogContent className="max-w-xs rounded-3xl p-6 sm:max-w-sm">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl">Hapus Riwayat?</DialogTitle>
            <DialogDescription className="text-base">
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
    </>
  );
}
