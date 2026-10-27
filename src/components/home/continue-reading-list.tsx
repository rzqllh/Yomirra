"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookBookmark,
  ArrowRight,
} from "@phosphor-icons/react";
import type { HistoryItem } from "@/shared/store/history-store";
import { cn } from "@/shared/utils/cn";

export interface ContinueReadingListProps {
  items: HistoryItem[];
  variant?: string; // Kept for backward compatibility
  className?: string;
}

import { HistoryCard } from "@/components/komik/card/history-card";

/**
 * Editorial Continue Reading shelf with compact cards, clamped progress,
 * and a functional context menu for history management.
 */
export function ContinueReadingList({
  items,
  className,
}: ContinueReadingListProps) {
  if (!items || items.length === 0) {
    // Zero-history users seamlessly enter Discovery without layout-pushing empty cards
    return null;
  }

  return (
    <section aria-labelledby="continue-reading-title" className={cn("w-full flex flex-col gap-3.5", className)}>
      {/* Editorial Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 id="continue-reading-title" className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2 tracking-tight">
          <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
          <span>Lanjut Baca</span>
        </h2>
        <Link
          href="/bookmark"
          className="group inline-flex items-center gap-1 text-xs text-text-muted font-medium hover:text-accent transition-colors"
        >
          <span>{items.length} judul</span>
          <span className="hidden sm:inline">&bull; Lihat rak buku</span>
          <ArrowRight size={12} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Responsive Shelf: Snap Rail on Mobile, 2 Cols on Tablet, 3 Cols on Desktop */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 pt-0.5 snap-x snap-mandatory scrollbar-hide w-full sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:snap-none sm:gap-4">
        {items.slice(0, 6).map((item) => (
          <HistoryCard
            key={`${item.sourceId}-${item.mangaId}-${item.chapterId}`}
            item={item}
            className="shrink-0 snap-start w-[84vw] max-w-[320px] sm:w-auto sm:max-w-none sm:shadow-sm"
          />
        ))}
      </div>
    </section>
  );
}
