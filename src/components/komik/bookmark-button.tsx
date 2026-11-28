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
  const identity = manga.verifiedCatalogIdentity;
  const verified = identity?.refs.some(ref => ref.sourceId === sourceId && ref.mangaId === manga.id)
    ? identity : undefined;

  React.useEffect(() => {
    if (isMounted && verified) {
      useLibraryStore.getState().recordVerifiedCatalogIdentity(verified.workId, verified.refs);
    }
  }, [isMounted, verified]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleLibrary({
      sourceId: sourceId,
      mangaId: manga.id,
      title: manga.title,
      isNsfw: manga.isNsfw,
      coverUrl: manga.coverUrl,
      author: manga.author,
      status: manga.status,
      format: manga.format,
      canonicalWorkId: verified?.workId,
      linkedSources: verified?.refs
        .filter(ref => ref.sourceId !== sourceId || ref.mangaId !== manga.id)
        .map(ref => ({ ...ref, addedAt: Date.now(), matchConfidence: "CONFIRMED" })),
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
        "group relative grid size-11 place-items-center rounded-sm border border-border-subtle bg-surface-base/95 text-text-primary shadow-xs transition-colors hover:bg-surface-hover hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer",
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
