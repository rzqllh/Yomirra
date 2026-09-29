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

  React.useEffect(() => {
    if (!isOpen) return;
    let innerFrame = 0;
    const frame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        const active = activeChapterRef.current;
        const container = containerRef.current;
        if (!active || !container) return;
        const scrollTop =
          active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
        const top = Math.max(0, scrollTop);
        if (typeof container.scrollTo === "function") {
          container.scrollTo({ top, behavior: "instant" });
        } else {
          container.scrollTop = top;
        }
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      if (innerFrame) cancelAnimationFrame(innerFrame);
    };
  }, [isOpen, sortedChapters]);

  const headerControls = (
    <div className="flex items-center gap-2.5">
      <SearchInput 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Cari nomor chapter…" 
        containerClassName="flex-1 h-[44px]"
      />
      <IconButton 
        variant="ghost" 
        size="default"
        className={cn(
          "rounded-xl min-h-[44px] min-w-[44px] border border-border-subtle shrink-0 transition-colors",
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
      title="Chapter"
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
          <div className="p-4 sm:p-5">
            {sortedChapters.length === 0 ? (
              <div className="text-center py-10 text-sm font-medium text-text-muted">
                Chapter tidak ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {sortedChapters.map((chapter) => {
                  const decodedCurrent = (() => {
                    try {
                      return decodeURIComponent(currentChapterId || "");
                    } catch {
                      return currentChapterId || "";
                    }
                  })();
                  const isCurrent =
                    chapter.id === currentChapterId || chapter.id === decodedCurrent;
                  const numberLabel =
                    chapter.number != null
                      ? String(chapter.number)
                      : chapter.title.match(/\d+(?:\.\d+)?/)?.[0] ?? chapter.title;

                  return (
                    <button
                      key={chapter.id}
                      ref={isCurrent ? activeChapterRef : null}
                      onClick={() => {
                        if (!isCurrent) {
                          router.replace(getReaderHref(sourceId, mangaId, chapter.id))
                          onClose()
                        }
                      }}
                      className={cn(
                        "min-h-10 rounded-xl border px-2 text-sm font-bold transition-[background-color,border-color,color,transform] outline-none active:scale-[0.97]",
                        isCurrent
                          ? "border-accent bg-accent text-accent-on shadow-xs"
                          : "border-border-subtle bg-surface-raised text-text-secondary hover:border-border-strong hover:text-text-primary hover:bg-surface-hover"
                      )}
                      aria-current={isCurrent ? "page" : undefined}
                      aria-label={`Chapter ${numberLabel}${isCurrent ? ", sedang dibaca" : ""}`}
                    >
                      {numberLabel}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </ReaderPanelShell>
  )
}
