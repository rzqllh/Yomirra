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

export interface ContinueReadingCardProps {
  item: HistoryItem;
}

export function ContinueReadingCard({ item }: ContinueReadingCardProps) {
  const router = useRouter();
  const removeMangaHistory = useHistoryStore((state) => state.removeMangaHistory);
  const rawProgress = item.seriesProgressPercent ?? item.progressPercent ?? 0;
  const progress = Math.min(100, Math.max(0, Math.round(rawProgress)));
  const readerHref = getReaderHref(item.sourceId, item.mangaId, item.chapterId);
  const detailHref = getMangaDetailHref(item.sourceId, item.mangaId, "/");
  const chapterLabel = item.chapterTitle || `Ch. ${item.chapterId}`;

  const handleDeleteHistory = (event: React.MouseEvent) => {
    event.stopPropagation();
    removeMangaHistory(item.sourceId, item.mangaId);
    toast.success(`"${item.mangaTitle}" dihapus dari riwayat.`);
  };

  return (
    <article
      className={cn(
        mangaCardSurface({ kind: "enclosed" }),
        "group relative shrink-0 snap-start w-[84vw] max-w-[320px] sm:w-auto sm:max-w-none sm:shadow-sm overflow-hidden select-none"
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
          <ContinueReadingCard
            key={`${item.sourceId}-${item.mangaId}-${item.chapterId}`}
            item={item}
          />
        ))}
      </div>
    </section>
  );
}
