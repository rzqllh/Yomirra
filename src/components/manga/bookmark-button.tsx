"use client";

import * as React from "react";
import { useMounted } from "@/shared/hooks/use-mounted";
import type { MangaItem } from "@/shared/types/source";
import { useLibraryStore } from "@/shared/store/library-store";
import { cn } from "@/shared/utils/cn";
import { BookmarkSimple } from "@phosphor-icons/react";
import { transitions } from "@/shared/lib/motion/tokens";

import { motion, useReducedMotion } from "motion/react";

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
      type="button"
      onClick={handleBookmarkClick}
      whileTap={reducedMotion ? undefined : { scale: 0.97 }}
      transition={reducedMotion ? { duration: 0 } : transitions.snappy}
      className={cn(
        "group relative grid size-11 place-items-center rounded-[12px] border border-border-subtle bg-surface-base/95 text-text-primary shadow-xs transition-colors hover:bg-surface-hover hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer",
        isInLibrary ? "text-accent bg-accent-dim border-accent/40" : "text-text-secondary",
        className
      )}
      aria-label={isInLibrary ? `Hapus ${manga.title} dari rak` : `Simpan ${manga.title} ke rak`}
      aria-pressed={isInLibrary}
    >
      <BookmarkSimple
        size={19}
        weight={isInLibrary ? "fill" : "regular"}
        className={cn(
          "transition-all duration-150",
          isInLibrary ? "text-accent scale-105" : "text-text-secondary group-hover:text-text-primary"
        )}
        aria-hidden="true"
      />
    </motion.button>
  );
}
