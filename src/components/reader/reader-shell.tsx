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
  const { preferences, isOverlayVisible, isDesktopPanelOpen, toggleDesktopPanel, toggleOverlay } = useReaderStore()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const getBackgroundColor = () => {
    switch (preferences.background) {
      case 'deepLagoon': return '#003135';
      case 'mist': return '#f8fafc';
      case 'black':
      default: return '#000000';
    }
  }

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
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {/* Top Overlay */}
      <div 
        className={cn(
          "fixed top-4 left-4 right-4 z-[var(--z-sticky)] transition-all duration-300 ease-out flex justify-between pointer-events-none",
          isOverlayVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0",
          isDesktopPanelOpen ? "md:right-[calc(320px+1rem)]" : ""
        )}
        style={{ marginTop: 'var(--safe-top)' }}
      >
        <div className="flex items-center gap-2 bg-surface-overlay/80 backdrop-blur-xl border border-border-glass rounded-full p-1 shadow-sm pointer-events-auto max-w-[75%] md:max-w-md">
          <IconButton 
            aria-label="Kembali ke detail manga"
            variant="ghost"
            className="rounded-full shrink-0"
            onClick={(e) => { 
              e.stopPropagation(); 
              router.push(getMangaDetailHref(sourceId, mangaId));
            }}
          >
            <CaretLeft size={20} weight="bold" />
          </IconButton>
          
          <div className="flex flex-col truncate pr-4">
            <span className="text-sm font-bold text-text-primary truncate leading-tight">{chapterTitle}</span>
            {pageCount && <span className="text-2xs text-text-muted leading-tight">{pageCount} halaman</span>}
          </div>
        </div>

        <div className="bg-surface-overlay/80 backdrop-blur-xl border border-border-glass rounded-full p-1 shadow-sm pointer-events-auto shrink-0">
          <IconButton
            aria-label="Pengaturan pembaca"
            variant="ghost"
            className="rounded-full"
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
