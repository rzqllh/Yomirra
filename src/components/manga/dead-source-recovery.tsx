"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Warning, MagnifyingGlass, ArrowClockwise, BookOpen, ArrowLeft } from "@phosphor-icons/react";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useDownloadStore } from "@/shared/store/download-store";
import { getSourceMetadata, getAllSourceMetadata } from "@/shared/sources/source-registry";
import { apiClient } from "@/shared/api-client";
import { rankCandidates, type TitleCandidate } from "@/shared/lib/title-matcher";
import { mapChapterProgress, type ChapterMapResult } from "@/shared/lib/chapter-parser";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/header";
import { getReaderHref } from "@/shared/lib/routes";
import {
  AlternateSourceModal,
  type AlternateSourceCandidate,
} from "./alternate-source-modal";
import { toast } from "sonner";

interface DeadSourceRecoveryProps {
  sourceId: string;
  mangaId: string;
}

export function DeadSourceRecovery({ sourceId, mangaId }: DeadSourceRecoveryProps) {
  const router = useRouter();

  const libraryItem = useLibraryStore((state) =>
    state.resolveBySourceRef(sourceId, mangaId) ?? state.getLibraryItem(sourceId, mangaId)
  );
  const relinkTitle = useLibraryStore((state) => state.relinkTitle);

  const historyItem = useHistoryStore((state) =>
    state.getLatestForManga(sourceId, mangaId)
  );

  const allDownloads = useDownloadStore((state) => state.downloads);
  const offlineChapters = useMemo(() => {
    return Object.values(allDownloads).filter(
      (d) => d.sourceId === sourceId && d.mangaId === mangaId && d.status === "downloaded"
    );
  }, [allDownloads, sourceId, mangaId]);

  const sourceMeta = getSourceMetadata(sourceId);
  const sourceName = sourceMeta?.name ?? sourceId;
  const knownTitle = libraryItem?.title ?? historyItem?.mangaTitle ?? mangaId;
  const knownCover = libraryItem?.coverUrl ?? historyItem?.coverUrl;
  const knownAuthor = libraryItem?.author;
  const lastReadChapter = historyItem?.chapterTitle ?? libraryItem?.lastReadChapterTitle;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<AlternateSourceCandidate[]>([]);
  const [chapterMapResult, setChapterMapResult] = useState<ChapterMapResult | undefined>();

  const handleFindAlternate = async () => {
    setIsModalOpen(true);
    setIsSearching(true);
    setCandidates([]);
    setChapterMapResult(undefined);

    try {
      // Find all available sources except the broken one (including built-ins and dynamic)
      const enabledSources = getAllSourceMetadata()
        .filter((s) => s.capabilities.search && s.id !== sourceId && s.status !== "unavailable");

      // Search across enabled sources in parallel
      const searchPromises = enabledSources.map(async (src) => {
        try {
          const res = await apiClient.search(src.id, knownTitle, 1);
          return (res.results || []).map((m) => ({
            sourceId: src.id,
            mangaId: m.id,
            title: m.title,
            coverUrl: m.coverUrl,
            sourceDisplayName: src.name,
          }));
        } catch {
          return [];
        }
      });

      const nested = await Promise.all(searchPromises);
      const rawCandidates: TitleCandidate[] = nested.flat();

      // Rank by title similarity
      const ranked = rankCandidates(knownTitle, rawCandidates, knownAuthor);

      const formatted: AlternateSourceCandidate[] = ranked.map((r) => ({
        sourceId: r.candidate.sourceId,
        mangaId: r.candidate.mangaId,
        sourceDisplayName:
          (r.candidate as any).sourceDisplayName ??
          getSourceMetadata(r.candidate.sourceId)?.name ??
          r.candidate.sourceId,
        title: r.candidate.title,
        coverUrl: r.candidate.coverUrl,
        confidence: r.result.confidence,
      }));

      setCandidates(formatted);

      // If user had previous reading progress, calculate initial mapping for top candidate
      if (formatted.length > 0 && lastReadChapter) {
        try {
          const top = formatted[0];
          const chapters = await apiClient.getChapters(top.sourceId, top.mangaId);
          const mapped = mapChapterProgress(
            lastReadChapter,
            chapters.map((c) => ({
              chapterId: c.id,
              chapterTitle: c.title,
              title: c.title,
            }))
          );
          setChapterMapResult(mapped);
        } catch {
          // non-blocking
        }
      }
    } catch (err) {
      console.error("Failed searching alternate sources:", err);
      toast.error("Gagal mencari sumber alternatif");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmRelink = (candidate: AlternateSourceCandidate) => {
    // Relink in library if present
    if (libraryItem) {
      const savedTitleId = libraryItem.id ?? `${libraryItem.sourceId}::${libraryItem.mangaId}`;
      relinkTitle(savedTitleId, candidate.sourceId, candidate.mangaId, {
        title: candidate.title,
        coverUrl: candidate.coverUrl,
      });
      toast.success("Manga berhasil dialihkan ke sumber baru");
    }

    setIsModalOpen(false);
    router.push(`/manga/${candidate.sourceId}/${candidate.mangaId}`);
  };

  return (
    <main className="min-h-screen flex flex-col w-full relative pb-24">
      <div className="md:hidden">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
          <PageHeader title="Sumber Bermasalah" showBack={true} />
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 pt-12 md:pt-20 flex flex-col items-center">
        {/* Manga Preview Card */}
        <div className="w-full bg-surface-raised border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          {knownCover && (
            <div className="relative w-28 h-40 rounded-xl overflow-hidden shadow-md mb-4 border border-border-subtle shrink-0">
              <Image
                src={knownCover}
                alt={knownTitle}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-1">
            {knownTitle}
          </h1>
          {knownAuthor && (
            <p className="text-sm text-text-muted mb-3">{knownAuthor}</p>
          )}

          {/* Warning Banner */}
          <div className="w-full mt-2 mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left flex items-start gap-3">
            <Warning size={24} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-300">
                Sumber &quot;{sourceName}&quot; Tidak Tersedia
              </p>
              <p className="text-text-muted mt-1 leading-relaxed">
                Sumber komik ini sedang mengalami gangguan atau sudah tidak aktif. Anda dapat mencari dan beralih ke sumber alternatif tanpa kehilangan data koleksi Anda.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Button
              variant="primary"
              onClick={handleFindAlternate}
              className="gap-2 w-full sm:w-auto font-bold"
            >
              <MagnifyingGlass size={18} weight="bold" />
              Cari Sumber Alternatif
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2 w-full sm:w-auto"
            >
              <ArrowLeft size={18} />
              Kembali
            </Button>
          </div>
        </div>

        {/* Offline Chapters Available */}
        {offlineChapters.length > 0 && (
          <div className="w-full mt-6 bg-surface-raised border border-border-subtle rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={20} className="text-accent" />
              <h2 className="text-base font-semibold text-text-primary">
                Tersedia Offline ({offlineChapters.length} chapter)
              </h2>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Chapter berikut telah diunduh dan dapat dibaca meskipun sumber sedang offline.
            </p>
            <div className="divide-y divide-border-subtle">
              {offlineChapters.map((ch) => (
                <Link
                  key={ch.chapterId}
                  href={getReaderHref(sourceId, mangaId, ch.chapterId)}
                  className="flex items-center justify-between py-3 hover:text-accent transition-colors"
                >
                  <span className="text-sm font-medium">{ch.chapterTitle}</span>
                  <span className="text-xs text-accent">Baca Offline &rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <AlternateSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deadSourceId={sourceId}
        deadMangaTitle={knownTitle}
        candidates={candidates}
        chapterMapResult={chapterMapResult}
        isLoading={isSearching}
        onConfirm={handleConfirmRelink}
      />
    </main>
  );
}
