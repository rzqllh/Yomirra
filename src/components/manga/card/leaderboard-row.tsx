"use client";

import * as React from "react";
import Link from "next/link";
import { ImageBroken, Star } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";
import type { BaseCardProps } from "./types";
import { usePathname, useSearchParams } from "next/navigation";

export interface LeaderboardRowProps extends BaseCardProps {
  variant?: string; // kept for API compat
}

export function LeaderboardRow({ manga, sourceId, displayScore }: LeaderboardRowProps) {
  const [imageError, setImageError] = React.useState(false);
  const scoreToDisplay = displayScore ?? manga.score;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const rankNumber = manga.rank || 0;
  const rankStr = manga.rank ? manga.rank.toString().padStart(2, '0') : "00";

  return (
    <Link
      href={getMangaDetailHref(sourceId, manga.id, fullPath)}
      className="group relative flex items-center gap-3.5 py-2.5 px-3 rounded-2xl bg-surface-base/40 hover:bg-surface-raised/90 border border-border-subtle/40 hover:border-border-default/80 transition-all duration-300 shadow-xs hover:shadow-md"
    >
      {/* Rank Badge */}
      {manga.rank !== undefined && (
        <div className="w-9 shrink-0 flex justify-center items-center">
          <span className={cn(
            "text-2xl sm:text-3xl font-black transition-transform group-hover:scale-110 duration-300",
            rankNumber === 1 && "text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]",
            rankNumber === 2 && "text-slate-400 drop-shadow-[0_2px_8px_rgba(148,163,184,0.4)]",
            rankNumber === 3 && "text-amber-700 drop-shadow-[0_2px_8px_rgba(180,83,9,0.3)]",
            rankNumber > 3 && "text-text-muted/30 group-hover:text-text-muted/60"
          )}>
            {rankStr}
          </span>
        </div>
      )}

      {/* Cover */}
      <div className="relative w-[50px] h-[68px] sm:w-[60px] sm:h-[80px] shrink-0 bg-surface-muted rounded-xl overflow-hidden shadow-sm border border-border-subtle/50 group-hover:shadow-md transition-all">
        {manga.coverUrl && !imageError ? (
          <img
            src={manga.coverUrl}
            alt={manga.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-text-muted/30 bg-surface-muted">
            <ImageBroken size={20} weight="duotone" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-0.5">
        <h4 className="font-bold text-sm sm:text-[15px] text-text-primary leading-snug truncate group-hover:text-accent transition-colors">
          {manga.title}
        </h4>
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-text-secondary">
          <div className="flex items-center gap-1 bg-surface-raised/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border-subtle/60">
            <Star weight="fill" size={11} className="text-amber-400" />
            <span suppressHydrationWarning>{Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}</span>
          </div>
          <span className="truncate max-w-[110px] sm:max-w-[140px] text-text-muted">{manga.latestChapter || "Detail"}</span>
        </div>
      </div>
    </Link>
  );
}
