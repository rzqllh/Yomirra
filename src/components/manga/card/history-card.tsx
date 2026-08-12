"use client";

import * as React from "react";
import Link from "next/link";
import { Play } from "@phosphor-icons/react";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { motion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { MangaCover } from "../manga-cover";
import { ReadingProgress } from "@/components/ui/reading-progress";
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
        <MangaCover
          src={manga.coverUrl}
          alt={manga.title}
          fallbackTitle={manga.title}
          iconSize={24}
        />
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
        </div>
        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="mt-1.5 max-w-[160px]">
            <ReadingProgress value={progressPercent} size="sm" showLabel />
          </div>
        )}
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
