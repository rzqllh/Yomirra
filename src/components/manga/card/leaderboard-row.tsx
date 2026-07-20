"use client";

import * as React from "react";
import Link from "next/link";
import { ImageBroken, Star } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";
import type { BaseCardProps } from "./types";
import { usePathname, useSearchParams } from "next/navigation";

export function LeaderboardRow({ manga, sourceId, displayScore }: BaseCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const scoreToDisplay = displayScore ?? manga.score;
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  // Format rank as 01, 02, etc.
  const rankStr = manga.rank ? manga.rank.toString().padStart(2, '0') : "00";

  return (
    <Link 
      href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
      className="group relative flex items-center gap-4 py-2 px-1 sm:px-3 rounded-2xl hover:bg-surface-hover transition-colors"
    >
      {/* Big Rank Number */}
      {manga.rank !== undefined && (
        <div className="w-8 shrink-0 flex justify-center">
          <span className="text-2xl sm:text-3xl font-black text-text-muted/30 group-hover:text-accent/50 transition-colors">
            {rankStr}
          </span>
        </div>
      )}

      {/* Cover Image */}
      <div className="relative w-[48px] h-[64px] sm:w-[56px] sm:h-[76px] shrink-0 bg-surface-base rounded-md overflow-hidden shadow-sm group-hover:shadow-md transition-all">
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
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-1">
        <h4 className="font-bold text-sm sm:text-[15px] text-text-primary leading-snug truncate group-hover:text-accent transition-colors">
          {manga.title}
        </h4>
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-text-secondary">
          <div className="flex items-center gap-1 bg-surface-raised px-1.5 py-0.5 rounded-md border border-border-subtle">
            <Star weight="fill" size={10} className="text-semantic-warning" />
            <span suppressHydrationWarning>{Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}</span>
          </div>
          <span className="truncate max-w-[120px] sm:max-w-[140px]">{manga.latestChapter || "Detail"}</span>
          {manga.format && (
             <>
                <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
                <span className="font-black uppercase text-text-muted tracking-wider hidden sm:inline-block">
                  {manga.format}
                </span>
             </>
          )}
        </div>
      </div>
    </Link>
  );
}
