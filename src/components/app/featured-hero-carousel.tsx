"use client";

import * as React from "react";
import Link from "next/link";
import { MangaItem } from "@/shared/sources/source-types";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Play, CaretLeft, CaretRight } from "@phosphor-icons/react";
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

  // Touch swipe state
  const touchStartX = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

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

  // Compact metadata string: MANHWA • ONGOING • ★ 7.0 • Chapter 47
  const metaParts: string[] = [format.toUpperCase()];
  if (status) metaParts.push(status.toUpperCase());
  if (score && score > 0) metaParts.push(`★ ${Number(score).toFixed(1)}`);
  if (latestChapter) metaParts.push(latestChapter);

  return (
    <div
      className="w-full h-full relative group isolate overflow-hidden bg-black rounded-2xl md:rounded-3xl border border-white/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-bleed artwork layer */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentManga.id + "-bg"}
          src={currentManga.coverUrl || ""}
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduce ? 0 : motionDuration.slow, ease: motionEase.softOut as [number, number, number, number] }}
          className="absolute inset-0 w-full h-full object-cover object-top"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>

      {/* Gradient overlays — bottom-heavy, artwork visible on top */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      {/* Foreground UI */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pb-5 sm:p-6 sm:pb-6 md:p-8 pointer-events-none">

        {/* Top row: badge left, pager right */}
        <div className="flex items-start justify-between w-full pointer-events-auto">
          {/* Sorotan badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/20 backdrop-blur-md border border-accent/30 text-accent font-black text-[10px] uppercase tracking-widest">
            #{String(currentIndex + 1).padStart(2, "0")} Sorotan
          </span>

          {/* Pager — replaces dot bar + arrows on mobile */}
          {mangas.length > 1 && (
            <span className="text-[11px] font-bold text-white/60 tabular-nums">
              {currentIndex + 1} / {mangas.length}
            </span>
          )}
        </div>

        {/* Bottom content */}
        <div className="flex items-end justify-between gap-4 pointer-events-auto">
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentManga.id + "-text"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: shouldReduce ? 0 : motionDuration.normal, ease: motionEase.softOut as [number, number, number, number] }}
                className="flex flex-col gap-1.5"
              >
                {/* Flat metadata row — no pills */}
                <p className="text-[11px] font-semibold text-white/55 tracking-wide truncate">
                  {metaParts.join(" · ")}
                </p>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-[1.15] tracking-tight line-clamp-2 drop-shadow-md">
                  {currentManga.title}
                </h2>

                {/* Description */}
                {isDetailLoading ? (
                  <div className="flex flex-col gap-1 py-0.5 max-w-xs">
                    <div className="h-3 w-full bg-white/10 rounded-full animate-pulse" />
                    <div className="h-3 w-3/4 bg-white/10 rounded-full animate-pulse" />
                  </div>
                ) : (
                  <p className="text-white/60 text-xs sm:text-sm line-clamp-2 leading-relaxed max-w-sm">
                    {synopsis}
                  </p>
                )}

                {/* CTA */}
                <div className="mt-1 sm:mt-2">
                  <Link
                    href={getMangaDetailHref(actualSourceId, currentManga.id)}
                    className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-white text-black font-extrabold text-sm shadow-lg hover:bg-accent hover:text-white active:scale-95 transition-all shrink-0"
                    draggable={false}
                    aria-label="Baca"
                  >
                    <Play weight="fill" size={16} />
                    Baca
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop cover poster */}
          <div className="hidden lg:block shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentManga.id + "-poster"}
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                transition={{ duration: shouldReduce ? 0 : motionDuration.normal, ease: motionEase.softOut as [number, number, number, number] }}
                className="w-[150px] xl:w-[170px] aspect-[2/3] overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl bg-surface-muted"
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

      {/* Desktop-only prev/next arrows — hidden on mobile */}
      {mangas.length > 1 && (
        <div className="hidden sm:flex absolute bottom-6 right-6 md:bottom-8 md:right-8 z-30 items-center gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handlePrev}
            aria-label="Previous manga"
            className="w-10 h-10 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
          >
            <CaretLeft weight="bold" size={16} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next manga"
            className="w-10 h-10 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
          >
            <CaretRight weight="bold" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
