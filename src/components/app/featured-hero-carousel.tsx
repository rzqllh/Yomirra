"use client";

import * as React from "react";
import Link from "next/link";
import { MangaItem } from "@/shared/sources/source-types";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Play, CaretLeft, CaretRight, Star, Fire } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { motionEase, motionDuration } from "@/shared/lib/motion/tokens";

export type HomeDesignVariant = "cyber-editorial" | "cinematic-glass" | "editorial-studio";

interface FeaturedHeroCarouselProps {
  sourceId: string;
  mangas: MangaItem[];
  variant?: HomeDesignVariant;
}

export function FeaturedHeroCarousel({ sourceId, mangas, variant = "cyber-editorial" }: FeaturedHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const shouldReduce = useReducedMotion();

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
  const score = mangaDetail?.score || currentManga.score;

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % mangas.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + mangas.length) % mangas.length);

  return (
    <div
      className={cn(
        "w-full h-full relative group isolate overflow-hidden transition-all duration-300 shadow-2xl",
        variant === "cyber-editorial" && "bg-black rounded-2xl md:rounded-3xl border border-white/10",
        variant === "cinematic-glass" && "bg-slate-950/80 backdrop-blur-2xl rounded-3xl border border-white/20",
        variant === "editorial-studio" && "bg-zinc-950 rounded-2xl border-2 border-zinc-800"
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Ambient Cover Background Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentManga.id + "-bg"}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduce ? 0 : motionDuration.slow, ease: motionEase.softOut as [number, number, number, number] }}
          className="absolute inset-0 z-0"
        >
          <img
            src={currentManga.coverUrl || ""}
            alt={currentManga.title}
            className={cn(
              "w-full h-full object-cover",
              variant === "cyber-editorial" && "opacity-80 sm:opacity-50 sm:blur-2xl sm:scale-125",
              variant === "cinematic-glass" && "opacity-40 blur-xl scale-110",
              variant === "editorial-studio" && "opacity-40 grayscale contrast-125 scale-105"
            )}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Foreground Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 md:p-8 pointer-events-none">
        {/* Top Header Badge Row */}
        <div className="flex items-center justify-between w-full z-20 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[11px] uppercase tracking-wider shadow-sm",
              variant === "cyber-editorial" && "bg-accent/20 backdrop-blur-md border border-accent/40 text-accent",
              variant === "cinematic-glass" && "bg-sky-400/20 backdrop-blur-md border border-sky-400/40 text-sky-300",
              variant === "editorial-studio" && "bg-white text-black border border-white font-extrabold"
            )}>
              <Fire size={13} weight="fill" /> #0{currentIndex + 1} Sorotan
            </span>
          </div>
        </div>

        {/* Bottom Details + Desktop Cover Preview */}
        <div className="w-full flex items-end justify-between gap-6 relative z-20 pointer-events-auto">
          <div className="w-full max-w-lg flex flex-col gap-2.5 sm:gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentManga.id + "-text"}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: shouldReduce ? 0 : motionDuration.normal, ease: motionEase.softOut as [number, number, number, number] }}
                className="flex flex-col gap-2"
              >
                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/90">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/20 uppercase tracking-wider text-accent font-extrabold">
                    {format}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/20">
                    {status}
                  </span>
                  {score && score > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 font-bold">
                      <Star size={12} weight="fill" className="text-amber-400" />
                      {Number(score).toFixed(1)}
                    </span>
                  )}
                  <span className="text-white/60 text-xs hidden xs:inline">•</span>
                  <span className="text-white/80 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                    {latestChapter}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-lg line-clamp-2">
                  {currentManga.title}
                </h2>

                {/* Synopsis */}
                {isDetailLoading ? (
                  <div className="flex flex-col gap-1.5 w-full max-w-sm py-1">
                    <div className="h-3.5 w-full bg-white/10 rounded-full animate-pulse" />
                    <div className="h-3.5 w-4/5 bg-white/10 rounded-full animate-pulse" />
                  </div>
                ) : (
                  <p className="text-white/75 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-md font-medium drop-shadow-sm">
                    {synopsis}
                  </p>
                )}

                {/* CTA Button */}
                <div className="mt-2 sm:mt-3 flex items-center gap-3">
                  <Link
                    href={getMangaDetailHref(actualSourceId, currentManga.id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-full font-extrabold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0 pointer-events-auto",
                      variant === "cyber-editorial" && "bg-white text-black hover:bg-accent hover:text-white",
                      variant === "cinematic-glass" && "bg-sky-400 text-slate-950 hover:bg-white shadow-[0_0_15px_rgba(56,189,248,0.5)]",
                      variant === "editorial-studio" && "bg-white text-black border-2 border-white uppercase tracking-wider"
                    )}
                    draggable={false}
                  >
                    <Play weight="fill" size={18} />
                    Baca
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop Cover Artwork Card Stage */}
          <div className="hidden lg:block shrink-0 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentManga.id + "-poster"}
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                transition={{ duration: shouldReduce ? 0 : motionDuration.normal, ease: motionEase.softOut as [number, number, number, number] }}
                className={cn(
                  "w-[150px] xl:w-[170px] aspect-[2/3] overflow-hidden shadow-2xl border-2 bg-surface-muted transform hover:rotate-1 transition-transform",
                  variant === "cyber-editorial" && "rounded-2xl border-white/20",
                  variant === "cinematic-glass" && "rounded-3xl border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
                  variant === "editorial-studio" && "rounded-xl border-white"
                )}
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
      </div>

      {/* Carousel Navigation Controls */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-30 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={handlePrev}
          aria-label="Previous manga"
          className="w-9 h-9 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-90"
        >
          <CaretLeft weight="bold" size={18} />
        </button>

        <div className="flex gap-1.5 mx-1 max-w-[120px] overflow-hidden justify-center items-center">
          {mangas.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === currentIndex ? "w-5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "w-1.5 bg-white/30 hover:bg-white/60"
              )}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          aria-label="Next manga"
          className="w-9 h-9 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-90"
        >
          <CaretRight weight="bold" size={18} />
        </button>
      </div>
    </div>
  );
}
