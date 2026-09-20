"use client";

import * as React from "react";
import Link from "next/link";
import { TrendUp, Star } from "@phosphor-icons/react";
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
  const effectiveBindings = sourceBindings || (manga as any)?.sourceBindings;
  const isMultiSource = effectiveBindings && effectiveBindings.length > 1;

  return (
    <motion.article
      layoutId={`manga-card-${sourceId}-${manga.id}`}
      layout="position"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        layout: { type: "spring", stiffness: 320, damping: 30 },
        duration: 0.2 
      }}
      className="relative flex flex-col w-full group"
    >
      <Link 
        href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
        transitionTypes={['nav-forward']}
        className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`Read ${manga.title}`}
      >
        <motion.div 
          layoutId={`manga-cover-${sourceId}-${manga.id}`}
          className="relative w-full aspect-[2/3] overflow-hidden rounded-xl bg-surface-base border-none shadow-none vt-hover"
          style={vtStyle}
        >
          <MangaCover
            src={manga.coverUrl}
            alt={manga.title}
            priority={priority}
            fallbackTitle={manga.title}
            imageClassName="transition-transform duration-500 ease-out group-hover:scale-105"
          />
          
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20 items-start">
            {isUnread && (
              <div className="flex items-center gap-1 rounded-md bg-semantic-error text-white px-2 py-0.5 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest">Baru</span>
              </div>
            )}
            
            {isMultiSource && (
              <div className="flex items-center gap-1 rounded-md bg-surface-glass backdrop-blur-md px-1.5 py-0.5 shadow-sm border border-border-default/40">
                <span className="text-[9px] font-black text-accent uppercase tracking-wider">
                  {effectiveBindings.length} Sumber
                </span>
              </div>
            )}

            {manga.rank !== undefined && (
              <div className="flex items-center gap-1 rounded-md bg-surface-glass backdrop-blur-md px-2 py-1 shadow-sm">
                <TrendUp weight="bold" className="text-accent text-[10px]" />
                <span className="text-xs font-black text-text-primary">#{manga.rank}</span>
              </div>
            )}

            {(() => {
              const mangaKey = `${sourceId}::${manga.id}` as MangaKey;
              const status = readingStatusByManga[mangaKey];
              if (!status) return null;

              const statusMap: Record<string, { label: string; bg: string }> = {
                "reading": { label: "Sedang Dibaca", bg: "bg-accent text-white" },
                "completed": { label: "Selesai", bg: "bg-semantic-success text-white" },
                "on-hold": { label: "Ditunda", bg: "bg-semantic-warning text-black" },
                "dropped": { label: "Dihentikan", bg: "bg-semantic-error text-white" },
                "plan-to-read": { label: "Akan Dibaca", bg: "bg-surface-raised text-text-primary" }
              };

              const config = statusMap[status];
              if (!config) return null;

              return (
                <div className={cn("px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase shadow-md backdrop-blur-sm", config.bg, config.bg.includes('surface') && "border border-border-subtle")}>
                  {config.label}
                </div>
              );
            })()}
          </div>
          
          <div className="absolute top-2 right-2 z-20 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <BookmarkButton sourceId={sourceId} manga={manga} />
          </div>

          {isUnavailable && (
            <div className="absolute inset-0 bg-surface-base/60 backdrop-blur-[2px] flex items-center justify-center z-10 transition-opacity group-hover:opacity-100 opacity-90">
              <div className="bg-semantic-error/90 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md shadow-lg">
                Tidak Tersedia
              </div>
            </div>
          )}
        </motion.div>

        <div className="flex flex-col px-2 mt-3" style={vtStyle}>
          {/* Metadata Row */}
          <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
            {manga.format && (
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0">{manga.format}</span>
            )}
            {manga.format && showSourceBadge && (sourceName || isMultiSource) && (
              <span className="w-[3px] h-[3px] rounded-full bg-border-strong shrink-0" />
            )}
            {showSourceBadge && (
              isMultiSource ? (
                <span className="text-[9px] md:text-[10px] font-black text-accent uppercase tracking-wider truncate">
                  {effectiveBindings.length} Sumber
                </span>
              ) : sourceName ? (
                <span className="text-[9px] md:text-[10px] font-black text-accent uppercase tracking-wider truncate">{sourceName}</span>
              ) : null
            )}
          </div>
          {/* Title - 2 lines fixed height */}
          <h3 className="line-clamp-2 text-[13px] md:text-sm font-bold text-text-primary tracking-tight leading-snug mb-2 group-hover:text-accent transition-colors duration-200 min-h-[2.4em]">
            {manga.title}
          </h3>
          {/* Bottom Row - Chapter & Score */}
          {(manga.latestChapter || (scoreToDisplay !== undefined && Number(scoreToDisplay) > 0)) && (
            <div className="flex items-center justify-between mt-auto">
              {manga.latestChapter ? (
                <span className="text-[11px] md:text-xs font-semibold text-text-muted truncate max-w-[70%]">
                  {manga.latestChapter}
                </span>
              ) : <div />}
              {scoreToDisplay !== undefined && Number(scoreToDisplay) > 0 && (
                <span className="text-[11px] md:text-xs font-bold flex items-center gap-1 text-text-muted shrink-0 tracking-tight">
                  <Star weight="fill" className="text-semantic-warning text-[10px] md:text-[12px]" />
                  <span suppressHydrationWarning>{Number(scoreToDisplay).toFixed(1)}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
