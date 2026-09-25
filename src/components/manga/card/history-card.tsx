"use client";

import * as React from "react";
import Link from "next/link";
import { Play } from "@phosphor-icons/react";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { MangaCover } from "../manga-cover";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { cn } from "@/shared/utils/cn";
import type { BaseCardProps } from "./types";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "./primitives";

export interface HistoryCardProps extends BaseCardProps {
  chapterId?: string;
  chapterTitle?: string;
  progressPercent?: number;
  timestamp?: number;
}

export function HistoryCard({ 
  manga, 
  sourceId, 
  chapterId,
  chapterTitle,
  progressPercent,
  timestamp
}: HistoryCardProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
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
      layout={reducedMotion ? false : "position"}
      className={cn(
        mangaCardSurface({ kind: "enclosed" }),
        "group relative flex items-center gap-4 overflow-hidden p-3"
      )}
    >
      <Link 
        href={targetHref} 
        prefetch={false} 
        className={cn(mangaCardInteraction.link, "z-10 shrink-0 rounded-xs vt-hover")}
        style={!chapterId ? vtStyle : undefined}
        aria-label={`Buka ${chapterTitle || manga.title}`}
      >
        <MangaCardCoverFrame className="h-[84px] w-[56px] shadow-sm">
          <MangaCover
            src={manga.coverUrl}
            alt={manga.title}
            fallbackTitle={manga.title}
            iconSize={24}
            imageClassName={mangaCardInteraction.coverImage}
          />
        </MangaCardCoverFrame>
      </Link>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center z-10">
        <Link
          href={getMangaDetailHref(sourceId, manga.id, fullPath)}
          className={cn(mangaCardInteraction.link, "block min-w-0 rounded-xs")}
        >
          <MangaCardTitle className={cn("text-sm md:text-base", mangaCardInteraction.title)}>
            {manga.title}
          </MangaCardTitle>
        </Link>
        <Link href={targetHref} className={cn(mangaCardInteraction.link, "mt-0.5 block min-w-0 rounded-xs")}>
          <MangaCardMeta as="p" className={cn("truncate text-sm text-text-muted", mangaCardInteraction.title)}>
            {chapterTitle || manga.latestChapter || `Detail`}
          </MangaCardMeta>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-text-muted">
          <MangaCardMeta className="uppercase tracking-wider">{manga.format || manga.status || "MANGA"}</MangaCardMeta>
          {timestamp && (
            <>
              <span className="opacity-50">•</span>
              <span>{new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
            </>
          )}
        </div>
        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="mt-1.5 max-w-[160px]">
            <ReadingProgress value={progressPercent} size="sm" showLabel />
          </div>
        )}
      </div>
      
      {chapterId && (
        <div className="relative z-20 ml-2 shrink-0">
          <Link 
            href={targetHref} 
            className={cn(
              mangaCardInteraction.link,
              mangaCardSurface({ kind: "nested" }),
              "flex size-11 items-center justify-center text-accent transition-colors hover:bg-accent/10 motion-reduce:transition-none"
            )}
            aria-label={`Lanjut baca ${chapterTitle || manga.title}`}
          >
            <Play className="h-4 w-4 ml-0.5" weight="fill" />
          </Link>
        </div>
      )}
    </motion.article>
  );
}
