"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Compass, Trash, Play } from "@phosphor-icons/react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { MangaCover } from "@/components/manga/manga-cover";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { getLibraryHref, getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import { useBookmarkReading } from "@/shared/hooks/use-bookmark-reading";
import { HistoryCard } from "@/components/manga/card";
import { getRelativeTime } from "@/components/bookmark/reading-tab";
import { cn } from "@/shared/utils/cn";
import { motion, AnimatePresence } from "motion/react";

export function RiwayatTab() {
  const { groupedHistory, pendingDeletions, handleRemoveHistory } = useBookmarkReading();

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
        title="Belum ada bacaan aktif"
        description="Komik yang kamu baca akan muncul di sini."
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

  // Continue Reading (top item)
  const continueReading = visibleHistory[0];
  const continueItem = continueReading.chapters[0];
  const continueProgress = continueItem.progressPercent || 0;
  const continueReaderHref = getReaderHref(
    continueReading.sourceId,
    continueReading.mangaId,
    continueItem.chapterId,
    "/library?tab=riwayat"
  );
  
  const continueDetailHref = getMangaDetailHref(
    continueReading.sourceId,
    continueReading.mangaId,
    "/library?tab=riwayat"
  );

  return (
    <div className="space-y-6 pt-4 pb-12">
      {/* Lanjutkan Membaca Section */}
      <section className="px-4">
        <h2 className="text-sm font-bold text-text-primary tracking-tight mb-3">Lanjutkan Membaca</h2>
        <div className="relative group overflow-hidden rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
          <div className="flex p-3 gap-4">
            <Link href={continueDetailHref} className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden shadow-md">
              <MangaCover src={continueReading.coverUrl} alt={continueReading.mangaTitle} />
            </Link>
            <div className="flex flex-col flex-1 min-w-0 py-1">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider truncate mb-1">
                {continueReading.sourceName || continueReading.sourceId}
              </span>
              <h3 className="text-sm font-bold text-text-primary line-clamp-2 leading-tight mb-2">
                {continueReading.mangaTitle}
              </h3>
              <div className="mt-auto">
                <span className="text-xs text-text-muted truncate block mb-2">
                  Chapter {continueItem.chapterTitle || continueItem.chapterId}
                </span>
                <ReadingProgress value={continueProgress} className="h-1.5" />
              </div>
            </div>
            <div className="flex flex-col justify-center pr-2">
              <Link
                href={continueReaderHref}
                className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                aria-label="Lanjutkan Membaca"
              >
                <Play weight="fill" size={24} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Riwayat Lengkap Section */}
      <section className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary tracking-tight">Riwayat Lengkap</h2>
          <span className="text-xs font-semibold text-text-muted">{visibleHistory.length - 1} komik</span>
        </div>
        
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {visibleHistory.slice(1).map((group) => {
              const item = group.chapters[0];
              const manga = {
                id: group.mangaId,
                title: group.mangaTitle,
                coverUrl: group.coverUrl,
              };

              return (
                <motion.div
                  key={`${group.sourceId}::${group.mangaId}`}
                  layout="position"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative group"
                >
                  <HistoryCard 
                    manga={manga as any} 
                    sourceId={group.sourceId}
                    chapterId={item.chapterId}
                    chapterTitle={item.chapterTitle}
                    progressPercent={item.progressPercent || 0}
                    timestamp={item.readAt}
                  />
                  
                  <button
                    onClick={() => handleRemoveHistory(group.sourceId, group.mangaId, group.mangaTitle)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-surface-glass backdrop-blur-md border border-white/10 flex items-center justify-center text-text-muted hover:text-semantic-error transition-colors md:opacity-0 group-hover:opacity-100 z-10"
                    aria-label="Hapus dari riwayat"
                  >
                    <Trash size={16} weight="duotone" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
