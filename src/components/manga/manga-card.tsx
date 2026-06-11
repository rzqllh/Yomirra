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

export function MangaCard({ manga, sourceId, priority = false }: MangaCardProps) {
  const timeText = getRelativeTime(manga.latestChapterTime);
  const [isMounted, setIsMounted] = React.useState(false);
  // eslint-disable-next-line
  React.useEffect(() => setIsMounted(true), []);

  const rawIsInLibrary = useLibraryStore((state) => state.isInLibrary(sourceId, manga.id));
  const isInLibrary = isMounted ? rawIsInLibrary : false;
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);

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

  return (
    <motion.article
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className="relative block w-full aspect-[1/1.4] overflow-hidden rounded-[var(--card-cover-radius)] bg-surface-raised border border-border-subtle shadow-sm group"
    >
      <Link 
        href={getMangaDetailHref(sourceId, manga.id)} 
        className="group absolute inset-0 flex flex-col justify-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        prefetch={false}
      >
        <Image
          src={manga.coverUrl}
          alt={manga.title}
          fill
          sizes={priority ? "(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw" : "(max-width: 640px) 25vw, 15vw"}
          priority={priority}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          unoptimized={manga.coverUrl.startsWith("http")} // Since these are external arbitrary URLs, standard unoptimized might be needed unless domains are configured
        />
        
        {/* Solid smooth gradient for high readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/50 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100 z-10 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20">
          {manga.status === "Ongoing" && (
            <div className="rounded-[4px] bg-accent px-1.5 py-0.5 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-wider text-white">UP</span>
            </div>
          )}
          {manga.format && (
            <div className="rounded-[4px] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 shadow-sm border border-white/10">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white">{manga.format}</span>
            </div>
          )}
        </div>

        {/* Info Content */}
        <div className="relative z-20 p-2 sm:p-3 pb-2 flex flex-col justify-end w-full">
          <motion.h3 
            className="line-clamp-2 text-xs sm:text-sm font-bold text-white leading-tight text-shadow-sm mb-1 group-hover:text-accent transition-colors duration-200"
          >
            {manga.title}
          </motion.h3>
          
          <div className="flex items-end justify-between w-full mt-0.5 gap-1">
            <div className="flex flex-col min-w-0 flex-1">
              {manga.latestChapter && (
                <span className="text-2xs sm:text-xs font-medium text-white/90 truncate">
                  {manga.latestChapter}
                </span>
              )}
              {timeText && (
                <span className="text-3xs sm:text-2xs text-white/60 truncate" suppressHydrationWarning>
                  {timeText}
                </span>
              )}
            </div>
            
            <motion.button 
              onClick={handleBookmarkClick}
              whileTap={{ scale: 0.86 }}
              whileHover={{ scale: 1.04 }}
              className={`grid size-8 place-items-center rounded-full transition-all focus-visible:outline-none ${isInLibrary ? 'text-accent hover:text-accent/80' : 'text-white/70 hover:text-white'}`}
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
                    <BookmarkSimple size={16} weight="fill" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ scale: 0.6, rotate: 12, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0.6, rotate: -12, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                  >
                    <BookmarkSimple size={16} weight="bold" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
