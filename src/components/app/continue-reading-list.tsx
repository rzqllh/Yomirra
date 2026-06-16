"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookBookmark, Compass, MagnifyingGlass, Play } from "@phosphor-icons/react";
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

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x < -threshold) {
      // Swipe Left -> Next
      setCards((prev) => {
        const newCards = [...prev];
        const first = newCards.shift();
        if (first) newCards.push(first);
        return newCards;
      });
    } else if (info.offset.x > threshold) {
      // Swipe Right -> Prev
      setCards((prev) => {
        const newCards = [...prev];
        const last = newCards.pop();
        if (last) newCards.unshift(last);
        return newCards;
      });
    }
  };

  return (
    <div className="w-full py-8 flex flex-col items-center justify-center relative min-h-[400px] overflow-hidden">
      <div className="relative w-full max-w-[280px] md:max-w-[320px] h-[360px] md:h-[400px] flex items-center justify-center">
        <AnimatePresence>
          {cards.map((item, index) => {
            // Only render top 3 cards for performance
            if (index > 2) return null;

            const isFront = index === 0;

            return (
              <motion.div
                key={`${item.mangaId}-${item.chapterId}`}
                className={cn(
                  "absolute top-0 left-0 right-0 bottom-0 rounded-[32px] overflow-hidden shadow-2xl bg-surface-raised border border-white/10 flex flex-col",
                  isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
                )}
                style={{
                  transformOrigin: "bottom center",
                }}
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
                {/* Background Image Blurred */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-125" 
                  style={{ backgroundImage: `url(${item.coverUrl})` }} 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
                
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6 text-center">
                  <div className="w-[120px] h-[160px] rounded-xl overflow-hidden shadow-2xl mb-4 border border-white/20">
                    <img 
                      src={item.coverUrl || ""} 
                      className="w-full h-full object-cover pointer-events-none" 
                      alt={item.mangaTitle} 
                    />
                  </div>
                  <h2 className="font-bold text-white text-lg md:text-xl line-clamp-2 w-full drop-shadow-md leading-tight mb-1">{item.mangaTitle}</h2>
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

      <p className="mt-8 text-sm text-text-muted font-medium bg-surface-overlay px-4 py-1.5 rounded-full border border-white/5">
        Swipe untuk melihat riwayat
      </p>
    </div>
  );
}
