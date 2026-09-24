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
      className="group relative flex min-h-[90px] items-center gap-3 border-b border-border-subtle px-1 py-2.5 transition-colors last:border-0 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent"
    >
      {/* Rank Badge */}
      {manga.rank !== undefined && (
        <div className="w-9 shrink-0 flex justify-center items-center">
          <span className="ink-caption text-[32px] leading-none text-accent">
            {rankStr}
          </span>
        </div>
      )}

      {/* Cover */}
      <div className="relative h-[72px] w-[48px] shrink-0 overflow-hidden rounded-[8px] border border-border-subtle bg-surface-muted">
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
          <div className="flex items-center gap-1">
            <Star weight="fill" size={13} className="text-semantic-warning" />
            <span suppressHydrationWarning>{Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}</span>
          </div>
          <span className="truncate max-w-[110px] sm:max-w-[140px] text-text-muted">{manga.latestChapter || "Detail"}</span>
        </div>
      </div>
    </Link>
  );
}
