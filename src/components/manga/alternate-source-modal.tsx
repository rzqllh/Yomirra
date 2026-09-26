"use client";

import { useState, useCallback } from "react";
import { Warning, MagnifyingGlass, ArrowRight, CheckCircle, ArrowsClockwise } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MatchConfidence } from "@/shared/lib/title-matcher";
import type { ChapterMapResult } from "@/shared/lib/chapter-parser";
import { cn } from "@/shared/utils/cn";

// Types


export interface AlternateSourceCandidate {
  sourceId: string;
  mangaId: string;
  sourceDisplayName: string;
  title: string;
  coverUrl?: string;
  author?: string;
  confidence: MatchConfidence;
}

export interface AlternateSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The dead / unavailable source context */
  deadSourceId: string;
  deadMangaTitle: string;
  /** Candidates ranked by confidence */
  candidates: AlternateSourceCandidate[];
  /** If provided, shows progress mapping result for the confirmed candidate */
  chapterMapResult?: ChapterMapResult;
  onConfirm: (candidate: AlternateSourceCandidate) => void;
  isLoading?: boolean;
}

// Confidence badge


const confidenceConfig: Record<
  MatchConfidence,
  { label: string; className: string }
> = {
  CONFIRMED: { label: "Terkonfirmasi", className: "text-semantic-success bg-semantic-success/10 border-semantic-success/20" },
  HIGH_CONFIDENCE: { label: "Sangat Cocok", className: "text-accent bg-accent/10 border-accent/20" },
  AMBIGUOUS: { label: "Mungkin Cocok", className: "text-semantic-warning bg-semantic-warning/10 border-semantic-warning/20" },
  NO_MATCH: { label: "Tidak Cocok", className: "text-text-muted bg-surface-raised border-border-subtle" },
};

function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
  const cfg = confidenceConfig[confidence];
  return (
    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-lg border", cfg.className)}>
      {cfg.label}
    </span>
  );
}

// Chapter map result banner


function ChapterMapBanner({ result }: { result: ChapterMapResult }) {
  if (result.type === "EXACT") {
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-semantic-success/10 border border-semantic-success/20 text-semantic-success text-xs font-medium">
        <CheckCircle size={18} weight="fill" className="shrink-0" />
        <span>Progres chapter terpetakan secara tepat ke Chapter {result.chapterNumber}.</span>
      </div>
    );
  }
  if (result.type === "PROBABLE") {
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warning text-xs font-medium">
        <Warning size={18} weight="fill" className="shrink-0" />
        <span>
          Progres dipetakan ke Chapter {result.chapterNumber} (selisih {result.delta > 0 ? "+" : ""}{result.delta} chapter). Konfirmasi diperlukan.
        </span>
      </div>
    );
  }
  if (result.type === "AMBIGUOUS") {
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warning text-xs font-medium">
        <Warning size={18} weight="fill" className="shrink-0" />
        <span>Beberapa kandidat chapter ditemukan. Kamu perlu memilih secara manual.</span>
      </div>
    );
  }
  // UNMAPPED
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-surface-raised border border-border-subtle text-text-muted text-xs font-medium">
      <Warning size={18} className="shrink-0" />
      <span>Progres chapter tidak dapat dipetakan otomatis. Progres lama dipertahankan; kamu bisa mengaturnya manual.</span>
    </div>
  );
}

// Main modal


export function AlternateSourceModal({
  isOpen,
  onClose,
  deadMangaTitle,
  candidates,
  chapterMapResult,
  onConfirm,
  isLoading,
}: AlternateSourceModalProps) {
  const [selected, setSelected] = useState<AlternateSourceCandidate | null>(null);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    onConfirm(selected);
  }, [selected, onConfirm]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-[calc(100vw-32px)] rounded-[28px] p-0 bg-surface-overlay/95 backdrop-blur-2xl border border-border-glass shadow-glass overflow-hidden flex flex-col gap-0">
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 border-b border-border-glass/40 flex items-start gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-lg bg-accent/12 text-accent border border-accent/20 shrink-0">
            <ArrowsClockwise size={22} weight="duotone" />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <DialogTitle className="text-lg font-black tracking-tight text-text-primary">
              Cari Sumber Alternatif
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-text-secondary mt-1 truncate">
              <span className="font-semibold text-text-primary">{deadMangaTitle}</span>
              {" "} (sumber saat ini tidak tersedia)
            </DialogDescription>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {/* Chapter map result */}
          {selected && chapterMapResult && candidates[0]?.sourceId === selected.sourceId && candidates[0]?.mangaId === selected.mangaId && (
            <ChapterMapBanner result={chapterMapResult} />
          )}

          {/* Candidates */}
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-text-muted">
              <div className="flex size-12 items-center justify-center rounded-lg bg-surface-raised text-text-muted border border-border-subtle">
                <MagnifyingGlass size={24} weight="duotone" />
              </div>
              <p className="text-xs font-medium">Tidak ada sumber ditemukan untuk komik ini.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5" role="listbox" aria-label="Kandidat sumber alternatif">
              {candidates.map((c) => {
                const isSelected = selected?.sourceId === c.sourceId && selected?.mangaId === c.mangaId;
                return (
                  <li key={`${c.sourceId}::${c.mangaId}`}>
                    <button
                      id={`alt-source-${c.sourceId}-${c.mangaId.replace(/[^a-zA-Z0-9-]/g, "-")}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => setSelected(isSelected ? null : c)}
                      className={cn(
                        "w-full flex items-start gap-3.5 p-3 rounded-lg border text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        isSelected
                          ? "border-accent/60 bg-accent/10 shadow-sm"
                          : "border-border-subtle bg-surface-raised/60 hover:bg-surface-raised hover:border-border-default"
                      )}
                    >
                      {c.coverUrl && (
                        <img
                          src={c.coverUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-11 h-16 rounded-xl object-cover shrink-0 border border-border-glass"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-text-primary text-sm font-bold leading-snug line-clamp-2">
                          {c.title}
                        </p>
                        {c.author && (
                          <p className="text-text-muted text-xs mt-0.5 truncate">{c.author}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[11px] font-bold text-text-secondary bg-surface-base px-2 py-0.5 rounded-lg border border-border-subtle">
                            {c.sourceDisplayName}
                          </span>
                          <ConfidenceBadge confidence={c.confidence} />
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle size={22} weight="fill" className="text-accent shrink-0 mt-0.5" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-glass/40 bg-surface-base/30 flex flex-col gap-2">
          <Button
            id="alternate-source-confirm-btn"
            onClick={handleConfirm}
            disabled={!selected || isLoading}
            variant="accent"
            className="w-full h-11 rounded-full font-bold text-sm shadow-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Mengganti sumber...</span>
            ) : (
              <>
                <span>Gunakan Sumber Ini</span>
                <ArrowRight size={16} weight="bold" />
              </>
            )}
          </Button>
          <Button
            id="alternate-source-cancel-btn"
            variant="ghost"
            onClick={onClose}
            className="w-full h-11 rounded-full font-bold text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
