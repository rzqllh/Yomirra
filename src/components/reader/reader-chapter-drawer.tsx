import * as React from "react"
import { List, SortAscending, SortDescending } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"
import { IconButton } from "@/components/ui/icon-button"
import { Chapter } from "@/shared/types/source"
import { useRouter } from "next/navigation"
import { getReaderHref } from "@/shared/lib/routes"
import { SearchInput } from "@/components/ui/search-input"
import { ReaderPanelShell } from "./reader-panel-shell"

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
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("asc")
  const activeChapterRef = React.useRef<HTMLButtonElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

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

  // Auto scroll to active chapter when opened
  React.useEffect(() => {
    if (isOpen && activeChapterRef.current && containerRef.current) {
      // Small delay to ensure render is complete before scrolling
      setTimeout(() => {
        if (activeChapterRef.current && containerRef.current) {
          const container = containerRef.current;
          const element = activeChapterRef.current;
          // Calculate center position
          const scrollPos = element.offsetTop - (container.clientHeight / 2) + (element.clientHeight / 2);
          container.scrollTo({ top: scrollPos, behavior: "smooth" });
        }
      }, 150);
    }
  }, [isOpen, sortedChapters]); // Re-run if sorting changes while open

  const headerControls = (
    <div className="flex items-center gap-2.5">
      <SearchInput 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Cari chapter..." 
        containerClassName="flex-1 h-[44px]"
      />
      <IconButton 
        variant="ghost" 
        size="default"
        className={cn(
          "rounded-full min-h-[44px] min-w-[44px] border border-border-subtle shrink-0 transition-colors",
          sortOrder === "asc" ? "bg-accent/15 text-accent border-accent/20" : "bg-surface-glass text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        )}
        onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
        aria-label={sortOrder === "desc" ? "Urutkan lama ke baru" : "Urutkan baru ke lama"}
        title={sortOrder === "desc" ? "Urutkan lama ke baru" : "Urutkan baru ke lama"}
      >
        {sortOrder === "desc" ? <SortDescending size={20} /> : <SortAscending size={20} />}
      </IconButton>
    </div>
  )

  return (
    <ReaderPanelShell
      isOpen={isOpen}
      onClose={onClose}
      title="Daftar Chapter"
      icon={<List size={20} weight="bold" />}
      headerControls={headerControls}
      desktopMode="bottom-dialog"
    >
      <div ref={containerRef} className="h-full overflow-y-auto pb-safe-bottom custom-scrollbar">
        {!chapters ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm font-medium py-10">
            Loading chapters...
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border-subtle/50">
            {sortedChapters.length === 0 ? (
              <div className="text-center py-10 text-sm font-medium text-text-muted">
                Chapter tidak ditemukan.
              </div>
            ) : (
              sortedChapters.map((chapter) => {
                const isCurrent = chapter.id === currentChapterId;
                return (
                  <button
                    key={chapter.id}
                    ref={isCurrent ? activeChapterRef : null}
                    onClick={() => {
                      if (!isCurrent) {
                        router.push(getReaderHref(sourceId, mangaId, chapter.id))
                        onClose()
                      }
                    }}
                    className={cn(
                      "w-full flex flex-col items-start px-5 py-4 transition-colors outline-none",
                      isCurrent 
                        ? "bg-accent/5" 
                        : "hover:bg-surface-hover bg-surface-base"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-bold line-clamp-1 text-left leading-tight",
                      isCurrent ? "text-accent" : "text-text-primary"
                    )}>
                      {chapter.title}
                    </span>
                    <span className={cn(
                      "text-xs mt-1.5 font-medium",
                      isCurrent ? "text-accent/80" : "text-text-secondary"
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
    </ReaderPanelShell>
  )
}
