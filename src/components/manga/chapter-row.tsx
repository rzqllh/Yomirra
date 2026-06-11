import * as React from "react"
import Link from "next/link"
import { getReaderHref } from "@/shared/lib/routes"
import { ChapterDownloadButton } from "@/components/manga/chapter-download-button"
import { cn } from "@/shared/utils/cn"

interface ChapterRowProps {
  sourceId: string
  mangaId: string
  chapterId: string
  chapterTitle: string
  mangaTitle: string
  date: string | number | Date
  isRead?: boolean
  isLastRead?: boolean
}

export function ChapterRow({
  sourceId,
  mangaId,
  chapterId,
  chapterTitle,
  mangaTitle,
  date,
  isRead = false,
  isLastRead = false
}: ChapterRowProps) {
  return (
    <Link
      href={getReaderHref(sourceId, mangaId, chapterId)}
      className={cn(
        "group relative flex items-center gap-3 md:gap-4 rounded-2xl px-4 py-3.5 transition-all duration-300 ease-out will-change-transform",
        isLastRead 
          ? "bg-surface-active/60 backdrop-blur-md border border-accent/20 shadow-[0_4px_20px_-4px_rgba(var(--accent-rgb),0.15)] ring-1 ring-accent/10 z-10" 
          : "bg-surface-base/40 backdrop-blur-sm border border-transparent hover:bg-surface-raised/80 hover:border-border-subtle/50 hover:shadow-lg hover:shadow-black/5 hover:ring-1 hover:ring-white/5",
        "hover:-translate-y-[1px] hover:scale-[1.005]"
      )}
    >
      {/* Subtle indicator for read status */}
      {!isRead && !isLastRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent/80 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-4">
        <h4 className={cn(
          "text-sm md:text-[15px] font-semibold tracking-tight truncate transition-colors duration-300",
          isRead ? "text-text-muted font-medium" : "text-text-primary group-hover:text-accent"
        )}>
          {chapterTitle}
        </h4>
        <p className="text-[11px] md:text-xs text-text-muted/70 mt-1.5 md:mt-0 font-medium shrink-0 flex items-center gap-1.5">
          {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {isLastRead && (
        <div className="flex items-center">
          <div className="hidden sm:flex items-center justify-center rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent ring-1 ring-inset ring-accent/20 shrink-0">
            Terakhir Dibaca
          </div>
          <div className="sm:hidden flex items-center justify-center rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent ring-1 ring-inset ring-accent/20 shrink-0">
            Terakhir
          </div>
        </div>
      )}

      <div 
        className="pl-3 md:pl-4 border-l border-border-subtle/30 shrink-0 transition-opacity opacity-70 group-hover:opacity-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <ChapterDownloadButton
          sourceId={sourceId}
          mangaId={mangaId}
          chapterId={chapterId}
          chapterTitle={chapterTitle}
          mangaTitle={mangaTitle}
        />
      </div>
    </Link>
  )
}