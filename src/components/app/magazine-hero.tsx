"use client";

import * as React from "react";
import Link from "next/link";
import { MangaItem } from "@/shared/sources/source-types";
import { motion, AnimatePresence } from "motion/react";

interface MagazineHeroProps {
  sourceId: string;
  mangas: MangaItem[];
}

export function MagazineHero({ sourceId, mangas }: MagazineHeroProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    if (mangas.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mangas.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mangas.length, isPaused]);

  if (!mangas || mangas.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      setCurrentIndex((prev) => (prev + 1) % mangas.length);
    } else if (info.offset.x > threshold) {
      setCurrentIndex((prev) => (prev === 0 ? mangas.length - 1 : prev - 1));
    }
  };

  const heroManga = mangas[currentIndex];

  return (
    <div className="w-full md:w-2/3 flex flex-col">
      <h3 className="text-xl font-black mb-4 tracking-tight">Sorotan Terbaru</h3>
      <div 
        className="relative w-full h-[320px] md:h-[420px] rounded-3xl overflow-hidden group border border-white/10 shadow-2xl bg-surface-raised cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={heroManga.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <img 
              src={heroManga.coverUrl || ""} 
              alt={heroManga.title} 
              className="w-full h-full object-cover" 
            />
            {/* Cinematic Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
          <motion.div 
            key={`badge-${heroManga.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block shadow-lg">
              #{currentIndex + 1} Hottest
            </span>
          </motion.div>
          
          <motion.h2 
            key={`title-${heroManga.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight drop-shadow-md line-clamp-2"
          >
            {heroManga.title}
          </motion.h2>
          
          <motion.div
            key={`btn-${heroManga.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Link 
              href={`/sources/${sourceId}/manga/${heroManga.id}`} 
              className="inline-flex mt-2 bg-white text-slate-950 hover:bg-slate-200 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95"
            >
              Baca Sekarang
            </Link>
          </motion.div>
        </div>

        {/* Indicators */}
        <div className="absolute top-4 right-4 flex gap-1.5 z-10">
          {mangas.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-6 bg-accent' : 'w-2 bg-white/30'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
