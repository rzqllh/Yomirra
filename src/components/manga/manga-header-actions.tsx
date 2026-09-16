"use client";

import * as React from "react";
import { Bell, BellSlash, ShareNetwork } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useMounted } from "@/shared/hooks/use-mounted";
import { cn } from "@/shared/utils/cn";

interface MangaHeaderActionsProps {
  sourceId: string;
  mangaId: string;
  title: string;
  manifestUrl?: string;
}

export function MangaHeaderActions({
  sourceId,
  mangaId,
  title,
  manifestUrl,
}: MangaHeaderActionsProps) {
  const isMounted = useMounted();

  const mangaKey = `${sourceId}::${mangaId}`;
  const mutedMangaKeys = useSettingsStore((state) => state.mutedMangaKeys);
  const muteManga = useSettingsStore((state) => state.muteManga);
  const unmuteManga = useSettingsStore((state) => state.unmuteManga);
  const rawIsInLibrary = useLibraryStore((state) => state.isInLibrary(sourceId, mangaId));
  const isInLibrary = isMounted && rawIsInLibrary;
  const isMuted = isMounted && mutedMangaKeys.includes(mangaKey);

  const handleToggleMute = () => {
    if (!rawIsInLibrary) {
      toast.info("Simpan komik ini terlebih dahulu untuk mengaktifkan notifikasi pembaruan");
      return;
    }

    if (isMuted) {
      unmuteManga(mangaKey);
      toast.success("Notifikasi diaktifkan untuk manga ini");
    } else {
      muteManga(mangaKey);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(manifestUrl || window.location.href);
      toast.success("Link berhasil disalin");
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
      <button
        onClick={handleShare}
        aria-label="Bagikan"
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-glass backdrop-blur-md border border-border-default/40 text-text-primary hover:bg-surface-hover hover:border-border-strong active:scale-95 transition-all shrink-0 select-none outline-none shadow-xs"
      >
        <ShareNetwork size={20} weight="bold" />
      </button>

      <button
        onClick={handleToggleMute}
        aria-label={
          !isInLibrary
            ? "Notifikasi pembaruan (simpan komik terlebih dahulu)"
            : isMuted
            ? "Bunyikan notifikasi"
            : "Senyapkan notifikasi"
        }
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl backdrop-blur-md border transition-all shrink-0 select-none outline-none shadow-xs active:scale-95",
          !isInLibrary
            ? "bg-surface-glass/40 border-border-default/20 text-text-muted/40 cursor-not-allowed"
            : isMuted
            ? "bg-accent/15 border-accent/30 text-accent hover:bg-accent/25"
            : "bg-surface-glass border-border-default/40 text-text-primary hover:bg-surface-hover hover:border-border-strong"
        )}
      >
        {isInLibrary && isMuted ? (
          <BellSlash size={20} weight="fill" />
        ) : (
          <Bell size={20} weight={!isInLibrary ? "regular" : "bold"} />
        )}
      </button>
    </div>
  );
}
