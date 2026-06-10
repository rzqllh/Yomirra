"use client";

import { useEffect, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { ReaderPageSkeleton } from "@/components/skeletons/reader-page-skeleton";
import { ReaderShell } from "@/components/reader/reader-shell";
import { ContinuousVerticalReader } from "@/components/reader/continuous-vertical-reader";
import { PagedReader } from "@/components/reader/paged-reader";
import { useHistoryStore } from "@/shared/store/history-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { useReaderStore } from "@/shared/store/reader-store";

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

  const { data: chapterPages, isLoading, error } = useQuery({
    queryKey: ["pages", sourceId, chapterId],
    queryFn: () => apiClient.getPages(sourceId, mangaId, chapterId),
  });

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

  if (error || !chapterPages?.pages) {
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
      pageCount={chapterPages.pages.length}
      currentChapterId={chapterId}
      sourceId={sourceId}
      mangaId={mangaId}
    >
      {settings.mode === "CONTINUOUS_VERTICAL" || settings.mode === "WEBTOON" ? (
        <ContinuousVerticalReader 
          sourceId={sourceId}
          mangaId={mangaId}
          chapterId={chapterId}
          pages={chapterPages.pages} 
        />
      ) : (
        <PagedReader 
          sourceId={sourceId}
          mangaId={mangaId}
          chapterId={chapterId}
          pages={chapterPages.pages}
        />
      )}
    </ReaderShell>
  );
}
