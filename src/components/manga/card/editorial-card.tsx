"use client";

import * as React from "react";
import Link from "next/link";
import { ImageBroken, Star } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { motion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { getRelativeTime } from "@/shared/utils/date";
import { BookmarkButton } from "../bookmark-button";
import type { BaseCardProps } from "./types";

export function EditorialCard({ 
  manga, 
  sourceId, 
  displayScore 
}: BaseCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const safeId = `${sourceId}-${manga.id}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const vtName = `manga-cover-${safeId}`;
  const vtStyle = { '--vt-name': vtName } as React.CSSProperties;

  const scoreToDisplay = displayScore ?? manga.score;
  const timeText = getRelativeTime(manga.latestChapterTime);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ ease: "easeOut", duration: 0.2 }}
      className="w-full min-w-[280px]"
    >
      <Link 
        href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
        className="flex gap-2.5 h-[110px] cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent vt-hover"
        aria-label={`Read ${manga.title}`}
        style={vtStyle}
      >
        {/* Cover Bento Cell */}
        <div className="relative w-[80px] shrink-0 bg-surface-raised rounded-2xl overflow-hidden shadow-sm border border-border-subtle group-hover:border-accent/30 group-hover:shadow-accent/10 transition-all">
          {manga.coverUrl && !imageError ? (
            <img src={manga.coverUrl} alt={manga.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImageError(true)} referrerPolicy="no-referrer" loading="lazy" decoding="async" />
          ) : (
            <div className="h-full w-full bg-surface-muted flex flex-col items-center justify-center text-text-muted/50 p-2">
              <ImageBroken size={24} weight="duotone" />
            </div>
          )}
          
          {/* Number Badge */}
          {manga.rank !== undefined && (
            <div className={cn(
              "absolute top-0 left-0 backdrop-blur-md text-white font-black text-[11px] w-7 h-7 flex items-center justify-center rounded-br-xl shadow-md z-10",
              manga.rank === 1 ? "bg-amber-500/90 text-amber-50" :
              manga.rank === 2 ? "bg-slate-400/90 text-slate-50" :
              manga.rank === 3 ? "bg-amber-700/90 text-amber-50" :
              "bg-black/80"
            )}>
              {manga.rank}
            </div>
          )}
        </div>

        {/* Info Bento Cell */}
        <div className="flex-1 bg-surface-raised rounded-2xl border border-border-subtle p-3.5 flex flex-col justify-center min-w-0 group-hover:bg-surface-overlay group-hover:border-accent/30 transition-all shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] font-black uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-md">{manga.status || "Ongoing"}</span>
            {manga.format && <span className="text-[9px] font-black uppercase text-text-secondary bg-surface-base px-2 py-0.5 rounded-md">{manga.format}</span>}
          </div>
          <h4 className="font-bold text-sm md:text-base text-text-primary leading-snug truncate group-hover:text-accent transition-colors">
            {manga.title}
          </h4>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium truncate pr-2">{manga.latestChapter || "Detail"}</span>
            {timeText && <span className="text-[10px] text-text-muted whitespace-nowrap">{timeText}</span>}
          </div>
        </div>

        {/* Action/Rating Bento Cell */}
        <div className="w-[48px] shrink-0 bg-surface-raised rounded-2xl border border-border-subtle flex flex-col items-center justify-center gap-3 shadow-sm group-hover:bg-surface-overlay group-hover:border-accent/30 transition-all relative overflow-hidden">
            {/* Bookmark */}
            <div className="z-10 scale-90 relative" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <BookmarkButton sourceId={sourceId} manga={manga} />
            </div>
            
            {/* Divider */}
            <div className="w-6 h-px bg-border-subtle z-10" />
            
            {/* Rating */}
            <div className="flex flex-col items-center gap-0.5 text-semantic-warning z-10">
              <Star weight="fill" size={12} />
              <span className="text-[10px] font-black" suppressHydrationWarning>{Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}</span>
            </div>
            
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      </Link>
    </motion.article>
  );
}
