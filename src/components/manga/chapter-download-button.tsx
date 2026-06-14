"use client";

import { DownloadSimple, CheckCircle, XCircle, CircleNotch, Pause } from "@phosphor-icons/react";
import { useDownloadStore } from "@/shared/store/download-store";
import { getDownloadChapterId } from "@/shared/utils/download-helpers";
import { motion, AnimatePresence } from "motion/react";
import { IconButton } from "@/components/ui/icon-button";

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

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!download) {
      addDownload({
        sourceId,
        mangaId,
        chapterId,
        chapterTitle,
        mangaTitle,
      });
    } else if (download.status === "downloaded" || download.status === "failed") {
      if (confirm("Hapus unduhan chapter ini?")) {
        removeDownload(id);
      }
    } else if (download.status === "downloading" || download.status === "queued") {
      const pauseDownload = useDownloadStore.getState().pauseDownload;
      pauseDownload(id);
    } else if (download.status === "paused") {
      const resumeDownload = useDownloadStore.getState().resumeDownload;
      resumeDownload(id);
    }
  };

  return (
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
  );
}
