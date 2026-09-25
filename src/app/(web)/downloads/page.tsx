"use client";

import { useDownloadStore } from "@/shared/store/download-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { HardDrives, Pause, Play, Trash, X, ArrowClockwise, Download, BookOpen } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";
import Link from "next/link";
import { YomirraSurface } from "@/components/ui/layout";
import { toast } from "sonner";
import { EmptyState } from "@/components/states/empty-state";
import { StorageWarningBanner } from "@/components/download/storage-warning-banner";

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
    <div className="flex flex-col min-h-screen pb-20 md:pb-12 bg-surface-base">
      <div className="px-4 pt-[calc(var(--safe-top,0px)+16px)] md:pt-8 md:px-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="ink-display text-2xl sm:text-3xl font-normal text-text-primary tracking-tight">
              Unduhan
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Kelola bab komik yang diunduh untuk dibaca saat offline.
            </p>
          </div>
          {allDownloads.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Yakin ingin menghapus semua unduhan?")) {
                  clearDownloads();
                  toast.error("Semua unduhan dihapus");
                }
              }}
              className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-sm text-xs font-semibold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 transition-colors"
            >
              <Trash size={16} />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>

        <StorageWarningBanner />

        {/* Device Storage Status */}
        {storageInfo && (
          <YomirraSurface variant="elevated" className="rounded-md p-4 flex items-center gap-4 border border-border-subtle/80">
            <div className="size-11 bg-accent/10 rounded-sm flex items-center justify-center text-accent shrink-0">
              <HardDrives size={22} weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-secondary mb-1">Penyimpanan Perangkat</p>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-bold text-text-primary">{formatBytes(storageInfo.usage)} terpakai</span>
                <span className="text-text-muted">{formatBytes(storageInfo.quota)} total</span>
              </div>
              <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (storageInfo.usage / (storageInfo.quota || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </YomirraSurface>
        )}

        {/* Downloads Tabs / Task Lists */}
        {allDownloads.length === 0 ? (
          <div className="py-16 text-center">
            <EmptyState
              icon={<Download size={44} className="text-text-muted" weight="duotone" />}
              title="Belum ada unduhan."
              description="Komik yang kamu unduh akan muncul di sini."
            />
          </div>
        ) : (
          <Tabs defaultValue={queuedItems.length > 0 ? "queue" : "completed"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 sm:max-w-xs rounded-sm">
              <TabsTrigger value="queue" className="rounded-xs text-xs font-semibold">
                Antrean ({queuedItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xs text-xs font-semibold">
                Selesai ({completedItems.length})
              </TabsTrigger>
            </TabsList>

            {/* QUEUED & ACTIVE DOWNLOADS */}
            <TabsContent value="queue" className="space-y-3">
              {queuedItems.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    icon={<Download size={40} className="text-text-muted" weight="duotone" />}
                    title="Tidak ada antrean unduhan aktif."
                  />
                </div>
              ) : (
                queuedItems.map((item) => {
                  const clampedProgress = Math.max(0, Math.min(100, item.progress || 0));

                  return (
                    <YomirraSurface
                      variant="elevated"
                      key={item.id}
                      className="rounded-md p-3.5 sm:p-4 flex gap-3.5 sm:gap-4 border border-border-subtle/80"
                    >
                      <div className="w-14 h-18 sm:w-16 sm:h-20 bg-surface-muted rounded-xs overflow-hidden shrink-0 border border-border-subtle">
                        {item.coverUrl ? (
                          <img src={item.coverUrl} alt={item.mangaTitle} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">
                            No Cover
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-text-primary truncate text-sm">{item.mangaTitle}</h3>
                          <p className="text-xs text-text-secondary truncate mt-0.5">{item.chapterTitle}</p>
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
                          <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
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
                              toast.info("Unduhan dijeda");
                            }}
                            aria-label="Jeda Unduhan"
                            className="text-text-secondary hover:text-text-primary rounded-xs"
                          >
                            <Pause size={17} weight="bold" />
                          </IconButton>
                        ) : item.status === "paused" ? (
                          <IconButton
                            onClick={() => {
                              resumeDownload(item.id);
                              toast.info("Melanjutkan unduhan...");
                            }}
                            aria-label="Lanjutkan Unduhan"
                            className="text-accent hover:text-accent-hover rounded-xs"
                          >
                            <Play size={17} weight="fill" />
                          </IconButton>
                        ) : item.status === "failed" ? (
                          <IconButton
                            onClick={() => {
                              retryDownload(item.id);
                              toast.info("Mencoba ulang unduhan...");
                            }}
                            aria-label="Coba Lagi Unduhan"
                            className="text-accent hover:text-accent-hover rounded-xs"
                          >
                            <ArrowClockwise size={17} weight="bold" />
                          </IconButton>
                        ) : null}

                        <IconButton
                          onClick={() => {
                            cancelDownload(item.id);
                            toast.error("Unduhan dibatalkan");
                          }}
                          aria-label="Batalkan Unduhan"
                          className="text-semantic-error hover:text-semantic-error/80 rounded-xs"
                        >
                          <X size={17} weight="bold" />
                        </IconButton>
                      </div>
                    </YomirraSurface>
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
                    title="Belum ada chapter yang diunduh."
                  />
                </div>
              ) : (
                completedItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <Link
                      href={`/manga/${item.sourceId}/${item.mangaId}/read/${item.chapterId}`}
                      className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                      aria-label={`Baca ${item.mangaTitle} - ${item.chapterTitle}`}
                    />
                    <YomirraSurface
                      variant="elevated"
                      className="rounded-md p-3.5 sm:p-4 flex gap-3.5 sm:gap-4 items-center group-hover:bg-surface-hover/70 transition-colors border border-border-subtle/80 relative z-0"
                    >
                      <div className="w-12 h-16 sm:w-14 sm:h-18 bg-surface-muted rounded-xs overflow-hidden shrink-0 border border-border-subtle">
                        {item.coverUrl ? (
                          <img src={item.coverUrl} alt={item.mangaTitle} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">
                            No Cover
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary truncate text-sm group-hover:text-accent transition-colors">
                          {item.mangaTitle}
                        </h3>
                        <p className="text-xs text-text-secondary truncate mt-0.5">{item.chapterTitle}</p>
                        <p className="text-[11px] font-medium text-text-muted mt-1">
                          {item.downloadedPages || 0} Halaman • Selesai
                        </p>
                      </div>
                      <IconButton
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeDownload(item.id);
                          toast.error("Unduhan dihapus");
                        }}
                        aria-label="Hapus Unduhan"
                        className="text-semantic-error hover:text-semantic-error/80 shrink-0 relative z-20 rounded-xs"
                      >
                        <Trash size={18} />
                      </IconButton>
                    </YomirraSurface>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
