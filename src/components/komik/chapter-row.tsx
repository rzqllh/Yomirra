import * as React from "react"
import Link from "next/link"
import { getReaderHref } from "@/shared/lib/routes"
import { beginNavigationIntent } from "@/shared/lib/navigation-intent"
import { ChapterDownloadButton } from "@/components/komik/chapter-download-button"
import { cn } from "@/shared/utils/cn"
import { CaretLeft, Lock } from "@phosphor-icons/react"

interface ChapterRowProps {
  sourceId: string
  mangaId: string
  chapterId: string
  chapterTitle: string
  mangaTitle: string
  offlineSafe?: boolean
  date: string | number | Date
  isRead?: boolean
  isLastRead?: boolean
  isLocked?: boolean
  returnTo?: string
}

export function ChapterRow({
  sourceId,
  mangaId,
  chapterId,
  chapterTitle,
  mangaTitle,
  offlineSafe,
  date,
  isRead = false,
  isLastRead = false,
  isLocked = false,
  returnTo
}: ChapterRowProps) {

  // Format date safely
  const formattedDate = React.useMemo(() => {
    if (!date) return "";
    const d = new Date(date);
    // If it's not a valid date (like "20 jam lalu"), just return the string
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [date]);

  const readerHref = getReaderHref(sourceId, mangaId, chapterId, returnTo);

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className={cn(
            "truncate text-sm font-semibold",
            isLastRead ? "text-accent" : "text-text-primary"
          )}>
            {chapterTitle}
          </h4>
          {isLocked && (
            <span className="flex shrink-0 items-center gap-1 rounded-xs bg-status-warning-bg px-1.5 py-0.5 text-xs font-semibold text-status-warning-fg">
              <Lock aria-hidden="true" size={12} />
              Terkunci
            </span>
          )}
          {!isRead && !isLastRead && !isLocked && (
            <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-label="Belum dibaca" title="Belum dibaca" />
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-text-muted">{formattedDate}</p>
      </div>
      {isLastRead && (
        <span className="shrink-0 rounded-xs bg-accent/10 px-1.5 py-0.5 text-xs font-semibold text-accent">
          Terakhir
        </span>
      )}
    </>
  );

  const rowContentClass = "flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-3 sm:px-3";

  return (
    <article
      className={cn(
        "flex items-center gap-1 rounded-sm border px-1 motion-safe:transition-colors",
        isLastRead ? "border-accent/30 bg-accent/5" : "border-transparent",
        !isLocked && "hover:bg-surface-hover focus-within:bg-surface-hover"
      )}
    >
      {isLocked ? (
        <div className={rowContentClass} aria-disabled="true">{content}</div>
      ) : (
        <>
          <Link
            href={readerHref}
            onClick={() => beginNavigationIntent(readerHref)}
            aria-label={isLastRead ? `Lanjutkan bacaan terakhir: ${chapterTitle}` : isRead ? `Baca ulang ${chapterTitle}` : `Belum dibaca: baca ${chapterTitle}`}
            aria-current={isLastRead || undefined}
            className={cn(rowContentClass, "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:bg-accent/10")}
          >
            {content}
            <CaretLeft aria-hidden="true" size={14} className="shrink-0 rotate-180 text-text-muted" />
          </Link>
          <ChapterDownloadButton
            sourceId={sourceId}
            mangaId={mangaId}
            chapterId={chapterId}
            chapterTitle={chapterTitle}
            mangaTitle={mangaTitle}
            offlineSafe={offlineSafe}
          />
        </>
      )}
    </article>
  )
}
