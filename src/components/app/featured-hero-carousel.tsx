"use client";

import * as React from "react";
import Link from "next/link";
import { MangaItem } from "@/shared/sources/source-types";
import { motion, AnimatePresence } from "motion/react";
import { Play, Info } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";

interface FeaturedHeroCarouselProps {
  sourceId: string;
  mangas: MangaItem[];
}

export function FeaturedHeroCarousel({ sourceId, mangas }: FeaturedHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  // Auto-play interval
  React.useEffect(() => {
    if (mangas.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mangas.length);
    }, 8000); // Slower interval for reading synopsis
    return () => clearInterval(interval);
  }, [mangas.length, isPaused]);

  if (!mangas || mangas.length === 0) return null;

  const currentManga = mangas[currentIndex];

  // Fetch full details to get the synopsis
  const { data: mangaDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["manga-detail", sourceId, currentManga?.id],
    queryFn: () => apiClient.getDetail(sourceId, currentManga.id),
    enabled: !!currentManga?.id,
    staleTime: 1000 * 60 * 15,
  });

  const synopsis = mangaDetail?.description || currentManga?.description || "Ikuti kisah serunya dengan membaca chapter terbaru sekarang juga.";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (event: any, info: any) => {
    const swipe = info.offset.x;
    if (swipe < -50) {
      setCurrentIndex((prev) => (prev + 1) % mangas.length);
    } else if (swipe > 50) {
      setCurrentIndex((prev) => (prev - 1 + mangas.length) % mangas.length);
    }
  };

  return (
    <div 
      className="relative rounded-[3rem] overflow-hidden group bg-gradient-to-tr from-accent/10 to-accent/5 dark:from-surface-overlay dark:to-surface-base border border-transparent dark:border-border-subtle touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentManga.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          {/* Subtle blurred glow behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-accent/5 blur-[120px] rounded-full" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 p-6 pb-12 sm:p-8 sm:pb-14 md:p-10 md:pb-16 h-full flex flex-col items-center justify-center overflow-hidden">
        
        {/* Swipeable Content Area */}
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentManga.id}
              initial={{ opacity: 0, x: 40, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center w-full max-w-2xl mx-auto cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            >
              {/* Cover Art - Rotated */}
              <div className="w-[140px] sm:w-[160px] md:w-[180px] shrink-0 aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-white/50 dark:border-white/10 pointer-events-none relative z-10">
                <img src={currentManga.coverUrl || ""} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              </div>

              {/* Content */}
              <div className="flex flex-col items-center pointer-events-none w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 dark:bg-accent text-accent dark:text-white text-xs font-bold mb-4 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-white animate-pulse" />
                  Sorotan Utama
                </div>
                
                {isDetailLoading && currentManga.id ? (
                  /* Text Skeleton during loading */
                  <div className="w-full flex flex-col items-center gap-4 mb-4 h-[134px] sm:h-[162px]">
                    <div className="h-10 sm:h-12 w-3/4 bg-black/5 dark:bg-white/10 rounded-xl animate-pulse" />
                    <div className="h-4 w-1/2 bg-black/5 dark:bg-white/10 rounded-full animate-pulse mb-4" />
                    <div className="h-3 w-full bg-black/5 dark:bg-white/10 rounded-full animate-pulse" />
                    <div className="h-3 w-5/6 bg-black/5 dark:bg-white/10 rounded-full animate-pulse" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-black line-clamp-2 w-full px-4 mb-3 text-text-primary tracking-tight leading-tight">
                      {currentManga.title}
                    </h3>
                    
                    <p className="text-sm sm:text-base text-text-secondary font-bold mb-6 flex items-center justify-center gap-2">
                      <span>{currentManga.latestChapter || "Bab Terbaru"}</span> 
                      <span className="w-1 h-1 rounded-full bg-border-strong" /> 
                      <span>{mangaDetail?.status || currentManga.status || "Ongoing"}</span>
                      <span className="w-1 h-1 rounded-full bg-border-strong" /> 
                      <span>{currentManga.format || "Manga"}</span>
                    </p>

                    <div className="h-[44px] sm:h-[66px] w-full max-w-2xl mx-auto flex items-start justify-center overflow-hidden">
                      <p className="text-sm text-text-muted line-clamp-2 sm:line-clamp-3 leading-relaxed font-medium">
                        {synopsis}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Static Button (Outside AnimatePresence so it doesn't swipe/fade) */}
        <Link 
          href={`/sources/${sourceId}/manga/${currentManga.id}`}
          className="bg-accent text-white border border-accent-hover/20 px-8 py-3 rounded-[2rem] font-bold shadow-xl shadow-accent/20 hover:scale-105 hover:bg-accent-hover active:scale-95 transition-all flex items-center justify-center gap-2.5 pointer-events-auto cursor-pointer w-full sm:w-auto mt-4 z-20"
          draggable={false}
        >
          <Play weight="fill" size={20} /> Mulai Membaca
        </Link>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-5 sm:bottom-6 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-auto">
        {mangas.map((_, idx) => (
          <button 
            key={idx} 
            onClick={(e) => {
              e.preventDefault();
              setCurrentIndex(idx);
            }}
            className={cn(
              "relative h-1.5 rounded-full transition-all duration-300 cursor-pointer",
              idx === currentIndex ? "w-8" : "w-1.5 bg-border-strong hover:bg-text-muted"
            )}
            aria-label={`Go to slide ${idx + 1}`}
          >
            {idx === currentIndex && (
              <motion.div
                layoutId="active-dot"
                className="absolute inset-0 bg-accent rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
