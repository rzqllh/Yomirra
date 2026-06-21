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

export interface MangaCardProps {
  manga: MangaItem;
  sourceId: string;
  priority?: boolean;
  variant?: "shelf" | "history" | "editorial";
  // history specific
  chapterId?: string;
  chapterTitle?: string;
  progressPercent?: number;
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
      className={cn( "relative grid size-8 place-items-center rounded-full transition-all focus-visible:outline-none bg-black/40 backdrop-blur-md -sm -white/10", isInLibrary ? 'text-accent hover:text-accent-hover' : 'text-media-muted hover:text-media-foreground' )}
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
  progressPercent
}: MangaCardProps) {
  const timeText = getRelativeTime(manga.latestChapterTime);
  const [imageError, setImageError] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const safeId = `${sourceId}-${manga.id}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const vtName = `manga-cover-${safeId}`;

  const vtStyle = { '--vt-name': vtName } as React.CSSProperties;

  // --- HISTORY VARIANT ---
  if (variant === "history") {
    const targetHref = chapterId 
      ? getReaderHref(sourceId, manga.id, chapterId)
      : getMangaDetailHref(sourceId, manga.id, fullPath);

    return (
      <div className="group relative flex items-center gap-4 rounded-xl bg-surface-glass backdrop-blur-sm p-3 --subtle/50 transition-all duration-300 hover:bg-surface-overlay/80 hover:-sm overflow-hidden">
        <Link 
          href={targetHref} 
          prefetch={false} 
          className="relative h-[84px] w-[60px] shrink-0 overflow-hidden rounded-sm bg-surface-glass backdrop-blur-md -sm z-10 vt-hover"
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
          <div className="bg-accent/10 dark:bg-accent/20 backdrop-blur-xl -accent/20 rounded-full p-1 -sm shrink-0 ml-2 z-20 relative">
            <Link 
              href={targetHref} 
              prefetch={false}
              className="flex items-center justify-center rounded-full h-8 w-8 text-accent hover:bg-accent/10 transition-colors"
            >
              <Play className="h-4 w-4 ml-0.5" weight="fill" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  // --- EDITORIAL VARIANT --- (Ticket Stub)
  if (variant === "editorial") {
    return (
      <motion.article
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ ease: "easeOut", duration: 0.2 }}
        className="relative w-full group min-w-[280px]"
      >
        <Link 
          href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
          className="flex h-[120px] bg-surface-glass backdrop-blur-md rounded-3xl overflow-hidden cursor-pointer group hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent -sm vt-hover"
          prefetch={false}
          aria-label={`Read ${manga.title}`}
          style={vtStyle}
        >
          {manga.rank !== undefined && (
            <div className="w-14 sm:w-16 shrink-0 flex items-center justify-center bg-surface-muted/30 border-r-2 border-dashed border-border-subtle relative">
              <span className={cn(
                "text-2xl sm:text-3xl font-black italic",
                manga.rank === 1 ? "text-amber-500 drop-shadow-md" : 
                manga.rank === 2 ? "text-slate-400 drop-shadow-md" : 
                manga.rank === 3 ? "text-amber-700 drop-shadow-md" : 
                "text-text-muted/50"
              )}>
                #{manga.rank}
              </span>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-base rounded-full z-20" />
            </div>
          )}
          <div className={cn("bg-surface-muted shrink-0 relative", manga.rank !== undefined ? "w-20" : "w-24")}>
             {manga.rank !== undefined && (
               <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-base rounded-full z-20" />
             )}
             <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-base rounded-full z-20" />
             {manga.coverUrl && !imageError ? (
               <img src={manga.coverUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={manga.title} onError={() => setImageError(true)} referrerPolicy="no-referrer" />
             ) : (
               <div className="absolute inset-0 flex items-center justify-center">
                 <ImageBroken size={24} weight="duotone" className="text-text-muted/50" />
               </div>
             )}
          </div>
          <div className="flex-1 p-4 pl-5 border-l-2 border-dashed border-border-subtle relative flex flex-col justify-center min-w-0">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-base rounded-full z-20" />
            
            <div className="flex items-center justify-between gap-2 mb-1 z-10 relative">
               <div className="flex items-center gap-1.5 min-w-0">
                 <span className="text-[10px] font-black text-accent uppercase tracking-wider shrink-0 bg-accent/10 px-1.5 py-0.5 rounded-sm">{manga.status || "Ongoing"}</span>
                 {manga.format && <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0 bg-surface-muted px-1.5 py-0.5 rounded-sm">{manga.format}</span>}
               </div>
               <div className="shrink-0 scale-90 origin-right">
                  <BookmarkButton sourceId={sourceId} manga={manga} />
               </div>
            </div>
            
            <h4 className="text-sm sm:text-base font-bold truncate group-hover:text-accent transition-colors z-10 relative">{manga.title}</h4>
            
            <div className="mt-1 flex items-center justify-between text-xs text-text-muted z-10 relative">
              <span className="truncate pr-2">{manga.latestChapter || "Detail"}</span>
              <span className="font-semibold flex items-center gap-1 shrink-0"><Star weight="fill" className="text-semantic-warning" /> {manga.score ? manga.score.toFixed(1) : "-.-"}</span>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  // --- SHELF VARIANT ---
  return (
    <motion.article
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
          className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl bg-surface-glass --subtle -sm mb-3 vt-hover"
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
              <div className="flex items-center gap-1 rounded-full bg-surface-glass backdrop-blur-md px-2 py-1 -sm --glass">
                <TrendUp weight="bold" className="text-accent text-[10px]" />
                <span className="text-xs font-black text-text-primary">#{manga.rank}</span>
              </div>
            )}
            
            <div className="md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <BookmarkButton sourceId={sourceId} manga={manga} />
            </div>
          </div>
          
          <div className="absolute top-2 right-2 flex flex-wrap gap-1 z-20">
            {manga.format && (
              <div className="flex items-center justify-center rounded-md bg-surface-overlay/80 backdrop-blur-md px-2 py-1 -sm -white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-text-primary leading-none">{manga.format}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col px-1">
          <h3 className="line-clamp-2 text-sm font-bold text-text-primary leading-tight mb-1.5 group-hover:text-accent transition-colors duration-200">
            {manga.title}
          </h3>
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs font-medium text-text-muted truncate max-w-[70%]">
              {manga.latestChapter || "Detail"}
            </span>
            <span className="text-xs font-semibold flex items-center gap-1 text-text-muted shrink-0">
              <Star weight="fill" className="text-semantic-warning" /> 
              {manga.score ? manga.score.toFixed(1) : "-.-"}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
