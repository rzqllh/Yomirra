import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getReaderHref, getMangaDetailHref } from "@/shared/lib/routes"
import { Trash, CaretDown, CaretUp } from "@phosphor-icons/react"
import { IconButton } from "@/components/ui/icon-button"
import { HistoryItem } from "@/shared/store/history-store"
import { HistoryChapterRow } from "./history-chapter-row"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export interface HistoryMangaGroupProps {
  sourceId: string;
  mangaId: string;
  mangaTitle: string;
  coverUrl?: string;
  sourceName?: string;
  latestReadAt: string;
  chapters: HistoryItem[];
  onRemoveManga: (sourceId: string, mangaId: string) => void;
  onRemoveChapter: (sourceId: string, mangaId: string, chapterId: string) => void;
}

export function HistoryMangaGroup({
  sourceId,
  mangaId,
  mangaTitle,
  coverUrl,
  sourceName,
  latestReadAt,
  chapters,
  onRemoveManga,
  onRemoveChapter
}: HistoryMangaGroupProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // If there's only 1 chapter, we might not even need to show the toggle, but let's keep it consistent
  
  return (
    <div className="flex flex-col rounded-2xl bg-surface-raised/30 border border-border-subtle overflow-hidden mb-6">
      {/* Group Header */}
      <div className="flex items-center gap-4 p-4 bg-surface-raised/80 backdrop-blur-md">
        <Link href={getMangaDetailHref(sourceId, mangaId, pathname)} className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-surface-overlay shadow-sm">
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt={mangaTitle} 
              className="absolute inset-0 w-full h-full object-cover" 
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full bg-surface-muted" />
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <Link href={getMangaDetailHref(sourceId, mangaId, pathname)} className="block min-w-0">
            <h3 className="truncate font-bold text-text-primary text-base md:text-lg hover:text-accent transition-colors">
              {mangaTitle}
            </h3>
          </Link>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-muted font-medium">
            <span className="uppercase tracking-wider">{sourceName || sourceId}</span>
            <span>•</span>
            <span>{chapters.length} chapter dibaca</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            aria-label={`Hapus semua riwayat ${mangaTitle}`}
            variant="ghost"
            className="text-text-muted hover:text-semantic-error hover:bg-semantic-error/10"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash size={18} />
          </IconButton>
          
          <IconButton
            aria-label={isExpanded ? "Tutup daftar chapter" : "Buka daftar chapter"}
            variant="ghost"
            className="text-text-muted"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <CaretUp size={18} /> : <CaretDown size={18} />}
          </IconButton>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl border border-border-default shadow-heavy">
          <DialogHeader>
            <DialogTitle>Hapus Riwayat Bacaan?</DialogTitle>
            <DialogDescription>
              Semua riwayat bacaan untuk <strong>{mangaTitle}</strong> akan dihapus dari perangkat ini.
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
              variant="accent"
              onClick={() => {
                onRemoveManga(sourceId, mangaId);
                setIsDeleteDialogOpen(false);
              }}
              className="flex-1 rounded-full font-bold h-12 bg-red-500 hover:bg-red-600 text-white"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapters List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-3 bg-surface-base/50">
              {chapters.map((chapter) => (
                <HistoryChapterRow 
                  key={chapter.chapterId} 
                  item={chapter} 
                  onRemove={onRemoveChapter} 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
