"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Compass, Trash, Play } from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { MangaCover } from "@/components/manga/manga-cover";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "@/components/manga/card";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { getLibraryHref, getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
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
          const timeText = getRelativeTime(new Date(item.readAt).toISOString());
          const progress = item.progressPercent || 0;
          const detailHref = getMangaDetailHref(group.sourceId, group.mangaId, "/bookmark");
          const readerHref = getReaderHref(
            group.sourceId,
            group.mangaId,
            item.chapterId,
            "/bookmark"
          );

          return (
            <article
              key={`${group.sourceId}::${group.mangaId}`}
              className={cn(
                mangaCardSurface({ kind: "enclosed" }),
                "group relative flex flex-col bg-surface-raised/20 hover:bg-surface-raised/50 p-3 shadow-none"
              )}
            >
              <div className="flex gap-3 items-start">
                <Link
                  href={detailHref}
                  className={cn("w-[68px] shrink-0 rounded-xs", mangaCardInteraction.link)}
                  aria-label={`Lihat detail ${group.mangaTitle}`}
                >
                  <MangaCardCoverFrame className="w-full shadow-2xs">
                    <MangaCover
                      src={group.coverUrl}
                      alt={group.mangaTitle}
                      fallbackTitle={group.mangaTitle}
                      className="w-full h-full"
                      imageClassName={cn("w-full h-full object-cover", mangaCardInteraction.coverImage)}
                    />
                  </MangaCardCoverFrame>
                </Link>

                <div className="flex-1 flex flex-col min-w-0 py-0.5 justify-between self-stretch">
                  <div className="flex items-start justify-between gap-1.5">
                    <Link
                      href={detailHref}
                      className={cn("min-w-0 flex-1 group/title rounded-xs", mangaCardInteraction.link)}
                    >
                      <MangaCardTitle
                        density="compact"
                        lines={2}
                        className="group-hover/title:text-accent"
                      >
                        {group.mangaTitle}
                      </MangaCardTitle>
                      <MangaCardMeta as="p" className="font-semibold text-accent mt-1 truncate">
                        {item.chapterTitle || "Chapter ?"}
                      </MangaCardMeta>
                      <MangaCardMeta as="p" className="text-[11px] text-text-muted mt-0.5">
                        {timeText || "Baru saja"}
                      </MangaCardMeta>
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        onRemoveHistory(group.sourceId, group.mangaId, group.mangaTitle)
                      }
                      className="flex size-11 items-center justify-center -mr-1.5 -mt-1.5 rounded-sm text-text-muted/60 hover:text-semantic-error hover:bg-semantic-error/10 motion-safe:transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={`Hapus ${group.mangaTitle} dari riwayat`}
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="min-h-11 px-3 rounded-sm text-xs font-bold text-accent border border-accent/20 bg-accent/5 hover:bg-accent/10"
                    >
                      <Link
                        href={readerHref}
                        aria-label={`Lanjutkan baca ${group.mangaTitle}`}
                      >
                        <Play size={11} weight="fill" className="mr-1" />
                        Lanjutkan
                      </Link>
                    </Button>

                    {progress > 0 && (
                      <span className="text-[11px] font-semibold text-text-muted/70">
                        {Math.round(progress)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {progress > 0 && (
                <div className="w-full mt-3">
                  <ReadingProgress value={progress} size="sm" showLabel={false} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
