"use client";

import * as React from "react";
import { MangaCard } from "./manga-card";
import type { HistoryItem } from "@/shared/store/history-store";

export interface HistoryCardProps {
  item: HistoryItem;
  className?: string;
  onDeleteOverride?: (sourceId: string, mangaId: string, title: string) => void;
}

export function HistoryCard({ item, className, onDeleteOverride }: HistoryCardProps) {
  const calculatedSeriesProgress =
    item.seriesProgressPercent ??
    (item.totalChapters && item.totalChapters > 0
      ? Math.min(
          100,
          Math.max(
            1,
            Math.round(
              ((item.chapterIndex ?? item.chapterNumber ?? 0) /
                item.totalChapters) *
                100
            )
          )
        )
      : undefined);

  return (
    <MangaCard
      variant="progress"
      sourceId={item.sourceId}
      manga={{
        id: item.mangaId,
        title: item.mangaTitle,
        coverUrl: item.coverUrl || "",
      }}
      historyItem={item}
      progressPercent={calculatedSeriesProgress ?? item.progressPercent ?? 0}
      chapterTitle={item.chapterTitle || `Ch. ${item.chapterId}`}
      chapterId={item.chapterId}
      className={className}
      onDeleteOverride={onDeleteOverride}
    />
  );
}
