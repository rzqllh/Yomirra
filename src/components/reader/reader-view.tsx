"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { ReaderPageSkeleton } from "@/components/skeletons/reader-page-skeleton";
import { ReaderShell } from "@/components/reader/reader-shell";
import { ContinuousVerticalReader } from "@/components/reader/continuous-vertical-reader";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useDownloadStore } from "@/shared/store/download-store";
import { EmptyState } from "@/components/states/empty-state";
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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

  const downloadId = `${sourceId}::${mangaId}::${chapterId}`;
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
            setOfflinePages(blobUrls.filter(Boolean) as PageItem[]);
          }
        } catch (e) {
          console.error("Failed to load offline pages", e);
        }
      })();
      return () => { isMounted = false; };
    }
  }, [downloadStatus, downloadId]);

  const isLoading = downloadStatus === "downloaded" ? offlinePages === null : (!initialPages && isQueryLoading);
  const pagesToRender = offlinePages || initialPages || chapterPages?.pages;

  const chapterTitle = initialChapters?.find(c => c.id === chapterId)?.title || "Chapter";

  useEffect(() => {
    if (!initialDetail) return;
    
    upsertHistory({
      sourceId,
      mangaId,
      chapterId,
      mangaTitle: initialDetail.title,
      chapterTitle,
      coverUrl: initialDetail.coverUrl,
      sourceName: sourceId,
      readAt: new Date().toISOString(),
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
      <ReaderShell chapterTitle="Loading..." currentChapterId={chapterId} sourceId={sourceId} mangaId={mangaId}>
        <div className="flex min-h-screen w-full items-center justify-center pt-[calc(var(--mobile-header-height)+var(--safe-top))] px-4">
          <ReaderPageSkeleton />
        </div>
      </ReaderShell>
    );
  }

  if (error || !pagesToRender) {
    return (
      <ReaderShell chapterTitle="Error" currentChapterId={chapterId} sourceId={sourceId} mangaId={mangaId}>
        <div className="flex min-h-screen items-center justify-center pt-16">
          <EmptyState
            icon={<WarningCircle size={48} weight="duotone" className="text-text-muted" />}
            title="Gagal Memuat Halaman"
            description="Tidak dapat mengambil halaman chapter dari server."
            action={
              <Button onClick={() => refetch()} variant="outline" className="rounded-full shadow-sm mt-2 font-bold">
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
      chapterTitle={chapterTitle} 
      pageCount={pagesToRender.length}
      currentChapterId={chapterId}
      sourceId={sourceId}
      mangaId={mangaId}
      chapters={initialChapters}
    >
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
    </ReaderShell>
  );
}
