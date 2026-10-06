"use client";

import * as React from "react";
import { useLibraryStore } from "@/shared/store/library-store";
import { BookmarkSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { MangaRating } from "./manga-rating";
import { cn } from "@/shared/utils/cn";

interface MangaActionsProps {
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl: string;
  author?: string;
  status?: string;
  manifestUrl?: string; // We can use this to open webview
}

export function MangaActions({
  sourceId,
  mangaId,
  title,
  coverUrl,
  author,
  status,
}: MangaActionsProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const rawIsInLibrary = useLibraryStore((state) => state.isInLibrary(sourceId, mangaId));
  const isInLibrary = isMounted ? rawIsInLibrary : false;
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary);

  const handleToggle = () => {
    toggleLibrary({
      sourceId,
      mangaId,
      title,
      coverUrl,
      author,
      status,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (isInLibrary) {
      toast.info("Dihapus dari Rak Buku", {
        description: `'${title}' tidak lagi tersimpan.`,
      });
    } else {
      toast.success("Disimpan ke Rak Buku", {
        description: `'${title}' berhasil disimpan.`,
      });
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={isInLibrary ? "Hapus dari Rak Buku" : "Simpan ke Rak Buku"}
        className={cn(
          "flex items-center justify-center gap-1.5 h-[52px] md:h-[48px] px-1 md:px-3.5 transition-all outline-none select-none rounded-[14px] border shadow-xs active:scale-95 bg-surface-raised",
          isInLibrary
            ? "border-accent/60 text-accent font-bold ring-1 ring-accent/20"
            : "border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-surface-hover"
        )}
      >
        <BookmarkSimple size={18} weight={isInLibrary ? "fill" : "regular"} className="shrink-0" />
        <span className="hidden md:inline text-xs font-bold tracking-tight leading-none whitespace-nowrap">
          {isInLibrary ? "Tersimpan" : "Simpan"}
        </span>
      </button>

      <MangaRating
        sourceId={sourceId}
        mangaId={mangaId}
        variant="action"
        mangaDetail={{ title, coverUrl, author, status }}
      />
    </>
  );
}
