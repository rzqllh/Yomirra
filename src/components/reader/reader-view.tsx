"use client";

import { useEffect, useState } from "react";
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
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { getDownloadChapterId } from "@/shared/utils/download-helpers";
import type { MangaDetail, Chapter, PageItem } from "@/shared/types/source";

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

  const chapterTitle = initialChapters?.find(c => c.id === chapterId)?.title || "Chapter";

  useEffect(() => {
    if (!initialDetail) return;
    
    // Calculate overall series progress based on chapter list
    const chapterIndex = initialChapters?.findIndex(c => c.id === chapterId) ?? -1;
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
  }, [initialDetail, chapterId, sourceId, mangaId, chapterTitle, upsertHistory, getLibraryItem, updateLibraryItem]);

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

  if (error || !pagesToRender) {
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
            description="Tidak dapat mengambil halaman chapter dari server."
            action={
              <Button onClick={() => refetch()} variant="outline" className="rounded-xl shadow-sm mt-2 font-bold">
                Coba Lagi
              </Button>
            }
          />
        </div>
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
        />
      )}
    </ReaderShell>
  );
}
