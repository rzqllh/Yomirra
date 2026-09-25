"use client";

import * as React from "react";
import Link from "next/link";
import { ImageBroken, Star } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
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

  const rankStr = manga.rank ? manga.rank.toString().padStart(2, '0') : "00";

  return (
    <Link
      href={getMangaDetailHref(sourceId, manga.id, fullPath)}
      className="group relative flex flex-1 min-h-[58px] sm:min-h-[62px] items-center gap-3 border-b border-border-subtle/70 px-1 py-1.5 sm:py-2 transition-colors last:border-0 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent"
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
      <div className="relative h-[56px] w-[38px] sm:h-[60px] sm:w-[42px] shrink-0 overflow-hidden rounded-xs border border-border-subtle bg-surface-muted">
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
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 py-0.5">
        <h4 className="font-bold text-xs sm:text-[13.5px] text-text-primary leading-snug truncate group-hover:text-accent transition-colors">
          {manga.title}
        </h4>
        <div className="flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-semibold text-text-secondary">
          <div className="flex items-center gap-1">
            <Star weight="fill" size={12} className="text-semantic-warning" />
            <span suppressHydrationWarning>{Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}</span>
          </div>
          <span className="truncate max-w-[110px] sm:max-w-[140px] text-text-muted">{manga.latestChapter || "Detail"}</span>
        </div>
      </div>
    </Link>
  );
}
