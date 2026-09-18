"use client";

import * as React from "react";
import { ShareNetwork, Bell, BellSlash } from "@phosphor-icons/react";
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
        className="flex h-10 w-10 items-center justify-center rounded-[12px] liquid-glass text-text-primary active:scale-95 transition-all shrink-0 select-none outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        <ShareNetwork size={20} weight="regular" />
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
          "flex h-10 w-10 items-center justify-center rounded-[12px] transition-all shrink-0 select-none outline-none active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          isMounted && isMuted
            ? "bg-accent/20 border border-accent/40 text-accent shadow-xs"
            : "liquid-glass text-text-primary"
        )}
      >
        {isMounted && isMuted ? (
          <BellSlash size={20} weight="fill" />
        ) : (
          <Bell size={20} weight={isMounted && isInLibrary ? "regular" : "regular"} />
        )}
      </button>
    </div>
  );
}
