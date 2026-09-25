"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookBookmark,
  Play,
  DotsThreeVertical,
  BookOpen,
  Trash,
  ArrowRight,
} from "@phosphor-icons/react";
import { useHistoryStore, type HistoryItem } from "@/shared/store/history-store";
import { getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import { MangaCover } from "@/components/manga/manga-cover";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "@/components/manga/card";
import { ReadingProgress } from "@/components/ui/reading-progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";

export interface ContinueReadingListProps {
  items: HistoryItem[];
  variant?: string; // Kept for backward compatibility
  className?: string;
}

import { HistoryCard } from "@/components/manga/card/history-card";

/**
 * Editorial Continue Reading shelf with compact cards, clamped progress,
 * and a functional context menu for history management.
 */
export function ContinueReadingList({
  items,
  className,
}: ContinueReadingListProps) {
  if (!items || items.length === 0) {
    return (
      <div className={cn("w-full flex flex-col gap-3.5", className)}>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
            Lanjut Baca
          </h2>
        </div>
        <div className="ink-panel p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <div className="size-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20 shrink-0">
              <BookBookmark size={22} weight="duotone" />
            </div>
            <div>
              <p className="font-bold text-text-primary text-sm sm:text-base">
                Belum ada bacaan yang sedang kamu lanjutkan
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Mulai baca manga dari katalog dan progresmu akan otomatis tersimpan di sini.
              </p>
            </div>
          </div>
          <Link
            href="/library"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-accent-on hover:bg-accent-hover transition-colors shrink-0"
          >
            <span>Jelajahi komik</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    );
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
          <span className="hidden sm:inline">· Lihat rak buku</span>
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
