"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface MangaGridProps {
  children: React.ReactNode;
  className?: string;
}

export const MANGA_GRID_CLASS =
  "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10 lg:grid-cols-5 xl:grid-cols-6";

export function MangaGrid({ children, className }: MangaGridProps) {
  return (
    <div className={cn(MANGA_GRID_CLASS, className)}>
      {children}
    </div>
  );
}
