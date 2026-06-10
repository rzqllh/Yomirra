"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useReaderStore } from "@/shared/store/reader-store"
import { CaretLeft, Gear, List } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

import { getMangaDetailHref } from "@/shared/lib/routes"
import { ReaderSettingsDrawer } from "./reader-settings-drawer"
import { IconButton } from "@/components/ui/icon-button"
import { Button } from "@/components/ui/button"

interface ReaderShellProps {
  children: React.ReactNode
  chapterTitle?: string
  pageCount?: number
  currentChapterId?: string
  sourceId: string
  mangaId: string
}

export function ReaderShell({ children, chapterTitle = "Chapter", pageCount, sourceId, mangaId }: ReaderShellProps) {
  const router = useRouter()
  const { settings, isOverlayVisible, isDesktopPanelOpen, toggleDesktopPanel } = useReaderStore()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

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
          "fixed top-0 left-0 z-50 transition-all duration-200 ease-out",
          isOverlayVisible ? "translate-y-0" : "-translate-y-full",
          isDesktopPanelOpen ? "md:right-[320px] right-0" : "right-0"
        )}
      >
        <div className="flex h-[calc(60px+env(safe-area-inset-top))] items-center justify-between bg-surface-base/95 backdrop-blur-md px-4 border-b border-border-subtle pt-[env(safe-area-inset-top)] shadow-sm">
          
          <div className="flex items-center gap-3">
            <IconButton 
              aria-label="Kembali ke detail manga"
              variant="reader"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push(getMangaDetailHref(sourceId, mangaId));
                }
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
            {pageCount && <span className="block text-[11px] text-text-muted mt-0.5">{pageCount} halaman</span>}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="reader"
              size="sm"
              className="hidden md:inline-flex rounded-full"
            >
              <List size={16} weight="bold" />
              Daftar Chapter
            </Button>
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

      {/* Bottom Overlay (Mobile only) */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-200 ease-out md:hidden",
          isOverlayVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between bg-surface-base/95 backdrop-blur-md px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border-subtle">
          <Button variant="ghost" size="sm" className="uppercase tracking-wider text-[13px]">
            Sebelumnya
          </Button>
          <div className="text-[11px] font-bold text-text-muted tracking-widest uppercase">
             Chapter
          </div>
          <Button variant="ghost" size="sm" className="uppercase tracking-wider text-[13px]">
            Selanjutnya
          </Button>
        </div>
      </div>

      {/* Settings Drawer */}
      <ReaderSettingsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  )
}
