"use client";

import { useDownloadStore } from "@/shared/store/download-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { HardDrives, Pause, Play, Trash, X, ArrowClockwise, CaretLeft, Download, Package } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";
import Link from "next/link";
import { YomirraSection, YomirraSurface } from "@/components/ui/layout";
import { toast } from "sonner";
import { EmptyState } from "@/components/states/empty-state";
import { StorageWarningBanner } from "@/components/downloads/storage-warning-banner";

export default function DownloadsPage() {
  const { downloads, removeDownload, pauseDownload, resumeDownload, cancelDownload, retryDownload, clearDownloads } = useDownloadStore();
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        setStorageInfo({
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        });
      });
    }
  }, [downloads]);

  const allDownloads = Object.values(downloads);
  const queuedItems = allDownloads.filter(d => ['queued', 'downloading', 'paused', 'failed'].includes(d.status));
  const completedItems = allDownloads.filter(d => d.status === 'downloaded');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0">
      <header className="sticky top-[72px] md:top-0 z-30 bg-surface-base/80 backdrop-blur-xl -b --default h-14 flex items-center px-4 gap-3">
        <Link href="/library" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-muted hover:bg-surface-hover text-text-primary transition-colors">
          <CaretLeft size={20} weight="bold" />
        </Link>
        <h1 className="font-bold text-lg">Manajer Unduhan</h1>
      </header>

      <div className="px-4 py-6 md:py-8 max-w-3xl mx-auto w-full space-y-6 md:space-y-8">
        <StorageWarningBanner />
        {storageInfo && (
          <YomirraSurface variant="elevated" className="rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <HardDrives size={24} weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-muted mb-1">Penyimpanan Perangkat</p>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium text-text-primary">{formatBytes(storageInfo.usage)} terpakai</span>
                <span className="text-text-muted">{formatBytes(storageInfo.quota)} total</span>
              </div>
              <div className="w-full bg-surface-base rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (storageInfo.usage / storageInfo.quota) * 100)}%` }}
                />
              </div>
            </div>
            <button 
              onClick={() => {
                if (window.confirm("Yakin ingin menghapus semua unduhan?")) {
                  clearDownloads();
                  toast("Semua unduhan dihapus");
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-muted hover:bg-semantic-error/20 text-semantic-error transition-colors shrink-0"
              aria-label="Hapus Semua"
            >
              <Trash size={20} />
            </button>
          </YomirraSurface>
        )}

        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="queue">
              Antrean ({queuedItems.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Selesai ({completedItems.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue" className="space-y-4">
            {queuedItems.length === 0 ? (
              <div className="py-12">
                <EmptyState 
                  icon={<Download size={48} className="text-text-muted" weight="duotone" />} 
                  title="Tidak ada antrean unduhan" 
                />
              </div>
            ) : (
              queuedItems.map(item => (
                <YomirraSurface variant="elevated" key={item.id} className="rounded-xl p-4 flex gap-4">
                  <div className="w-16 h-20 bg-surface-muted rounded-lg overflow-hidden shrink-0">
                    {item.coverUrl ? (
                      <img src={item.coverUrl} alt={item.mangaTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No Cover</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary truncate text-sm">{item.mangaTitle}</h3>
                      <p className="text-xs text-text-muted truncate mt-0.5">{item.chapterTitle}</p>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-muted capitalize">
                          {item.status === 'downloading' ? 'Mengunduh' : 
                           item.status === 'paused' ? 'Dijeda' : 
                           item.status === 'failed' ? 'Gagal' : 'Dalam Antrean'}
                        </span>
                        <span className="font-medium text-primary">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${item.status === 'failed' ? 'bg-error' : item.status === 'paused' ? 'bg-text-muted' : 'bg-primary'}`} 
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      {item.error && <p className="text-xs text-error mt-1 truncate">{item.error}</p>}
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-around shrink-0 border-l border-border-default/50 pl-3 ml-1">
                    {item.status === 'downloading' || item.status === 'queued' ? (
                      <IconButton onClick={() => { pauseDownload(item.id); toast("Unduhan dijeda"); }} aria-label="Pause" className="text-text-muted hover:text-text-primary">
                        <Pause size={18} />
                      </IconButton>
                    ) : item.status === 'paused' ? (
                      <IconButton onClick={() => { resumeDownload(item.id); toast.info("Melanjutkan unduhan..."); }} aria-label="Resume" className="text-primary hover:text-primary/80">
                        <Play size={18} />
                      </IconButton>
                    ) : item.status === 'failed' ? (
                      <IconButton onClick={() => { retryDownload(item.id); toast.info("Mencoba ulang unduhan..."); }} aria-label="Retry" className="text-primary hover:text-primary/80">
                        <ArrowClockwise size={18} />
                      </IconButton>
                    ) : null}
                    
                    <IconButton onClick={() => { cancelDownload(item.id); toast("Unduhan dibatalkan"); }} aria-label="Cancel" className="text-semantic-error hover:text-semantic-error/80">
                      <X size={18} />
                    </IconButton>
                  </div>
                </YomirraSurface>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedItems.length === 0 ? (
              <div className="py-12">
                <EmptyState 
                  icon={<Package size={48} className="text-text-muted" weight="duotone" />} 
                  title="Belum ada chapter yang diunduh" 
                />
              </div>
            ) : (
              completedItems.map(item => (
                <div key={item.id} className="relative group">
                  <Link 
                    href={`/manga/${item.sourceId}/${item.mangaId}/read/${item.chapterId}`}
                    className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
                    aria-label={`Read ${item.mangaTitle} - ${item.chapterTitle}`}
                  />
                  <YomirraSurface variant="elevated" className="rounded-xl p-4 flex gap-4 items-center group-hover:bg-surface-hover transition-colors relative z-0">
                    <div className="w-12 h-16 bg-surface-muted rounded-lg overflow-hidden shrink-0">
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt={item.mangaTitle} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No Cover</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-text-primary truncate text-sm group-hover:text-accent transition-colors">{item.mangaTitle}</h3>
                      <p className="text-xs text-text-muted truncate mt-0.5">{item.chapterTitle}</p>
                      <p className="text-[10px] text-text-muted mt-1">{item.downloadedPages} Halaman • Selesai</p>
                    </div>
                    <IconButton 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeDownload(item.id); toast("Unduhan dihapus"); }} 
                      aria-label="Delete" 
                      className="text-semantic-error hover:text-semantic-error/80 shrink-0 relative z-20"
                    >
                      <Trash size={20} />
                    </IconButton>
                  </YomirraSurface>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
