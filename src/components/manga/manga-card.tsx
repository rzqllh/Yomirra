"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMounted } from "@/shared/hooks/use-mounted";
import { BookmarkSimple, Play, ImageBroken } from "@phosphor-icons/react";
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
  const rawIsInLibrary = useLibraryStore((state) => state.isInLibrary(manga.sourceId || sourceId, manga.id));
  const isInLibrary = isMounted ? rawIsInLibrary : false;
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLibrary({
      sourceId: manga.sourceId || sourceId,
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
      whileTap={{ scale: 0.86 }}
      whileHover={{ scale: 1.04 }}
      className={cn(
        "grid size-8 place-items-center rounded-full transition-all focus-visible:outline-none bg-black/40 backdrop-blur-md shadow-sm border border-white/10",
        isInLibrary ? 'text-accent hover:text-accent-hover' : 'text-media-muted hover:text-media-foreground'
      )}
      aria-label={isInLibrary ? "Hapus dari readlist" : "Simpan ke readlist"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isInLibrary ? (
          <motion.span
            key="saved"
            initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, rotate: 12, opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <BookmarkSimple size={18} weight="fill" />
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ scale: 0.6, rotate: 12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, rotate: -12, opacity: 0 }}
            transition={{ duration: 0.16 }}
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
      <div className="group relative flex items-center gap-4 rounded-xl bg-surface-glass backdrop-blur-sm p-3 border border-border-subtle/50 transition-all duration-300 hover:bg-surface-overlay/80 hover:shadow-sm overflow-hidden">
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
            <span className="uppercase tracking-wider">{sourceId}</span>
            {progressPercent !== undefined && progressPercent > 0 && (
              <>
                <span>•</span>
                <span className="text-accent">{progressPercent}%</span>
              </>
            )}
          </div>
        </div>
        
        {chapterId && (
          <div className="bg-accent/10 dark:bg-accent/20 backdrop-blur-xl border border-accent/20 rounded-full p-1 shadow-sm shrink-0 ml-2 z-20 relative">
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

  // --- EDITORIAL VARIANT ---
  if (variant === "editorial") {
    return (
      <motion.article
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ ease: "easeOut", duration: 0.2 }}
        className="relative flex flex-col w-full group rounded-lg overflow-hidden bg-surface-glass backdrop-blur-md border border-border-default shadow-sm aspect-[3/4]"
      >
        <Link 
          href={getMangaDetailHref(sourceId, manga.id, fullPath)} 
          className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent vt-hover"
          prefetch={false}
          style={vtStyle}
          aria-label={`Read ${manga.title}`}
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
          
          {/* Media overlay gradient */}
          <div className="absolute inset-0 bg-media-gradient opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Top Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20">
            {manga.status === "Ongoing" && (
              <div className="flex items-center justify-center rounded-sm bg-accent px-1.5 py-0.5 shadow-sm">
                <span className="text-2xs font-black uppercase tracking-wider text-accent-on leading-none">UP</span>
              </div>
            )}
            {manga.format && (
              <div className="flex items-center justify-center rounded-sm bg-black/60 backdrop-blur-md px-1.5 py-0.5 shadow-sm border border-white/10">
                <span className="text-2xs font-black uppercase tracking-wider text-media-foreground leading-none">{manga.format}</span>
              </div>
            )}
          </div>
          
          <div className="absolute top-2 right-2 z-30 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <BookmarkButton sourceId={sourceId} manga={manga} />
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col justify-end pointer-events-none">
            <h3 className="line-clamp-2 text-sm sm:text-base font-bold text-media-foreground leading-[1.25] mb-1 drop-shadow-md">
              {manga.title}
            </h3>
            <div className="flex items-center gap-2">
              {manga.latestChapter && (
                <span className="text-xs font-semibold text-accent drop-shadow-md truncate">
                  {manga.latestChapter}
                </span>
              )}
              {timeText && (
                <span className="text-2xs text-media-muted drop-shadow-md whitespace-nowrap" suppressHydrationWarning>
                  {timeText}
                </span>
              )}
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
          className="relative w-full aspect-[1/1.4] overflow-hidden rounded-md bg-surface-glass backdrop-blur-md border border-border-default shadow-sm mb-2.5 vt-hover"
          style={vtStyle}
        >
          {manga.coverUrl && !imageError ? (
            <img
              src={manga.coverUrl}
              alt={manga.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
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
          
          <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1 z-20">
            {manga.status === "Ongoing" && (
              <div className="flex items-center justify-center rounded-xs bg-accent px-1.5 py-[2px] shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-wider text-accent-on leading-none">UP</span>
              </div>
            )}
            {manga.format && (
              <div className="flex items-center justify-center rounded-xs bg-black/60 backdrop-blur-md px-1.5 py-[2px] shadow-sm border border-white/10">
                <span className="text-[9px] font-black uppercase tracking-wider text-media-foreground leading-none">{manga.format}</span>
              </div>
            )}
          </div>
          
          <div className="absolute top-1.5 right-1.5 z-30 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <BookmarkButton sourceId={sourceId} manga={manga} />
          </div>
        </div>

        <div className="flex flex-col px-0.5">
          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-text-primary leading-[1.3] mb-0.5 group-hover:text-accent transition-colors duration-200">
            {manga.title}
          </h3>
          
          {manga.latestChapter && (
            <span className="text-[11px] font-medium text-text-muted truncate">
              {manga.latestChapter}
            </span>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
