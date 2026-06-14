import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { getReaderHref, getMangaDetailHref } from "@/shared/lib/routes"
import { Trash } from "@phosphor-icons/react"
import { IconButton } from "@/components/ui/icon-button"
import { HistoryItem } from "@/shared/store/history-store"

interface HistoryRowProps {
  item: HistoryItem
  onRemove: (sourceId: string, mangaId: string, chapterId: string) => void
  priority?: boolean
}

export function HistoryRow({ item, onRemove, priority = false }: HistoryRowProps) {
  const pathname = usePathname()
  const targetHref = getReaderHref(item.sourceId, item.mangaId, item.chapterId)

  return (
    <div className="group relative flex items-center gap-4 rounded-xl bg-surface-raised/50 backdrop-blur-sm p-3 border border-border-subtle/50 transition-all duration-300 hover:bg-surface-overlay/80 hover:shadow-sm overflow-hidden">
      <Link href={getMangaDetailHref(item.sourceId, item.mangaId, pathname)} className="relative h-[84px] w-[60px] shrink-0 overflow-hidden rounded-sm bg-surface-overlay shadow-sm z-10">
        {item.coverUrl ? (
          <img 
            src={item.coverUrl} 
            alt={item.mangaTitle} 
            className="absolute inset-0 w-full h-full object-cover" 
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-full w-full bg-surface-muted" />
        )}
      </Link>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center z-10 pr-8">
        <Link href={getMangaDetailHref(item.sourceId, item.mangaId, pathname)} className="block min-w-0">
          <h3 className="truncate font-bold text-text-primary text-sm md:text-base leading-snug group-hover:text-accent transition-colors">
            {item.mangaTitle}
          </h3>
        </Link>
        <Link href={targetHref} className="block min-w-0 mt-0.5">
          <p className="truncate text-sm font-medium text-text-muted group-hover:text-accent transition-colors">
            {item.chapterTitle || "Chapter"}
          </p>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-text-muted">
          <span className="uppercase tracking-wider">{item.sourceName || item.sourceId}</span>
          <span>•</span>
          <span>{new Date(item.readAt).toLocaleDateString()}</span>
          {item.progressPercent !== undefined && item.progressPercent > 0 && (
            <>
              <span>•</span>
              <span className="text-accent">{item.progressPercent}%</span>
            </>
          )}
        </div>
      </div>
      
      <IconButton
        aria-label={`Hapus ${item.mangaTitle} dari riwayat`}
        variant="ghost"
        size="sm"
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:text-semantic-error hover:bg-semantic-error/10 z-20"
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
