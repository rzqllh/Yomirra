"use client";

import * as React from "react";
import Link from "next/link";
import { BookBookmark, Compass, Clock, Play } from "@phosphor-icons/react";
import { HistoryItem } from "@/shared/store/history-store";
import { getReaderHref } from "@/shared/lib/routes";

interface ContinueReadingListProps {
  items: HistoryItem[];
  variant?: string; // kept for API compat, only cyber-editorial visuals
}

export function ContinueReadingList({ items }: ContinueReadingListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="w-full relative overflow-hidden p-6 md:p-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 rounded-2xl md:rounded-3xl bg-surface-glass backdrop-blur-xl border border-border-subtle/70 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 text-center sm:text-left text-text-muted">
          <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
            <BookBookmark size={24} weight="duotone" />
          </div>
          <div>
            <p className="font-bold text-text-primary md:text-lg">Belum ada riwayat baca</p>
            <p className="text-sm text-text-muted">Mulai baca komik untuk melanjutkan progresmu di sini.</p>
          </div>
        </div>
        <Link
          href="/"
          className="bg-accent text-accent-on px-6 py-2.5 md:py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
        >
          <Compass weight="bold" /> Eksplor Manga
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Lanjut Baca
        </h2>
        <span className="text-xs text-text-muted font-medium">{items.length} judul</span>
      </div>

      <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scrollbar-hide w-full">
        {items.map((group) => {
          const progress = group.seriesProgressPercent || group.progressPercent || 0;
          const targetHref = getReaderHref(group.sourceId, group.mangaId, group.chapterId);

          return (
            <div
              key={`${group.mangaId}-${group.chapterId}`}
              className="group relative shrink-0 snap-start w-[80vw] max-w-[320px] sm:w-[350px] md:w-[370px] p-3 md:p-3.5 flex gap-3.5 bg-surface-glass backdrop-blur-xl border border-border-subtle/80 hover:border-accent/40 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <Link
                href={targetHref}
                className="absolute inset-0 z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Lanjut baca ${group.mangaTitle}`}
              />

              <div className="relative w-20 sm:w-24 aspect-[3/4] shrink-0 rounded md:rounded-lg overflow-hidden bg-surface-muted shadow-sm border border-border-subtle/50">
                {group.coverUrl ? (
                  <img
                    src={group.coverUrl}
                    alt={group.mangaTitle}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-muted flex items-center justify-center">
                    <BookBookmark size={28} className="text-text-muted/50" />
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0 py-0.5">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-accent text-[10px] sm:text-xs font-bold tracking-wider uppercase flex items-center gap-1">
                    <Clock weight="fill" size={12} /> Progres Baca
                  </span>
                  <span className="text-[10px] font-bold text-text-muted bg-surface-muted/80 px-2 py-0.5 rounded-full border border-border-subtle/40">
                    {Math.round(progress)}%
                  </span>
                </div>

                <h4 className="font-bold text-sm sm:text-base text-text-primary line-clamp-2 leading-tight group-hover:text-accent transition-colors mb-auto">
                  {group.mangaTitle}
                </h4>

                <div className="mt-2.5">
                  <div className="flex justify-between items-center text-[11px] sm:text-xs font-medium mb-1.5">
                    <span className="truncate mr-2 text-text-muted">
                      {group.chapterTitle || `Ch. ${group.chapterId}`}
                    </span>
                    <div className="shrink-0 flex items-center gap-1 text-accent font-bold text-[11px]">
                      <Play weight="fill" size={10} /> Lanjut
                    </div>
                  </div>
                  <div className="w-full bg-surface-muted/80 h-1.5 rounded-full overflow-hidden border border-border-subtle/30">
                    <div
                      className="bg-accent h-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(94,92,230,0.5)]"
                      style={{ width: `${Math.max(5, progress)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
