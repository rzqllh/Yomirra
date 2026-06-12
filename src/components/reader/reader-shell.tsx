"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useReaderStore } from "@/shared/store/reader-store"
import { CaretLeft, Gear } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

import { getMangaDetailHref } from "@/shared/lib/routes"
import { Chapter } from "@/shared/types/source"
import { ReaderSettingsDrawer } from "./reader-settings-drawer"
import { IconButton } from "@/components/ui/icon-button"

interface ReaderShellProps {
  children: React.ReactNode
  chapterTitle?: string
  pageCount?: number
  currentChapterId?: string
  sourceId: string
  mangaId: string
  chapters?: Chapter[]
}

export function ReaderShell({ children, chapterTitle = "Chapter", pageCount, sourceId, mangaId, chapters, currentChapterId }: ReaderShellProps) {
  const router = useRouter()
  const { settings, isOverlayVisible, isDesktopPanelOpen, toggleDesktopPanel, toggleOverlay } = useReaderStore()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
        toggleOverlay();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleOverlay]);

  return (
    <div 
      className={cn(
        "relative min-h-screen w-full transition-all duration-300",
        isDesktopPanelOpen && "md:pr-[320px]"
      )}
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {/* Top Overlay */}
      <div 
        className={cn(
          "fixed top-0 left-0 z-50 transition-all duration-300 ease-out",
          isOverlayVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
          isDesktopPanelOpen ? "md:right-[320px] right-0" : "right-0"
        )}
      >
        <div className="flex h-[calc(60px+env(safe-area-inset-top))] items-center justify-between bg-surface-base/85 backdrop-blur-xl px-2 md:px-4 border-b border-border-subtle/50 pt-[env(safe-area-inset-top)] shadow-sm">
          
          <div className="flex items-center gap-1 md:gap-3">
            <IconButton 
              aria-label="Kembali ke detail manga"
              variant="reader"
              onClick={(e) => { 
                e.stopPropagation(); 
                router.push(getMangaDetailHref(sourceId, mangaId));
              }}
            >
              <CaretLeft size={20} weight="bold" />
            </IconButton>
            <div className="hidden md:block">
              <span className="text-[15px] font-bold text-text-primary line-clamp-1">{chapterTitle}</span>
              {pageCount && <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{pageCount} halaman</span>}
            </div>
          </div>
          
          <div className="md:hidden text-center flex-1 truncate px-2">
            <span className="block text-sm font-bold text-text-primary truncate">{chapterTitle}</span>
            {pageCount && <span className="block text-[11px] text-text-secondary mt-0.5">{pageCount} halaman</span>}
          </div>

          <div className="flex items-center gap-2">
            <IconButton
              aria-label="Pengaturan pembaca"
              variant="reader"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (window.innerWidth >= 768) {
                  toggleDesktopPanel();
                } else {
                  setIsDrawerOpen(true); 
                }
              }}
            >
              <Gear size={20} weight="fill" />
            </IconButton>
          </div>
        </div>
      </div>

      {children}

      {/* Settings Drawer */}
      {/* Settings Drawer / Desktop Panel */}
      <ReaderSettingsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        chapters={chapters}
        currentChapterId={currentChapterId}
        sourceId={sourceId}
        mangaId={mangaId}
      />
    </div>
  )
}
