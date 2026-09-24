"use client";

import * as React from "react";
import Link from "next/link";
import { Star, TrendUp, Eye } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { motion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { MangaCover } from "../manga-cover";
import { BookmarkButton } from "../bookmark-button";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useUpdateStore, getUpdateKey } from "@/shared/store/update-store";
import type { MangaKey } from "@/shared/types/collection";
import { cn } from "@/shared/utils/cn";
import type { BaseCardProps } from "./types";
import type { SourceBinding } from "@/shared/lib/canonical-search";

export interface CompactCardProps extends BaseCardProps {
  showSourceBadge?: boolean;
  sourceBindings?: SourceBinding[];
}

export function CompactCard({
  manga,
  sourceId,
  priority = false,
  showSourceBadge = false,
  sourceBindings,
  displayScore,
}: CompactCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { readingStatusByManga } = useCollectionStore();
  const updateStore = useUpdateStore();

  const isUnread = React.useMemo(() => {
    const byId = updateStore.items[manga.id];
    if (byId && !byId.seenAt) return true;
    const byLegacy = updateStore.items[getUpdateKey(sourceId, manga.id)];
    if (byLegacy && !byLegacy.seenAt) return true;
    return false;
  }, [updateStore.items, manga.id, sourceId]);

  const fullPath = (pathname || "") + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
  const scoreToDisplay = displayScore ?? manga.score;
  const sourceObj = dynamicSourceRegistry.get(sourceId) || sourceRegistry.find((s) => s.id === sourceId);
  const sourceName = showSourceBadge ? (sourceObj?.name || sourceId) : null;
  const effectiveBindings = sourceBindings || (manga as any)?.sourceBindings;
  const isMultiSource = effectiveBindings && effectiveBindings.length > 1;

  const mangaKey = `${sourceId}::${manga.id}` as MangaKey;
  const readingStatus = readingStatusByManga[mangaKey];

  const mangaFormat = manga.format || (manga as any).type;
  const rawStatus = manga.status ? String(manga.status).toUpperCase() : "";
  const isOngoing = rawStatus.includes("ONGOING") || rawStatus.includes("RELEASING");
  const isCompleted = rawStatus.includes("COMPLETED");

  const cleanedDescription = manga.description
    ? manga.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
    : null;

  return (
    <motion.article
      layoutId={`manga-card-${sourceId}-${manga.id}`}
      layout="position"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ 
        layout: { type: "spring", stiffness: 320, damping: 30 },
        duration: 0.2 
      }}
      className="relative flex items-stretch p-3 sm:p-3.5 rounded-xl bg-surface-raised border border-border-subtle/80 hover:border-accent/40 hover:bg-surface-hover/70 transition-all duration-200 shadow-xs group w-full gap-3 sm:gap-4 overflow-hidden"
    >
      {/* Thumbnail Cover (Squircle 2/3 Aspect) */}
      <motion.div
        layoutId={`manga-cover-${sourceId}-${manga.id}`}
        className="relative w-[84px] sm:w-[96px] md:w-[104px] aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-surface-base border border-border-subtle shadow-xs group-hover:shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Link
          href={getMangaDetailHref(sourceId, manga.id, fullPath)}
          className="block w-full h-full"
          aria-label={`Lihat detail ${manga.title}`}
        >
          <MangaCover
            src={manga.coverUrl}
            alt={manga.title}
            priority={priority}
            fallbackTitle={manga.title}
            imageClassName="transition-transform duration-300 ease-out group-hover:scale-105 object-cover w-full h-full"
          />

          {isUnread && (
            <div className="absolute top-1 left-1 z-20 flex items-center rounded-[6px] bg-semantic-error text-white px-1.5 py-0.5 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest">Baru</span>
            </div>
          )}

          {manga.rank !== undefined && (
            <div className="absolute bottom-1 right-1 z-20 flex items-center gap-0.5 rounded-[6px] bg-black/75 backdrop-blur-sm px-1.5 py-0.5 shadow-xs border border-white/10">
              <TrendUp weight="bold" className="text-accent text-[9px]" />
              <span className="text-[10px] font-black text-white">#{manga.rank}</span>
            </div>
          )}
        </Link>
      </motion.div>

      {/* Content & Metadata Area (MangaDex / Gambar 4 Inspired) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Row 1: Title + Bookmark Button */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={getMangaDetailHref(sourceId, manga.id, fullPath)}
              className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
            >
              <h3 className="text-[15px] sm:text-base font-bold tracking-tight text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                {manga.title}
              </h3>
            </Link>

            <div className="shrink-0 -mt-0.5 -mr-1 z-20">
              <BookmarkButton
                sourceId={sourceId}
                manga={manga}
                className="hover:border-accent hover:text-accent"
              />
            </div>
          </div>

          {/* Row 2: Chapter & Status Pill & Format Tag (Gambar 4 Style) */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {manga.latestChapter && (
              <span className="text-xs font-semibold text-text-secondary truncate">
                {manga.latestChapter}
              </span>
            )}

            {manga.status && (
              <span
                className={cn(
                  "font-bold text-[10px] px-2 py-0.5 rounded-[6px] tracking-wide border",
                  isOngoing && "border-purple-500/30 bg-purple-500/10 text-purple-400 dark:text-purple-300",
                  isCompleted && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
                  !isOngoing && !isCompleted && "border-border-subtle bg-surface-base text-text-secondary"
                )}
              >
                {manga.status}
              </span>
            )}

            {mangaFormat && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-[6px] bg-surface-base border border-border-subtle/80 text-text-muted">
                {mangaFormat}
              </span>
            )}

            {isMultiSource && (
              <span className="text-[9px] font-bold text-accent px-1.5 py-0.5 rounded-[6px] bg-accent/10 border border-accent/20">
                {effectiveBindings.length} Sumber
              </span>
            )}

            {readingStatus && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[6px] bg-accent/20 text-accent uppercase tracking-wider">
                {readingStatus === "reading"
                  ? "Dibaca"
                  : readingStatus === "completed"
                  ? "Selesai"
                  : readingStatus === "plan-to-read"
                  ? "Rencana"
                  : readingStatus}
              </span>
            )}
          </div>

          {/* Row 3: Metrics Row (Rating Star, Views / Rank, Source Name) */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
            {scoreToDisplay !== undefined && Number(scoreToDisplay) > 0 && (
              <span className="flex items-center gap-1 font-black text-amber-400">
                <Star weight="fill" size={13} className="text-amber-400 shrink-0" />
                <span>{Number(scoreToDisplay).toFixed(1)}</span>
              </span>
            )}

            {(manga as any).views && (
              <span className="flex items-center gap-1 text-text-muted font-medium">
                <Eye size={13} weight="bold" className="shrink-0" />
                <span>{typeof (manga as any).views === "number" ? `${((manga as any).views / 1000).toFixed(1)}k` : (manga as any).views}</span>
              </span>
            )}

            {sourceName && (
              <span className="text-[10px] font-semibold text-text-muted/85 px-1.5 py-0.5 rounded-[6px] bg-surface-base/80 border border-border-subtle/50">
                {sourceName}
              </span>
            )}
          </div>

          {/* Row 4: Synopsis / Excerpt (Like Gambar 4) */}
          {cleanedDescription ? (
            <p className="text-[12px] text-text-muted/80 line-clamp-2 md:line-clamp-3 leading-relaxed mt-1.5">
              {cleanedDescription}
            </p>
          ) : manga.author ? (
            <p className="text-[11px] text-text-muted/60 mt-1.5">
              Karya: {manga.author}
            </p>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
