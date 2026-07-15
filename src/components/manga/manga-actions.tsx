"use client";

import * as React from "react";
import { useLibraryStore } from "@/shared/store/library-store";
import { GlobeHemisphereWest, BookmarkSimple, Check } from "@phosphor-icons/react";
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

  const _libraryState = useLibraryStore((state) => state.items);
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

  const handleWebView = () => {
    if (manifestUrl) {
      window.open(manifestUrl, "_blank");
    } else {
      toast.error("URL tidak tersedia");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3 w-full py-2">
      <button
        onClick={handleToggle}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-300 outline-none select-none",
          isInLibrary 
            ? "bg-accent/10 border border-accent/20 text-accent shadow-sm" 
            : "bg-surface-raised border border-border-default text-text-secondary hover:bg-surface-hover hover:border-border-strong hover:text-text-primary active:scale-[0.98]"
        )}
      >
        {isInLibrary ? (
          <Check size={24} weight="bold" />
        ) : (
          <BookmarkSimple size={24} weight="regular" />
        )}
        <span className="text-[11px] font-bold tracking-tight">
          {isInLibrary ? "In Library" : "Add to Library"}
        </span>
      </button>

      <MangaRating sourceId={sourceId} mangaId={mangaId} variant="action" />

      <button 
        onClick={handleWebView}
        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-surface-raised border border-border-default text-text-secondary hover:bg-surface-hover hover:border-border-strong hover:text-text-primary transition-all duration-300 outline-none select-none active:scale-[0.98]"
      >
        <GlobeHemisphereWest size={24} weight="regular" />
        <span className="text-[11px] font-bold tracking-tight">WebView</span>
      </button>
    </div>
  );
}
