"use client";

import { useState, useMemo, useEffect } from "react";
import { Play, SortAscending, SortDescending, Book } from "@phosphor-icons/react";
import { CaretLeft } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { getReaderHref, getSafeMangaDetailBackHref } from "@/shared/lib/routes";
import { MangaActions } from "@/components/manga/manga-actions";
import { useHistoryStore } from "@/shared/store/history-store";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ChapterRow } from "@/components/manga/chapter-row";
import { useSearchParams } from "next/navigation";
import { YomirraSearchField } from "@/components/ui/yomirra-search-field";
import { EmptyState } from "@/components/states/empty-state";
import { cn } from "@/shared/utils/cn";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const backHref = getSafeMangaDetailBackHref(returnTo, sourceId);

  const getLatestForManga = useHistoryStore((state) => state.getLatestForManga);
  const historyItems = useHistoryStore((state) => state.items); // keep subscription
  const historyItem = mounted ? getLatestForManga(sourceId, mangaId) : undefined;

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

  const renderActions = () => (
    <>
      {showContinue && continueChapterId ? (
        <Button asChild variant="accent" className="w-full rounded-full h-12 text-base font-bold shadow-sm">
          <Link href={getReaderHref(sourceId, mangaId, continueChapterId)}>
            <Play className="h-5 w-5" fill="currentColor" weight="fill" />
            Lanjut baca
          </Link>
        </Button>
      ) : startChapterId ? (
        <Button asChild variant="accent" className="w-full rounded-full h-12 text-base font-bold shadow-sm">
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
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <Link 
          href={backHref}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-overlay/80 backdrop-blur-md border border-border-glass shadow-sm text-text-primary hover:bg-surface-hover transition-colors"
        >
          <CaretLeft size={24} weight="bold" />
        </Link>
      </div>

      <div className="absolute top-0 left-0 right-0 h-[300px] md:h-[450px] w-full overflow-hidden z-0 pointer-events-none select-none">
        {detail.coverUrl && (
          <img
            src={detail.coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.25] blur-3xl scale-110 saturate-150 transform-gpu dark:opacity-[0.15]"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-base/80 to-surface-base" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-12 relative z-10 flex flex-col md:flex-row gap-6 md:gap-10">
        
        <div className="flex gap-4 md:hidden">
          <div className="relative w-[110px] shrink-0 aspect-[2/3] rounded-md overflow-hidden shadow-heavy border border-border-default bg-surface-base vt-cover-mobile">
            {coverUrl && (
              <img 
                src={coverUrl} 
                alt={detail.title} 
                className="absolute inset-0 w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.style.display = 'none' }}
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="flex flex-col flex-1 gap-1.5 justify-center py-1">
            <h1 className="text-xl font-bold leading-snug line-clamp-3 text-shadow-sm">{detail.title}</h1>
            <div className="text-sm font-medium text-text-muted">{detail.author}</div>
            <div className="mt-1">
              <span className="text-text-primary bg-surface-overlay border border-border-default px-1.5 py-0.5 rounded-sm text-2xs uppercase tracking-wider font-bold">{detail.status}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2 md:hidden">
          {renderActions()}
        </div>

        <div className="hidden md:flex relative sticky top-[100px] self-start w-[280px] lg:w-80 shrink-0 flex-col gap-4">
          <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-heavy border border-border-default bg-surface-base vt-cover-desktop">
            {coverUrl && (
              <img 
                src={coverUrl} 
                alt={detail.title} 
                className="absolute inset-0 w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.style.display = 'none' }}
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="flex flex-col gap-3 mt-2">
            {renderActions()}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-4">
            
            <div className="hidden md:flex flex-col gap-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-tight text-balance">
                {detail.title}
              </h1>
              <div className="flex items-center gap-2 text-base font-medium text-text-muted">
                <span>{detail.author}</span>
                <span>•</span>
                <span className="text-text-primary bg-surface-overlay px-2 py-0.5 rounded-sm text-xs uppercase tracking-wider font-bold">{detail.status}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
              {detail.genres?.map((g) => (
                <Link 
                  key={g} 
                  href={`/library?source=${sourceId}&genre=${encodeURIComponent(g)}`}
                  className="rounded-sm bg-surface-overlay px-2 py-1 text-[11px] md:text-xs font-semibold text-text-primary border border-border-default uppercase tracking-wider hover:bg-accent/10 hover:text-accent hover:border-accent transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>

            <div className="mt-2 md:mt-4 bg-surface-base border border-border-default rounded-lg p-4 md:p-6">
              <p className={cn(
                "text-sm md:text-base leading-relaxed text-text-secondary whitespace-pre-wrap break-words text-justify transition-all",
                !isExpanded && "line-clamp-4"
              )}>
                {detail.description || "Sinopsis belum tersedia."}
              </p>
              {detail.description && detail.description.length > 180 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2.5 text-sm font-bold text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1"
                >
                  {isExpanded ? "Tampilkan lebih sedikit" : "Selengkapnya"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 md:mt-10">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-default pb-3 gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg md:text-xl font-bold text-text-primary">Chapter</h3>
                <span className="text-sm text-text-muted font-bold">{chapters?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <YomirraSearchField 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari chapter..." 
                  containerClassName="w-full sm:w-[220px]"
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
              <EmptyState 
                icon={<Book size={32} weight="duotone" />}
                title="Belum ada chapter"
                description="Manga ini belum memiliki chapter atau sedang error saat memuat data."
                className="my-8"
              />
            ) : (
              <div className="flex flex-col gap-2 max-h-[60vh] md:max-h-[500px] overflow-y-auto pr-2 -mr-2 [scrollbar-width:thin]">
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
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
