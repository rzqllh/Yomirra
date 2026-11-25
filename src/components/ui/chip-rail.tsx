"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface ChipRailProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to bleed horizontally into page gutters on mobile (-mx-4 px-4)
   * while aligning normally on desktop. Default: true.
   */
  bleed?: boolean;
}

/**
 * Standard horizontal chip/pill rail container for filters, sources, and categories.
 * Provides touch pan, edge-to-edge mobile bleed, and smooth scrolling without scrollbar chrome.
 */
export function ChipRail({
  children,
  className,
  bleed = true,
  ...props
}: ChipRailProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto overscroll-x-contain touch-pan-x pb-1",
        bleed && "-mx-4 px-4 md:mx-0 md:px-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
