"use client";

import * as React from "react";
import { GlobeHemisphereWest, Bell, BellSlash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSettingsStore } from "@/shared/store/settings-store";
import { cn } from "@/shared/utils/cn";

interface MangaHeaderActionsProps {
  sourceId: string;
  mangaId: string;
  manifestUrl?: string;
}

export function MangaHeaderActions({
  sourceId,
  mangaId,
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

  const handleWebView = () => {
    if (manifestUrl) {
      window.open(manifestUrl, "_blank");
    } else {
      toast.info("Source ini tidak menyediakan WebView");
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      unmuteManga(mangaKey);
      toast.success("Notifikasi diaktifkan untuk manga ini");
    } else {
      muteManga(mangaKey);
    }
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
      <button
        onClick={handleToggleMute}
        aria-label={isMuted ? "Bunyikan notifikasi" : "Senyapkan notifikasi"}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 outline-none select-none",
          isMuted
            ? "bg-semantic-warning/10 text-semantic-warning"
            : "bg-surface-glass backdrop-blur-xl border border-border-glass shadow-glass text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        )}
      >
        {isMuted ? (
          <BellSlash size={20} weight="bold" />
        ) : (
          <Bell size={20} weight="regular" />
        )}
      </button>

      <button
        onClick={handleWebView}
        aria-label="Buka di web"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-glass backdrop-blur-xl border border-border-glass shadow-glass text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-300 outline-none select-none"
      >
        <GlobeHemisphereWest size={20} weight="regular" />
      </button>
    </div>
  );
}
