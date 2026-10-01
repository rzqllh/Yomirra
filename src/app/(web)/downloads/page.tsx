"use client";

import { useDownloadStore } from "@/shared/store/download-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Database, Pause, Play, Trash, X, ArrowClockwise, Download, BookOpen } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";
import Link from "next/link";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";
import { toast } from "sonner";
import { EmptyState } from "@/components/states/empty-state";
import { StorageWarningBanner } from "@/components/download/storage-warning-banner";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
} from "@/components/manga/card";
import { MangaCover } from "@/components/manga/manga-cover";

import { PageHeader } from "@/components/app/header";

export default function DownloadsPage() {
  const {
    downloads,
    removeDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    clearDownloads,
  } = useDownloadStore();

  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        setStorageInfo({
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        });
      });
    }
  }, [downloads]);

  const allDownloads = Object.values(downloads);
  const queuedItems = allDownloads.filter((d) =>
    ["queued", "downloading", "paused", "failed"].includes(d.status)
  );
  const completedItems = allDownloads.filter((d) => d.status === "downloaded");

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        {/* Page Title & Subtitle */}
        <PageHeader
          title="Unduhan"
          subtitle="Kelola chapter yang tersimpan untuk dibaca offline."
          icon={<Download size={24} weight="duotone" />}
          desktopActions={
            allDownloads.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Yakin ingin menghapus semua unduhan?")) {
                    clearDownloads();
                    toast.info("Semua unduhan dihapus", {
                      description: "Seluruh chapter offline di perangkat telah dihapus.",
                    });
                  }
                }}
                className="inline-flex min-h-10 items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-bold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 active:scale-95 transition-all shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
              >
                <Trash size={16} />
                <span>Hapus Semua</span>
              </button>
            ) : undefined
          }
          actions={
            allDownloads.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Yakin ingin menghapus semua unduhan?")) {
                    clearDownloads();
                    toast.info("Semua unduhan dihapus", {
                      description: "Seluruh chapter offline di perangkat telah dihapus.",
                    });
                  }
                }}
                className="inline-flex min-h-10 items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-bold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 active:scale-95 transition-all shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
              >
                <Trash size={16} />
                <span>Hapus Semua</span>
              </button>
            ) : undefined
          }
        />

        <StorageWarningBanner />

        {/* Device Storage Status */}
        {storageInfo && (
          <div className="rounded-2xl p-4 sm:p-5 flex items-center gap-4 bg-surface-raised border border-border-default/80 shadow-xs">
            <div className="size-12 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent shrink-0 shadow-xs">
              <Database size={24} weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Penyimpanan Perangkat</p>
                <span className="text-[11px] font-bold text-accent">
                  {((storageInfo.usage / (storageInfo.quota || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-text-secondary">{formatBytes(storageInfo.usage)} terpakai</span>
                <span className="text-text-muted">{formatBytes(storageInfo.quota)} total</span>
              </div>
              <div className="w-full bg-surface-base border border-border-subtle/80 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-accent h-full rounded-full motion-safe:transition-all motion-safe:duration-500 shadow-xs"
                  style={{ width: `${Math.min(100, Math.max(1, (storageInfo.usage / (storageInfo.quota || 1)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Downloads Tabs / Task Lists */}
        {allDownloads.length === 0 ? (
          <div className="py-16 text-center">
            <EmptyState
              icon={<Download size={44} className="text-text-muted" weight="duotone" />}
              title="Belum ada unduhan"
              description="Komik yang kamu unduh akan muncul di sini."
            />
          </div>
        ) : (
          <Tabs defaultValue={queuedItems.length > 0 ? "queue" : "completed"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 sm:max-w-xs rounded-xl p-1 bg-surface-raised/80 border border-border-subtle shadow-xs">
              <TabsTrigger value="queue" className="rounded-lg text-xs font-bold data-[state=active]:bg-surface-base data-[state=active]:text-text-primary data-[state=active]:shadow-xs transition-all">
                Antrean ({queuedItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg text-xs font-bold data-[state=active]:bg-surface-base data-[state=active]:text-text-primary data-[state=active]:shadow-xs transition-all">
                Selesai ({completedItems.length})
              </TabsTrigger>
            </TabsList>

            {/* QUEUED & ACTIVE DOWNLOADS */}
            <TabsContent value="queue" className="space-y-3">
              {queuedItems.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    icon={<Download size={40} className="text-text-muted" weight="duotone" />}
                    title="Tidak ada unduhan aktif"
                  />
                </div>
              ) : (
                queuedItems.map((item) => {
                  const clampedProgress = Math.max(0, Math.min(100, item.progress || 0));

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl p-3.5 sm:p-4 flex gap-3.5 sm:gap-4 bg-surface-raised border border-border-subtle/80 shadow-xs hover:border-accent/40 motion-safe:transition-colors"
                    >
                      <MangaCardCoverFrame className="w-14 sm:w-16 rounded-xl">
                        <MangaCover
                          src={item.coverUrl}
                          alt={item.mangaTitle}
                          fallbackTitle={item.mangaTitle}
                          className="h-full w-full"
                        />
                      </MangaCardCoverFrame>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <MangaCardTitle density="compact">{item.mangaTitle}</MangaCardTitle>
                          <MangaCardMeta as="p" className="truncate mt-0.5">{item.chapterTitle}</MangaCardMeta>
                        </div>

                        <div className="mt-2.5">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[11px] font-medium text-text-muted capitalize">
                              {item.status === "downloading"
                                ? "Mengunduh…"
                                : item.status === "paused"
                                ? "Dijeda"
                                : item.status === "failed"
                                ? "Gagal"
                                : "Dalam antrean"}
                            </span>
                            <span className="text-xs font-bold text-accent">{clampedProgress}%</span>
                          </div>
                          <div className="w-full bg-surface-base border border-border-subtle/60 rounded-full h-2 overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-300 shadow-xs ${
                                item.status === "failed"
                                  ? "bg-semantic-error"
                                  : item.status === "paused"
                                  ? "bg-text-muted"
                                  : "bg-accent"
                              }`}
                              style={{ width: `${clampedProgress}%` }}
                            />
                          </div>
                          {item.error && (
                            <p className="text-[11px] text-semantic-error mt-1 truncate">{item.error}</p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col justify-around shrink-0 border-l border-border-subtle/60 pl-2 sm:pl-3">
                        {item.status === "downloading" || item.status === "queued" ? (
                          <IconButton
                            onClick={() => {
                              pauseDownload(item.id);
                              toast.info("Unduhan dijeda", {
                                description: `${item.chapterTitle} dijeda sementara.`,
                              });
                            }}
                            aria-label={`Jeda unduhan ${item.mangaTitle} - ${item.chapterTitle}`}
                            className="text-text-secondary hover:text-text-primary rounded-lg active:scale-95 transition-all"
                          >
                            <Pause size={17} weight="bold" />
                          </IconButton>
                        ) : item.status === "paused" ? (
                          <IconButton
                            onClick={() => {
                              resumeDownload(item.id);
                              toast.info("Unduhan dilanjutkan", {
                                description: `Mengunduh kembali ${item.chapterTitle}...`,
                              });
                            }}
                            aria-label={`Lanjutkan unduhan ${item.mangaTitle} - ${item.chapterTitle}`}
                            className="text-accent hover:text-accent-hover rounded-lg active:scale-95 transition-all"
                          >
                            <Play size={17} weight="fill" />
                          </IconButton>
                        ) : item.status === "failed" ? (
                          <IconButton
                            onClick={() => {
                              retryDownload(item.id);
                              toast.info("Mencoba lagi…", {
                                description: `Menghubungkan kembali untuk ${item.chapterTitle}...`,
                              });
                            }}
                            aria-label={`Coba lagi unduhan ${item.mangaTitle} - ${item.chapterTitle}`}
                            className="text-accent hover:text-accent-hover rounded-lg active:scale-95 transition-all"
                          >
                            <ArrowClockwise size={17} weight="bold" />
                          </IconButton>
                        ) : null}

                        <IconButton
                          onClick={() => {
                            cancelDownload(item.id);
                            toast.info("Unduhan dibatalkan", {
                              description: `${item.chapterTitle} dibatalkan dari antrean.`,
                            });
                          }}
                          aria-label={`Batalkan unduhan ${item.mangaTitle} - ${item.chapterTitle}`}
                          className="text-semantic-error hover:text-semantic-error/80 rounded-lg active:scale-95 transition-all"
                        >
                          <X size={17} weight="bold" />
                        </IconButton>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* COMPLETED DOWNLOADS */}
            <TabsContent value="completed" className="space-y-3">
              {completedItems.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    icon={<BookOpen size={40} className="text-text-muted" weight="duotone" />}
                    title="Belum ada chapter offline"
                  />
                </div>
              ) : (
                completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-1 rounded-2xl bg-surface-raised border border-border-subtle/80 p-2 sm:p-2.5 shadow-xs hover:border-accent/40 motion-safe:transition-colors"
                  >
                    <Link
                      href={`/manga/${item.sourceId}/${item.mangaId}/read/${item.chapterId}`}
                      className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:gap-4"
                      aria-label={`Baca ${item.mangaTitle} - ${item.chapterTitle}`}
                    >
                      <MangaCardCoverFrame className="w-12 sm:w-14 rounded-xl">
                        <MangaCover
                          src={item.coverUrl}
                          alt={item.mangaTitle}
                          fallbackTitle={item.mangaTitle}
                          className="h-full w-full"
                          imageClassName={mangaCardInteraction.coverImage}
                        />
                      </MangaCardCoverFrame>
                      <div className="flex-1 min-w-0">
                        <MangaCardTitle density="compact" className={mangaCardInteraction.title}>
                          {item.mangaTitle}
                        </MangaCardTitle>
                        <MangaCardMeta as="p" className="mt-0.5 truncate">
                          {item.chapterTitle}
                        </MangaCardMeta>
                        <MangaCardMeta as="p" className="mt-1 text-[11px] text-text-muted">
                          {item.downloadedPages || 0} Halaman • Selesai
                        </MangaCardMeta>
                      </div>
                    </Link>
                    <IconButton
                      onClick={() => {
                        removeDownload(item.id);
                        toast.info("Unduhan dihapus", {
                          description: `${item.chapterTitle} berhasil dihapus dari perangkat.`,
                        });
                      }}
                      aria-label={`Hapus unduhan ${item.mangaTitle} - ${item.chapterTitle}`}
                      className="shrink-0 rounded-xl text-semantic-error hover:text-semantic-error/80 hover:bg-semantic-error/10 active:scale-95 transition-all"
                    >
                      <Trash size={18} />
                    </IconButton>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </PageContainer>
    </YomirraSurface>
  );
}
