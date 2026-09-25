"use client";

import Link from "next/link";
import { Star } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
import type { BaseCardProps } from "./types";
import { usePathname, useSearchParams } from "next/navigation";
import { MangaCover } from "../manga-cover";
import { cn } from "@/shared/utils/cn";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "./primitives";

export interface LeaderboardRowProps extends BaseCardProps {
  variant?: string; // kept for API compat
}

export function LeaderboardRow({ manga, sourceId, displayScore }: LeaderboardRowProps) {
  const scoreToDisplay = displayScore ?? manga.score;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const rankStr = manga.rank ? manga.rank.toString().padStart(2, '0') : "00";

  return (
    <Link
      href={getMangaDetailHref(sourceId, manga.id, fullPath)}
      className={cn(
        mangaCardSurface({ kind: "row" }),
        mangaCardInteraction.link,
        "group relative flex min-h-[62px] flex-1 items-center gap-3 px-1 py-1.5 sm:py-2"
      )}
    >
      {/* Rank Badge */}
      {manga.rank !== undefined && (
        <div className="w-8 shrink-0 flex justify-center items-center">
          <span className="ink-caption text-[26px] sm:text-[28px] leading-none text-accent">
            {rankStr}
          </span>
        </div>
      )}

      {/* Cover */}
      <MangaCardCoverFrame className="h-[60px] w-10">
        <MangaCover
          src={manga.coverUrl}
          alt={manga.title}
          fallbackTitle={manga.title}
          iconSize={20}
          imageClassName={mangaCardInteraction.coverImage}
        />
      </MangaCardCoverFrame>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 py-0.5">
        <MangaCardTitle as="h4" density="compact" className={mangaCardInteraction.title}>
          {manga.title}
        </MangaCardTitle>
        <div className="flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-semibold text-text-secondary">
          <div className="flex items-center gap-1">
            <Star weight="fill" size={12} className="text-semantic-warning" />
            <span suppressHydrationWarning>{Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}</span>
          </div>
          <MangaCardMeta className="max-w-[110px] truncate text-[10.5px] text-text-muted sm:max-w-[140px] sm:text-[11.5px]">
            {manga.latestChapter || "Detail"}
          </MangaCardMeta>
        </div>
      </div>
    </Link>
  );
}
