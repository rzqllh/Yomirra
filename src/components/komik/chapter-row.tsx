import * as React from "react"
import Link from "next/link"
import { getReaderHref } from "@/shared/lib/routes"
import { beginNavigationIntent } from "@/shared/lib/navigation-intent"
import { ChapterDownloadButton } from "@/components/komik/chapter-download-button"
import { cn } from "@/shared/utils/cn"
import { CaretRight, Lock, Check } from "@phosphor-icons/react"

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
        <div className="flex items-center gap-2">
          {isRead && !isLastRead && (
            <span className="flex shrink-0 items-center justify-center size-4 rounded-full bg-surface-muted text-text-muted" title="Sudah dibaca">
              <Check aria-hidden="true" size={11} weight="bold" />
            </span>
          )}
          <h4 className={cn(
            "truncate text-sm font-semibold tracking-tight",
            isLastRead ? "text-accent font-bold" : isRead ? "text-text-muted font-medium" : "text-text-primary"
          )}>
            {chapterTitle}
          </h4>
          {isLocked && (
            <span className="flex shrink-0 items-center gap-1 rounded-xs bg-status-warning-bg px-1.5 py-0.5 text-2xs font-bold text-status-warning-fg">
              <Lock aria-hidden="true" size={12} />
              Terkunci
            </span>
          )}
          {!isRead && !isLastRead && !isLocked && (
            <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-label="Belum dibaca" title="Belum dibaca" />
          )}
        </div>
        <p className="mt-0.5 truncate text-2xs text-text-muted font-medium">{formattedDate}</p>
      </div>
      {isLastRead && (
        <span className="shrink-0 rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-2xs font-bold text-accent">
          Terakhir
        </span>
      )}
    </>
  );

  const rowContentClass = "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2.5 sm:px-3 sm:py-3";

  return (
    <article
      className={cn(
        "flex items-center gap-1 rounded-xl border px-1 transition-all duration-150",
        isLastRead
          ? "border-accent/40 bg-accent/8 shadow-xs"
          : isRead
          ? "border-transparent bg-transparent hover:bg-surface-hover/70"
          : "border-transparent bg-surface-base/40 hover:bg-surface-hover",
        !isLocked && "focus-within:bg-surface-hover"
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
            className={cn(rowContentClass, "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:bg-accent/10 cursor-pointer select-none")}
          >
            {content}
            <CaretRight aria-hidden="true" size={14} className="shrink-0 text-text-muted/60" />
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
