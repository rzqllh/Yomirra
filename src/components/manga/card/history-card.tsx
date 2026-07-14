"use client";

import * as React from "react";
import Link from "next/link";
import { ImageBroken, Play } from "@phosphor-icons/react";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { motion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import type { BaseCardProps } from "./types";

export interface HistoryCardProps extends BaseCardProps {
  chapterId?: string;
  chapterTitle?: string;
  progressPercent?: number;
}

export function HistoryCard({ 
  manga, 
  sourceId, 
  chapterId,
  chapterTitle,
  progressPercent
}: HistoryCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const safeId = `${sourceId}-${manga.id}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const vtName = `manga-cover-${safeId}`;
  const vtStyle = { '--vt-name': vtName } as React.CSSProperties;

  const targetHref = chapterId 
    ? getReaderHref(sourceId, manga.id, chapterId)
    : getMangaDetailHref(sourceId, manga.id, fullPath);

  return (
    <motion.article 
      layout="position"
      className="group relative flex items-center gap-4 rounded-xl bg-surface-glass backdrop-blur-sm p-3 border-border-subtle/50 transition-all duration-300 hover:bg-surface-overlay/80 hover:-sm overflow-hidden"
    >
      <Link 
        href={targetHref} 
        prefetch={false} 
        className="relative h-[84px] w-[60px] shrink-0 overflow-hidden rounded-sm bg-surface-glass backdrop-blur-md shadow-sm z-10 vt-hover"
        style={!chapterId ? vtStyle : undefined}
        aria-label={`Cover of ${manga.title}`}
      >
        {manga.coverUrl && !imageError ? (
          <img 
            src={manga.coverUrl} 
            alt={manga.title} 
            className="absolute inset-0 w-full h-full object-cover" 
            onError={() => setImageError(true)}
            ref={(img) => {
              if (img && img.complete && img.naturalWidth === 0) {
                setImageError(true);
              }
            }}
            referrerPolicy="no-referrer"
            decoding="async"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-surface-muted flex flex-col items-center justify-center text-text-muted/50 p-2">
            <ImageBroken size={24} weight="duotone" />
          </div>
        )}
      </Link>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center z-10">
        <Link href={getMangaDetailHref(sourceId, manga.id, fullPath)} className="block min-w-0">
          <h3 className="truncate font-bold text-text-primary text-sm md:text-base leading-snug group-hover:text-accent transition-colors">
            {manga.title}
          </h3>
        </Link>
        <Link href={targetHref} className="block min-w-0 mt-0.5">
          <p className="truncate text-sm font-medium text-text-muted group-hover:text-accent transition-colors">
            {chapterTitle || manga.latestChapter || `Detail`}
          </p>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-text-muted">
          <span className="uppercase tracking-wider">{manga.format || manga.status || "MANGA"}</span>
          {progressPercent !== undefined && progressPercent > 0 && (
            <>
              <span>•</span>
              <span className="text-accent">{progressPercent}%</span>
            </>
          )}
        </div>
      </div>
      
      {chapterId && (
        <div className="bg-accent/10 dark:bg-accent/20 backdrop-blur-xl -accent/20 rounded-full p-1 shadow-sm shrink-0 ml-2 z-20 relative">
          <Link 
            href={targetHref} 
            className="flex items-center justify-center rounded-full h-8 w-8 text-accent hover:bg-accent/10 transition-colors"
          >
            <Play className="h-4 w-4 ml-0.5" weight="fill" />
          </Link>
        </div>
      )}
    </motion.article>
  );
}
