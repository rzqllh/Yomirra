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
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory scrollbar-hide px-2">
          {items.map((group) => {
            const progress = group.progressPercent || 0;
            const targetHref = getReaderHref(group.sourceId, group.mangaId, group.chapterId);
            
            return (
              <div
                key={`${group.mangaId}-${group.chapterId}`}
                className="group flex flex-col items-center gap-3 shrink-0 snap-start w-20 sm:w-24 relative"
              >
                <Link 
                    href={targetHref} 
                    className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={`Lanjut baca ${group.mangaTitle}`}
                />
                
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface-muted shrink-0 overflow-hidden relative z-0 shadow-sm group-hover:shadow-md transition-shadow">
                  {group.coverUrl && (
                    <img 
                      src={group.coverUrl} 
                      alt={group.mangaTitle} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {/* Circular Progress Ring Indicator */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle cx="50%" cy="50%" r="48%" stroke="var(--color-accent)" strokeWidth="4%" fill="none" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * progress / 100)} className="opacity-80 transition-all duration-1000" />
                  </svg>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play weight="fill" className="text-white w-6 h-6 ml-1" />
                  </div>
                </div>
                
                <div className="text-center w-full">
                  <h4 className="font-bold text-xs sm:text-sm text-text-primary truncate group-hover:text-accent transition-colors w-full px-1">{group.mangaTitle}</h4>
                  <p className="text-text-muted text-[10px] sm:text-xs truncate w-full px-1">{group.chapterTitle || `Ch. ${group.chapterId}`}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
