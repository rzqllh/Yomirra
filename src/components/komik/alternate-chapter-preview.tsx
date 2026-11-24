"use client";

import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/shared/api-client";
import { Button } from "@/components/ui/button";
import { readChapterNumberEvidence, suggestAlternateChapter, type AlternateChapterMapping } from "@/shared/lib/alternate-chapter-mapping";

interface Props {
  sourceId: string;
  mangaId: string;
  currentChapterTitle: string;
  onOpenChapter: (id: string) => void;
}

type PreviewState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error" }
  | { type: "result"; mapping: AlternateChapterMapping };

export function AlternateChapterPreview({ sourceId, mangaId, currentChapterTitle, onOpenChapter }: Props) {
  const [state, setState] = useState<PreviewState>({ type: "idle" });
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  if (!readChapterNumberEvidence(currentChapterTitle)) return null;

  async function inspect() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState({ type: "loading" });
    try {
      const chapters = await apiClient.getChapters(sourceId, mangaId, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!Array.isArray(chapters)) throw new Error("Invalid chapter listing");
      setState({ type: "result", mapping: suggestAlternateChapter(currentChapterTitle, mangaId, chapters) });
    } catch {
      if (!controller.signal.aborted) setState({ type: "error" });
    } finally {
      if (request.current === controller) request.current = null;
    }
  }

  const result = state.type === "result" ? state.mapping : null;
  return (
    <div className="px-4 py-3 border-t border-border-glass/40 flex flex-col gap-2">
      <p className="text-xs text-text-secondary">Chapter saat ini: {currentChapterTitle}</p>
      {state.type === "idle" || state.type === "error" ? (
        <Button variant="outline" onClick={() => void inspect()} className="min-h-11">
          {state.type === "error" ? "Coba periksa chapter lagi" : "Periksa chapter di sumber ini"}
        </Button>
      ) : state.type === "loading" ? (
        <p role="status" className="text-xs text-text-secondary">Memeriksa daftar chapter...</p>
      ) : result?.type === "EXACT" ? (
        <>
          <p role="status" className="text-xs text-text-secondary">Nomor chapter cocok. Kesetaraan rilis belum terverifikasi. Riwayat lama tidak dipindahkan.</p>
          <Button variant="outline" onClick={() => onOpenChapter(result.chapter.id)} className="min-h-11">
            Buka {result.chapter.title}
          </Button>
        </>
      ) : (
        <p role="status" className="text-xs text-text-secondary">
          {result?.type === "AMBIGUOUS" ? "Ada beberapa chapter dengan nomor yang sama. Pilih dari halaman detail." : "Chapter yang cocok dan dapat dibuka belum terverifikasi. Pilih dari halaman detail."}
        </p>
      )}
      {state.type === "error" && <p role="status" className="text-xs text-text-secondary">Daftar chapter belum dapat diperiksa.</p>}
    </div>
  );
}
