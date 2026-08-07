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
  
  // Format date safely
  const formattedDate = React.useMemo(() => {
    if (!date) return "";
    const d = new Date(date);
    // If it's not a valid date (like "20 jam lalu"), just return the string
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [date]);

  return (
    <Link
      href={getReaderHref(sourceId, mangaId, chapterId)}
      className={cn(
        "group relative flex items-center gap-3 md:gap-4 py-3 transition-all duration-300 ease-out will-change-transform border-b border-border-default/50 last:border-b-0",
        isLastRead 
          ? "bg-accent/5 -mx-2 px-2 md:-mx-4 md:px-4 z-10 rounded-sm" 
          : "hover:bg-surface-hover -mx-2 px-2 md:-mx-4 md:px-4 rounded-sm"
      )}
    >
      {/* Subtle indicator for read status */}
      {!isRead && !isLastRead && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent/80 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-4">
        <h4 className={cn(
          "text-[15px] md:text-base font-bold tracking-tight leading-snug truncate transition-colors duration-300",
          isRead ? "text-text-muted font-medium" : "text-text-primary group-hover:text-accent"
        )}>
          {chapterTitle}
        </h4>
        <p className="text-[11px] md:text-xs text-text-muted/70 mt-1.5 md:mt-0 font-semibold shrink-0 flex items-center gap-1.5">
          {formattedDate}
        </p>
      </div>

      {isLastRead && (
        <div className="flex items-center">
          <div className="hidden sm:flex items-center justify-center rounded-full bg-accent/10 px-3 py-1 text-2xs font-bold uppercase tracking-widest text-accent ring-1 ring-inset ring-accent/20 shrink-0">
            Terakhir Dibaca
          </div>
          <div className="sm:hidden flex items-center justify-center rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent ring-1 ring-inset ring-accent/20 shrink-0">
            Terakhir
          </div>
        </div>
      )}

      <div 
        className="pl-3 md:pl-4 border-l border-border-default/50 shrink-0 transition-opacity opacity-70 group-hover:opacity-100" 
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
