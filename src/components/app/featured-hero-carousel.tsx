"use client";

import * as React from "react";
import Link from "next/link";
import { MangaItem } from "@/shared/sources/source-types";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Play, CaretLeft, CaretRight, Info } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { motionEase, motionDuration } from "@/shared/lib/motion/tokens";

interface FeaturedHeroCarouselProps {
  sourceId: string;
  mangas: MangaItem[];
}

export function FeaturedHeroCarousel({ sourceId, mangas }: FeaturedHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const shouldReduce = useReducedMotion();

  // Auto-play: disabled entirely when user prefers reduced motion
  React.useEffect(() => {
    if (mangas.length <= 1 || isPaused || shouldReduce) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mangas.length);
    }, 8000); 
    return () => clearInterval(interval);
  }, [mangas.length, isPaused, shouldReduce]);

  const currentManga = mangas?.[currentIndex];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actualSourceId = (currentManga as { sourceId?: string } | undefined)?.sourceId ?? sourceId;
  const { data: mangaDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["manga-detail", actualSourceId, currentManga?.id],
    queryFn: () => apiClient.getDetail(actualSourceId, currentManga!.id),
    enabled: !!currentManga?.id,
    staleTime: 1000 * 60 * 15,
  });

  if (!mangas || mangas.length === 0 || !currentManga) return null;

  const synopsis = mangaDetail?.description || currentManga?.description || "Ikuti kisah serunya dengan membaca chapter terbaru sekarang juga.";
  const status = mangaDetail?.status || currentManga.status || "Ongoing";
  const format = currentManga.format || "Manga";
  const latestChapter = currentManga.latestChapter || "Terbaru";

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % mangas.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + mangas.length) % mangas.length);

  return (
    <div 
      className="w-full h-full relative group bg-black isolate overflow-hidden rounded-[32px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background Image Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentManga.id + "-bg"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduce ? 0 : motionDuration.slow, ease: motionEase.softOut as [number, number, number, number] }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={currentManga.coverUrl || ""} 
            alt={currentManga.title} 
            className="w-full h-full object-cover opacity-90 sm:opacity-40 sm:blur-2xl sm:scale-125 sm:saturate-200" 
            referrerPolicy="no-referrer"
          />
          {/* Gradients: Mobile gets a strong fade-to-black at bottom for text. Desktop gets a wider dark base. */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent sm:via-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/90 via-[#0A0A0A]/40 to-transparent sm:from-black sm:via-black/40" />
          <div className="absolute inset-0 bg-black/10 sm:backdrop-blur-[2px]" />
        </motion.div>
      </AnimatePresence>

      {/* Foreground Content */}
      <div className="absolute inset-0 z-10 flex flex-col md:flex-row items-end md:items-center justify-between p-6 sm:p-10 md:p-16 h-full gap-8 pointer-events-none">
        
        {/* Left Text Block */}
        <div className="flex-1 w-full max-w-xl self-end md:self-center order-2 md:order-1 relative z-20 pb-8 md:pb-0 pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentManga.id + "-text"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: shouldReduce ? 0 : motionDuration.normal, ease: motionEase.softOut as [number, number, number, number] }}
              className="flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wider text-accent uppercase">
                <span>{format}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                <span>{status}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                <span>{latestChapter}</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tighter drop-shadow-xl line-clamp-2 sm:line-clamp-3">
                {currentManga.title}
              </h2>
              
              {isDetailLoading ? (
                <div className="flex flex-col gap-2 mt-1 sm:mt-2 w-full max-w-xs sm:max-w-md">
                  <div className="h-4 w-full bg-white/10 rounded-full animate-pulse" />
                  <div className="h-4 w-5/6 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-4 w-4/6 bg-white/10 rounded-full animate-pulse hidden sm:block" />
                </div>
              ) : (
                <p className="text-white/70 text-sm sm:text-base line-clamp-2 sm:line-clamp-3 leading-relaxed mt-1 sm:mt-2 max-w-md font-medium text-balance drop-shadow-md">
                  {synopsis}
                </p>
              )}

              <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-6">
                <Link 
                  href={getMangaDetailHref(actualSourceId, currentManga.id)}
                  className="bg-white text-black px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  draggable={false}
                >
                  <Play weight="fill" size={20} />
                  Baca
                </Link>
                <Link 
                  href={getMangaDetailHref(actualSourceId, currentManga.id)}
                  className="bg-white/5 backdrop-blur-md text-white border border-white/10 p-3 sm:p-3.5 rounded-full hover:bg-white/10 active:scale-95 transition-all hidden sm:block"
                >
                  <Info weight="bold" size={24} />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Image Cover - DESKTOP ONLY */}
        <div className="hidden sm:block w-[200px] md:w-[280px] lg:w-[320px] shrink-0 order-1 md:order-2 self-end md:self-center mr-auto md:mr-0 z-20 pb-4 md:pb-0 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentManga.id + "-cover"}
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: motionDuration.normal, ease: motionEase.softOut as [number, number, number, number] }}
              className="aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <img 
                src={currentManga.coverUrl || ""} 
                alt={currentManga.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-10 z-30 flex items-center gap-2 sm:gap-3 pointer-events-auto">
        <button 
          onClick={handlePrev}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <CaretLeft weight="bold" size={16} className="sm:w-5 sm:h-5" />
        </button>
        <div className="flex gap-1.5 sm:gap-2 mx-1 sm:mx-2 max-w-[120px] overflow-hidden justify-center">
          {mangas.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300", 
                idx === currentIndex ? "w-4 sm:w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
              )} 
            />
          ))}
        </div>
        <button 
          onClick={handleNext}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <CaretRight weight="bold" size={16} className="sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
