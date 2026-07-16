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


      {/* Cover Image */}
      <div className="relative w-[52px] h-[72px] shrink-0 bg-surface-base rounded-[10px] overflow-hidden border border-border-subtle group-hover:border-accent/30 transition-all shadow-sm">
        {manga.rank !== undefined && (
          <div className="absolute top-0 left-0 z-10 bg-accent/90 backdrop-blur-sm text-accent-on text-[10px] font-black px-1.5 py-0.5 rounded-br-lg shadow-sm">
            #{manga.rank}
          </div>
        )}
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
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-text-secondary">
          <span className="truncate max-w-[100px] sm:max-w-[140px]">{manga.latestChapter || "Detail"}</span>
          <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
          <div className="flex items-center gap-0.5 text-text-primary">
            <Star weight="fill" size={12} className="text-semantic-warning" />
            <span className="font-bold" suppressHydrationWarning>{Number(scoreToDisplay) > 0 ? Number(scoreToDisplay).toFixed(1) : "-.-"}</span>
          </div>
          {manga.format && (
             <>
                <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
                <span className="font-black uppercase text-text-muted tracking-wider">
                  {manga.format}
                </span>
             </>
          )}
        </div>
      </div>
    </Link>
  );
}
