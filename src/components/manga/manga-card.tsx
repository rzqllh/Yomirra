"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BookmarkSimple } from "@phosphor-icons/react";
import { getMangaDetailHref } from "@/shared/lib/routes";
import type { MangaItem } from "@/shared/types/source";
import { motion, AnimatePresence } from "motion/react";
import { useLibraryStore } from "@/shared/store/library-store";

interface MangaCardProps {
  manga: MangaItem;
  sourceId: string;
  priority?: boolean;
  variant?: "shelf" | "compact" | "discovery";
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

export function MangaCard({ manga, sourceId, priority = false, variant = "discovery" }: MangaCardProps) {
  const timeText = getRelativeTime(manga.latestChapterTime);
  const [isMounted, setIsMounted] = React.useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => setIsMounted(true), []);

  const rawIsInLibrary = useLibraryStore((state) => state.isInLibrary(sourceId, manga.id));
  const isInLibrary = isMounted ? rawIsInLibrary : false;
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);
  const [isInteracting, setIsInteracting] = React.useState(false);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLibrary({
      sourceId,
      mangaId: manga.id,
      title: manga.title,
      coverUrl: manga.coverUrl,
      status: manga.status,
      format: manga.format,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const BookmarkButton = () => (
    <motion.button 
      onClick={handleBookmarkClick}
      whileTap={{ scale: 0.86 }}
      whileHover={{ scale: 1.04 }}
      className={`grid size-8 place-items-center rounded-full transition-all focus-visible:outline-none ${isInLibrary ? 'text-accent hover:text-accent-hover' : 'text-white/70 hover:text-white'}`}
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

  if (variant === "compact") {
    return (
      <motion.article
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.985 }}
        className="relative flex items-center gap-4 w-full p-2 rounded-[var(--radius-md)] bg-surface-base hover:bg-surface-raised border border-transparent hover:border-border-subtle transition-all group"
      >
        <Link 
          href={getMangaDetailHref(sourceId, manga.id)}
          className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[var(--radius-md)]"
          aria-label={manga.title}
        />
        
        <div className="relative shrink-0 w-[4rem] sm:w-[5rem] aspect-[1/1.4] overflow-hidden rounded-[var(--radius-sm)] shadow-sm bg-surface-muted">
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            sizes="10vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={manga.coverUrl.startsWith("http")}
          />
        </div>
        
        <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-text-primary line-clamp-2 leading-tight mb-1 group-hover:text-accent transition-colors">
            {manga.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
            {manga.latestChapter && (
              <span className="font-medium text-text-secondary line-clamp-1">{manga.latestChapter}</span>
            )}
            {timeText && (
              <>
                <span className="size-1 rounded-full bg-border-strong opacity-50" />
                <span className="shrink-0">{timeText}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="relative z-20 shrink-0">
          <BookmarkButton />
        </div>
      </motion.article>
    );
  }

  // shelf and discovery variants use the vertical grid card
  return (
    <motion.article
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="relative block w-full aspect-[1/1.4] overflow-hidden rounded-[var(--radius-md)] bg-surface-muted border border-border-default shadow-sm group"
    >
      <Link 
        href={getMangaDetailHref(sourceId, manga.id)} 
        transitionTypes={['nav-forward']}
        onPointerDown={() => setIsInteracting(true)}
        onPointerLeave={() => setIsInteracting(false)}
        className="group absolute inset-0 flex flex-col justify-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        prefetch={false}
      >
        <Image
          src={manga.coverUrl}
          alt={manga.title}
          fill
          sizes={priority ? "(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw" : "(max-width: 640px) 25vw, 15vw"}
          priority={priority}
          style={isInteracting ? { viewTransitionName: `cover-${sourceId}-${manga.id}` } : undefined}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
          unoptimized={manga.coverUrl.startsWith("http")}
        />
        
        {/* Cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-base)] via-[var(--surface-base)]/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100 z-10 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20">
          {manga.status === "Ongoing" && variant === "discovery" && (
            <div className="flex items-center justify-center rounded-[var(--radius-xs)] bg-accent px-1.5 py-[2px] shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-wider text-accent-on leading-none">UP</span>
            </div>
          )}
          {manga.format && (
            <div className="flex items-center justify-center rounded-[var(--radius-xs)] bg-surface-overlay/80 backdrop-blur-md px-1.5 py-[2px] shadow-sm border border-border-default">
              <span className="text-[9px] font-black uppercase tracking-wider text-text-primary leading-none">{manga.format}</span>
            </div>
          )}
        </div>

        {/* Info Content */}
        <div className="relative z-20 p-3 pb-2.5 flex flex-col justify-end w-full">
          <motion.h3 
            className="line-clamp-2 text-xs sm:text-sm font-bold text-white leading-tight text-shadow-sm mb-1 group-hover:text-accent transition-colors duration-200"
          >
            {manga.title}
          </motion.h3>
          
          <div className="flex items-end justify-between w-full mt-0.5 gap-1">
            <div className="flex flex-col min-w-0 flex-1">
              {manga.latestChapter && (
                <span className="text-[11px] sm:text-xs font-medium text-white/90 truncate">
                  {manga.latestChapter}
                </span>
              )}
              {timeText && variant === "discovery" && (
                <span className="text-[10px] sm:text-[11px] text-white/60 truncate" suppressHydrationWarning>
                  {timeText}
                </span>
              )}
            </div>
            
            <div className="relative z-30 shrink-0">
              <BookmarkButton />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
