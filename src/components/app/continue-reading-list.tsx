"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookBookmark, Compass, MagnifyingGlass, Play, Clock } from "@phosphor-icons/react";
import { HistoryItem } from "@/shared/store/history-store";
import { getReaderHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";

import { motion, AnimatePresence, type PanInfo } from "motion/react";

interface ContinueReadingListProps {
  items: HistoryItem[];
}

export function ContinueReadingList({ items }: ContinueReadingListProps) {
  const router = useRouter();
  const [cards, setCards] = React.useState(items);

  // Sync state if props change (e.g. new history)
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCards(items);
  }, [items]);

  const handleSwipeLeft = React.useCallback(() => {
    setCards((prev) => {
      const newCards = [...prev];
      const first = newCards.shift();
      if (first) newCards.push(first);
      return newCards;
    });
  }, []);

  const handleSwipeRight = React.useCallback(() => {
    setCards((prev) => {
      const newCards = [...prev];
      const last = newCards.pop();
      if (last) newCards.unshift(last);
      return newCards;
    });
  }, []);

  const [isPaused, setIsPaused] = React.useState(false);

  // Auto swipe every 5 seconds
  React.useEffect(() => {
    if (cards.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      handleSwipeLeft();
    }, 5000);
    return () => clearInterval(interval);
  }, [cards.length, handleSwipeLeft, isPaused]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x < -threshold) {
      handleSwipeLeft();
    } else if (info.offset.x > threshold) {
      handleSwipeRight();
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="w-full relative overflow-hidden rounded-2xl bg-surface-muted/30 border border-border-subtle/50 py-6 md:py-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 px-6 md:px-10">
        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 text-center sm:text-left text-text-muted">
          <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full bg-surface-raised flex items-center justify-center  border border-border-subtle">
            <BookBookmark size={24} weight="duotone" className="text-text-secondary md:w-7 md:h-7" />
          </div>
          <div>
            <p className="font-bold text-text-primary md:text-lg">Belum ada riwayat baca</p>
            <p className="text-sm text-text-muted">Mulai baca komik untuk melanjutkan progresmu di sini.</p>
          </div>
        </div>
        <Link 
          href="/" 
          className="bg-surface-overlay border border-border-default px-6 py-2.5 md:py-3 rounded-full font-bold text-sm text-text-primary hover:bg-surface-hover hover:text-accent transition-colors shadow-sm flex items-center gap-2"
        >
          <Compass weight="bold" /> Eksplor Manga
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 px-2">
          <Clock weight="duotone" className="text-accent" /> Lanjut Baca
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-hide px-2">
          {items.map((group) => {
            const progress = group.seriesProgressPercent || group.progressPercent || 0;
            const targetHref = getReaderHref(group.sourceId, group.mangaId, group.chapterId);
            
            return (
              <div
                key={`${group.mangaId}-${group.chapterId}`}
                className="group relative shrink-0 snap-center w-[85vw] sm:w-[400px] md:w-[450px] bg-surface-raised border border-border-subtle rounded-2xl md:rounded-3xl p-3 md:p-4 flex gap-4 md:gap-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <Link 
                    href={targetHref} 
                    className="absolute inset-0 z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={`Lanjut baca ${group.mangaTitle}`}
                />
                
                {/* Cover Image */}
                <div className="relative w-24 sm:w-28 md:w-32 aspect-[3/4] shrink-0 rounded-xl md:rounded-2xl overflow-hidden bg-surface-muted">
                  {group.coverUrl ? (
                    <img 
                      src={group.coverUrl} 
                      alt={group.mangaTitle} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-muted flex items-center justify-center">
                      <BookBookmark size={32} className="text-text-muted/50" />
                    </div>
                  )}
                  {/* Subtle Gradient for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0 py-1 md:py-2">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <span className="text-accent text-[10px] md:text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <Clock weight="fill" /> Lanjut Baca
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-base md:text-lg text-text-primary line-clamp-2 leading-snug group-hover:text-accent transition-colors mb-auto drop-shadow-none">
                    {group.mangaTitle}
                  </h4>
                  
                  <div className="mt-4 md:mt-auto">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-text-secondary text-xs md:text-sm font-medium">
                        {group.chapterTitle || `Ch. ${group.chapterId}`}
                      </span>
                      <span className="text-text-muted text-[10px] md:text-xs font-semibold">
                        {group.totalChapters ? `${group.chapterIndex} / ${group.totalChapters}` : `${Math.round(progress)}%`}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-surface-muted h-1.5 md:h-2 rounded-full overflow-hidden mb-3">
                      <div className="bg-accent h-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
