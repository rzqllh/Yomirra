import * as React from "react"
import { List, SortAscending, SortDescending } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"
import { IconButton } from "@/components/ui/icon-button"
import { Chapter } from "@/shared/types/source"
import { useRouter } from "next/navigation"
import { getReaderHref } from "@/shared/lib/routes"
import { SearchInput } from "@/components/ui/search-input"
import { ReaderPanelShell } from "./reader-panel-shell"
import { beginNavigationIntent } from "@/shared/lib/navigation-intent"

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

  const currentChapter = React.useMemo(() => {
    if (!chapters || !currentChapterId) return undefined;
    return chapters.find(c => {
      if (c.id === currentChapterId) return true;
      try {
        return Boolean(currentChapterId && c.id === decodeURIComponent(currentChapterId));
      } catch {
        return false;
      }
    });
  }, [chapters, currentChapterId]);

  const sortedChapters = React.useMemo(() => {
    if (!chapters) return [];

    let result = chapters;
    if (searchQuery.trim()) {
      const raw = searchQuery.trim().toLowerCase();
      const normalized = raw.replace(",", ".").replace(/^(?:ch(?:apter)?|bab)\s*/i, "");
      const hasNormalized = Boolean(normalized);
      result = result.filter(c => {
        const titleLower = c.title.toLowerCase();
        const numStr = String(c.number ?? "");
        return (
          titleLower.includes(raw) ||
          (hasNormalized && titleLower.includes(normalized)) ||
          numStr.includes(raw) ||
          (hasNormalized && numStr.includes(normalized))
        );
      });
    }

    if (sortOrder === "asc") return [...result].reverse();
    return result;
  }, [chapters, sortOrder, searchQuery]);

  React.useEffect(() => {
    if (!isOpen) return;

    const scrollToActive = () => {
      const active = activeChapterRef.current;
      const container = containerRef.current;
      if (!active) return;

      if (typeof active.scrollIntoView === "function") {
        active.scrollIntoView({ block: "center", behavior: "smooth" });
      } else if (container) {
        const scrollTop = active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
        container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
      }
    };

    const frame = requestAnimationFrame(scrollToActive);
    const timer = setTimeout(scrollToActive, 250);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [isOpen, sortedChapters, currentChapterId]);

  const headerControls = (
    <div className="space-y-2">
    <p className="text-xs text-text-secondary" role="status">
      {chapters ? `${sortedChapters.length} dari ${chapters.length} chapter` : "Memuat chapter…"}
      {" · "}{sortOrder === "asc" ? "Lama ke baru" : "Baru ke lama"}
      {currentChapter
        ? ` · Sedang dibaca: ${
            currentChapter.number != null
              ? `Ch. ${currentChapter.number}`
              : currentChapter.title.match(/\d+(?:\.\d+)?/)?.[0]
              ? `Ch. ${currentChapter.title.match(/\d+(?:\.\d+)?/)?.[0]}`
              : currentChapter.title
          }`
        : ""}
    </p>
    <div className="flex items-center gap-2.5">
      <SearchInput
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Cari nomor atau judul chapter…"
        containerClassName="flex-1 h-11"
      />
      <IconButton
        variant="ghost"
        size="default"
        className={cn(
          "rounded-xl size-11 border border-border-subtle shrink-0 transition-colors",
          sortOrder === "asc" ? "bg-accent/15 text-accent border-accent/20" : "bg-surface-glass text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        )}
        onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
        aria-label={sortOrder === "desc" ? "Urutkan lama ke baru" : "Urutkan baru ke lama"}
        title={sortOrder === "desc" ? "Urutkan lama ke baru" : "Urutkan baru ke lama"}
        aria-pressed={sortOrder === "asc"}
      >
        {sortOrder === "desc" ? <SortDescending size={20} /> : <SortAscending size={20} />}
      </IconButton>
    </div>
    </div>
  )

  return (
    <ReaderPanelShell
      isOpen={isOpen}
      onClose={onClose}
      title="Daftar chapter"
      icon={<List size={20} weight="regular" />}
      headerControls={headerControls}
      desktopMode="bottom-dialog"
    >
      <div ref={containerRef} className="h-full overflow-y-auto overscroll-contain pb-[var(--safe-bottom)] custom-scrollbar">
        {!chapters ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm font-medium py-10">
            Memuat daftar chapter…
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
                          const href = getReaderHref(sourceId, mangaId, chapter.id)
                          if (beginNavigationIntent(href)) {
                            onClose()
                            router.replace(href)
                          }
                        }
                      }}
                      className={cn(
                        "min-h-11 rounded-xl min-w-0 break-words border px-2 py-2 text-sm font-bold motion-safe:transition-[background-color,border-color,color,transform] outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-safe:active:scale-[0.97]",
                        isCurrent
                          ? "border-accent bg-accent text-accent-on shadow-xs"
                          : "border-border-subtle bg-surface-raised text-text-secondary hover:border-border-strong hover:text-text-primary hover:bg-surface-hover"
                      )}
                      aria-current={isCurrent ? "page" : undefined}
                      aria-label={`Chapter ${numberLabel}${isCurrent ? ", sedang dibaca" : ""}`}
                      title={chapter.title}
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
