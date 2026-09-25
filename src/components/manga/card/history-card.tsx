"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, DotsThreeVertical, BookOpen, Trash } from "@phosphor-icons/react";
import { useHistoryStore, type HistoryItem } from "@/shared/store/history-store";
import { getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import { MangaCover } from "../manga-cover";
import { ReadingProgress } from "@/components/ui/reading-progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "./primitives";

export interface HistoryCardProps {
  item: HistoryItem;
  className?: string;
  onDeleteOverride?: (sourceId: string, mangaId: string, title: string) => void;
}

export function HistoryCard({ item, className, onDeleteOverride }: HistoryCardProps) {
  const router = useRouter();
  const removeMangaHistory = useHistoryStore((state) => state.removeMangaHistory);
  const rawProgress = item.seriesProgressPercent ?? item.progressPercent ?? 0;
  const progress = Math.min(100, Math.max(0, Math.round(rawProgress)));
  const readerHref = getReaderHref(item.sourceId, item.mangaId, item.chapterId);
  const detailHref = getMangaDetailHref(item.sourceId, item.mangaId, "/");
  const chapterLabel = item.chapterTitle || `Ch. ${item.chapterId}`;

  const handleDeleteHistory = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDeleteOverride) {
      onDeleteOverride(item.sourceId, item.mangaId, item.mangaTitle);
    } else {
      removeMangaHistory(item.sourceId, item.mangaId);
      toast.success(`"${item.mangaTitle}" dihapus dari riwayat.`);
    }
  };

  return (
    <article
      className={cn(
        mangaCardSurface({ kind: "enclosed" }),
        "group relative overflow-hidden select-none",
        className
      )}
    >
      <Link
        href={readerHref}
        prefetch={false}
        className={cn(
          "flex min-h-full gap-3.5 p-3 pr-13 sm:p-3.5 sm:pr-14 rounded-md focus-visible:ring-inset",
          mangaCardInteraction.link
        )}
        aria-label={`Lanjut baca ${item.mangaTitle}, ${chapterLabel}`}
      >
        <MangaCardCoverFrame className="w-18 sm:w-20">
          <MangaCover
            src={item.coverUrl}
            alt={item.mangaTitle}
            fallbackTitle={item.mangaTitle}
            className="w-full h-full"
            imageClassName={cn("w-full h-full object-cover", mangaCardInteraction.coverImage)}
          />
        </MangaCardCoverFrame>

        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-muted text-text-muted border border-border-subtle">
                {item.sourceId}
              </span>
              <span className="text-[10.5px] font-mono font-bold text-accent px-1.5 py-0.5 rounded bg-accent/10">
                {progress}%
              </span>
            </div>

            <MangaCardTitle
              density="compact"
              lines={2}
              className={mangaCardInteraction.title}
            >
              {item.mangaTitle}
            </MangaCardTitle>
          </div>

          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-text-muted mb-1.5">
              <MangaCardMeta className="truncate mr-2 text-[11px] text-text-muted">
                {chapterLabel}
              </MangaCardMeta>
              <span className="shrink-0 flex items-center gap-1 text-accent font-semibold text-[11px]">
                <Play size={9} weight="fill" /> Lanjut
              </span>
            </div>
            <ReadingProgress value={progress} size="sm" showLabel={false} />
          </div>
        </div>
      </Link>

      <div className="absolute right-1.5 top-1.5 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Opsi untuk ${item.mangaTitle}`}
              className="flex size-11 items-center justify-center rounded-sm text-text-muted hover:text-text-primary hover:bg-surface-hover motion-safe:transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
            >
              <DotsThreeVertical size={16} weight="bold" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-50">
            <DropdownMenuItem
              onClick={() => router.push(readerHref)}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Play size={14} weight="fill" className="text-accent" />
              <span>Lanjutkan membaca</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(detailHref)}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <BookOpen size={14} />
              <span>Buka detail komik</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDeleteHistory}
              className="flex items-center gap-2 cursor-pointer text-xs text-semantic-error focus:bg-semantic-error/10 focus:text-semantic-error"
            >
              <Trash size={14} />
              <span>Hapus dari riwayat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
