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
                className="group relative shrink-0 snap-center w-[85vw] sm:w-[500px] md:w-[600px] h-[200px] md:h-[260px] rounded-3xl overflow-hidden"
              >
                <Link 
                    href={targetHref} 
                    className="absolute inset-0 z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={`Lanjut baca ${group.mangaTitle}`}
                />
                
                {group.coverUrl && (
                  <img 
                    src={group.coverUrl} 
                    alt={group.mangaTitle} 
                    className="absolute inset-0 w-full h-full object-cover object-[50%_25%] group-hover:scale-105 transition-transform duration-1000" 
                    referrerPolicy="no-referrer"
                  />
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-0" />

                {/* Content */}
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-center max-w-[80%] md:max-w-md text-white z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-accent/20 text-accent-hover px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-accent/20">Lanjut Baca</span>
                    <span className="text-white/60 text-xs font-medium">{group.chapterTitle || `Ch. ${group.chapterId}`}</span>
                    {group.totalChapters ? (
                      <span className="text-white/80 text-xs font-bold ml-auto">{group.chapterIndex} / {group.totalChapters}</span>
                    ) : (
                      <span className="text-white/80 text-xs font-bold ml-auto">{Math.round(progress)}%</span>
                    )}
                  </div>
                  <h4 className="font-bold text-2xl md:text-3xl text-white truncate group-hover:text-accent-hover transition-colors w-full mb-6 tracking-tight drop-shadow-md">
                    {group.mangaTitle}
                  </h4>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-4 max-w-[200px]">
                    <div className="bg-accent h-full" style={{ width: `${progress}%` }} />
                  </div>
                  
                  <div className="bg-white text-black px-5 py-2.5 rounded-full font-bold w-fit flex items-center gap-2 text-sm shadow-xl group-hover:bg-accent group-hover:text-white transition-colors">
                    <Play weight="fill" size={16} /> Lanjutkan
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
