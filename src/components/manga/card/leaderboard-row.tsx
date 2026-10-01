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
  variant?: string;
  density?: "default" | "home";
  emphasized?: boolean;
}

export function LeaderboardRow({
  manga,
  sourceId,
  displayScore,
  density = "default",
  emphasized = false,
}: LeaderboardRowProps) {
  const scoreToDisplay = displayScore ?? manga.score;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
  const rankStr = manga.rank ? manga.rank.toString().padStart(2, "0") : "00";
  const isHomeDensity = density === "home";

  const rowGeometry = isHomeDensity
    ? emphasized
      ? "min-h-[72px] py-1"
      : "min-h-[44px] py-0.5"
    : "min-h-[62px] py-1.5 sm:py-2";

  const coverGeometry = isHomeDensity
    ? emphasized
      ? "h-[72px] w-12"
      : "h-[45px] w-[30px]"
    : "h-[60px] w-10";

  return (
    <Link
      href={getMangaDetailHref(sourceId, manga.id, fullPath)}
      className={cn(
        mangaCardSurface({ kind: "row" }),
        mangaCardInteraction.link,
        "group relative flex flex-1 items-center gap-3 px-1",
        rowGeometry
      )}
    >
      {manga.rank !== undefined && (
        <div className="flex w-8 shrink-0 items-center justify-center">
          <span
            className={cn(
              "font-black leading-none tracking-tight text-accent tabular-nums",
              emphasized
                ? "text-[30px]"
                : isHomeDensity
                  ? "text-[24px]"
                  : "text-[26px] sm:text-[28px]"
            )}
          >
            {rankStr}
          </span>
        </div>
      )}

      <MangaCardCoverFrame className={coverGeometry}>
        <MangaCover
          src={manga.coverUrl}
          alt={manga.title}
          fallbackTitle={manga.title}
          iconSize={20}
          imageClassName={mangaCardInteraction.coverImage}
        />
      </MangaCardCoverFrame>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
        <MangaCardTitle
          as="h4"
          density="compact"
          className={cn(
            mangaCardInteraction.title,
            emphasized && "font-extrabold"
          )}
        >
          {manga.title}
        </MangaCardTitle>
        <div className="flex items-center gap-2 text-[10.5px] font-semibold text-text-secondary sm:text-[11.5px]">
          <div className="flex items-center gap-1">
            <Star
              weight="fill"
              size={12}
              className="text-semantic-warning"
              aria-hidden="true"
            />
            <span suppressHydrationWarning>
              {Number(scoreToDisplay) > 0
                ? Number(scoreToDisplay).toFixed(1)
                : "-.-"}
            </span>
          </div>
          <MangaCardMeta className="max-w-[110px] truncate text-[10.5px] text-text-muted sm:max-w-[140px] sm:text-[11.5px]">
            {manga.latestChapter || "Detail"}
          </MangaCardMeta>
        </div>
      </div>
    </Link>
  );
}
