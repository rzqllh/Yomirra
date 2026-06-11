"use client"

import * as React from "react"
import { X, List, SortAscending, SortDescending } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"
import { IconButton } from "@/components/ui/icon-button"
import { Chapter } from "@/shared/types/source"
import { useRouter } from "next/navigation"
import { getReaderHref } from "@/shared/lib/routes"

interface ReaderChapterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters?: Chapter[];
  currentChapterId?: string;
  sourceId: string;
  mangaId: string;
}

export function ReaderChapterDrawer({ 
  isOpen, 
  onClose, 
  chapters,
  currentChapterId,
  sourceId,
  mangaId
}: ReaderChapterDrawerProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc")

  const sortedChapters = React.useMemo(() => {
    if (!chapters) return [];
    
    let result = chapters;
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(lowerQuery));
    }
    
    if (sortOrder === "asc") return [...result].reverse();
    return result;
  }, [chapters, sortOrder, searchQuery]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[70] max-h-[80vh] min-h-[50vh] bg-surface-base rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out flex flex-col md:hidden",
          "translate-y-full",
          isOpen && "translate-y-0"
        )}
      >
        <div className="flex flex-col gap-3 px-6 py-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <List size={20} className="text-text-muted" weight="bold" />
              Daftar Chapter
            </h2>
            <IconButton
              aria-label="Tutup panel"
              variant="surface"
              size="sm"
              onClick={onClose}
            >
              <X size={16} weight="bold" />
            </IconButton>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari chapter..." 
              className="bg-surface-raised border border-border-subtle rounded-full px-3 py-1.5 text-sm w-full outline-none focus:border-border-strong text-text-primary transition-colors"
            />
            <IconButton 
              variant="surface" 
              size="sm"
              className="shrink-0"
              onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
              aria-label={sortOrder === "desc" ? "Urutkan paling lama" : "Urutkan terbaru"}
              title={sortOrder === "desc" ? "Urutkan paling lama" : "Urutkan terbaru"}
            >
              {sortOrder === "desc" ? <SortDescending size={16} /> : <SortAscending size={16} />}
            </IconButton>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!chapters ? (
            <div className="flex items-center justify-center h-full text-text-muted">
              Loading chapters...
            </div>
          ) : (
            <div className="space-y-1">
              {sortedChapters.length === 0 ? (
                <div className="text-center py-8 text-sm text-text-muted">
                  Chapter tidak ditemukan.
                </div>
              ) : (
                sortedChapters.map((chapter) => {
                  const isCurrent = chapter.id === currentChapterId;
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        if (!isCurrent) {
                          router.push(getReaderHref(sourceId, mangaId, chapter.id))
                          onClose()
                        }
                      }}
                      className={cn(
                        "w-full flex flex-col items-start px-4 py-3 rounded-xl transition-all duration-200",
                        isCurrent 
                          ? "bg-accent/10 border border-accent/20" 
                          : "hover:bg-surface-raised/50 active:scale-[0.98]"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-bold line-clamp-1 text-left",
                        isCurrent ? "text-accent" : "text-text-primary"
                      )}>
                        {chapter.title}
                      </span>
                      <span className={cn(
                        "text-[11px] mt-1 font-medium",
                        isCurrent ? "text-accent/80" : "text-text-muted"
                      )}>
                        {chapter.date}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
