"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/shared/utils/cn";

export interface MangaGridProps {
  children: React.ReactNode;
  className?: string;
  viewMode?: "grid" | "compact";
}

// Optimized desktop card grid: tighter vertical spacing and consistent columns
export const MANGA_GRID_CLASS =
  "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 md:gap-x-5 md:gap-y-7 lg:grid-cols-5 xl:grid-cols-6 xl:gap-x-5 xl:gap-y-8";

// Responsive compact row grid: 1 col on mobile, 2 cols on tablet/laptop, 3 cols on large desktop
export const MANGA_COMPACT_GRID_CLASS =
  "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-3.5";

export function MangaGrid({ children, className, viewMode = "grid" }: MangaGridProps) {
  const baseClass = viewMode === "compact" ? MANGA_COMPACT_GRID_CLASS : MANGA_GRID_CLASS;

  return (
    <motion.div
      layout
      transition={{ layout: { type: "spring", stiffness: 320, damping: 30 } }}
      className={cn(baseClass, className)}
    >
      {children}
    </motion.div>
  );
}
