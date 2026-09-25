"use client";

import * as React from "react";
import Link from "next/link";
import { TrendUp, Star } from "@phosphor-icons/react";
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

export interface ShelfCardProps extends BaseCardProps {
  showSourceBadge?: boolean;
  sourceBindings?: SourceBinding[];
}

export function ShelfCard({ 
  manga, 
  sourceId, 
  priority = false,
  showSourceBadge = false,
  sourceBindings,
  displayScore
}: ShelfCardProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const { readingStatusByManga } = useCollectionStore();
  const updateStore = useUpdateStore();
  
  // Check unread status (handle both UUID and legacy keys)
  const isUnread = React.useMemo(() => {
    const byId = updateStore.items[manga.id];
    if (byId && !byId.seenAt) return true;
    const byLegacy = updateStore.items[getUpdateKey(sourceId, manga.id)];
    if (byLegacy && !byLegacy.seenAt) return true;
    return false;
  }, [updateStore.items, manga.id, sourceId]);

  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const safeId = `${sourceId}-${manga.id}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const vtName = `manga-cover-${safeId}`;
  const vtTitleName = `manga-title-${safeId}`;
  const vtStyle = { '--vt-name': vtName, '--vt-title-name': vtTitleName } as React.CSSProperties;

  const scoreToDisplay = displayScore ?? manga.score;
  const sourceObj = dynamicSourceRegistry.get(sourceId) || sourceRegistry.find(s => s.id === sourceId);
  const sourceName = showSourceBadge ? (sourceObj?.name || sourceId) : null;
  const isUnavailable = sourceObj?.status === "unavailable" || sourceObj?.status === "in-fix";
  const effectiveBindings = (sourceBindings || (manga as any)?.sourceBindings || []) as SourceBinding[];
  const availableBindings = effectiveBindings.filter(isCanonicalBindingAvailable);
  const isMultiSource = availableBindings.length > 1;
  const [isSourceDialogOpen, setIsSourceDialogOpen] = React.useState(false);

  return (
    <motion.article
      layoutId={reducedMotion ? undefined : `manga-card-${sourceId}-${manga.id}`}
      layout={reducedMotion ? false : "position"}
      whileHover={reducedMotion ? undefined : { y: -3 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      transition={{ 
        layout: { type: "spring", stiffness: 320, damping: 30 },
        duration: 0.2 
      }}
      className={cn(mangaCardSurface({ kind: "open" }), "group relative flex w-full flex-col")}
    >
      <Link 
        href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
        transitionTypes={['nav-forward']}
        className={cn(mangaCardInteraction.link, "group flex flex-col rounded-xs")}
        aria-label={isMultiSource ? `Pilih sumber untuk ${manga.title}` : `Lihat ${manga.title}`}
        aria-haspopup={isMultiSource ? "dialog" : undefined}
        onClick={(event) => {
          if (!isMultiSource) return;
          event.preventDefault();
          setIsSourceDialogOpen(true);
        }}
      >
        <motion.div
          layoutId={reducedMotion ? undefined : `manga-cover-${sourceId}-${manga.id}`}
          style={vtStyle}
        >
          <MangaCardCoverFrame className="w-full shadow-sm vt-hover">
            <MangaCover
              src={manga.coverUrl}
              alt={manga.title}
              priority={priority}
              fallbackTitle={manga.title}
              imageClassName={mangaCardInteraction.coverImage}
            />
          
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20 items-start">
            {isUnread && (
              <div className="flex items-center gap-1 rounded-xs bg-status-info-bg px-2 py-0.5 text-status-info-fg">
                <span className="text-xs font-bold">Baru</span>
              </div>
            )}
            
            {isMultiSource && (
              <div className="flex items-center gap-1 rounded-xs bg-surface-glass backdrop-blur-md px-1.5 py-0.5 shadow-sm border border-border-default/40">
                <span className="text-xs font-bold text-accent">
                  {availableBindings.length} Sumber
                </span>
              </div>
            )}

            {manga.rank !== undefined && (
              <div className="flex items-center gap-1 rounded-xs bg-surface-glass backdrop-blur-md px-2 py-1 shadow-sm">
                <TrendUp weight="bold" className="text-accent text-[10px]" />
                <span className="text-xs font-black text-text-primary">#{manga.rank}</span>
              </div>
            )}

            {(() => {
              const mangaKey = `${sourceId}::${manga.id}` as MangaKey;
              const status = readingStatusByManga[mangaKey];
              if (!status) return null;

              const statusMap: Record<string, { label: string; bg: string }> = {
                "reading": { label: "Sedang dibaca", bg: "bg-accent-dim text-accent" },
                "completed": { label: "Selesai", bg: "bg-status-success-bg text-status-success-fg" },
                "on-hold": { label: "Ditunda", bg: "bg-status-warning-bg text-status-warning-fg" },
                "dropped": { label: "Dihentikan", bg: "bg-status-error-bg text-status-error-fg" },
                "plan-to-read": { label: "Akan Dibaca", bg: "bg-surface-raised text-text-primary" }
              };

              const config = statusMap[status];
              if (!config) return null;

              return (
                <div className={cn("rounded-xs px-2 py-0.5 text-xs font-bold", config.bg, config.bg.includes('surface') && "border border-border-subtle")}>
                  {config.label}
                </div>
              );
            })()}
          </div>
          
          {isUnavailable && (
            <div className="absolute inset-0 bg-surface-base/60 backdrop-blur-[2px] flex items-center justify-center z-10 transition-opacity group-hover:opacity-100 opacity-90">
              <div className="rounded-xs bg-status-error-bg px-2.5 py-1 text-xs font-bold text-status-error-fg">
                Tidak Tersedia
              </div>
            </div>
          )}
          </MangaCardCoverFrame>
        </motion.div>

        <div className="flex flex-col px-2 mt-3" style={vtStyle}>
          {/* Metadata Row */}
          <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
            {manga.format && (
              <MangaCardMeta className="shrink-0 font-semibold">{manga.format}</MangaCardMeta>
            )}
            {manga.format && showSourceBadge && (sourceName || isMultiSource) && (
              <span className="w-[3px] h-[3px] rounded-full bg-border-strong shrink-0" />
            )}
            {showSourceBadge && (
              isMultiSource ? (
                <MangaCardMeta className="truncate font-semibold text-accent">
                  {availableBindings.length} Sumber
                </MangaCardMeta>
              ) : sourceName ? (
                <MangaCardMeta className="truncate font-semibold text-accent">{sourceName}</MangaCardMeta>
              ) : null
            )}
          </div>
          {/* Title - 2 lines fixed height */}
          <MangaCardTitle
            lines={2}
            className={cn("mb-2 min-h-[2.4em]", mangaCardInteraction.title)}
          >
            {manga.title}
          </MangaCardTitle>
          {/* Bottom Row - Chapter & Score */}
          {(manga.latestChapter || (scoreToDisplay !== undefined && Number(scoreToDisplay) > 0)) && (
            <div className="flex items-center justify-between mt-auto">
              {manga.latestChapter ? (
                <MangaCardMeta className="max-w-[70%] truncate font-semibold sm:text-sm">
                  {manga.latestChapter}
                </MangaCardMeta>
              ) : <div />}
              {scoreToDisplay !== undefined && Number(scoreToDisplay) > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-xs font-bold tracking-tight text-text-secondary sm:text-sm">
                  <Star weight="fill" className="text-semantic-warning text-sm" />
                  <span suppressHydrationWarning>{Number(scoreToDisplay).toFixed(1)}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
      <div className="absolute right-2 top-2 z-10 flex items-center justify-center">
        <BookmarkButton sourceId={sourceId} manga={manga} className="size-11" />
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
