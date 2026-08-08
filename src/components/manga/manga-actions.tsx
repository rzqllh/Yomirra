"use client";

import * as React from "react";
import { useLibraryStore } from "@/shared/store/library-store";
import { BookmarkSimple, Check, ShareNetwork } from "@phosphor-icons/react";
import { toast } from "sonner";
import { IconButton } from "@/components/ui/icon-button";
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
  manifestUrl,
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
      toast("Dihapus dari library");
    } else {
      toast.success("Ditambahkan ke library");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link berhasil disalin");
    }
  };  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={isInLibrary ? "Hapus dari library" : "Tambah ke library"}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-colors outline-none select-none hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10",
          isInLibrary ? "text-accent" : "text-text-secondary hover:text-text-primary"
        )}
      >
        <BookmarkSimple size={24} weight={isInLibrary ? "fill" : "regular"} />
        <span className="text-[11px] font-bold tracking-tight">Simpan</span>
      </button>

      <MangaRating sourceId={sourceId} mangaId={mangaId} variant="action" />
    </>
  );
}
