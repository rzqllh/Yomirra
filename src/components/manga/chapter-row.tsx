import * as React from "react"
import Link from "next/link"
import { getReaderHref } from "@/shared/lib/routes"
import { ChapterDownloadButton } from "@/components/manga/chapter-download-button"
import { cn } from "@/shared/utils/cn"
import { CaretLeft, Lock } from "@phosphor-icons/react"

interface ChapterRowProps {
  sourceId: string
  mangaId: string
  chapterId: string
  chapterTitle: string
  mangaTitle: string
  date: string | number | Date
  isRead?: boolean
  isLastRead?: boolean
  isLocked?: boolean
}

export function ChapterRow({
  sourceId,
  mangaId,
  chapterId,
  chapterTitle,
  mangaTitle,
  date,
  isRead = false,
  isLastRead = false,
  isLocked = false
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
    <article
      className={cn(
        "group relative flex items-center border-b border-border-default/30 bg-transparent motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
        isLastRead ? "bg-accent/5" : "hover:bg-surface-hover",
        !isRead && !isLastRead ? "opacity-100" : "opacity-70"
      )}
    >
      <Link
        href={getReaderHref(sourceId, mangaId, chapterId)}
        aria-label={`Baca ${chapterTitle}`}
        className="flex min-w-0 flex-1 items-center justify-between px-1 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div className="flex min-w-0 flex-1 flex-col pr-4">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className={cn(
              "text-[14px] font-bold tracking-tight truncate motion-safe:transition-colors motion-safe:duration-300",
              isLastRead ? "text-accent" : "text-text-primary group-hover:text-accent"
            )}>
              {chapterTitle}
            </h4>
            {isLocked && (
              <div className="flex items-center gap-1 rounded-[5px] bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500 ring-1 ring-inset ring-amber-500/20 shrink-0">
                <Lock size={11} weight="bold" />
                <span>Terkunci</span>
              </div>
            )}
            {!isRead && !isLastRead && !isLocked && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 shadow-[0_0_8px_rgba(91,101,233,0.5)]" />
            )}
          </div>
          <p className="text-[11px] text-text-muted font-medium truncate">
            {formattedDate}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isLastRead && (
            <div className="flex items-center justify-center rounded-[6px] bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent ring-1 ring-inset ring-accent/20">
              Terakhir
            </div>
          )}
          {isLocked && (
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500"
              title="Chapter terkunci di sumber asli"
            >
              <Lock size={16} weight="bold" />
            </span>
          )}
          <CaretLeft size={16} className="shrink-0 rotate-180 text-text-muted/40 group-hover:text-accent" />
        </div>
      </Link>

      {!isLocked && (
        <div className="shrink-0 rounded-sm bg-accent/10 text-accent opacity-70 motion-safe:transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <ChapterDownloadButton
            sourceId={sourceId}
            mangaId={mangaId}
            chapterId={chapterId}
            chapterTitle={chapterTitle}
            mangaTitle={mangaTitle}
          />
        </div>
      )}
    </article>
  )
}
