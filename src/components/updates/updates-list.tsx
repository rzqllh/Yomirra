"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  WarningCircle, 
  ArrowsClockwise, 
  CalendarBlank, 
  Play,
  BookOpen
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { useUpdateStore } from "@/shared/store/update-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore, type HistoryItem } from "@/shared/store/history-store";
import { useUpdateChecker } from "@/shared/hooks/use-update-checker";
import { CustomSelect } from "@/components/ui/custom-select";
import { useMounted } from "@/shared/hooks/use-mounted";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MangaCover } from "@/components/manga/manga-cover";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "@/components/manga/card";
import { UpdatesSkeleton } from "@/components/skeletons/updates-skeleton";
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

export interface UpdateCardProps {
  item: WeeklyMangaItem;
  historyItem?: HistoryItem;
  onScheduleChange: (value: string) => void;
}

export function UpdateCard({ item, historyItem, onScheduleChange }: UpdateCardProps) {
  const hasHistory = Boolean(historyItem);
  const targetChapterId = historyItem?.chapterId || item.latestChapterId;
  const detailHref = getMangaDetailHref(item.sourceId, item.mangaId, "/updates");
  const readerHref = targetChapterId
    ? getReaderHref(item.sourceId, item.mangaId, targetChapterId, "/updates")
    : detailHref;
  const isUnread = Boolean(item.latestChapterId && !item.seenAt);
  const dayName = WEEKDAYS.find((day) => day.dayIndex === item.effectiveDay)?.name || "Senin";

  return (
    <article
      className={cn(
        mangaCardSurface({ kind: "nested" }),
        "p-3 sm:p-3.5 group flex items-center justify-between gap-3 overflow-hidden hover:border-accent/40 hover:bg-surface-hover/70 motion-safe:transition-[background-color,border-color,box-shadow] motion-safe:duration-200"
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link
          href={detailHref}
          className={cn("w-[52px] sm:w-[58px] shrink-0 rounded-xs", mangaCardInteraction.link)}
          aria-label={`Lihat detail ${item.mangaTitle}`}
        >
          <MangaCardCoverFrame className="w-full bg-surface-base shadow-xs">
            <MangaCover
              src={item.coverUrl}
              alt={item.mangaTitle}
              iconSize={18}
              imageClassName={cn("object-cover w-full h-full", mangaCardInteraction.coverImage)}
            />
          </MangaCardCoverFrame>
        </Link>

        <div className="flex-1 min-w-0 space-y-1">
          <Link
            href={detailHref}
            className={cn("block min-w-0 rounded-xs", mangaCardInteraction.link)}
          >
            <MangaCardTitle
              as="h4"
              lines={1}
              className={mangaCardInteraction.title}
            >
              {item.mangaTitle}
            </MangaCardTitle>
          </Link>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] bg-surface-base border border-border-subtle/70 font-semibold text-text-secondary">
              {item.sourceName || item.sourceId}
            </span>
            {isUnread && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-[6px] bg-semantic-error text-white font-extrabold uppercase tracking-wider shadow-xs">
                Baru
              </span>
            )}
            <MangaCardMeta className="text-text-muted truncate">
              {item.latestChapterTitle || (item.latestChapterNumber ? `Ch. ${item.latestChapterNumber}` : "Siap dibaca")}
            </MangaCardMeta>
          </div>

          <div className="pt-0.5">
            <CustomSelect
              label={`Jadwal rilis untuk ${item.mangaTitle}`}
              value={item.releaseDay !== undefined ? String(item.releaseDay) : ""}
              onChange={onScheduleChange}
              options={[
                { value: "", label: `Auto (${dayName})` },
                { value: "1", label: "📅 Senin" },
                { value: "2", label: "📅 Selasa" },
                { value: "3", label: "📅 Rabu" },
                { value: "4", label: "📅 Kamis" },
                { value: "5", label: "📅 Jumat" },
                { value: "6", label: "📅 Sabtu" },
                { value: "0", label: "📅 Minggu" },
              ]}
              buttonClassName="min-h-11 px-2 py-0 text-[11px] font-semibold text-text-muted hover:text-text-primary bg-surface-base hover:bg-surface-hover border border-border-subtle rounded-xs gap-1.5 cursor-pointer shadow-xs"
              align="left"
            />
          </div>
        </div>
      </div>

      <Link
        href={readerHref}
        className={cn(
          "min-h-11 px-2.5 sm:px-3 rounded-sm font-semibold text-xs shadow-xs shrink-0 inline-flex items-center gap-1.5 motion-safe:transition-[transform,background-color,border-color] motion-safe:active:scale-95 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          hasHistory
            ? "bg-accent text-accent-on hover:bg-accent-hover"
            : "bg-surface-base border border-border-subtle hover:border-accent/40 hover:bg-surface-hover text-text-primary"
        )}
        aria-label={`${hasHistory ? "Lanjut" : "Mulai"} baca ${item.mangaTitle}`}
      >
        {hasHistory ? (
          <Play size={13} weight="fill" />
        ) : (
          <BookOpen size={14} weight="bold" className="text-text-muted group-hover:text-accent" />
        )}
        <span>{hasHistory ? "Lanjut" : "Baca"}</span>
      </Link>
    </article>
  );
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
    <div className="mb-6 rounded-xl bg-semantic-error/8 border border-semantic-error/20 overflow-hidden shadow-xs">
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

      // Sort by detectedAt descending with deterministic tie-breaking by key
      return dedupedItems.sort((a, b) => {
        const timeA = a.detectedAt ? new Date(a.detectedAt).getTime() : 0;
        const timeB = b.detectedAt ? new Date(b.detectedAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return a.key.localeCompare(b.key);
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
      if (timeB !== timeA) return timeB - timeA;
      return a.key.localeCompare(b.key);
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
            <div className="py-12 rounded-xl bg-surface-raised/50 border border-border-subtle p-6 text-center space-y-3">
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
                return (
                  <UpdateCard
                    key={item.key}
                    item={item}
                    historyItem={historyItem}
                    onScheduleChange={(value) => {
                      const releaseDay = value === "" ? undefined : Number(value);
                      updateLibraryItem(item.sourceId, item.mangaId, { releaseDay });
                      const targetName = releaseDay !== undefined
                        ? WEEKDAYS.find((day) => day.dayIndex === releaseDay)?.name
                        : "Otomatis";
                      toast.success(`Jadwal ${item.mangaTitle} diatur ke ${targetName}`);
                    }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
