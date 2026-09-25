"use client";

import * as React from "react";
import Link from "next/link";
import { Star } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { getRelativeTime } from "@/shared/utils/date";
import { MangaCover } from "../manga-cover";
import { BookmarkButton } from "../bookmark-button";
import type { BaseCardProps } from "./types";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "./primitives";

export function EditorialCard({ 
  manga, 
  sourceId, 
  displayScore 
}: BaseCardProps) {
  const reducedMotion = useReducedMotion();
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
      whileHover={reducedMotion ? undefined : { y: -2 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      transition={{ ease: "easeOut", duration: 0.2 }}
      className={cn(
        mangaCardSurface({ kind: "enclosed" }),
        "group flex h-[110px] w-full min-w-[280px] overflow-hidden"
      )}
    >
      <Link 
        href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
        className={cn(
          mangaCardInteraction.link,
          "flex min-w-0 flex-1 gap-2.5 cursor-pointer rounded-l-md vt-hover"
        )}
        aria-label={`Baca ${manga.title}`}
        style={vtStyle}
      >
        {/* Cover Bento Cell */}
        <MangaCardCoverFrame className="h-full w-[74px] border-y-0 border-l-0 rounded-l-md rounded-r-xs group-hover:shadow-lg group-hover:shadow-accent/5">
          <MangaCover
            src={manga.coverUrl}
            alt={manga.title}
            fallbackTitle={manga.title}
            iconSize={24}
            imageClassName={mangaCardInteraction.coverImage}
          />
          
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
        </MangaCardCoverFrame>

        {/* Info Bento Cell */}
        <div className="flex-1 p-3 flex flex-col justify-center min-w-0 transition-all motion-reduce:transition-none bg-transparent">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] font-bold uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-md">{manga.status || "Ongoing"}</span>
            {manga.format && <span className="text-[9px] font-bold uppercase text-text-secondary bg-surface-base px-2 py-0.5 rounded-md">{manga.format}</span>}
          </div>
          <MangaCardTitle
            as="h4"
            lines={1}
            className={cn("font-medium leading-normal", mangaCardInteraction.title)}
          >
            {manga.title}
          </MangaCardTitle>
          <div className="mt-1.5 flex items-center justify-between">
            <MangaCardMeta className="truncate pr-2">{manga.latestChapter || "Detail"}</MangaCardMeta>
            {timeText && <MangaCardMeta className="whitespace-nowrap text-[10px] text-text-muted">{timeText}</MangaCardMeta>}
          </div>
        </div>
      </Link>

      {/* Bookmark remains independent from the primary navigation target. */}
      <div className="relative flex w-[52px] shrink-0 flex-col items-center justify-center gap-2 bg-transparent">
        <BookmarkButton sourceId={sourceId} manga={manga} className="size-11" />
        <div className="h-px w-6 bg-border-subtle" />
        <div className="flex flex-col items-center gap-0.5 text-semantic-warning">
          <Star weight="fill" size={12} aria-hidden="true" />
          <span className="text-[10px] font-black" suppressHydrationWarning>
            {Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
