"use client";

import { use, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { CircleNotch, Play, SortAscending, SortDescending } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { getReaderHref } from "@/shared/lib/routes";
import { MangaActions } from "@/components/manga/manga-actions";
import { useHistoryStore } from "@/shared/store/history-store";
import { TopBar } from "@/components/app/top-bar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChapterDownloadButton } from "@/components/manga/chapter-download-button";
import { MangaDetailSkeleton } from "@/components/skeletons/manga-detail-skeleton";
import { ChapterListSkeleton } from "@/components/skeletons/chapter-list-skeleton";

export default function MangaDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string; mangaId: string }>;
}) {
  const { sourceId, mangaId } = use(params);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const getLatestForManga = useHistoryStore((state) => state.getLatestForManga);
  const historyItem = getLatestForManga(sourceId, mangaId);

  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["manga", sourceId, mangaId],
    queryFn: () => apiClient.getDetail(sourceId, mangaId),
  });

  const { data: chapters, isLoading: isLoadingChapters } = useQuery({
    queryKey: ["chapters", sourceId, mangaId],
    queryFn: () => apiClient.getChapters(sourceId, mangaId),
  });

  const sortedChapters = useMemo(() => {
    if (!chapters) return [];
    // Assuming the API returns chapters in descending order by default
    if (sortOrder === "asc") return [...chapters].reverse();
    return chapters;
  }, [chapters, sortOrder]);

  if (isLoadingDetail) {
    return <MangaDetailSkeleton />;
  }

  if (!detail) return null;

  const coverUrl = detail.coverUrl;
  const firstChapter = chapters?.[chapters.length - 1]; // First chapter is at the end if it's desc

  // Determine CTA
  const showContinue = !!historyItem;
  const continueChapterId = historyItem?.chapterId;
  const startChapterId = firstChapter?.id;

  return (
    <main className="min-h-screen flex flex-col w-full relative">
      {/* Mobile TopBar */}
      <div className="md:hidden">
        <TopBar title={detail.title} showBack />
      </div>

      {/* Banner Background */}
      <div className="absolute top-0 left-0 right-0 h-64 md:h-[400px] w-full overflow-hidden z-0 bg-surface-raised">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt={detail.title}
            fill
            className="object-cover blur-2xl opacity-30 md:opacity-20 scale-110"
            priority
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-24 relative z-10 flex flex-col md:flex-row gap-8">
        
        {/* Left Column (Cover + Actions) */}
        <div className="relative md:sticky md:top-[100px] self-start w-full md:w-[280px] lg:w-[320px] shrink-0 flex flex-col gap-4">
          <div className="relative w-[200px] sm:w-[240px] md:w-full mx-auto aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-border-subtle bg-surface-raised flex items-center justify-center text-text-muted">
            {coverUrl ? (
              <Image src={coverUrl} alt={detail.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 320px" />
            ) : (
              <span className="text-sm font-medium">No Cover</span>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {showContinue && continueChapterId ? (
              <Button asChild variant="accent" className="w-full rounded-full h-12 text-[15px] font-bold shadow-sm">
                <Link href={getReaderHref(sourceId, mangaId, continueChapterId)}>
                  <Play className="h-5 w-5" fill="currentColor" weight="fill" />
                  Lanjut baca
                </Link>
              </Button>
            ) : startChapterId ? (
              <Button asChild variant="accent" className="w-full rounded-full h-12 text-[15px] font-bold shadow-sm">
                <Link href={getReaderHref(sourceId, mangaId, startChapterId)}>
                  <Play className="h-5 w-5" fill="currentColor" weight="fill" />
                  Mulai baca
                </Link>
              </Button>
            ) : null}

            <MangaActions 
              sourceId={sourceId}
              mangaId={mangaId}
              title={detail.title}
              coverUrl={detail.coverUrl}
              author={detail.author}
              status={detail.status}
            />
          </div>
        </div>

        {/* Right Column (Info + Chapters) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary leading-tight balance">
              {detail.title}
            </h1>
            
            <div className="flex items-center gap-2 text-[15px] font-medium text-text-muted">
              <span>{detail.author}</span>
              <span>•</span>
              <span className="text-text-primary bg-surface-raised px-2 py-0.5 rounded text-xs uppercase tracking-wider font-bold">{detail.status}</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {detail.genres.map((g) => (
                <span key={g} className="rounded bg-surface-raised px-2 py-1 text-xs font-semibold text-text-primary border border-border-subtle uppercase tracking-wider">
                  {g}
                </span>
              ))}
            </div>

            <div className="mt-4 md:mt-6 bg-surface-raised/50 border border-border-subtle rounded-xl p-4 md:p-6">
              <p className="text-sm md:text-[15px] leading-relaxed text-text-secondary whitespace-pre-wrap">
                {detail.description || "Sinopsis belum tersedia."}
              </p>
            </div>
          </div>

          {/* Chapters Section */}
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-text-primary">Chapter</h3>
                <span className="text-sm text-text-muted font-bold">{chapters?.length || 0}</span>
              </div>
              <IconButton 
                variant="ghost" 
                size="sm"
                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                aria-label={sortOrder === "desc" ? "Urutkan paling lama" : "Urutkan terbaru"}
                title={sortOrder === "desc" ? "Urutkan paling lama" : "Urutkan terbaru"}
              >
                {sortOrder === "desc" ? <SortDescending size={20} /> : <SortAscending size={20} />}
              </IconButton>
            </div>

            {isLoadingChapters ? (
              <ChapterListSkeleton />
            ) : !chapters || chapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-raised/30 rounded-xl border border-dashed border-border-subtle">
                <p className="text-[15px] font-medium text-text-muted">Belum ada chapter.</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="flex flex-col gap-2">
                  {sortedChapters.map((chapter) => {
                    const isRead = useHistoryStore.getState().items[`${sourceId}::${mangaId}::${chapter.id}`] !== undefined;
                    const isLastRead = historyItem?.chapterId === chapter.id;

                    return (
                      <Link
                        key={chapter.id}
                        href={getReaderHref(sourceId, mangaId, chapter.id)}
                        className={`group flex items-center justify-between rounded-md px-4 py-3 border transition-colors ${
                          isLastRead 
                            ? "bg-surface-active border-border-strong hover:bg-surface-overlay" 
                            : "bg-surface-base border-border-subtle hover:bg-surface-raised"
                        }`}
                      >
                        <div className="flex-1 truncate pr-4 flex flex-col md:flex-row md:items-center md:gap-4">
                          <h4 className={`text-[15px] font-bold truncate transition-colors group-hover:text-accent ${isRead ? "text-text-muted" : "text-text-primary"}`}>
                            {chapter.title}
                          </h4>
                          <p className="text-[12px] text-text-muted mt-1 md:mt-0 font-medium shrink-0 flex items-center gap-2">
                             {new Date(chapter.date).toLocaleDateString()}
                          </p>
                        </div>
                        {isLastRead && (
                          <div className="rounded bg-accent/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-accent border border-accent/20 shrink-0">
                            Terakhir dibaca
                          </div>
                        )}
                        <div className="ml-2 pl-2 border-l border-border-subtle shrink-0" onClick={(e) => e.stopPropagation()}>
                          <ChapterDownloadButton
                            sourceId={sourceId}
                            mangaId={mangaId}
                            chapterId={chapter.id}
                            chapterTitle={chapter.title}
                            mangaTitle={detail.title}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
