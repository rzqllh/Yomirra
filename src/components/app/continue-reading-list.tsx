"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookBookmark, Compass, MagnifyingGlass, Play, Clock } from "@phosphor-icons/react";
import { HistoryItem } from "@/shared/store/history-store";
import { getReaderHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";

import { motion, AnimatePresence } from "motion/react";

interface ContinueReadingListProps {
  items: HistoryItem[];
}

export function ContinueReadingList({ items }: ContinueReadingListProps) {
  const router = useRouter();
  const [cards, setCards] = React.useState(items);

  // Sync state if props change (e.g. new history)
  React.useEffect(() => {
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

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x < -threshold) {
      handleSwipeLeft();
    } else if (info.offset.x > threshold) {
      handleSwipeRight();
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-b from-surface-raised/40 to-surface-base/20 border border-white/5 h-[360px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-text-muted">
          <BookBookmark size={48} weight="duotone" className="opacity-50" />
          <p className="font-medium">Belum ada riwayat baca</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* MOBILE LAYOUT: Tinder Stacked Card */}
      <div 
        className="w-full flex md:hidden flex-col items-center justify-center py-6 overflow-visible"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="relative w-full max-w-[280px] h-[360px] flex items-center justify-center">
          <AnimatePresence>
            {cards.map((item, index) => {
              if (index > 2) return null;
              const isFront = index === 0;

              return (
                <motion.div
                  key={`${item.mangaId}-${item.chapterId}`}
                  className={cn(
                    "absolute top-0 left-0 right-0 bottom-0 rounded-[32px] overflow-hidden shadow-2xl bg-surface-raised border border-white/10 flex flex-col",
                    isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
                  )}
                  style={{ transformOrigin: "bottom center" }}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{
                    opacity: 1 - index * 0.2,
                    scale: 1 - index * 0.05,
                    y: index * 20,
                    zIndex: 10 - index,
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  drag={isFront ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
                  onDragEnd={isFront ? handleDragEnd : undefined}
                  whileDrag={{ scale: 1.05, rotateZ: isFront ? 3 : 0 }}
                >
                  <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-125" style={{ backgroundImage: `url(${item.coverUrl})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
                  
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6 text-center">
                    <div className="w-[120px] h-[160px] rounded-xl overflow-hidden shadow-xl mb-4">
                      <img src={item.coverUrl || ""} className="w-full h-full object-cover pointer-events-none" alt={item.mangaTitle} />
                    </div>
                    <h2 className="font-bold text-white text-lg line-clamp-2 w-full drop-shadow-md leading-tight mb-1">{item.mangaTitle}</h2>
                    <p className="text-slate-300 text-sm font-medium mb-6">{item.chapterTitle || `Chapter ${item.chapterId}`}</p>
                    
                    <Link 
                      href={getReaderHref(item.sourceId, item.mangaId, item.chapterId)}
                      className="bg-accent hover:bg-accent-hover text-white px-8 py-3 w-full rounded-full text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-95 pointer-events-auto"
                      draggable={false}
                    >
                      <Play weight="fill" /> Lanjut Baca
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <p className="mt-12 text-sm text-text-muted font-medium bg-surface-overlay px-4 py-1.5 rounded-full border border-white/5">
          Swipe untuk melihat riwayat
        </p>
      </div>

      {/* DESKTOP LAYOUT: Netflix-style Swimlane */}
      <div className="hidden md:flex flex-col gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-3"><Clock weight="duotone" className="text-accent" /> Lanjut Baca</h2>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-hide">
          {items.map((item) => {
            const progressPercentage = item.progress ? (item.progress.readPages / item.progress.totalPages) * 100 : 0;
            return (
              <div key={`${item.mangaId}-${item.chapterId}`} className="relative flex-none w-[200px] lg:w-[220px] group snap-start">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-md border border-border-subtle mb-3 bg-surface-raised">
                  <img src={item.coverUrl || ""} alt={item.mangaTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <Link 
                      href={getReaderHref(item.sourceId, item.mangaId, item.chapterId)}
                      className="w-full bg-accent text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md hover:bg-accent-hover transition-colors"
                    >
                      <Play weight="fill" /> Resume
                    </Link>
                  </div>
                  {/* Small progress bar inside card bottom */}
                  {progressPercentage > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-black/50">
                      <div className="h-full bg-accent" style={{ width: `${progressPercentage}%` }} />
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-base line-clamp-1 group-hover:text-accent transition-colors">{item.mangaTitle}</h4>
                <p className="text-sm text-text-muted">{item.chapterTitle || `Chapter ${item.chapterId}`}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
