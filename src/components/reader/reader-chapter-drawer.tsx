"use client"

import * as React from "react"
import { X, List, SortAscending, SortDescending } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"
import { IconButton } from "@/components/ui/icon-button"
import { Chapter } from "@/shared/types/source"
import { useRouter } from "next/navigation"
import { getReaderHref } from "@/shared/lib/routes"
import { YomirraSearchField } from "@/components/ui/yomirra-search-field"

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
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Bottom Sheet / Dialog */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[70] max-h-[80vh] min-h-[50vh] bg-surface-glass backdrop-blur-3xl rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out flex flex-col md:max-w-md md:mx-auto md:mb-6 md:bottom-6 md:rounded-3xl md:border md:border-border-glass",
          isOpen ? "translate-y-0" : "translate-y-full md:translate-y-[120%]"
        )}
      >
        <div className="flex flex-col gap-4 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <List size={18} className="text-accent" weight="bold" />
              Daftar Chapter
            </h2>
            <div className="bg-black/10 dark:bg-surface-overlay/80 backdrop-blur-xl border border-border-glass rounded-full p-1 shadow-sm shrink-0">
              <IconButton
                aria-label="Tutup panel"
                variant="ghost"
                size="sm"
                className="rounded-full min-h-[32px] min-w-[32px] hover:bg-black/5 dark:hover:bg-surface-hover text-text-primary"
                onClick={onClose}
              >
                <X size={16} weight="bold" />
              </IconButton>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <YomirraSearchField 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari chapter..." 
              containerClassName="w-full"
            />
            <div className="bg-black/10 dark:bg-surface-overlay/80 backdrop-blur-xl border border-border-glass rounded-full p-1 shadow-sm shrink-0 ml-2">
              <IconButton 
                variant="ghost" 
                size="sm"
                className="rounded-full min-h-[32px] min-w-[32px] hover:bg-black/5 dark:hover:bg-surface-hover text-text-primary"
                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                aria-label={sortOrder === "desc" ? "Urutkan paling lama" : "Urutkan terbaru"}
                title={sortOrder === "desc" ? "Urutkan paling lama" : "Urutkan terbaru"}
              >
                {sortOrder === "desc" ? <SortDescending size={16} /> : <SortAscending size={16} />}
              </IconButton>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-2 pb-6 custom-scrollbar border-t border-border-glass">
          {!chapters ? (
            <div className="flex items-center justify-center h-full text-text-muted">
              Loading chapters...
            </div>
          ) : (
            <div className="space-y-0">
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
                        "w-full flex flex-col items-start px-6 py-3.5 transition-colors outline-none",
                        isCurrent 
                          ? "bg-accent/10 border-l-2 border-accent" 
                          : "hover:bg-surface-raised/50 border-l-2 border-transparent"
                      )}
                    >
                      <span className={cn(
                        "text-[14px] font-bold line-clamp-1 text-left leading-tight",
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
