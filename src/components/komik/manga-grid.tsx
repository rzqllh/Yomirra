"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface MangaGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  viewMode?: "grid" | "compact";
}

/**
 * Container-aware listing density derived from the existing supported-width matrix:
 * shelf cards stay at roughly 156–193px, while compact rows keep enough room
 * for cover, metadata, and the 44px bookmark target.
 */
export const MANGA_GRID_CLASS =
  "grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,156px),1fr))] gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 md:gap-x-5 md:gap-y-7 xl:gap-y-8";

export const MANGA_COMPACT_GRID_CLASS =
  "grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-2.5 sm:gap-3 lg:gap-3.5";

export const MangaGrid = React.forwardRef<HTMLDivElement, MangaGridProps>(
  ({ children, className, viewMode = "grid", ...props }, ref) => {
    const baseClass = viewMode === "compact" ? MANGA_COMPACT_GRID_CLASS : MANGA_GRID_CLASS;

    return (
      <div
        ref={ref}
        className={cn(baseClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MangaGrid.displayName = "MangaGrid";
