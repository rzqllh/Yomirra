import * as React from "react"
import Link from "next/link"
import { getReaderHref } from "@/shared/lib/routes"
import { ChapterDownloadButton } from "@/components/manga/chapter-download-button"
import { cn } from "@/shared/utils/cn"
import { CaretLeft } from "@phosphor-icons/react"

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
        "group relative flex items-center justify-between py-4 px-1 border-b border-border-default/30 bg-transparent transition-colors duration-200 ease-out",
        isLastRead
          ? "bg-accent/5"
          : "hover:bg-surface-hover",
        !isRead && !isLastRead ? "opacity-100" : "opacity-70"
      )}
    >
      <div className="flex flex-col flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className={cn(
            "text-[14px] font-bold tracking-tight truncate transition-colors duration-300",
            isLastRead ? "text-accent" : "text-text-primary group-hover:text-accent"
          )}>
            {chapterTitle}
          </h4>
          {!isRead && !isLastRead && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 shadow-[0_0_8px_rgba(91,101,233,0.5)]" />
          )}
        </div>
        <p className="text-[11px] text-text-muted font-medium truncate">
          {formattedDate}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isLastRead && (
          <div className="flex items-center justify-center rounded-[6px] bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent ring-1 ring-inset ring-accent/20">
            Terakhir
          </div>
        )}
        {/* Colored-circle wrap adds the depth the reference design has (a plain icon
            read as flat next to the title). Assumption: ChapterDownloadButton renders
            an icon-only, transparent-background trigger. If it ships its own bg/padding,
            this will double up — either drop the wrapper or give ChapterDownloadButton
            a `bare` prop to disable its own chrome. */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/10 text-accent transition-opacity opacity-70 group-hover:opacity-100 shrink-0"
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
        <CaretLeft size={16} className="text-text-muted/40 group-hover:text-accent shrink-0 rotate-180" />
      </div>
    </Link>
  )
}
