"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  Bell, 
  WarningCircle, 
  ArrowsClockwise, 
  CalendarBlank, 
  BookBookmark, 
  Sparkle,
  CheckCircle,
  CaretDown
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { useUpdateStore } from "@/shared/store/update-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useUpdateChecker } from "@/shared/hooks/use-update-checker";
import { useMounted } from "@/shared/hooks/use-mounted";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MangaCover } from "@/components/manga/manga-cover";
import { UpdatesSkeleton } from "@/components/skeletons/updates-skeleton";
import { MangaUpdateItem } from "@/shared/types/update";
import { cn } from "@/shared/utils/cn";

export const WEEKDAYS = [
  { key: "all", name: "Semua", dayIndex: -1 },
  { key: "1", name: "Senin", dayIndex: 1 },
  { key: "2", name: "Selasa", dayIndex: 2 },
  { key: "3", name: "Rabu", dayIndex: 3 },
  { key: "4", name: "Kamis", dayIndex: 4 },
  { key: "5", name: "Jumat", dayIndex: 5 },
  { key: "6", name: "Sabtu", dayIndex: 6 },
  { key: "0", name: "Minggu", dayIndex: 0 },
];

export interface WeeklyMangaItem {
  key: string;
  sourceId: string;
  mangaId: string;
  mangaTitle: string;
  coverUrl?: string;
  sourceName?: string;
  latestChapterId?: string;
  latestChapterNumber?: number;
  latestChapterTitle?: string;
  detectedAt?: string;
  seenAt?: string;
  error?: string;
  releaseDay?: number;
  inferredDay: number;
  effectiveDay: number;
}

// ErrorBanner


function ErrorBanner({
  errorItems,
  onRetry,
  isScanning,
}: {
  errorItems: WeeklyMangaItem[];
  onRetry: () => void;
  isScanning: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = errorItems.length;
  const label = count === 1 ? "1 manga" : `${count} manga`;

  return (
    <div className="mb-6 rounded-2xl bg-semantic-error/8 border border-semantic-error/20 overflow-hidden shadow-xs">
      <div className="flex gap-3 items-start p-3.5">
        <WarningCircle
          size={18}
          className="text-semantic-error shrink-0 mt-0.5"
          weight="fill"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {label} gagal dimuat
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors px-2 py-0.5 rounded-lg hover:bg-surface-hover"
              >
                {expanded ? "Sembunyikan" : "Lihat detail"}
              </button>
              <button
                onClick={onRetry}
                disabled={isScanning}
                className="flex items-center gap-1 text-[11px] font-semibold text-semantic-error hover:text-semantic-error/80 transition-colors px-2 py-0.5 rounded-lg hover:bg-semantic-error/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowsClockwise
                  size={12}
                  weight="bold"
                  className={isScanning ? "animate-spin" : ""}
                />
                Coba lagi
              </button>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Server penyedia komik mungkin sedang sibuk atau tidak bisa dijangkau.
          </p>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-semantic-error/15 px-3.5 pb-3.5 pt-2 space-y-1.5 bg-surface-raised/40">
          {errorItems.map((item) => (
            <div
              key={item.key}
              className="flex items-start gap-2"
            >
              <span className="text-semantic-error/60 text-[10px] mt-0.5 shrink-0">•</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {item.mangaTitle || item.mangaId}
                </p>
                <p className="text-[10px] text-text-muted truncate">
                  {item.sourceId} · {item.error}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface UpdatesListProps {
  /** Passed from page so the Refresh button can live in the header action slot */
  renderRefreshButton?: (props: {
    isScanning: boolean;
    onRefresh: () => void;
  }) => React.ReactNode;
  /** Initial selected day key: 'all' | '0' | '1' | ... | '6' */
  initialDay?: string;
  /** Hide in-component title when used with PageHeader */
  hideHeader?: boolean;
}

export function UpdatesList({ renderRefreshButton, initialDay, hideHeader = false }: UpdatesListProps = {}) {
  const isMounted = useMounted();
  const libraryItems = useLibraryStore((state) => state.items || {});
  const updateLibraryItem = useLibraryStore((state) => state.updateLibraryItem);
  const { items: updateItems, markAllAsSeen } = useUpdateStore();
  const { isScanning, triggerScan } = useUpdateChecker();
  const getLatestForManga = useHistoryStore((state) => state.getLatestForManga);
  const todayKey = useMemo(() => String(new Date().getDay()), []);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(initialDay ?? todayKey);

  useEffect(() => {
    // Mark all as seen on unmount
    return () => {
      markAllAsSeen();
    };
  }, [markAllAsSeen]);

  // Combine library bookmarks with update store data
  const allItems = useMemo<WeeklyMangaItem[]>(() => {
    const validLibEntries = Object.values(libraryItems).filter(
      (lib) => Boolean(lib && lib.sourceId && lib.mangaId)
    );

    if (validLibEntries.length > 0) {
      const mapped = validLibEntries.map((lib) => {
        const updateKey = `${lib.sourceId}::${lib.mangaId}`;
        const upd = updateItems[updateKey];

        const inferredDay = (() => {
          if (upd?.detectedAt) return new Date(upd.detectedAt).getDay();
          if (lib.updatedAt) return new Date(lib.updatedAt).getDay();
          if (lib.addedAt) return new Date(lib.addedAt).getDay();
          return 1; // Default Senin
        })();

        const effectiveDay = lib.releaseDay !== undefined ? lib.releaseDay : inferredDay;

        // Clean up title: if lib.title is missing, fallback to upd.mangaTitle or humanized mangaId
        const rawTitle = lib.title?.trim() || upd?.mangaTitle?.trim() || "";
        const mangaTitle =
          rawTitle ||
          lib.mangaId.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        return {
          key: updateKey,
          sourceId: lib.sourceId,
          mangaId: lib.mangaId,
          mangaTitle,
          coverUrl: lib.coverUrl || upd?.coverUrl,
          sourceName: lib.sourceName || upd?.sourceName || lib.sourceId,
          latestChapterId: upd?.latestChapterId,
          latestChapterNumber: upd?.latestChapterNumber,
          latestChapterTitle: upd?.latestChapterTitle,
          detectedAt: upd?.detectedAt || lib.updatedAt || lib.addedAt,
          seenAt: upd?.seenAt,
          error: upd?.error,
          releaseDay: lib.releaseDay,
          inferredDay,
          effectiveDay,
        };
      });

      // Deduplicate by updateKey (sourceId::mangaId) to ensure uniqueness
      const dedupedMap = new Map<string, WeeklyMangaItem>();
      for (const item of mapped) {
        if (!dedupedMap.has(item.key)) {
          dedupedMap.set(item.key, item);
        } else {
          // If collision occurs, pick the one with manual releaseDay or latest detectedAt
          const existing = dedupedMap.get(item.key)!;
          const existingTime = existing.detectedAt ? new Date(existing.detectedAt).getTime() : 0;
          const newTime = item.detectedAt ? new Date(item.detectedAt).getTime() : 0;
          if (item.releaseDay !== undefined && existing.releaseDay === undefined) {
            dedupedMap.set(item.key, item);
          } else if (newTime > existingTime) {
            dedupedMap.set(item.key, item);
          }
        }
      }

      const dedupedItems = Array.from(dedupedMap.values());

      // Sort by detectedAt descending
      return dedupedItems.sort((a, b) => {
        const timeA = a.detectedAt ? new Date(a.detectedAt).getTime() : 0;
        const timeB = b.detectedAt ? new Date(b.detectedAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    // Fallback: If library store is empty (e.g. unit tests with mocked update-store), use updateItems
    const validUpdates = Object.values(updateItems).filter(
      (upd) => Boolean(upd && upd.sourceId && upd.mangaId)
    );
    const updateEntries = validUpdates.map((upd) => {
      const updateKey = `${upd.sourceId}::${upd.mangaId}`;
      const inferredDay = upd.detectedAt ? new Date(upd.detectedAt).getDay() : 1;
      const rawTitle = upd.mangaTitle?.trim() || "";
      const mangaTitle =
        rawTitle ||
        upd.mangaId.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        key: updateKey,
        sourceId: upd.sourceId,
        mangaId: upd.mangaId,
        mangaTitle,
        coverUrl: upd.coverUrl,
        sourceName: upd.sourceName || upd.sourceId,
        latestChapterId: upd.latestChapterId,
        latestChapterNumber: upd.latestChapterNumber,
        latestChapterTitle: upd.latestChapterTitle,
        detectedAt: upd.detectedAt,
        seenAt: upd.seenAt,
        error: upd.error,
        releaseDay: undefined,
        inferredDay,
        effectiveDay: inferredDay,
      };
    });

    const dedupedFallbackMap = new Map<string, WeeklyMangaItem>();
    for (const item of updateEntries) {
      if (!dedupedFallbackMap.has(item.key)) {
        dedupedFallbackMap.set(item.key, item);
      }
    }

    return Array.from(dedupedFallbackMap.values()).sort((a, b) => {
      const timeA = a.detectedAt ? new Date(a.detectedAt).getTime() : 0;
      const timeB = b.detectedAt ? new Date(b.detectedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [libraryItems, updateItems]);

  const errorItems = useMemo(() => allItems.filter((i) => i.error), [allItems]);

  // Filtered list based on selected weekly day
  const displayedItems = useMemo(() => {
    if (selectedDayKey === "all") return allItems;
    const dayIndex = Number(selectedDayKey);
    return allItems.filter((i) => i.effectiveDay === dayIndex);
  }, [selectedDayKey, allItems]);

  // Segment options (Variant 7 Reusable Quick Rail)
  const quickSegmentOptions = useMemo(() => {
    const todayIndex = new Date().getDay();
    return WEEKDAYS.map((w) => {
      const dayItems = w.key === "all" ? allItems : allItems.filter((i) => i.effectiveDay === w.dayIndex);
      const hasUnread = dayItems.some((i) => i.latestChapterId && !i.seenAt);
      const isCurrentDay = w.dayIndex === todayIndex;
      const label = isCurrentDay ? `${w.name}*` : w.name;
      return {
        value: w.key,
        label,
        badge: dayItems.length > 0 ? dayItems.length : undefined,
        badgeVariant: hasUnread ? ("error" as const) : ("muted" as const),
      };
    });
  }, [allItems]);

  return (
    <div className="w-full space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Jadwal Rilis Mingguan
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Komik bookmark yang dijadwalkan update per hari (ala Notion)
            </p>
          </div>

          {renderRefreshButton ? (
            renderRefreshButton({
              isScanning,
              onRefresh: () => triggerScan({ forceRefresh: true }),
            })
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => triggerScan({ forceRefresh: true })}
              disabled={isScanning}
              className="gap-2 rounded-xl shrink-0"
            >
              <ArrowsClockwise
                size={15}
                weight="bold"
                className={isScanning ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
        </div>
      )}

      {errorItems.length > 0 && (
        <ErrorBanner
          errorItems={errorItems}
          onRetry={() => triggerScan({ forceRefresh: true })}
          isScanning={isScanning}
        />
      )}

      {(!isMounted || (isScanning && allItems.length === 0)) ? (
        <div className="py-4">
          <UpdatesSkeleton count={6} />
        </div>
      ) : allItems.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<Bell size={48} className="text-text-muted" weight="duotone" />}
            title="Tidak ada update komik di koleksimu"
            description="Bookmark komik favoritmu untuk memantau jadwal rilis mingguan (Senin–Minggu) di sini."
            action={
              <Button asChild variant="primary" className="rounded-xl mt-4">
                <Link href="/library">Jelajah Komik</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* 7-Day Notion Weekly Quick Rail */}
          <div className="space-y-2.5">
            <div className="overflow-x-auto [scrollbar-width:none] pb-1">
              <SegmentedControl
                options={quickSegmentOptions}
                value={selectedDayKey}
                onChange={setSelectedDayKey}
                variant="quick-rail"
                layoutId="weekly-calendar-pill"
                size="sm"
                fullWidth
                className="min-w-[620px]"
              />
            </div>
            <p className="text-[11px] text-text-muted px-1 flex items-center gap-1.5">
              <span>* Hari ini</span>
              <span>•</span>
              <span>Klik jadwal di kartu komik untuk mengatur hari rilis manual</span>
            </p>
          </div>

          {/* Manga List for Selected Day */}
          {displayedItems.length === 0 ? (
            <div className="py-12 rounded-2xl bg-surface-raised/50 border border-border-subtle p-6 text-center space-y-3">
              <CalendarBlank size={36} className="text-text-muted mx-auto" weight="duotone" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-text-primary">
                  {selectedDayKey === todayKey
                    ? "Tidak ada komik rilis hari ini"
                    : `Belum ada komik untuk hari ${WEEKDAYS.find((d) => d.key === selectedDayKey)?.name}`}
                </h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  {selectedDayKey === todayKey
                    ? "Tidak ada komik di bookmark yang dijadwalkan hari ini. Kamu bisa cek hari lain atau atur hari rilis manual."
                    : "Kamu bisa mengatur hari rilis komik favoritmu ke hari ini melalui pilihan jadwal pada kartu komik."}
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDayKey("all")}
                >
                  Lihat Semua Hari
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedItems.map((item) => {
                const historyItem = isMounted ? getLatestForManga(item.sourceId, item.mangaId) : undefined;
                const hasHistory = Boolean(historyItem);
                const targetChapterId = (hasHistory && historyItem?.chapterId)
                  ? historyItem.chapterId
                  : item.latestChapterId;
                const hasTargetChapter = Boolean(targetChapterId);

                // Distinct destinations per UX hierarchy
                // Card / Title click -> Manga Detail (with returnTo=/updates for contextual back)
                const detailHref = getMangaDetailHref(item.sourceId, item.mangaId, "/updates");
                // Action button click -> Direct to Reader chapter (or detail if no chapter found)
                const readerHref = hasTargetChapter
                  ? getReaderHref(item.sourceId, item.mangaId, targetChapterId!, "/updates")
                  : detailHref;

                // Adaptive CTA label: "Lanjut Baca" if previously read, "Mulai Baca" if new
                const ctaLabel = hasHistory ? "Lanjut Baca" : "Mulai Baca";

                const isUnread = Boolean(item.latestChapterId && !item.seenAt);
                const dayName = WEEKDAYS.find((d) => d.dayIndex === item.effectiveDay)?.name || "Senin";

                return (
                  <div
                    key={item.key}
                    className="p-3 rounded-2xl bg-surface-raised border border-border-subtle hover:border-border-strong hover:bg-surface-hover transition-all group shadow-xs flex items-center justify-between gap-3"
                  >
                    {/* Left: Cover & Info (Clicking leads to Manga Detail) */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Link
                        href={detailHref}
                        className="relative w-[52px] h-[72px] rounded-lg overflow-hidden shrink-0 bg-surface-muted border border-border-subtle/70 shadow-xs group-hover:scale-[1.02] transition-transform"
                        aria-label={`Lihat detail ${item.mangaTitle}`}
                      >
                        <MangaCover
                          src={item.coverUrl}
                          alt={item.mangaTitle}
                          iconSize={20}
                        />
                      </Link>

                      <div className="flex-1 min-w-0 space-y-1">
                        <Link href={detailHref} className="block min-w-0">
                          <h4 className="font-bold text-sm text-text-primary truncate group-hover:text-accent transition-colors">
                            {item.mangaTitle}
                          </h4>
                        </Link>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-muted border border-border-subtle font-medium text-text-secondary">
                            {item.sourceName || item.sourceId}
                          </span>
                          {isUnread && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-semantic-error text-white font-extrabold shadow-xs">
                              NEW
                            </span>
                          )}
                          <span className="text-xs text-text-muted truncate font-medium">
                            {item.latestChapterTitle || (item.latestChapterNumber ? `Ch. ${item.latestChapterNumber}` : "Siap dibaca")}
                          </span>
                        </div>

                        {/* Notion Tag Dropdown with Custom Squircle Chip */}
                        <div className="pt-0.5">
                          <div className="relative inline-flex items-center">
                            <select
                              aria-label={`Jadwal rilis untuk ${item.mangaTitle}`}
                              value={item.releaseDay !== undefined ? String(item.releaseDay) : ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? undefined : Number(e.target.value);
                                updateLibraryItem(item.sourceId, item.mangaId, { releaseDay: val });
                                const targetName = val !== undefined ? WEEKDAYS.find((d) => d.dayIndex === val)?.name : "Otomatis";
                                toast.success(`Jadwal ${item.mangaTitle} diatur ke ${targetName}`);
                              }}
                              className="appearance-none text-[11px] font-semibold py-1 pl-2.5 pr-6 rounded-md bg-surface-base border border-border-subtle hover:border-accent/40 text-text-secondary hover:text-accent transition-all cursor-pointer outline-none shadow-xs"
                            >
                              <option value="">Auto ({dayName})</option>
                              <option value="1">📅 Senin</option>
                              <option value="2">📅 Selasa</option>
                              <option value="3">📅 Rabu</option>
                              <option value="4">📅 Kamis</option>
                              <option value="5">📅 Jumat</option>
                              <option value="6">📅 Sabtu</option>
                              <option value="0">📅 Minggu</option>
                            </select>
                            <CaretDown
                              size={12}
                              weight="bold"
                              className="absolute right-2 text-text-muted pointer-events-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Direct Read Button (Squircle rounded-lg, NOT Pill) */}
                    <Link
                      href={readerHref}
                      className="h-8 px-3 rounded-lg bg-accent text-white hover:bg-accent-hover font-bold text-xs shadow-xs active:scale-95 shrink-0 flex items-center justify-center transition-all whitespace-nowrap"
                    >
                      {ctaLabel}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

