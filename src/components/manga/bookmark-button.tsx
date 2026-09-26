"use client";

import * as React from "react";
import { useMounted } from "@/shared/hooks/use-mounted";
import { BookmarkSimple } from "@phosphor-icons/react";
import type { MangaItem } from "@/shared/types/source";
import { useLibraryStore } from "@/shared/store/library-store";
import { cn } from "@/shared/utils/cn";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";

export function BookmarkButton({ sourceId, manga, className }: { sourceId: string, manga: MangaItem, className?: string }) {
  const isMounted = useMounted();
  const rawIsInLibrary = useLibraryStore((state) => state.isInLibrary(sourceId, manga.id));
  const isInLibrary = isMounted ? rawIsInLibrary : false;
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);
  const reducedMotion = useReducedMotion();
  const [isBouncing, setIsBouncing] = React.useState(false);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!reducedMotion) {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 300);
    }
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
      type="button"
      onClick={handleBookmarkClick}
      whileTap={reducedMotion ? undefined : { scale: 0.95 }}
      animate={!reducedMotion && isBouncing ? { scale: [1, 0.8, 1.15, 1] } : { scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative grid size-11 place-items-center rounded-[12px] border border-border-subtle bg-surface-base/95 text-text-primary shadow-xs transition-colors hover:bg-surface-hover hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer",
        isInLibrary ? "text-accent bg-accent-dim border-accent/40" : "text-text-secondary",
        className
      )}
      aria-label={isInLibrary ? `Hapus ${manga.title} dari rak` : `Simpan ${manga.title} ke rak`}
      aria-pressed={isInLibrary}
    >
      <span className="relative flex items-center justify-center size-5" aria-hidden="true">
        <AnimatePresence mode="wait" initial={false}>
          {isInLibrary ? (
            <motion.span
              key="in-library"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="text-accent flex items-center justify-center"
            >
              <BookmarkSimple size={18} weight="fill" />
            </motion.span>
          ) : (
            <motion.span
              key="not-in-library"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="text-text-secondary flex items-center justify-center"
            >
              <BookmarkSimple size={18} weight="regular" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
