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
  const shouldReduceMotion = typeof useReducedMotion === "function" ? useReducedMotion() : false;
  // Parallax translation: as page scrolls down 0->500px, background glides smoothly down 0->150px
  const rawY = useTransform(scrollY, [-200, 0, 500], [-120, 0, 150], { clamp: true });
  const backdropY = shouldReduceMotion ? 0 : rawY;

  return (
    <div className={cn("flex-1 flex flex-col w-full relative text-text-primary bg-surface-base", className)}>
      <section className="relative w-full overflow-hidden select-none">
        {/* Backdrop Scrim */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Parallax layer with vertical overflow so translation never exposes empty gaps */}
          <motion.div
            style={{ y: backdropY }}
            className="absolute inset-x-0 -top-12 -bottom-24 will-change-transform"
          >
            {backdrop}
          </motion.div>

          {/* Scrim gradients ensuring high contrast against light or dark theme while keeping artwork vibrant */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 via-40% to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-base/35 via-80% to-surface-base pointer-events-none" />
        </div>

        {/* Page Header */}
        {header}

        {/* Hero Content Container */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-20 pb-4 md:pb-6 relative z-10 ">
          {/* Mobile Hero Flow */}
          <div className="flex flex-col gap-4 md:hidden">
            <div className="flex gap-4 relative items-end">
              <div
                className={cn(
                  "relative shrink-0 aspect-[2/3] rounded-[18px] overflow-hidden shadow-heavy ring-1 ring-white/20 bg-surface-raised z-20",
                  mobileCoverClassName
                )}
                style={{ width: "clamp(130px, 36vw, 165px)" }}
              >
                {mobileCover}
              </div>

              <div className="flex flex-col flex-1 overflow-hidden pb-1">
                {mobileMeta}
              </div>
            </div>

            {/* Primary CTA */}
            {mainAction}

            {/* Secondary Actions (2x2 grid mobile, horizontal tablet/desktop) */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-2 w-full [&>button]:w-full [&>button]:justify-center sm:[&>button]:w-auto">
              {actions}
            </div>
          </div>

          {/* Desktop Hero Flow */}
          <div className="hidden md:flex gap-8 items-end">
            <div
              className={cn(
                "relative w-[220px] lg:w-[240px] shrink-0 aspect-[2/3] rounded-[20px] overflow-hidden shadow-heavy ring-1 ring-white/20 bg-surface-raised z-20",
                desktopCoverClassName
              )}
            >
              {desktopCover}
            </div>

            <div className="flex-1 flex flex-col gap-3 pb-1">
              {desktopMeta}

              <div className="flex flex-col gap-0 pt-2 max-w-2xl w-full">
                <div className="w-full">{mainAction}</div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-2 w-full [&>button]:w-full [&>button]:justify-center sm:[&>button]:w-auto">
                  {actions}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body Content */}
      <div className="w-full relative z-10 bg-surface-base">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col gap-6">
          {/* Synopsis Section */}
          <div className="rounded-2xl border border-border-default/80 bg-surface-raised p-4 md:p-5 shadow-xs">
            {synopsis}
          </div>

          {/* Chapters Section */}
          <div className="flex flex-col">
            {chapters}
          </div>

          {/* Recommendations Section */}
          {recommendations && (
            <div className="pb-1">
              {recommendations}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
