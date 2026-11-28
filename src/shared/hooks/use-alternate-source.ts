"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { getSourceMetadata, getAllSourceMetadata } from "@/shared/sources/source-registry";
import { apiClient } from "@/shared/api-client";
import { rankCandidates, type TitleCandidate } from "@/shared/lib/title-matcher";
import type { ChapterMapResult } from "@/shared/lib/chapter-parser";
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes";
import { eligibleCanonicalBindings } from "@/components/komik/canonical-source-dialog";
import { useSettingsStore } from "@/shared/store/settings-store";
import { isContentVisible, isSourceContentVisible } from "@/shared/sources/content-policy";
import type { AlternateSourceCandidate } from "@/components/komik/alternate-source-modal";
import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";

interface UseAlternateSourceOptions {
  sourceId: string;
  mangaId: string;
  currentChapterId?: string;
  knownTitle?: string;
  knownAuthor?: string;
  currentChapterTitle?: string;
  blockedSourceIds?: ReadonlySet<string>;
  onConfirmed?: (candidate: AlternateSourceCandidate) => boolean;
}

export function useAlternateSource({
  sourceId,
  mangaId,
  knownTitle: initialTitle,
  knownAuthor: initialAuthor,
  currentChapterId,
  currentChapterTitle,
  blockedSourceIds,
  onConfirmed,
}: UseAlternateSourceOptions) {
  const router = useRouter();

  const libraryItem = useLibraryStore((state) =>
    state.resolveBySourceRef(sourceId, mangaId) ?? state.getLibraryItem(sourceId, mangaId)
  );
  const highestMilestone = useHistoryStore((state) => state.getHighestMilestoneForManga(sourceId, mangaId));
  const latestRead = useHistoryStore((state) => state.getLatestForManga(sourceId, mangaId));
  const historyItem = highestMilestone || latestRead;
  const disabledSources = useSourcePreferencesStore((state) => state.disabledSources);
  const hideNsfw = useSettingsStore(state => state.hideNsfw);

  const title = initialTitle ?? libraryItem?.title ?? historyItem?.mangaTitle ?? mangaId;
  const author = initialAuthor ?? libraryItem?.author;

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<AlternateSourceCandidate[]>([]);
  const chapterMapResult: ChapterMapResult | undefined = undefined;
  const mappingChapterTitle = currentChapterId ? currentChapterTitle : latestRead?.chapterTitle;

  const openAndSearch = useCallback(async () => {
    setIsOpen(true);
    setIsSearching(true);
    setCandidates([]);

    try {
      const enabledSources = getAllSourceMetadata().filter(
        (s) =>
          s.capabilities.search &&
          s.id !== sourceId &&
          s.isEnabled &&
          s.isInstalled &&
          !disabledSources.includes(s.id) &&
          !blockedSourceIds?.has(s.id) &&
          s.status !== "in-fix" && s.status !== "in-dev" && !s.maintenance &&
          isSourceContentVisible(s, hideNsfw)
      );

      const searchPromises = enabledSources.map(async (src) => {
        try {
          const res = await apiClient.search(src.id, title, 1);
          return (res.results || []).filter(m => isContentVisible(m, hideNsfw)).map((m) => ({
            sourceId: src.id,
            mangaId: m.id,
            title: m.title,
            coverUrl: m.coverUrl,
            author: m.author,
            alternativeTitles: [m.originalTitle, ...(m.alternativeTitles ?? [])].filter(Boolean) as string[],
            sourceDisplayName: src.name,
            isNsfw: m.isNsfw,
            contentRating: m.contentRating,
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
        isNsfw: (r.candidate as AlternateSourceCandidate).isNsfw,
        contentRating: (r.candidate as AlternateSourceCandidate).contentRating,
      }));

      setCandidates(formatted);

    } catch (err) {
      console.error("Failed searching alternate sources:", err);
      toast.info("Sumber lain belum ditemukan", {
        description: "Belum ada sumber bacaan alternatif yang cocok saat ini.",
      });
    } finally {
      setIsSearching(false);
    }
  }, [sourceId, title, author, disabledSources, hideNsfw, blockedSourceIds]);

  const handleConfirm = useCallback((candidate: AlternateSourceCandidate, chapterId?: string) => {
    if (blockedSourceIds?.has(candidate.sourceId) ||
        eligibleCanonicalBindings([candidate], disabledSources, hideNsfw).length !== 1) {
      toast.error("Sumber tidak dapat dibuka");
      return;
    }
    if (onConfirmed) {
      if (onConfirmed(candidate)) {
        setIsOpen(false);
        toast.success("Sumber ditambahkan");
      } else {
        toast.error("Sumber tidak dapat ditambahkan ke komik ini");
      }
      return;
    }
    setIsOpen(false);
    router.replace(chapterId ? getReaderHref(candidate.sourceId, candidate.mangaId, chapterId) : getMangaDetailHref(candidate.sourceId, candidate.mangaId));
  }, [disabledSources, hideNsfw, router, blockedSourceIds, onConfirmed]);

  return {
    isOpen,
    setIsOpen,
    isSearching,
    candidates: blockedSourceIds
      ? candidates.filter(candidate => !blockedSourceIds.has(candidate.sourceId))
      : candidates,
    chapterMapResult,
    mappingChapterTitle,
    openAndSearch,
    handleConfirm,
    title,
  };
}
