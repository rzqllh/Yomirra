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
  isNsfw?: boolean;
  manifestUrl?: string; // We can use this to open webview
}

export function MangaActions({
  sourceId,
  mangaId,
  title,
  coverUrl,
  author,
  status,
  isNsfw,
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
    const wasInLibrary = useLibraryStore.getState().isInLibrary(sourceId, mangaId);
    toggleLibrary({
      sourceId,
      mangaId,
      title,
      coverUrl,
      author,
      status,
      isNsfw,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const toastId = `bookmark-toggle-${sourceId}-${mangaId}`;

    if (wasInLibrary) {
      toast.info("Dihapus dari Library", { id: toastId });
    } else {
      toast.success("Tersimpan di Library", { id: toastId });
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={isInLibrary ? "Hapus dari Library" : "Simpan ke Library"}
        className={cn(
          "flex items-center justify-center gap-1.5 min-h-11 px-2.5 sm:px-3.5 transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent select-none rounded-xl border shadow-xs active:scale-95 bg-surface-raised cursor-pointer",
          isInLibrary
            ? "border-accent/60 text-accent font-bold ring-1 ring-accent/20 bg-accent/5"
            : "border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-surface-hover"
        )}
      >
        <BookmarkSimple
          size={18}
          weight={isInLibrary ? "fill" : "regular"}
          className="shrink-0"
        />
        <span className="min-w-0 truncate text-xs font-semibold tracking-tight leading-tight">
          {isInLibrary ? "Tersimpan" : "Simpan"}
        </span>
      </button>

      <MangaRating
        sourceId={sourceId}
        mangaId={mangaId}
        variant="action"
        mangaDetail={{ title, coverUrl, author, status, isNsfw }}
      />
    </>
  );
}
