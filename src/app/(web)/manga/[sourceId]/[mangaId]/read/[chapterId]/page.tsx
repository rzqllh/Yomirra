"use client";

import { useEffect, use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { ReaderPageSkeleton } from "@/components/skeletons/reader-page-skeleton";
import { ReaderShell } from "@/components/reader/reader-shell";
import { ContinuousVerticalReader } from "@/components/reader/continuous-vertical-reader";
import { PagedReader } from "@/components/reader/paged-reader";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useReaderStore } from "@/shared/store/reader-store";
import { useDownloadStore } from "@/shared/store/download-store";

export default function ReaderPage({
  params,
}: {
  params: Promise<{ sourceId: string; mangaId: string; chapterId: string }>;
}) {
  const { sourceId, mangaId, chapterId } = use(params);
  
  const upsertHistory = useHistoryStore(state => state.upsertHistory);
  const getLibraryItem = useLibraryStore(state => state.getLibraryItem);
  const updateLibraryItem = useLibraryStore(state => state.updateLibraryItem);
  const settings = useReaderStore(state => state.settings);

  const { data: detail } = useQuery({
    queryKey: ["manga", sourceId, mangaId],
    queryFn: () => apiClient.getDetail(sourceId, mangaId),
    staleTime: 1000 * 60 * 5,
  });

  const { data: chapters } = useQuery({
    queryKey: ["chapters", sourceId, mangaId],
    queryFn: () => apiClient.getChapters(sourceId, mangaId),
    staleTime: 1000 * 60 * 5,
  });

  const downloadId = `${sourceId}::${mangaId}::${chapterId}`;
  const downloadStatus = useDownloadStore(state => state.downloads[downloadId]?.status);

  const [offlinePages, setOfflinePages] = useState<import("@/shared/types/source").PageItem[] | null>(null);

  useEffect(() => {
    if (downloadStatus === "downloaded" && typeof caches !== "undefined") {
      let isMounted = true;
      (async () => {
        try {
          const cache = await caches.open("yomirra-chapter-cache-v1");
          const keys = await cache.keys();
          const prefix = `/offline-images/${downloadId}/`;
          
          const matchedKeys = keys.filter(req => req.url.includes(prefix));
          const sorted = matchedKeys.sort((a, b) => {
            const numA = parseInt(a.url.split('/').pop() || "0", 10);
            const numB = parseInt(b.url.split('/').pop() || "0", 10);
            return numA - numB;
          });

          const blobUrls = await Promise.all(sorted.map(async (req, index) => {
            const res = await cache.match(req);
            const blob = await res?.blob();
            return blob ? { index, url: URL.createObjectURL(blob) } : null;
          }));
          
          if (isMounted && blobUrls.length > 0) {
            setOfflinePages(blobUrls.filter(Boolean) as import("@/shared/types/source").PageItem[]);
          }
        } catch (e) {
          console.error("Failed to load offline pages", e);
        }
      })();
      return () => { isMounted = false; };
    }
  }, [downloadStatus, downloadId]);

  const { data: chapterPages, isLoading: isQueryLoading, error } = useQuery({
    queryKey: ["pages", sourceId, chapterId],
    queryFn: () => apiClient.getPages(sourceId, mangaId, chapterId),
    enabled: downloadStatus !== "downloaded", // Don't fetch if downloaded
  });

  const isLoading = downloadStatus === "downloaded" ? offlinePages === null : isQueryLoading;
  const pagesToRender = offlinePages || chapterPages?.pages;

  const chapterTitle = chapters?.find(c => c.id === chapterId)?.title || "Chapter";

  useEffect(() => {
    if (!detail) return;
    
    // Upsert to history
    upsertHistory({
      sourceId,
      mangaId,
      chapterId,
      mangaTitle: detail.title,
      chapterTitle,
      coverUrl: detail.coverUrl,
      sourceName: sourceId, // Could map to actual name if we fetch source registry
      readAt: new Date().toISOString(),
    });

    // Update library if bookmarked
    const libItem = getLibraryItem(sourceId, mangaId);
    if (libItem) {
      updateLibraryItem(sourceId, mangaId, {
        lastReadChapterId: chapterId,
        lastReadChapterTitle: chapterTitle,
        lastReadAt: new Date().toISOString(),
      });
    }
  }, [detail, chapterId, sourceId, mangaId, chapterTitle, upsertHistory, getLibraryItem, updateLibraryItem]);

  if (isLoading) {
    return (
      <ReaderShell chapterTitle="Loading..." currentChapterId={chapterId} sourceId={sourceId} mangaId={mangaId}>
        <div className="flex min-h-screen w-full items-center justify-center pt-[calc(56px+env(safe-area-inset-top))] px-4">
          <ReaderPageSkeleton />
        </div>
      </ReaderShell>
    );
  }

  if (error || !pagesToRender) {
    return (
      <ReaderShell chapterTitle="Error" currentChapterId={chapterId} sourceId={sourceId} mangaId={mangaId}>
        <div className="flex min-h-screen items-center justify-center text-text-muted">
          Failed to load pages.
        </div>
      </ReaderShell>
    );
  }

  return (
    <ReaderShell 
      chapterTitle={chapterTitle} 
      pageCount={pagesToRender.length}
      currentChapterId={chapterId}
      sourceId={sourceId}
      mangaId={mangaId}
    >
      {settings.mode === "CONTINUOUS_VERTICAL" || settings.mode === "WEBTOON" ? (
        <ContinuousVerticalReader 
          sourceId={sourceId}
          mangaId={mangaId}
          chapterId={chapterId}
          pages={pagesToRender} 
        />
      ) : (
        <PagedReader 
          sourceId={sourceId}
          mangaId={mangaId}
          chapterId={chapterId}
          pages={pagesToRender}
        />
      )}
    </ReaderShell>
  );
}
