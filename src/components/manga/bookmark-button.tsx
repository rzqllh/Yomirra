"use client";

import * as React from "react";
import { useMounted } from "@/shared/hooks/use-mounted";
import { BookmarkSimple } from "@phosphor-icons/react";
import type { MangaItem } from "@/shared/types/source";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useLibraryStore } from "@/shared/store/library-store";
import { cn } from "@/shared/utils/cn";

export function BookmarkButton({ sourceId, manga, className }: { sourceId: string, manga: MangaItem, className?: string }) {
  const isMounted = useMounted();
  const rawIsInLibrary = useLibraryStore((state) => state.isInLibrary(sourceId, manga.id));
  const isInLibrary = isMounted ? rawIsInLibrary : false;
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);
  const reducedMotion = useReducedMotion();

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const effectiveBindings = (manga as any)?.sourceBindings;
    const linkedSources = Array.isArray(effectiveBindings) && effectiveBindings.length > 0
      ? effectiveBindings
          .filter((b: any) => b.sourceId !== sourceId)
          .map((b: any) => ({
            sourceId: b.sourceId,
            mangaId: b.mangaId,
            addedAt: Date.now(),
            matchConfidence: "HIGH_CONFIDENCE" as const,
          }))
      : undefined;

    toggleLibrary({
      sourceId: sourceId,
      mangaId: manga.id,
      title: manga.title,
      coverUrl: manga.coverUrl,
      author: manga.author,
      status: manga.status,
      format: manga.format,
      linkedSources,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <motion.button 
      onClick={handleBookmarkClick}
      whileTap={reducedMotion ? undefined : { scale: 0.9 }}
      className={cn(
        "relative grid size-11 place-items-center rounded-[12px] border border-border-subtle bg-surface-overlay/95 text-text-primary shadow-sm transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        isInLibrary && 'text-accent',
        className
      )}
      aria-label={isInLibrary ? `Hapus ${manga.title} dari rak` : `Simpan ${manga.title} ke rak`}
      aria-pressed={isInLibrary}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isInLibrary ? (
          <motion.span
            key="saved"
            initial={reducedMotion ? false : { scale: 0.3, opacity: 0 }}
            animate={{ 
              scale: reducedMotion ? 1 : [0.3, 1.3, 0.9, 1.1, 1],
              opacity: 1 
            }}
            exit={reducedMotion ? undefined : { scale: 0.3, opacity: 0 }}
            transition={{ 
              duration: reducedMotion ? 0 : 0.5,
              times: [0, 0.4, 0.6, 0.8, 1],
              ease: "easeOut"
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <BookmarkSimple size={18} weight="fill" />
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? undefined : { scale: 0.6, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <BookmarkSimple size={18} weight="regular" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
