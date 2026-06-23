"use client";

import { DownloadSimple, CheckCircle, XCircle, CircleNotch, Pause } from "@phosphor-icons/react";
import { useDownloadStore } from "@/shared/store/download-store";
import { getDownloadChapterId } from "@/shared/utils/download-helpers";
import { motion, AnimatePresence } from "motion/react";
import { IconButton } from "@/components/ui/icon-button";
import { downloadChapterAsZip } from "@/shared/utils/zip-downloader";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChapterDownloadButtonProps {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  chapterTitle: string;
  mangaTitle: string;
}

export function ChapterDownloadButton({
  sourceId,
  mangaId,
  chapterId,
  chapterTitle,
  mangaTitle,
}: ChapterDownloadButtonProps) {
  const id = getDownloadChapterId(sourceId, mangaId, chapterId);
  // Only subscribe to the specific download item to prevent re-rendering the whole list
  const download = useDownloadStore((state) => state.downloads[id]);
  const addDownload = useDownloadStore((state) => state.addDownload);
  const removeDownload = useDownloadStore((state) => state.removeDownload);

  const [isPWA, setIsPWA] = useState(true);
  const [isZipDownloading, setIsZipDownloading] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isPWA) {
      if (isZipDownloading) return;
      const toastId = `zip-dl-${chapterId}`;
      try {
        setIsZipDownloading(true);
        setZipProgress(0);
        toast.loading(`Mempersiapkan unduhan ${chapterTitle}...`, { id: toastId });
        
        await downloadChapterAsZip({
          sourceId,
          mangaId,
          chapterId,
          chapterTitle,
          mangaTitle,
          onProgress: (current, total) => {
            const pct = Math.round((current / total) * 100);
            setZipProgress(pct);
            toast.loading(`Mengunduh ${chapterTitle} (${pct}%)`, { id: toastId });
          }
        });
        toast.success(`Berhasil mengunduh ${chapterTitle}!`, { id: toastId, duration: 4000 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error tidak diketahui";
        toast.error(`Gagal mengunduh: ${msg}`, { id: toastId, duration: 5000 });
      } finally {
        setIsZipDownloading(false);
      }
      return;
    }

    if (!download) {
      addDownload({
        sourceId,
        mangaId,
        chapterId,
        chapterTitle,
        mangaTitle,
      });
      toast.success(`Chapter ditambahkan ke antrean`);
    } else if (download.status === "downloaded" || download.status === "failed") {
      setIsDeleteDialogOpen(true);
    } else if (download.status === "downloading" || download.status === "queued") {
      const pauseDownload = useDownloadStore.getState().pauseDownload;
      pauseDownload(id);
      toast("Unduhan dijeda");
    } else if (download.status === "paused") {
      const resumeDownload = useDownloadStore.getState().resumeDownload;
      resumeDownload(id);
      toast.info("Melanjutkan unduhan...");
    }
  };

  return (
    <>
      <IconButton
      variant="ghost"
      size="sm"
      className="relative z-20 shrink-0 text-text-muted hover:text-text-primary rounded-full"
      onClick={handleDownload}
      aria-label="Download Chapter"
    >
      <AnimatePresence mode="wait" initial={false}>
        {!download ? (
          <motion.span
            key="idle"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <DownloadSimple size={20} />
          </motion.span>
        ) : download.status === "downloaded" ? (
          <motion.span
            key="downloaded"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-accent"
          >
            <CheckCircle size={20} weight="fill" />
          </motion.span>
        ) : download.status === "failed" ? (
          <motion.span
            key="failed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-error"
          >
            <XCircle size={20} weight="fill" />
          </motion.span>
        ) : download.status === "paused" ? (
          <motion.span
            key="paused"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-text-muted"
          >
            <Pause size={20} weight="fill" />
          </motion.span>
        ) : isZipDownloading ? (
          <motion.span
            key="zip-downloading"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-accent relative flex items-center justify-center"
          >
            <CircleNotch size={20} className="motion-safe:animate-spin" />
            <span className="absolute text-[8px] font-bold">
              {zipProgress > 0 ? zipProgress : ""}
            </span>
          </motion.span>
        ) : (
          <motion.span
            key="downloading"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-accent relative flex items-center justify-center"
          >
            <CircleNotch size={20} className="motion-safe:animate-spin" />
            <span className="absolute text-[8px] font-bold">
              {download.progress > 0 ? download.progress : ""}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </IconButton>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl shadow-default -heavy">
          <DialogHeader>
            <DialogTitle>Hapus Unduhan?</DialogTitle>
            <DialogDescription>
              Unduhan chapter <strong>{chapterTitle}</strong> akan dihapus dari perangkat ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-center mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1 rounded-full font-bold h-12"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                removeDownload(id);
                toast("Unduhan dihapus");
                setIsDeleteDialogOpen(false);
              }}
              className="flex-1 rounded-full font-bold h-12"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
