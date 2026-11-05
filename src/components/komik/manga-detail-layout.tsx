"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { cn } from "@/shared/utils/cn";

export interface MangaDetailLayoutProps {
  // Hero background / scrim
  backdrop?: React.ReactNode;
  header: React.ReactNode;

  // Mobile hero elements
  mobileCover: React.ReactNode;
  mobileCoverClassName?: string;
  mobileMeta: React.ReactNode;

  // Desktop hero elements
  desktopCover: React.ReactNode;
  desktopCoverClassName?: string;
  desktopMeta: React.ReactNode;

  // Shared action slots
  mainAction: React.ReactNode;
  actions: React.ReactNode;

  // Body content
  synopsis: React.ReactNode;
  chapters: React.ReactNode;
  recommendations?: React.ReactNode;

  className?: string;
}

export function MangaDetailLayout({
  backdrop,
  header,
  mobileCover,
  mobileCoverClassName,
  mobileMeta,
  desktopCover,
  desktopCoverClassName,
  desktopMeta,
  mainAction,
  actions,
  synopsis,
  chapters,
  recommendations,
  className,
}: MangaDetailLayoutProps) {
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  // Parallax translation: as page scrolls down 0->500px, background glides smoothly down 0->150px
  const rawY = useTransform(scrollY, [-200, 0, 500], [-120, 0, 150], { clamp: true });
  const backdropY = shouldReduceMotion ? 0 : rawY;

  return (
    <div className={cn("flex-1 flex flex-col w-full relative text-text-primary bg-surface-base", className)}>
      <section className="relative w-full overflow-hidden select-none">
        {/* Backdrop Scrim */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-neutral-950">
          {/* Parallax layer with vertical overflow so translation never exposes empty gaps */}
          <motion.div
            style={{ y: backdropY }}
            className="absolute inset-x-0 -top-12 -bottom-24 will-change-transform"
          >
            {backdrop}
          </motion.div>

          {/* Top vignette — keeps header/back button readable without killing the cover */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/15 via-35% to-transparent pointer-events-none" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/10" />
        </div>

        {/* Page Header */}
        {header}

        {/* Hero Content Container */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-[calc(var(--safe-top,0px)+72px)] md:pt-20 pb-5 md:pb-8 relative z-10">
          {/* Mobile Hero Flow */}
          <div className="flex flex-col gap-4 md:hidden">
            <div className="flex gap-3.5 relative items-end min-[360px]:gap-5">
              <div
                className={cn(
                  "relative shrink-0 aspect-[2/3] rounded-[18px] overflow-hidden shadow-lg border border-white/10 dark:border-white/10 bg-surface-raised z-20",
                  mobileCoverClassName
                )}
                style={{ width: "clamp(126px, 41vw, 180px)" }}
              >
                {mobileCover}
              </div>

              <div className="flex min-w-0 flex-1 flex-col pb-1">
                {mobileMeta}
              </div>
            </div>

            {/* Primary CTA */}
            {mainAction}

            <div role="group" aria-label="Aksi komik" className="grid w-full grid-cols-2 gap-2 [&>button]:min-w-0">
              {actions}
            </div>
          </div>

          {/* Desktop Hero Flow */}
          <div className="hidden items-center gap-8 md:flex lg:gap-10">
            <div
              className={cn(
                "relative w-[220px] lg:w-[240px] shrink-0 aspect-[2/3] rounded-xl overflow-hidden shadow-xl border border-white/10 dark:border-white/10 bg-surface-raised z-20",
                desktopCoverClassName
              )}
            >
              {desktopCover}
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
              {desktopMeta}

              {mainAction}
              <div role="group" aria-label="Aksi komik" className="flex flex-wrap gap-2">
                {actions}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body Content: 2-Column Editorial Grid + Full-Width Recommendations (Anti-Cutoff) */}
      <div className="w-full relative z-10 bg-surface-base">
        <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-[var(--page-bottom-safe)] md:px-8 md:pb-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column on Desktop (4 cols / ~33%): Sticky Synopsis & Metadata */}
            <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20">
              <div className="rounded-xl border border-border-default/80 bg-surface-raised p-4 sm:p-5 shadow-xs">
                {synopsis}
              </div>
            </div>

            {/* Right Column on Desktop (8 cols / ~67%): Chapters List */}
            <div className="lg:col-span-8 flex min-w-0 flex-col rounded-xl border border-border-default/80 bg-surface-raised px-3 pb-3 sm:px-5">
              {chapters}
            </div>
          </div>

          {/* Full-Width Recommendations: generous horizontal breathing room, zero clipping */}
          {recommendations && (
            <div className="w-full pt-4 border-t border-border-subtle/60">
              {recommendations}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
