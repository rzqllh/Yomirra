import * as React from "react"
import Link from "next/link"
import { getReaderHref } from "@/shared/lib/routes"
import { Trash } from "@phosphor-icons/react"
import { IconButton } from "@/components/ui/icon-button"
import { HistoryItem } from "@/shared/store/history-store"

interface HistoryChapterRowProps {
  item: HistoryItem
  onRemove: (sourceId: string, mangaId: string, chapterId: string) => void
}

export function HistoryChapterRow({ item, onRemove }: HistoryChapterRowProps) {
  const targetHref = getReaderHref(item.sourceId, item.mangaId, item.chapterId)

  return (
    <div className="group relative flex items-center justify-between gap-4 rounded-xl bg-surface-base p-3 border border-border-subtle/30 transition-all duration-300 hover:bg-surface-hover hover:shadow-sm overflow-hidden">
      <Link href={targetHref} className="flex-1 min-w-0 flex flex-col justify-center pr-8">
        <p className="truncate text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
          {item.chapterTitle || `Chapter ${item.chapterId}`}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
          <span>{new Date(item.readAt).toLocaleDateString()}</span>
          {item.progressPercent !== undefined && item.progressPercent > 0 && (
            <>
              <span>•</span>
              <span className="text-accent font-semibold">{item.progressPercent}%</span>
            </>
          )}
        </div>
      </Link>
      
      <IconButton
        aria-label="Hapus chapter dari riwayat"
        variant="ghost"
        size="sm"
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:text-semantic-error hover:bg-semantic-error/10 shrink-0"
        onClick={(e) => {
          e.preventDefault();
          onRemove(item.sourceId, item.mangaId, item.chapterId);
        }}
      >
        <Trash size={16} weight="bold" />
      </IconButton>
    </div>
  )
}
