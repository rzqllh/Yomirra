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
      className="group relative flex items-center gap-4 py-2.5 px-3 rounded-2xl hover:bg-surface-hover transition-colors"
    >
      {/* Rank Number (Typography instead of floating badge) */}
      <span className="text-3xl font-black text-text-muted/30 group-hover:text-accent/50 transition-colors shrink-0 w-8 text-center italic tracking-tighter select-none">
        {rankStr}
      </span>

      {/* Cover Image */}
      <div className="relative w-[52px] h-[72px] shrink-0 bg-surface-base rounded-[10px] overflow-hidden border border-border-subtle group-hover:border-accent/30 transition-all shadow-sm">
        {manga.coverUrl && !imageError ? (
          <img 
            src={manga.coverUrl} 
            alt={manga.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" 
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
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 py-1">
        <h4 className="font-bold text-[15px] text-text-primary leading-tight truncate group-hover:text-accent transition-colors">
          {manga.title}
        </h4>
        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
          <span className="truncate">{manga.latestChapter || "Detail"}</span>
          {manga.format && (
             <>
                <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
                <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">
                  {manga.format}
                </span>
             </>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="shrink-0 flex items-center justify-center pl-2">
        <div className="flex items-center gap-1 bg-surface-base border border-border-subtle group-hover:border-accent/20 px-2 py-1 rounded-lg">
          <span className="text-xs font-black text-text-primary" suppressHydrationWarning>{Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}</span>
          <Star weight="fill" size={14} className="text-semantic-warning" />
        </div>
      </div>
    </Link>
  );
}
