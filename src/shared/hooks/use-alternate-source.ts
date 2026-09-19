"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { getSourceMetadata, getAllSourceMetadata } from "@/shared/sources/source-registry";
import { apiClient } from "@/shared/api-client";
import { rankCandidates, type TitleCandidate } from "@/shared/lib/title-matcher";
import { mapChapterProgress, type ChapterMapResult } from "@/shared/lib/chapter-parser";
import { executeSourceMigration } from "@/shared/lib/source-fallback";
import { getReaderHref } from "@/shared/lib/routes";
import type { AlternateSourceCandidate } from "@/components/manga/alternate-source-modal";

interface UseAlternateSourceOptions {
  sourceId: string;
  mangaId: string;
  currentChapterId?: string;
  knownTitle?: string;
  knownAuthor?: string;
  currentChapterTitle?: string;
}

export function useAlternateSource({
  sourceId,
  mangaId,
  currentChapterId,
  knownTitle: initialTitle,
  knownAuthor: initialAuthor,
  currentChapterTitle: initialChapterTitle,
}: UseAlternateSourceOptions) {
  const router = useRouter();

  const libraryItem = useLibraryStore((state) =>
    state.resolveBySourceRef(sourceId, mangaId) ?? state.getLibraryItem(sourceId, mangaId)
  );
  const relinkTitle = useLibraryStore((state) => state.relinkTitle);
  const historyItem = useHistoryStore((state) => state.getLatestForManga(sourceId, mangaId));
  const saveProgress = useHistoryStore((state) => state.saveProgress);

  const title = initialTitle ?? libraryItem?.title ?? historyItem?.mangaTitle ?? mangaId;
  const author = initialAuthor ?? libraryItem?.author;
  const lastReadChapter =
    initialChapterTitle ?? historyItem?.chapterTitle ?? libraryItem?.lastReadChapterTitle;

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<AlternateSourceCandidate[]>([]);
  const [chapterMapResult, setChapterMapResult] = useState<ChapterMapResult | undefined>();

  const openAndSearch = useCallback(async () => {
    setIsOpen(true);
    setIsSearching(true);
    setCandidates([]);
    setChapterMapResult(undefined);

    try {
      const enabledSources = getAllSourceMetadata().filter(
        (s) => s.capabilities.search && s.id !== sourceId && s.status !== "unavailable"
      );

      const searchPromises = enabledSources.map(async (src) => {
        try {
          const res = await apiClient.search(src.id, title, 1);
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
      const ranked = rankCandidates(title, rawCandidates, author);

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
          // Non-blocking
        }
      }
    } catch (err) {
      console.error("Failed searching alternate sources:", err);
      toast.error("Gagal mencari sumber alternatif");
    } finally {
      setIsSearching(false);
    }
  }, [sourceId, title, author, lastReadChapter]);

  const handleConfirm = useCallback(
    async (candidate: AlternateSourceCandidate) => {
      try {
        const savedTitleId = libraryItem?.id ?? `${sourceId}:${mangaId}`;

        // Fetch candidate chapters to map chapter correctly
        let targetChapterId = "";
        try {
          const targetChapters = await apiClient.getChapters(candidate.sourceId, candidate.mangaId);
          if (targetChapters.length > 0) {
            if (lastReadChapter) {
              const mapped = mapChapterProgress(
                lastReadChapter,
                targetChapters.map((c) => ({
                  chapterId: c.id,
                  chapterTitle: c.title,
                  title: c.title,
                }))
              );
              targetChapterId =
                mapped.type === "EXACT" && mapped.targetChapterId
                  ? mapped.targetChapterId
                  : mapped.nearestSafeCandidate?.chapterId ?? targetChapters[0].id;
            } else {
              targetChapterId = targetChapters[0].id;
            }
          }
        } catch {
          // Ignore chapter fetch failure
        }

        const effectiveLibraryItem = libraryItem ?? {
          id: `${sourceId}::${mangaId}`,
          sourceId,
          mangaId,
          title,
          coverUrl: "",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const fallbackResult: Parameters<typeof executeSourceMigration>[0]["fallbackResult"] = {
          status: "CONFIRM_REQUIRED",
          reason: "User selected alternate source fallback",
          candidate: {
            sourceId: candidate.sourceId,
            mangaId: candidate.mangaId,
            title: candidate.title,
            coverUrl: candidate.coverUrl,
            author: candidate.author,
            addedAt: Date.now(),
            matchConfidence: candidate.confidence,
          },
          titleConfidence: candidate.confidence,
          suggestedChapterId: targetChapterId || undefined,
          requiresUserConfirmation: false,
        };

        executeSourceMigration({
          libraryItem: effectiveLibraryItem,
          fallbackResult,
          historyItem: historyItem ?? undefined,
          isPermanent: true,
          relinkTitleFn: libraryItem ? relinkTitle : undefined,
          saveProgressFn: (src, mid, cid, pidx) => saveProgress(src, mid, cid, pidx),
        });

        toast.success(`Berhasil beralih ke ${candidate.sourceDisplayName}`);
        setIsOpen(false);

        if (targetChapterId) {
          router.replace(getReaderHref(candidate.sourceId, candidate.mangaId, targetChapterId));
        } else {
          router.replace(`/manga/${candidate.sourceId}/${candidate.mangaId}`);
        }
      } catch (err) {
        console.error("Migration failed:", err);
        toast.error("Gagal mengalihkan sumber");
      }
    },
    [
      libraryItem,
      sourceId,
      mangaId,
      currentChapterId,
      lastReadChapter,
      relinkTitle,
      saveProgress,
      router,
    ]
  );

  return {
    isOpen,
    setIsOpen,
    isSearching,
    candidates,
    chapterMapResult,
    openAndSearch,
    handleConfirm,
    title,
  };
}
