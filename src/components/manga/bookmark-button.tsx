"use client";

import * as React from "react";
import { useMounted } from "@/shared/hooks/use-mounted";
import { BookmarkSimple } from "@phosphor-icons/react";
import type { MangaItem } from "@/shared/types/source";
import { motion, AnimatePresence } from "motion/react";
import { useLibraryStore } from "@/shared/store/library-store";
import { cn } from "@/shared/utils/cn";

export function BookmarkButton({ sourceId, manga, className }: { sourceId: string, manga: MangaItem, className?: string }) {
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
      className={cn(
        "relative grid size-8 place-items-center rounded-full transition-all focus-visible:outline-none bg-black/40 backdrop-blur-md shadow-sm -white/10",
        isInLibrary ? 'text-accent hover:text-accent-hover' : 'text-media-muted hover:text-media-foreground',
        className
      )}
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
