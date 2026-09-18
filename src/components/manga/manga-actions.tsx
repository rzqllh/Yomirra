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
      toast.error("Dihapus dari library");
    } else {
      toast.success("Ditambahkan ke library");
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={isInLibrary ? "Hapus dari library" : "Tambah ke library"}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-1.5 h-full transition-all outline-none select-none rounded-[16px] border shadow-xs active:scale-95 bg-surface-raised",
          isInLibrary
            ? "border-accent/60 text-accent font-bold ring-1 ring-accent/20"
            : "border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-surface-hover"
        )}
      >
        <BookmarkSimple size={22} weight={isInLibrary ? "fill" : "regular"} />
        <span className="text-[10px] font-bold tracking-tight">
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
