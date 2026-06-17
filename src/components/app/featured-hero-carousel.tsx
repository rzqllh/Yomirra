"use client";

import * as React from "react";
import Link from "next/link";
import { MangaItem } from "@/shared/sources/source-types";
import { motion, AnimatePresence } from "motion/react";
import { Play, TrendUp } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

interface FeaturedHeroCarouselProps {
  sourceId: string;
  mangas: MangaItem[];
}

export function FeaturedHeroCarousel({ sourceId, mangas }: FeaturedHeroCarouselProps) {
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

  const currentManga = mangas[currentIndex];

  const handlePanEnd = (e: any, { offset }: any) => {
    const swipe = offset.x;
    if (swipe < -50) {
      setCurrentIndex((prev) => (prev + 1) % mangas.length);
    } else if (swipe > 50) {
      setCurrentIndex((prev) => (prev - 1 + mangas.length) % mangas.length);
    }
  };

  return (
    <motion.div 
      className="lg:col-span-2 relative rounded-3xl overflow-hidden group border border-border-subtle bg-surface-base cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onPanEnd={handlePanEnd}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentManga.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          {/* Background blurred cover */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110" 
            style={{ backgroundImage: `url(${currentManga.coverUrl || ""})` }} 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-base via-surface-base/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-stretch gap-6 md:gap-8 h-full">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div 
            key={`cover-${currentManga.id}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-[140px] md:w-[180px] shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 hidden sm:block"
          >
            <img src={currentManga.coverUrl || ""} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col justify-center flex-1 h-full py-2">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div 
              key={`content-${currentManga.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col h-full justify-center"
            >
              <div className="inline-flex items-center gap-2 text-xs font-bold text-semantic-warning mb-3 bg-semantic-warning/10 border border-semantic-warning/20 px-3 py-1 rounded-full w-fit">
                <TrendUp weight="duotone" /> Sorotan
              </div>
              <h3 className="text-2xl md:text-3xl font-bold line-clamp-2 mb-2 text-text-primary group-hover:text-accent transition-colors">
                {currentManga.title}
              </h3>
              <p className="text-text-secondary font-medium mb-3 flex items-center gap-2">
                <span className="text-text-primary font-bold">{currentManga.latestChapter || "Bab Terbaru"}</span> 
                <span className="w-1 h-1 rounded-full bg-border-strong" /> 
                <span>{currentManga.format || "Manga"}</span>
              </p>
              <p className="text-sm text-text-muted mb-6 line-clamp-2 max-w-lg">
                {currentManga.description || "Jelajahi kisah epik ini dengan aksi yang memukau dan petualangan tak terduga. Jangan lewatkan chapter terbarunya yang semakin seru dan menegangkan!"}
              </p>
              <Link 
                href={`/sources/${sourceId}/manga/${currentManga.id}`}
                className="bg-text-primary text-surface-base px-8 py-3 rounded-full font-bold w-fit flex items-center gap-2 hover:opacity-90 transition-opacity shadow-xl active:scale-95 transition-transform"
              >
                <Play weight="fill" /> Mulai Membaca
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-4 right-6 flex gap-1.5 z-20">
        {mangas.map((_, idx) => (
          <button 
            key={idx} 
            onClick={(e) => {
              e.preventDefault();
              setCurrentIndex(idx);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              idx === currentIndex ? "w-6 bg-accent" : "w-2 bg-text-muted/30 hover:bg-text-muted/60"
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
