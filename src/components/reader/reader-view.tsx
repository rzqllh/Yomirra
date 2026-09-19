"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { ReaderPageSkeleton } from "@/components/skeletons/reader-page-skeleton";
import { ReaderShell } from "@/components/reader/reader-shell";
import { ContinuousVerticalReader } from "@/components/reader/continuous-vertical-reader";
import { PagedReader } from "@/components/reader/paged-reader";
import { useReaderStore } from "@/shared/store/reader-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useDownloadStore } from "@/shared/store/download-store";
import { EmptyState } from "@/components/states/empty-state";
import { WarningCircle, LockKey } from "@phosphor-icons/react";
import Link from "next/link";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { Button } from "@/components/ui/button";
import { getDownloadChapterId } from "@/shared/utils/download-helpers";
import type { MangaDetail, Chapter, PageItem } from "@/shared/types/source";
import { useAlternateSource } from "@/shared/hooks/use-alternate-source";
import { AlternateSourceModal } from "@/components/manga/alternate-source-modal";

interface ReaderViewProps {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  initialDetail: MangaDetail;
  initialChapters: Chapter[];
  initialPages: PageItem[] | null; // null if error on server
}

export function ReaderView({
  sourceId,
  mangaId,
  chapterId,
  initialDetail,
  initialChapters,
  initialPages,
}: ReaderViewProps) {
  const upsertHistory = useHistoryStore(state => state.upsertHistory);
  const getLibraryItem = useLibraryStore(state => state.getLibraryItem);
  const updateLibraryItem = useLibraryStore(state => state.updateLibraryItem);
  const readingMode = useReaderStore(state => state.preferences.readingMode);

  const downloadId = getDownloadChapterId(sourceId, mangaId, chapterId);
  const downloadStatus = useDownloadStore(state => state.downloads[downloadId]?.status);

  const [offlinePages, setOfflinePages] = useState<PageItem[] | null>(null);

  // Fallback fetching if initialPages failed on SSR
  const { data: chapterPages, isLoading: isQueryLoading, error, refetch } = useQuery({
    queryKey: ["pages", sourceId, chapterId],
    queryFn: () => apiClient.getPages(sourceId, mangaId, chapterId),
    enabled: !initialPages && downloadStatus !== "downloaded",
    initialData: initialPages ? { chapterId, pages: initialPages } : undefined,
  });

  const chapterTitle = initialChapters?.find(c => c.id === chapterId)?.title || "Chapter";

  const alternateSource = useAlternateSource({
    sourceId,
    mangaId,
    currentChapterId: chapterId,
    knownTitle: initialDetail?.title,
    currentChapterTitle: chapterTitle,
  });

  const refreshChapter = useCallback(async (): Promise<PageItem[] | null> => {
    try {
      const res = await refetch();
      if (res.data?.pages && res.data.pages.length > 0) {
        return res.data.pages;
      }
    } catch {}
    return null;
  }, [refetch]);

  useEffect(() => {
    setOfflinePages(null);
    const createdUrls: string[] = [];
    let isMounted = true;

    if (downloadStatus === "downloaded" && typeof caches !== "undefined") {
      (async () => {
        try {
          const cache = await caches.open("yomirra-chapter-cache-v1");
          const keys = await cache.keys();
          const prefix = `/offline-images/${downloadId}/`;
          
          const matchedKeys = keys.filter(req => req.url.includes(prefix));
          let maxIndex = 0;
          const parsedKeys = matchedKeys.map(req => {
            const index = parseInt(req.url.split('/').pop() || "0", 10);
            maxIndex = Math.max(maxIndex, index);
            return { req, index };
          });

          const basePages = initialPages || chapterPages?.pages || [];
          const pageCount = Math.max(basePages.length, maxIndex + 1);

          const blobUrls: PageItem[] = Array.from({ length: pageCount }).map((_, i) => ({
            index: i,
            url: basePages[i]?.url || "" // fallback to network url if missing
          }));

          await Promise.all(parsedKeys.map(async ({ req, index }) => {
            const res = await cache.match(req);
            const blob = await res?.blob();
            if (blob && isMounted && index < pageCount) {
              const url = URL.createObjectURL(blob);
              createdUrls.push(url);
              blobUrls[index] = { index, url };
            }
          }));
          
          if (isMounted && createdUrls.length > 0) {
            setOfflinePages(blobUrls);
          } else {
            createdUrls.forEach(url => URL.revokeObjectURL(url));
          }
        } catch (e) {
          console.error("Failed to load offline pages", e);
          createdUrls.forEach(url => URL.revokeObjectURL(url));
        }
      })();
    }

    return () => {
      isMounted = false;
      createdUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [downloadStatus, downloadId]);

  const isLoading = downloadStatus === "downloaded" ? offlinePages === null : (!initialPages && isQueryLoading);
  const pagesToRender = offlinePages || initialPages || chapterPages?.pages;

  useEffect(() => {
    if (!initialDetail) return;
    
    // Prevent silently advancing reading progress for locked chapters
    const currentChapterForHistory = initialChapters?.find((c) => c.id === chapterId);
    if (currentChapterForHistory?.isLocked) {
      return;
    }

    // Calculate overall series progress based on chapter list
    const chapterIndex = initialChapters?.findIndex((c) => c.id === chapterId) ?? -1;
    let seriesProgressPercent = 0;
    
    // Assuming chapters are sorted newest (index 0) to oldest (index N)
    let readCount = 0;
    let totalChapters = 0;
    if (chapterIndex !== -1 && initialChapters?.length > 0) {
       totalChapters = initialChapters.length;
       readCount = totalChapters - chapterIndex; // Latest chapter = 100%
       seriesProgressPercent = Math.round((readCount / totalChapters) * 100);
    }
    
    upsertHistory({
      sourceId,
      mangaId,
      chapterId,
      mangaTitle: initialDetail.title,
      chapterTitle,
      coverUrl: initialDetail.coverUrl,
      sourceName: sourceId,
      seriesProgressPercent,
      chapterIndex: readCount,
      totalChapters,
      readAt: Date.now(),
    });

    const libItem = getLibraryItem(sourceId, mangaId);
    if (libItem) {
      updateLibraryItem(sourceId, mangaId, {
        lastReadChapterId: chapterId,
        lastReadChapterTitle: chapterTitle,
        lastReadAt: new Date().toISOString(),
      });
    }
  }, [initialDetail, chapterId, sourceId, mangaId, chapterTitle, initialChapters, upsertHistory, getLibraryItem, updateLibraryItem]);

  if (isLoading) {
    return (
      <ReaderShell
        mangaTitle={initialDetail?.title}
        chapterTitle="Loading..."
        currentChapterId={chapterId}
        sourceId={sourceId}
        mangaId={mangaId}
      >
        <div className="flex min-h-screen w-full items-center justify-center pt-[calc(var(--mobile-header-height)+var(--safe-top))] px-4">
          <ReaderPageSkeleton />
        </div>
      </ReaderShell>
    );
  }

  let decodedChapterId = chapterId;
  try {
    decodedChapterId = decodeURIComponent(chapterId);
  } catch {
    decodedChapterId = chapterId;
  }

  const currentChapter = initialChapters?.find(
    (c) => c.id === chapterId || c.id === decodedChapterId
  );
  const isLockedChapter = Boolean(
    currentChapter?.isLocked || (pagesToRender && pagesToRender.length === 0 && currentChapter?.isLocked)
  );

  if (isLockedChapter) {
    return (
      <ReaderShell
        mangaTitle={initialDetail?.title}
        chapterTitle={chapterTitle}
        currentChapterId={chapterId}
        sourceId={sourceId}
        mangaId={mangaId}
      >
        <div className="flex min-h-screen items-center justify-center pt-16">
          <EmptyState
            icon={<LockKey size={48} weight="duotone" className="text-amber-500" />}
            title="Chapter Terkunci"
            description="Chapter ini berstatus early access / terkunci di sumber aslinya."
            action={
              <Button asChild variant="outline" className="rounded-xl shadow-sm mt-2 font-bold">
                <Link href={getMangaDetailHref(sourceId, mangaId)}>
                  Kembali ke Detail
                </Link>
              </Button>
            }
          />
        </div>
      </ReaderShell>
    );
  }

  if (error || !pagesToRender || pagesToRender.length === 0) {
    return (
      <ReaderShell
        mangaTitle={initialDetail?.title}
        chapterTitle="Error"
        currentChapterId={chapterId}
        sourceId={sourceId}
        mangaId={mangaId}
      >
        <div className="flex min-h-screen items-center justify-center pt-16">
          <EmptyState
            icon={<WarningCircle size={48} weight="duotone" className="text-text-muted" />}
            title="Gagal Memuat Halaman"
            description="Tidak dapat mengambil halaman chapter dari server saat ini."
            action={
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                <Button onClick={() => refetch()} variant="outline" className="rounded-xl shadow-sm font-bold w-full sm:w-auto">
                  Coba Lagi
                </Button>
                <Button onClick={alternateSource.openAndSearch} variant="secondary" className="rounded-xl shadow-sm font-bold w-full sm:w-auto">
                  Cari Sumber Alternatif
                </Button>
              </div>
            }
          />
        </div>
        <AlternateSourceModal
          isOpen={alternateSource.isOpen}
          onClose={() => alternateSource.setIsOpen(false)}
          deadSourceId={sourceId}
          deadMangaTitle={alternateSource.title}
          candidates={alternateSource.candidates}
          chapterMapResult={alternateSource.chapterMapResult}
          onConfirm={alternateSource.handleConfirm}
          isLoading={alternateSource.isSearching}
        />
      </ReaderShell>
    );
  }

  const chapterIndex = initialChapters?.findIndex(c => c.id === chapterId) ?? -1;
  let prevChapterId: string | undefined;
  let nextChapterId: string | undefined;
  
  if (chapterIndex !== -1 && initialChapters) {
    if (chapterIndex < initialChapters.length - 1) {
      prevChapterId = initialChapters[chapterIndex + 1].id;
    }
    if (chapterIndex > 0) {
      nextChapterId = initialChapters[chapterIndex - 1].id;
    }
  }

  return (
    <ReaderShell 
      mangaTitle={initialDetail?.title}
      chapterTitle={chapterTitle} 
      pageCount={pagesToRender.length}
      currentChapterId={chapterId}
      sourceId={sourceId}
      mangaId={mangaId}
      chapters={initialChapters}
    >
      {readingMode === "paged" ? (
        <PagedReader
          sourceId={sourceId}
          mangaId={mangaId}
          chapterId={chapterId}
          chapterTitle={chapterTitle}
          pages={pagesToRender}
          chapters={initialChapters}
          prevChapterId={prevChapterId}
          nextChapterId={nextChapterId}
          onOpenAlternateSource={alternateSource.openAndSearch}
          onRefreshChapter={refreshChapter}
        />
      ) : (
        <ContinuousVerticalReader
          sourceId={sourceId}
          mangaId={mangaId}
          chapterId={chapterId}
          chapterTitle={chapterTitle}
          pages={pagesToRender}
          chapters={initialChapters}
          prevChapterId={prevChapterId}
          nextChapterId={nextChapterId}
          onOpenAlternateSource={alternateSource.openAndSearch}
          onRefreshChapter={refreshChapter}
        />
      )}

      <AlternateSourceModal
        isOpen={alternateSource.isOpen}
        onClose={() => alternateSource.setIsOpen(false)}
        deadSourceId={sourceId}
        deadMangaTitle={alternateSource.title}
        candidates={alternateSource.candidates}
        chapterMapResult={alternateSource.chapterMapResult}
        onConfirm={alternateSource.handleConfirm}
        isLoading={alternateSource.isSearching}
      />
    </ReaderShell>
  );
}
