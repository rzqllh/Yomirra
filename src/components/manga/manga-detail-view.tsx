"use client";

import { useState, useMemo } from "react";
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
import { ChapterRow } from "@/components/manga/chapter-row";
import type { MangaDetail, Chapter } from "@/shared/types/source";

interface MangaDetailViewProps {
  sourceId: string;
  mangaId: string;
  detail: MangaDetail;
  chapters: Chapter[];
}

export function MangaDetailView({
  sourceId,
  mangaId,
  detail,
  chapters,
}: MangaDetailViewProps) {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const getLatestForManga = useHistoryStore((state) => state.getLatestForManga);
  const historyItem = getLatestForManga(sourceId, mangaId);
  const historyItems = useHistoryStore((state) => state.items);

  const sortedChapters = useMemo(() => {
    if (!chapters) return [];
    let result = chapters;
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(lowerQuery));
    }
    if (sortOrder === "asc") return [...result].reverse();
    return result;
  }, [chapters, sortOrder, searchQuery]);

  const coverUrl = detail.coverUrl;
  const firstChapter = chapters?.[chapters.length - 1];

  const showContinue = !!historyItem;
  const continueChapterId = historyItem?.chapterId;
  const startChapterId = firstChapter?.id;

  const RenderActions = () => (
    <>
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
    </>
  );

  return (
    <main className="min-h-screen flex flex-col w-full relative">
      <div className="md:hidden">
        <TopBar title={detail.title} showBack />
      </div>

      <div className="absolute top-0 left-0 right-0 h-[400px] w-full overflow-hidden z-0 pointer-events-none select-none">
        <Image
          src={detail.coverUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-20 dark:opacity-15 blur-xl scale-110 saturate-150 transform-gpu"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-[calc(6rem+env(safe-area-inset-bottom))] relative z-10 flex flex-col md:flex-row gap-6 md:gap-8">
        
        <div className="flex gap-4 md:hidden">
          <div className="relative w-[110px] shrink-0 aspect-[2/3] rounded-md overflow-hidden shadow-xl border border-border-subtle bg-surface-raised">
            {coverUrl && <Image src={coverUrl} alt={detail.title} fill className="object-cover" priority sizes="110px" />}
          </div>
          <div className="flex flex-col flex-1 gap-1.5 justify-center py-1">
            <h1 className="text-xl font-bold leading-snug line-clamp-3 text-shadow-sm">{detail.title}</h1>
            <div className="text-sm font-medium text-text-muted">{detail.author}</div>
            <div className="mt-1">
              <span className="text-text-primary bg-surface-raised border border-border-subtle px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">{detail.status}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2 md:hidden">
          <RenderActions />
        </div>

        <div className="hidden md:flex relative sticky top-[100px] self-start w-[280px] lg:w-[320px] shrink-0 flex-col gap-4">
          <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-border-subtle bg-surface-raised">
            {coverUrl && <Image src={coverUrl} alt={detail.title} fill className="object-cover" priority sizes="320px" />}
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <RenderActions />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-4">
            
            <div className="hidden md:flex flex-col gap-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-tight text-balance">
                {detail.title}
              </h1>
              <div className="flex items-center gap-2 text-[15px] font-medium text-text-muted">
                <span>{detail.author}</span>
                <span>•</span>
                <span className="text-text-primary bg-surface-raised px-2 py-0.5 rounded text-xs uppercase tracking-wider font-bold">{detail.status}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
              {detail.genres?.map((g) => (
                <span key={g} className="rounded bg-surface-raised px-2 py-1 text-[11px] md:text-xs font-semibold text-text-primary border border-border-subtle uppercase tracking-wider">
                  {g}
                </span>
              ))}
            </div>

            <div className="mt-2 md:mt-4 bg-surface-raised/50 border border-border-subtle rounded-xl p-4 md:p-6">
              <p className="text-sm md:text-[15px] leading-relaxed text-text-secondary whitespace-pre-wrap break-words">
                {detail.description || "Sinopsis belum tersedia."}
              </p>
            </div>
          </div>

          <div className="mt-8 md:mt-10">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-2 gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg md:text-xl font-bold text-text-primary">Chapter</h3>
                <span className="text-sm text-text-muted font-bold">{chapters?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari chapter..." 
                  className="bg-surface-raised border border-border-subtle rounded-full px-3 py-1.5 text-sm w-full sm:w-[150px] outline-none focus:border-border-strong text-text-primary transition-colors"
                />
                <IconButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                  aria-label={sortOrder === "desc" ? "Urutkan paling lama" : "Urutkan terbaru"}
                >
                  {sortOrder === "desc" ? <SortDescending size={20} /> : <SortAscending size={20} />}
                </IconButton>
              </div>
            </div>

            {!chapters || chapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-raised/30 rounded-xl border border-dashed border-border-subtle">
                <p className="text-[15px] font-medium text-text-muted">Belum ada chapter.</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-2 md:pr-4">
                <div className="flex flex-col gap-2">
                  {sortedChapters.map((chapter) => {
                    const isRead = historyItems[`${sourceId}::${mangaId}::${chapter.id}`] !== undefined;
                    const isLastRead = historyItem?.chapterId === chapter.id;

                    return (
                      <ChapterRow
                        key={chapter.id}
                        sourceId={sourceId}
                        mangaId={mangaId}
                        chapterId={chapter.id}
                        chapterTitle={chapter.title}
                        mangaTitle={detail.title}
                        date={chapter.date}
                        isRead={isRead}
                        isLastRead={isLastRead}
                      />
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
