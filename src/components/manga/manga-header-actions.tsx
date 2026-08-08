"use client";

import * as React from "react";
import { LinkSimple, Bell, BellSlash, ShareNetwork } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSettingsStore } from "@/shared/store/settings-store";
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
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const mangaKey = `${sourceId}::${mangaId}`;
  const mutedMangaKeys = useSettingsStore((state) => state.mutedMangaKeys);
  const muteManga = useSettingsStore((state) => state.muteManga);
  const unmuteManga = useSettingsStore((state) => state.unmuteManga);
  const isMuted = isMounted ? mutedMangaKeys.includes(mangaKey) : false;

  const handleCopyLink = () => {
    const urlToCopy = manifestUrl || window.location.href;
    navigator.clipboard.writeText(urlToCopy);
    toast.success("Link berhasil disalin");
  };

  const handleToggleMute = () => {
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
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link berhasil disalin");
    }
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
      <button
        onClick={handleShare}
        aria-label="Bagikan"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-transparent text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary transition-colors outline-none select-none"
      >
        <ShareNetwork size={22} weight="regular" />
      </button>

      <button
        onClick={handleToggleMute}
        aria-label={isMuted ? "Bunyikan notifikasi" : "Senyapkan notifikasi"}
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded-full transition-colors outline-none select-none hover:bg-black/5 dark:hover:bg-white/5",
          isMuted ? "text-accent" : "text-text-secondary hover:text-text-primary"
        )}
      >
        {isMuted ? (
          <BellSlash size={22} weight="fill" />
        ) : (
          <Bell size={22} weight="regular" />
        )}
      </button>

      <button
        onClick={handleCopyLink}
        aria-label="Salin link"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-transparent text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary transition-colors outline-none select-none"
      >
        <LinkSimple size={22} weight="regular" />
      </button>
    </div>
  );
}
