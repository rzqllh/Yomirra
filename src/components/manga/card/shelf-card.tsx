"use client";

import * as React from "react";
import Link from "next/link";
import { ImageBroken, TrendUp, Star } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { motion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { sourceRegistry } from "@/shared/sources/source-registry";
import { BookmarkButton } from "../bookmark-button";
import { useCollectionStore } from "@/shared/store/collection-store";
import type { MangaKey } from "@/shared/types/collection";
import { cn } from "@/shared/utils/cn";
import type { BaseCardProps } from "./types";

export interface ShelfCardProps extends BaseCardProps {
  showSourceBadge?: boolean;
}

export function ShelfCard({ 
  manga, 
  sourceId, 
  priority = false,
  showSourceBadge = false,
  displayScore
}: ShelfCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { readingStatusByManga } = useCollectionStore();
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const safeId = `${sourceId}-${manga.id}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const vtName = `manga-cover-${safeId}`;
  const vtTitleName = `manga-title-${safeId}`;
  const vtStyle = { '--vt-name': vtName, '--vt-title-name': vtTitleName } as React.CSSProperties;

  const scoreToDisplay = displayScore ?? manga.score;
  const sourceName = showSourceBadge ? (sourceRegistry.find(s => s.id === sourceId)?.name || sourceId) : null;

  return (
    <motion.article
      layout="position"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ ease: "easeOut", duration: 0.2 }}
      className="relative flex flex-col w-full group"
    >
      <Link 
        href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
        transitionTypes={['nav-forward']}
        className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`Read ${manga.title}`}
      >
        <div 
          className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl bg-surface-base border-none shadow-none vt-hover"
          style={vtStyle}
        >
          {manga.coverUrl && !imageError ? (
            <img
              src={manga.coverUrl}
              alt={manga.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              onError={() => setImageError(true)}
              ref={(img) => {
                if (img && img.complete && img.naturalWidth === 0) {
                  setImageError(true);
                }
              }}
              referrerPolicy="no-referrer"
              decoding="async"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-surface-muted flex flex-col items-center justify-center text-text-muted/50 p-4">
              <ImageBroken size={32} weight="duotone" className="mb-2" />
              <span className="text-xs font-medium text-center line-clamp-2 px-2">{manga.title}</span>
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20 items-start">
            {manga.rank !== undefined && (
              <div className="flex items-center gap-1 rounded-full bg-surface-glass backdrop-blur-md px-2 py-1 shadow-sm">
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
                <div className={cn("px-2 py-0.5 rounded-sm text-[9px] font-black tracking-widest uppercase shadow-md backdrop-blur-sm", config.bg, config.bg.includes('surface') && "border border-border-subtle")}>
                  {config.label}
                </div>
              );
            })()}
          </div>
          
          <div className="absolute top-2 right-2 z-20 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <BookmarkButton sourceId={sourceId} manga={manga} />
          </div>
        </div>

        <div className="flex flex-col px-2 mt-3" style={vtStyle}>
          {/* Metadata Row */}
          <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
            {manga.format && (
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0">{manga.format}</span>
            )}
            {manga.format && showSourceBadge && sourceName && (
              <span className="w-[3px] h-[3px] rounded-full bg-border-strong shrink-0" />
            )}
            {showSourceBadge && sourceName && (
              <span className="text-[9px] md:text-[10px] font-black text-accent uppercase tracking-wider truncate">{sourceName}</span>
            )}
          </div>
          {/* Title - 2 lines fixed height */}
          <h3 className="line-clamp-2 text-[13px] md:text-sm font-bold text-text-primary tracking-tight leading-snug mb-2 group-hover:text-accent transition-colors duration-200 min-h-[2.4em]">
            {manga.title}
          </h3>
          {/* Bottom Row - Chapter & Score */}
          <div className="flex items-center justify-between mt-auto">
            <span className="text-[11px] md:text-xs font-semibold text-text-muted truncate max-w-[70%]">
              {manga.latestChapter || "Detail"}
            </span>
            {scoreToDisplay !== undefined && Number(scoreToDisplay) > 0 && (
              <span className="text-[11px] md:text-xs font-bold flex items-center gap-1 text-text-muted shrink-0 tracking-tight">
                <Star weight="fill" className="text-semantic-warning text-[10px] md:text-[12px]" />
                <span suppressHydrationWarning>{Number(scoreToDisplay).toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
