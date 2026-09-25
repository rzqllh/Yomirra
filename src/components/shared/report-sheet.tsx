"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Spinner, Flag, PaperPlaneRight, X } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import type { ReportType } from "@/app/api/ops/report/route";

// ─── Template Definitions ──────────────────────────────────────────────────

interface ReportTemplate {
  emoji: string;
  label: string;
  type: ReportType;
}

const CHAPTER_TEMPLATES: ReportTemplate[] = [
  { emoji: "🖼️", label: "Gambar tidak muncul", type: "image_broken" },
  { emoji: "⬛", label: "Gambar hitam / corrupt", type: "image_broken" },
  { emoji: "📄", label: "Halaman hilang / terpotong", type: "chapter_error" },
  { emoji: "🔀", label: "Urutan halaman acak", type: "chapter_error" },
  { emoji: "🔗", label: "Chapter salah / tidak sesuai", type: "chapter_error" },
  { emoji: "💬", label: "Teks / dialog tidak terbaca", type: "chapter_error" },
  { emoji: "✍️", label: "Lainnya...", type: "other" },
];

const SOURCE_TEMPLATES: ReportTemplate[] = [
  { emoji: "🔴", label: "Sumber tidak bisa diakses", type: "source_broken" },
  { emoji: "📚", label: "Komik tidak ditemukan", type: "source_broken" },
  { emoji: "🔄", label: "Update chapter terlambat", type: "source_broken" },
  { emoji: "⚠️", label: "Konten error / parser rusak", type: "source_broken" },
  { emoji: "✍️", label: "Lainnya...", type: "other" },
];

// ─── Props ─────────────────────────────────────────────────────────────────

export type ReportContext = "chapter" | "source";

export interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ReportContext;
  /** Human-readable title of what's being reported (chapter title or source name) */
  subject?: string;
  /** Payload fields forwarded to API */
  sourceId?: string;
  mangaId?: string;
  chapterId?: string;
  chapterTitle?: string;
  /** Pre-selected page index for image errors */
  pageIndex?: number;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ReportSheet({
  open,
  onOpenChange,
  context,
  subject,
  sourceId,
  mangaId,
  chapterId,
  chapterTitle,
  pageIndex,
}: ReportSheetProps) {
  const [selected, setSelected] = React.useState<ReportTemplate | null>(null);
  const [detail, setDetail] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);

  const templates = context === "chapter" ? CHAPTER_TEMPLATES : SOURCE_TEMPLATES;
  const showDetail = selected !== null;

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSelected(null);
        setDetail("");
        setIsSending(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Pre-select image broken if coming from a specific page error
  React.useEffect(() => {
    if (open && typeof pageIndex === "number" && selected === null) {
      const imageBroken = CHAPTER_TEMPLATES.find((t) => t.type === "image_broken");
      if (imageBroken) setSelected(imageBroken);
    }
  }, [open, pageIndex, selected]);

  const handleSend = async () => {
    if (!selected) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/ops/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selected.type,
          category: selected.label,
          detail: detail.trim() || undefined,
          sourceId,
          mangaId,
          chapterId,
          chapterTitle,
          pageIndex,
        }),
      });

      if (res.ok) {
        toast.success("Laporan terkirim — terima kasih!", { position: "top-center" });
        onOpenChange(false);
      } else if (res.status === 429) {
        toast.error("Terlalu banyak laporan. Coba lagi dalam 10 menit.");
      } else {
        toast.error("Gagal mengirim laporan. Coba lagi.");
      }
    } catch {
      toast.error("Tidak ada koneksi. Periksa jaringan kamu.");
    } finally {
      setIsSending(false);
    }
  };

  const contextLabel =
    context === "chapter" ? "chapter ini" : "sumber ini";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl sm:max-w-md sm:mx-auto sm:border sm:rounded-b-none p-0 overflow-hidden"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-border-default" />
        </div>

        <div className="px-6 pb-6">
          <SheetHeader className="mb-5 text-left">
            <SheetTitle className="text-lg flex items-center gap-2">
              <Flag size={20} className="text-semantic-error shrink-0" weight="duotone" />
              Laporkan Kendala
            </SheetTitle>
            <SheetDescription className="text-sm leading-snug">
              {subject
                ? <>Kendala di <strong className="text-text-primary">{subject}</strong></>
                : <>Pilih jenis masalah di {contextLabel}</>
              }
            </SheetDescription>
          </SheetHeader>

          {/* Template grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {templates.map((tpl) => {
              const isSelected = selected?.label === tpl.label;
              return (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : tpl)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left text-sm font-medium transition-all active:scale-[0.97]",
                    isSelected
                      ? "bg-accent/15 border-accent/60 text-accent"
                      : "bg-surface-raised/50 border-border-default text-text-secondary hover:bg-surface-raised hover:text-text-primary hover:border-border-strong"
                  )}
                >
                  <span className="text-base leading-none">{tpl.emoji}</span>
                  <span className="leading-tight">{tpl.label}</span>
                </button>
              );
            })}
          </div>

          {/* Optional detail textarea */}
          {showDetail && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                Tambah detail <span className="font-normal text-text-tertiary">(opsional)</span>
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder={
                  selected?.type === "image_broken"
                    ? "Contoh: gambar hitam dari halaman 8 ke atas..."
                    : "Contoh: chapter langsung loncat ke bab 10..."
                }
                maxLength={500}
                className="w-full p-3.5 bg-surface-base border border-border-default rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-text-primary resize-none h-24 placeholder:text-text-tertiary"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xl font-semibold border-border-default"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Batal
            </Button>
            <Button
              variant="accent"
              className="flex-1 h-11 rounded-xl font-semibold"
              onClick={handleSend}
              disabled={isSending || !selected}
            >
              {isSending ? (
                <>
                  <Spinner size={16} className="mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  Kirim Laporan
                  <PaperPlaneRight size={16} className="ml-2" weight="fill" />
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
