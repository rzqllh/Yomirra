"use client";

import * as React from "react";
import { useMounted } from "@/shared/hooks/use-mounted";
import { BookmarkSimple } from "@phosphor-icons/react";
import type { MangaItem } from "@/shared/types/source";
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
    <button
      type="button"
      onClick={handleBookmarkClick}
      className={cn(
        "relative grid size-11 place-items-center rounded-[12px] border border-border-subtle bg-surface-base/95 text-text-primary shadow-xs transition-all hover:bg-surface-hover hover:border-accent/40 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:transform-none cursor-pointer",
        isInLibrary ? "text-accent bg-accent-dim border-accent/40" : "text-text-secondary",
        className
      )}
      aria-label={isInLibrary ? `Hapus ${manga.title} dari rak` : `Simpan ${manga.title} ke rak`}
      aria-pressed={isInLibrary}
    >
      <span className="icon-morph" aria-hidden="true">
        <BookmarkSimple size={18} weight="regular" />
        <BookmarkSimple size={18} weight="fill" className="text-accent" />
      </span>
    </button>
  );
}
