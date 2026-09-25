"use client";

import * as React from "react";
import Link from "next/link";
import { Star, TrendUp, Eye } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { motion, useReducedMotion } from "motion/react";
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
import { CanonicalSourceDialog, isCanonicalBindingAvailable } from "../canonical-source-dialog";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "./primitives";

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
  const reducedMotion = useReducedMotion();
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
  const effectiveBindings = (sourceBindings || (manga as any)?.sourceBindings || []) as SourceBinding[];
  const availableBindings = effectiveBindings.filter(isCanonicalBindingAvailable);
  const isMultiSource = availableBindings.length > 1;
  const [isSourceDialogOpen, setIsSourceDialogOpen] = React.useState(false);

  const mangaKey = `${sourceId}::${manga.id}` as MangaKey;
  const readingStatus = readingStatusByManga[mangaKey];

  const mangaFormat = manga.format || (manga as any).type;
  const rawStatus = manga.status ? String(manga.status).toUpperCase() : "";
  const isOngoing = rawStatus.includes("ONGOING") || rawStatus.includes("RELEASING");
  const isCompleted = rawStatus.includes("COMPLETED");

  const rawDesc = manga.description || (manga as any)?.synopsis || (manga as any)?.summary || (manga as any)?.excerpt;
  const cleanedDescription = rawDesc
    ? String(rawDesc).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
    : null;

  return (
    <motion.article
      layoutId={reducedMotion ? undefined : `manga-card-${sourceId}-${manga.id}`}
      layout={reducedMotion ? false : "position"}
      whileHover={reducedMotion ? undefined : { y: -2 }}
      whileTap={reducedMotion ? undefined : { scale: 0.99 }}
      transition={{ 
        layout: { type: "spring", stiffness: 320, damping: 30 },
        duration: 0.2 
      }}
      className={cn(
        mangaCardSurface({ kind: "enclosed" }),
        "group relative flex w-full items-stretch gap-3 overflow-hidden p-3 sm:gap-4 sm:p-3.5"
      )}
    >
      {/* Thumbnail Cover (Squircle 2/3 Aspect) */}
      <motion.div
        layoutId={reducedMotion ? undefined : `manga-cover-${sourceId}-${manga.id}`}
        className="w-[84px] shrink-0 sm:w-[96px] md:w-[104px]"
      >
        <Link
          href={getMangaDetailHref(sourceId, manga.id, fullPath)}
          className={cn(mangaCardInteraction.link, "block rounded-xs")}
          aria-label={isMultiSource ? `Pilih sumber untuk ${manga.title}` : `Lihat detail ${manga.title}`}
          aria-haspopup={isMultiSource ? "dialog" : undefined}
          onClick={(event) => {
            if (!isMultiSource) return;
            event.preventDefault();
            setIsSourceDialogOpen(true);
          }}
        >
          <MangaCardCoverFrame className="w-full shadow-xs transition-shadow group-hover:shadow-sm motion-reduce:transition-none">
            <MangaCover
              src={manga.coverUrl}
              alt={manga.title}
              priority={priority}
              fallbackTitle={manga.title}
              imageClassName={cn(mangaCardInteraction.coverImage, "size-full object-cover")}
            />

          {isUnread && (
            <div className="absolute top-1 left-1 z-20 flex items-center rounded-xs bg-semantic-error text-white px-1.5 py-0.5 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest">Baru</span>
            </div>
          )}

          {manga.rank !== undefined && (
            <div className="absolute bottom-1 right-1 z-20 flex items-center gap-0.5 rounded-xs bg-black/75 backdrop-blur-sm px-1.5 py-0.5 shadow-xs border border-white/10">
              <TrendUp weight="bold" className="text-accent text-[9px]" />
              <span className="text-[10px] font-black text-white">#{manga.rank}</span>
            </div>
          )}
          </MangaCardCoverFrame>
        </Link>
      </motion.div>

      {/* Content & Metadata Area (MangaDex / Gambar 4 Inspired) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Row 1: Title + Bookmark Button */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={getMangaDetailHref(sourceId, manga.id, fullPath)}
              className={cn(mangaCardInteraction.link, "min-w-0 flex-1 rounded-sm")}
              aria-haspopup={isMultiSource ? "dialog" : undefined}
              onClick={(event) => {
                if (!isMultiSource) return;
                event.preventDefault();
                setIsSourceDialogOpen(true);
              }}
            >
              <MangaCardTitle lines={1} className={mangaCardInteraction.title}>
                {manga.title}
              </MangaCardTitle>
            </Link>

            <div className="shrink-0 -mt-0.5 -mr-1 relative z-10">
              <BookmarkButton
                sourceId={sourceId}
                manga={manga}
                className="size-11 hover:border-accent hover:text-accent"
              />
            </div>
          </div>

          {/* Row 2: Chapter & Status Pill & Format Tag (Gambar 4 Style) */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {manga.latestChapter && (
              <MangaCardMeta className="truncate font-semibold">
                {manga.latestChapter}
              </MangaCardMeta>
            )}

            {manga.status && (
              <span
                className={cn(
                  "font-bold text-[10px] px-2 py-0.5 rounded-xs tracking-wide border",
                  isOngoing && "border-purple-500/30 bg-purple-500/10 text-purple-400 dark:text-purple-300",
                  isCompleted && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
                  !isOngoing && !isCompleted && "border-border-subtle bg-surface-base text-text-secondary"
                )}
              >
                {manga.status}
              </span>
            )}

            {mangaFormat && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-surface-base border border-border-subtle/80 text-text-muted">
                {mangaFormat}
              </span>
            )}

            {isMultiSource && (
              <span className="text-[9px] font-bold text-accent px-1.5 py-0.5 rounded-xs bg-accent/10 border border-accent/20">
                {availableBindings.length} Sumber
              </span>
            )}

            {readingStatus && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-accent/20 text-accent uppercase tracking-wider">
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
              <span className="text-[10px] font-semibold text-text-muted/85 px-1.5 py-0.5 rounded-xs bg-surface-base/80 border border-border-subtle/50">
                {sourceName}
              </span>
            )}
          </div>

          {/* Row 4: Synopsis / Excerpt / Metadata Fallback */}
          {cleanedDescription ? (
            <MangaCardMeta as="p" className="mt-1.5 line-clamp-2 leading-relaxed text-text-muted/80 md:line-clamp-3">
              {cleanedDescription}
            </MangaCardMeta>
          ) : manga.author ? (
            <MangaCardMeta as="p" className="mt-1.5 truncate text-[11px] text-text-muted/70">
              Karya: {manga.author}
            </MangaCardMeta>
          ) : (manga as any)?.genres && (manga as any).genres.length > 0 ? (
            <MangaCardMeta as="p" className="mt-1.5 truncate text-[11px] text-text-muted/70">
              Genre: {(manga as any).genres.slice(0, 3).join(" · ")}
            </MangaCardMeta>
          ) : null}
        </div>
      </div>
      {isMultiSource && (
        <CanonicalSourceDialog
          open={isSourceDialogOpen}
          onOpenChange={setIsSourceDialogOpen}
          title={manga.title}
          sourceBindings={availableBindings}
          returnTo={fullPath}
        />
      )}
    </motion.article>
  );
}
