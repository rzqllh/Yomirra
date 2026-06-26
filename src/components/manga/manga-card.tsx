"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMounted } from "@/shared/hooks/use-mounted";
import { BookmarkSimple, Play, ImageBroken, TrendUp, Star } from "@phosphor-icons/react";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import type { MangaItem } from "@/shared/types/source";
import { motion, AnimatePresence } from "motion/react";
import { useLibraryStore } from "@/shared/store/library-store";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { sourceRegistry } from "@/shared/sources/source-registry";

export interface MangaCardProps {
  manga: MangaItem;
  sourceId: string;
  priority?: boolean;
  variant?: "shelf" | "history" | "editorial";
  // history specific
  chapterId?: string;
  chapterTitle?: string;
  progressPercent?: number;
  showSourceBadge?: boolean;
  // eksplorasi specific
  rank?: number;
  score?: number;
}

function getRelativeTime(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 60) return `${diffInMins} mnt lalu`;
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  if (diffInDays < 30) return `${diffInDays} hr lalu`;
  return date.toLocaleDateString('id-ID');
}

function BookmarkButton({ sourceId, manga }: { sourceId: string, manga: MangaItem }) {
  const isMounted = useMounted();
  const rawIsInLibrary = useLibraryStore((state) => state.isInLibrary(sourceId, manga.id));
  const isInLibrary = isMounted ? rawIsInLibrary : false;
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLibrary({
      sourceId: sourceId,
      mangaId: manga.id,
      title: manga.title,
      coverUrl: manga.coverUrl,
      status: manga.status,
      format: manga.format,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <motion.button 
      onClick={handleBookmarkClick}
      whileTap={{ scale: 0.8 }}
      className={cn( "relative grid size-8 place-items-center rounded-full transition-all focus-visible:outline-none bg-black/40 backdrop-blur-md shadow-sm -white/10", isInLibrary ? 'text-accent hover:text-accent-hover' : 'text-media-muted hover:text-media-foreground' )}
      aria-label={isInLibrary ? "Hapus dari readlist" : "Simpan ke readlist"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isInLibrary ? (
          <motion.span
            key="saved"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ 
              scale: [0.3, 1.3, 0.9, 1.1, 1],
              opacity: 1 
            }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ 
              duration: 0.5,
              times: [0, 0.4, 0.6, 0.8, 1],
              ease: "easeOut"
            }}
            className="absolute inset-0 flex items-center justify-center drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
          >
            <BookmarkSimple size={18} weight="fill" />
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <BookmarkSimple size={18} weight="bold" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function MangaCard({ 
  manga, 
  sourceId, 
  priority = false, 
  variant = "shelf",
  chapterId,
  chapterTitle,
  progressPercent,
  showSourceBadge = false
}: MangaCardProps) {
  const timeText = getRelativeTime(manga.latestChapterTime);
  const [imageError, setImageError] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const safeId = `${sourceId}-${manga.id}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const vtName = `manga-cover-${safeId}`;

  const vtStyle = { '--vt-name': vtName } as React.CSSProperties;

  // Fetch Anilist score as single source of truth
  const { data: anilistData, isLoading: isAnilistLoading } = useQuery({
    queryKey: ["anilist-score", manga.title],
    queryFn: () => apiClient.getAnilistScore(manga.title),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1, // Fail fast if Anilist rate limits us
  });

  const displayScore = anilistData?.score ?? manga.score;
  const sourceName = showSourceBadge ? (sourceRegistry.find(s => s.id === sourceId)?.name || sourceId) : null;

  // --- HISTORY VARIANT ---
  if (variant === "history") {
    const targetHref = chapterId 
      ? getReaderHref(sourceId, manga.id, chapterId)
      : getMangaDetailHref(sourceId, manga.id, fullPath);

    return (
      <motion.article 
        layout="position"
        className="group relative flex items-center gap-4 rounded-xl bg-surface-glass backdrop-blur-sm p-3 border-border-subtle/50 transition-all duration-300 hover:bg-surface-overlay/80 hover:-sm overflow-hidden"
      >
        <Link 
          href={targetHref} 
          prefetch={false} 
          className="relative h-[84px] w-[60px] shrink-0 overflow-hidden rounded-sm bg-surface-glass backdrop-blur-md shadow-sm z-10 vt-hover"
          style={!chapterId ? vtStyle : undefined}
          aria-label={`Cover of ${manga.title}`}
        >
          {manga.coverUrl && !imageError ? (
            <img 
              src={manga.coverUrl} 
              alt={manga.title} 
              className="absolute inset-0 w-full h-full object-cover" 
              onError={() => setImageError(true)}
              ref={(img) => {
                if (img && img.complete && img.naturalWidth === 0) {
                  setImageError(true);
                }
              }}
              referrerPolicy="no-referrer"
              decoding="async"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-surface-muted flex flex-col items-center justify-center text-text-muted/50 p-2">
              <ImageBroken size={24} weight="duotone" />
            </div>
          )}
        </Link>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center z-10">
          <Link href={getMangaDetailHref(sourceId, manga.id, fullPath)} prefetch={false} className="block min-w-0">
            <h3 className="truncate font-bold text-text-primary text-sm md:text-base leading-snug group-hover:text-accent transition-colors">
              {manga.title}
            </h3>
          </Link>
          <Link href={targetHref} prefetch={false} className="block min-w-0 mt-0.5">
            <p className="truncate text-sm font-medium text-text-muted group-hover:text-accent transition-colors">
              {chapterTitle || manga.latestChapter || `Detail`}
            </p>
          </Link>
          <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-text-muted">
            <span className="uppercase tracking-wider">{manga.format || manga.status || "MANGA"}</span>
            {progressPercent !== undefined && progressPercent > 0 && (
              <>
                <span>•</span>
                <span className="text-accent">{progressPercent}%</span>
              </>
            )}
          </div>
        </div>
        
        {chapterId && (
          <div className="bg-accent/10 dark:bg-accent/20 backdrop-blur-xl -accent/20 rounded-full p-1 shadow-sm shrink-0 ml-2 z-20 relative">
            <Link 
              href={targetHref} 
              prefetch={false}
              className="flex items-center justify-center rounded-full h-8 w-8 text-accent hover:bg-accent/10 transition-colors"
            >
              <Play className="h-4 w-4 ml-0.5" weight="fill" />
            </Link>
          </div>
        )}
      </motion.article>
    );
  }

  // --- EDITORIAL VARIANT --- (Bento List x Card Remastered)
  if (variant === "editorial") {
    return (
      <motion.article
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ ease: "easeOut", duration: 0.2 }}
        className="w-full min-w-[280px]"
      >
        <Link 
          href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
          className="flex gap-2.5 h-[110px] cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent vt-hover"
          prefetch={false}
          aria-label={`Read ${manga.title}`}
          style={vtStyle}
        >
          {/* Cover Bento Cell */}
          <div className="relative w-[80px] shrink-0 bg-surface-raised rounded-2xl overflow-hidden shadow-sm border border-border-subtle group-hover:border-accent/30 group-hover:shadow-accent/10 transition-all">
            {manga.coverUrl && !imageError ? (
              <img src={manga.coverUrl} alt={manga.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImageError(true)} referrerPolicy="no-referrer" />
            ) : (
              <div className="h-full w-full bg-surface-muted flex flex-col items-center justify-center text-text-muted/50 p-2">
                <ImageBroken size={24} weight="duotone" />
              </div>
            )}
            
            {/* Number Badge (Remastered inside cover) */}
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
          </div>

          {/* Info Bento Cell */}
          <div className="flex-1 bg-surface-raised rounded-2xl border border-border-subtle p-3.5 flex flex-col justify-center min-w-0 group-hover:bg-surface-overlay group-hover:border-accent/30 transition-all shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[9px] font-black uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-md">{manga.status || "Ongoing"}</span>
              {manga.format && <span className="text-[9px] font-black uppercase text-text-secondary bg-surface-base px-2 py-0.5 rounded-md">{manga.format}</span>}
            </div>
            <h4 className="font-bold text-sm md:text-base text-text-primary leading-snug truncate group-hover:text-accent transition-colors">
              {manga.title}
            </h4>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium truncate pr-2">{manga.latestChapter || "Detail"}</span>
              {timeText && <span className="text-[10px] text-text-muted whitespace-nowrap">{timeText}</span>}
            </div>
          </div>

          {/* Action/Rating Bento Cell */}
          <div className="w-[48px] shrink-0 bg-surface-raised rounded-2xl border border-border-subtle flex flex-col items-center justify-center gap-3 shadow-sm group-hover:bg-surface-overlay group-hover:border-accent/30 transition-all relative overflow-hidden">
             {/* Bookmark */}
             <div className="z-10 scale-90 relative" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
               <BookmarkButton sourceId={sourceId} manga={manga} />
             </div>
             
             {/* Divider */}
             <div className="w-6 h-px bg-border-subtle z-10" />
             
             {/* Rating */}
             <div className="flex flex-col items-center gap-0.5 text-semantic-warning z-10">
               <Star weight="fill" size={12} />
               {isAnilistLoading ? (
                 <div className="w-4 h-3 bg-semantic-warning/20 animate-pulse rounded mt-0.5" />
               ) : (
                 <span className="text-[10px] font-black" suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
               )}
             </div>
             
             {/* Hover Glow */}
             <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </Link>
      </motion.article>
    );
  }

  // --- SHELF VARIANT ---
  return (
    <motion.article
      layout="position"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ ease: "easeOut", duration: 0.2 }}
      className="relative flex flex-col w-full group"
    >
      <Link 
        href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
        transitionTypes={['nav-forward']}
        className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        prefetch={false}
        aria-label={`Read ${manga.title}`}
      >
        <div 
          className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl bg-surface-glass border-border-subtle shadow-sm mb-3 vt-hover"
          style={vtStyle}
        >
          {manga.coverUrl && !imageError ? (
            <img
              src={manga.coverUrl}
              alt={manga.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              onError={() => setImageError(true)}
              ref={(img) => {
                if (img && img.complete && img.naturalWidth === 0) {
                  setImageError(true);
                }
              }}
              referrerPolicy="no-referrer"
              decoding="async"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-surface-muted flex flex-col items-center justify-center text-text-muted/50 p-4">
              <ImageBroken size={32} weight="duotone" className="mb-2" />
              <span className="text-xs font-medium text-center line-clamp-2 px-2">{manga.title}</span>
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20 items-start">
            {manga.rank !== undefined && (
              <div className="flex items-center gap-1 rounded-full bg-surface-glass backdrop-blur-md px-2 py-1 shadow-sm">
                <TrendUp weight="bold" className="text-accent text-[10px]" />
                <span className="text-xs font-black text-text-primary">#{manga.rank}</span>
              </div>
            )}
            
            <div className="md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <BookmarkButton sourceId={sourceId} manga={manga} />
            </div>
          </div>
        </div>

        <div className="flex flex-col px-1 mt-1.5">
          <h3 className="truncate text-sm font-bold text-text-primary leading-tight mb-1 group-hover:text-accent transition-colors duration-200">
            {manga.title}
          </h3>
          
          {(showSourceBadge || manga.format) && (
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              {manga.format && (
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0">{manga.format}</span>
              )}
              {manga.format && showSourceBadge && sourceName && (
                <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />
              )}
              {showSourceBadge && sourceName && (
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider truncate">{sourceName}</span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs font-medium text-text-muted truncate max-w-[70%]">
              {manga.latestChapter || "Detail"}
            </span>
            <span className="text-xs font-semibold flex items-center gap-1 text-text-muted shrink-0">
              <Star weight="fill" className="text-semantic-warning" /> 
              <span suppressHydrationWarning>{Number(displayScore) > 0 ? Number(displayScore).toFixed(1) : "-.-"}</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
