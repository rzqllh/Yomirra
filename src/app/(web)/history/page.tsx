"use client";

import { MobilePageShell } from "@/components/app/mobile-page-shell";
import { useHistoryStore } from "@/shared/store/history-store";
import { getReaderHref, getMangaDetailHref } from "@/shared/lib/routes";
import { Clock, Play } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Trash } from "@phosphor-icons/react";

export default function HistoryPage() {
  const getHistoryList = useHistoryStore((state) => state.getHistoryList);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const removeHistoryItem = useHistoryStore((state) => state.removeHistoryItem);
  
  const historyItems = getHistoryList();

  return (
    <MobilePageShell 
      title="Riwayat"
      action={
        historyItems.length > 0 && (
          <Button 
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm("Hapus semua riwayat baca?")) {
                clearHistory();
              }
            }}
          >
            Hapus semua
          </Button>
        )
      }
    >
      {historyItems.length === 0 ? (
        <EmptyState
          icon={<Clock size={48} className="text-text-muted" weight="duotone" />}
          title="Belum ada riwayat baca"
          description="Buka chapter untuk mulai membaca. Progres bacaanmu akan muncul di sini."
          action={
            <Button asChild variant="default" className="rounded-full">
              <Link href="/">
                <Play size={20} weight="fill" />
                Mulai Membaca
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3 p-4 max-w-3xl mx-auto w-full">
          {historyItems.map((item) => (
            <div key={`${item.sourceId}::${item.mangaId}::${item.chapterId}`} className="group relative flex items-center gap-4 rounded-[var(--radius-xl)] bg-surface-raised p-3 border border-border-subtle transition-colors hover:bg-surface-overlay overflow-hidden">
              <Link href={getMangaDetailHref(item.sourceId, item.mangaId)} className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-surface-overlay">
                {item.coverUrl ? (
                  <Image src={item.coverUrl} alt={item.mangaTitle} fill className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-surface-overlay" />
                )}
              </Link>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <Link href={getMangaDetailHref(item.sourceId, item.mangaId)}>
                  <h3 className="truncate font-bold text-text-primary text-[15px] hover:text-accent transition-colors">
                    {item.mangaTitle}
                  </h3>
                </Link>
                <Link href={getReaderHref(item.sourceId, item.mangaId, item.chapterId)}>
                  <p className="truncate text-sm font-medium text-text-muted hover:text-accent transition-colors">
                    {item.chapterTitle || "Chapter"}
                  </p>
                </Link>
                <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-text-muted">
                  <span className="uppercase tracking-wider">{item.sourceName || item.sourceId}</span>
                  <span>•</span>
                  <span>{new Date(item.readAt).toLocaleDateString()}</span>
                  {item.progressPercent !== undefined && item.progressPercent > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-accent">{item.progressPercent}%</span>
                    </>
                  )}
                </div>
              </div>
              <IconButton
                aria-label={`Hapus ${item.mangaTitle} dari riwayat`}
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all hover:text-error hover:bg-error/10"
                onClick={(e) => {
                  e.preventDefault();
                  removeHistoryItem(item.sourceId, item.mangaId, item.chapterId);
                }}
              >
                <Trash size={16} weight="bold" />
              </IconButton>
            </div>
          ))}
        </div>
      )}
    </MobilePageShell>
  );
}
