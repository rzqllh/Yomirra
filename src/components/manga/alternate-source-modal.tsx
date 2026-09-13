"use client";

import { useState, useCallback } from "react";
import { X, Warning, MagnifyingGlass, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import type { MatchConfidence } from "@/shared/lib/title-matcher";
import type { ChapterMapResult } from "@/shared/lib/chapter-parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Confidence badge
// ---------------------------------------------------------------------------

const confidenceConfig: Record<
  MatchConfidence,
  { label: string; className: string }
> = {
  CONFIRMED: { label: "Terkonfirmasi", className: "text-green-400 bg-green-400/10" },
  HIGH_CONFIDENCE: { label: "Sangat Cocok", className: "text-blue-400 bg-blue-400/10" },
  AMBIGUOUS: { label: "Mungkin Cocok", className: "text-yellow-400 bg-yellow-400/10" },
  NO_MATCH: { label: "Tidak Cocok", className: "text-text-muted bg-surface-raised" },
};

function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
  const cfg = confidenceConfig[confidence];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Chapter map result banner
// ---------------------------------------------------------------------------

function ChapterMapBanner({ result }: { result: ChapterMapResult }) {
  if (result.type === "EXACT") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-400/10 border border-green-400/20 text-green-400 text-sm">
        <CheckCircle size={16} weight="fill" />
        <span>Progres chapter terpetakan secara tepat ke Chapter {result.chapterNumber}.</span>
      </div>
    );
  }
  if (result.type === "PROBABLE") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm">
        <Warning size={16} weight="fill" />
        <span>
          Progres dipetakan ke Chapter {result.chapterNumber} (selisih {result.delta > 0 ? "+" : ""}{result.delta} chapter). Konfirmasi diperlukan.
        </span>
      </div>
    );
  }
  if (result.type === "AMBIGUOUS") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm">
        <Warning size={16} weight="fill" />
        <span>Beberapa kandidat chapter ditemukan. Kamu perlu memilih secara manual.</span>
      </div>
    );
  }
  // UNMAPPED
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-raised border border-border-subtle text-text-muted text-sm">
      <Warning size={16} />
      <span>Progres chapter tidak dapat dipetakan otomatis. Progres lama dipertahankan; kamu bisa mengaturnya manual.</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            className="fixed bottom-0 inset-x-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-surface-raised border-t border-border-subtle"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface-raised border-b border-border-subtle px-4 py-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-text-primary text-base font-semibold leading-tight">
                  Cari Sumber Alternatif
                </h2>
                <p className="text-text-muted text-sm mt-0.5">
                  <span className="text-text-secondary font-medium">{deadMangaTitle}</span>
                  {" "}— sumber saat ini tidak tersedia
                </p>
              </div>
              <button
                id="alternate-source-modal-close"
                onClick={onClose}
                className="shrink-0 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Chapter map result */}
              {selected && chapterMapResult && (
                <ChapterMapBanner result={chapterMapResult} />
              )}

              {/* Candidates */}
              {candidates.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-text-muted">
                  <MagnifyingGlass size={32} weight="light" />
                  <p className="text-sm">Tidak ada sumber ditemukan untuk judul ini.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2" role="listbox" aria-label="Kandidat sumber alternatif">
                  {candidates.map((c) => {
                    const isSelected = selected?.sourceId === c.sourceId && selected?.mangaId === c.mangaId;
                    return (
                      <li key={`${c.sourceId}::${c.mangaId}`}>
                        <button
                          id={`alt-source-${c.sourceId}-${c.mangaId.replace(/[^a-zA-Z0-9-]/g, "-")}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => setSelected(isSelected ? null : c)}
                          className={[
                            "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors",
                            isSelected
                              ? "border-brand-primary bg-brand-primary/10"
                              : "border-border-subtle bg-surface-base hover:bg-surface-overlay",
                          ].join(" ")}
                        >
                          {c.coverUrl && (
                            <img
                              src={c.coverUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-10 h-14 rounded object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-text-primary text-sm font-medium leading-snug line-clamp-2">
                              {c.title}
                            </p>
                            {c.author && (
                              <p className="text-text-muted text-xs mt-0.5 truncate">{c.author}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-xs text-text-secondary bg-surface-raised px-2 py-0.5 rounded-full border border-border-subtle">
                                {c.sourceDisplayName}
                              </span>
                              <ConfidenceBadge confidence={c.confidence} />
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle size={20} weight="fill" className="text-brand-primary shrink-0 mt-0.5" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  id="alternate-source-confirm-btn"
                  onClick={handleConfirm}
                  disabled={!selected || isLoading}
                  className="w-full flex items-center justify-center gap-2"
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
                  className="w-full"
                >
                  Batalkan
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
