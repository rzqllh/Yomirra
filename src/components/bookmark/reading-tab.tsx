"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Compass, Trash, Play } from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { HistoryCard } from "@/components/manga/card/history-card";
import { getLibraryHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";

export function getRelativeTime(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 60) return `${diffInMins} mnt lalu`;
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  if (diffInDays < 30) return `${diffInDays} hr lalu`;
  return date.toLocaleDateString("id-ID");
}

export interface ReadingTabProps {
  groupedHistory: Array<{
    sourceId: string;
    mangaId: string;
    mangaTitle: string;
    coverUrl?: string;
    sourceName?: string;
    latestReadAt: number;
    chapters: Array<any>;
  }>;
  pendingDeletions: Set<string>;
  onRemoveHistory: (sourceId: string, mangaId: string, mangaTitle: string) => void;
}

export function ReadingTab({
  groupedHistory,
  pendingDeletions,
  onRemoveHistory,
}: ReadingTabProps) {
  const visibleHistory = React.useMemo(
    () =>
      groupedHistory.filter(
        (g) => !pendingDeletions.has(`${g.sourceId}::${g.mangaId}`)
      ),
    [groupedHistory, pendingDeletions]
  );

  if (visibleHistory.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={48} className="text-text-muted" weight="duotone" />}
        title="Belum ada yang dilanjut"
        description="Komik yang sedang kamu baca otomatis muncul di sini."
        action={
          <Button asChild variant="accent" className="rounded-xl shadow-sm font-bold mt-4">
            <Link href={getLibraryHref()}>
              <Compass size={20} weight="bold" className="mr-1.5" />
              Eksplor Manga
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div
      role="tabpanel"
      id="tabpanel-reading"
      aria-labelledby="tab-reading"
      className="space-y-4"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          {visibleHistory.length} Bacaan Aktif
        </span>
        <span className="text-2xs text-text-muted/60">Terakhir dibaca</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleHistory.map((group) => {
          const item = group.chapters[0];
          return (
            <HistoryCard
              key={`${group.sourceId}::${group.mangaId}`}
              item={item}
              className="bg-surface-raised/20 hover:bg-surface-raised/50 shadow-none w-full max-w-none snap-none"
              onDeleteOverride={(sourceId, mangaId, title) => onRemoveHistory(sourceId, mangaId, title)}
            />
          );
        })}
      </div>
    </div>
  );
}
