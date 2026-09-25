"use client";

import * as React from "react";
import { Compass, CheckCircle, Star, ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLibraryStore } from "@/shared/store/library-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";

interface MangaSourceSelectorProps {
  sourceId: string;
  mangaId: string;
  title: string;
  isTemporaryFallback?: boolean;
}

export function MangaSourceSelector({
  sourceId,
  mangaId,
  title,
  isTemporaryFallback = false,
}: MangaSourceSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const libraryItem = useLibraryStore((state) =>
    state.getLibraryItem(sourceId, mangaId) || state.resolveBySourceRef(sourceId, mangaId)
  );

  const titleKey = libraryItem?.id || `${sourceId}::${mangaId}`;
  const perTitlePref = useSettingsStore((state) => state.perTitleSourcePreferences[titleKey]);
  const setPerTitleSourcePreference = useSettingsStore((state) => state.setPerTitleSourcePreference);
  const clearPerTitleSourcePreference = useSettingsStore((state) => state.clearPerTitleSourcePreference);

  const currentSourceName = getSourceMetadata(sourceId)?.name || sourceId;
  const isCurrentPreferred = perTitlePref ? perTitlePref === sourceId : false;

  const linkedSources = (libraryItem?.linkedSources || []).filter((linked) => {
    if (linked.sourceId === sourceId && linked.mangaId === mangaId) return false;
    const source = getSourceMetadata(linked.sourceId);
    if (!source) return false;
    return (
      source.isEnabled !== false &&
      source.isInstalled !== false &&
      source.status !== "unavailable" &&
      source.status !== "in-fix"
    );
  });

  const handleSetPreferred = (targetSourceId: string) => {
    if (perTitlePref === targetSourceId) {
      clearPerTitleSourcePreference(titleKey);
      toast.success("Pilihan sumber direset ke pengaturan umum");
    } else {
      setPerTitleSourcePreference(titleKey, targetSourceId);
      const targetName = getSourceMetadata(targetSourceId)?.name || targetSourceId;
      toast.success(`${targetName} jadi sumber utama untuk ${title}`);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide backdrop-blur-md border transition-all cursor-pointer select-none active:scale-95",
            isCurrentPreferred
              ? "bg-accent/20 border-accent/40 text-accent"
              : isTemporaryFallback
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
              : "bg-white/15 dark:bg-white/10 border-white/20 text-white hover:bg-white/25"
          )}
        >
          <Compass size={13} weight="duotone" />
          <span>{currentSourceName}</span>
          {isCurrentPreferred && (
            <Star size={12} weight="fill" className="text-accent" />
          )}
          {isTemporaryFallback && (
            <span className="text-[9px] bg-amber-400/20 px-1.5 py-0.5 rounded-md uppercase font-black tracking-wider">
              Sementara
            </span>
          )}
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Compass size={20} weight="duotone" className="text-accent" />
              <span>Sumber Bacaan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted">
              Pilih sumber utama untuk judul ini.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-2">
            {/* Current Active Source */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border-default/60">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  {currentSourceName}
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/15 text-accent font-semibold border border-accent/20">
                    Sedang Dibuka
                  </span>
                </span>
                <span className="text-[11px] text-text-muted mt-0.5">
                  ID: {mangaId}
                </span>
              </div>

              <Button
                size="sm"
                variant={isCurrentPreferred ? "primary" : "outline"}
                onClick={() => handleSetPreferred(sourceId)}
                className="text-xs h-8 px-3 rounded-xl gap-1.5"
              >
                <Star size={14} weight={isCurrentPreferred ? "fill" : "regular"} />
                <span>{isCurrentPreferred ? "Pilihan Utama" : "Jadikan Pilihan"}</span>
              </Button>
            </div>

            {/* Linked Alternates */}
            {linkedSources.length > 0 ? (
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider px-1">
                  Sumber lain
                </span>

                {linkedSources.map((linked) => {
                  const linkedName = getSourceMetadata(linked.sourceId)?.name || linked.sourceId;
                  const isPref = perTitlePref === linked.sourceId;

                  return (
                    <div
                      key={`${linked.sourceId}::${linked.mangaId}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-base border border-border-subtle hover:border-border-default transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          {linkedName}
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-surface-raised text-text-muted font-medium border border-border-subtle">
                            {linked.matchConfidence}
                          </span>
                        </span>
                        <Link
                          href={`/manga/${linked.sourceId}/${linked.mangaId}`}
                          className="text-[11px] text-accent hover:underline flex items-center gap-1 mt-0.5"
                          onClick={() => setIsOpen(false)}
                        >
                          <span>Buka versi ini</span>
                          <ArrowRight size={10} weight="bold" />
                        </Link>
                      </div>

                      <Button
                        size="sm"
                        variant={isPref ? "primary" : "outline"}
                        onClick={() => handleSetPreferred(linked.sourceId)}
                        className="text-xs h-8 px-3 rounded-xl gap-1.5"
                      >
                        <Star size={14} weight={isPref ? "fill" : "regular"} />
                        <span>{isPref ? "Pilihan Utama" : "Jadikan Pilihan"}</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted px-1 py-2">
                Belum ada sumber lain yang terhubung untuk judul ini.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
