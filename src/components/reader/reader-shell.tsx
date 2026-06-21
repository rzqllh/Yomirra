"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useReaderStore } from "@/shared/store/reader-store"
import { CaretLeft, Gear, CaretRight, List } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"

import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes"
import { Chapter } from "@/shared/types/source"
import dynamic from "next/dynamic"

const ReaderSettingsDrawer = dynamic(() => import("./reader-settings-drawer").then(mod => mod.ReaderSettingsDrawer), {
  ssr: false,
})

const ReaderChapterDrawer = dynamic(() => import("./reader-chapter-drawer").then(mod => mod.ReaderChapterDrawer), {
  ssr: false,
})

import { IconButton } from "@/components/ui/icon-button"
import { Button } from "@/components/ui/button"
import { ReaderProgress } from "./reader-progress"
import { toast } from "sonner"
import { useReaderGesture } from "@/shared/hooks/use-reader-gesture"

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
  const { preferences, isOverlayVisible, isDesktopPanelOpen, toggleDesktopPanel, toggleOverlay, setOverlayVisible } = useReaderStore()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = React.useState(false)

  const chapterIndex = chapters?.findIndex(c => c.id === currentChapterId) ?? -1;
  let prevChapterId: string | undefined;
  let nextChapterId: string | undefined;
  
  if (chapterIndex !== -1 && chapters) {
    if (chapterIndex < chapters.length - 1) {
      prevChapterId = chapters[chapterIndex + 1].id;
    }
    if (chapterIndex > 0) {
      nextChapterId = chapters[chapterIndex - 1].id;
    }
  }

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

  // Wake Lock API
  React.useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && (preferences.keepScreenAwake ?? true)) {
        try {
          if (navigator.wakeLock) {
            wakeLock = await navigator.wakeLock.request('screen');
          }
        } catch (err) {
          console.warn('Wake Lock error:', err);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock !== null) {
        wakeLock.release().catch(console.warn);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [preferences.keepScreenAwake]);

  // Gesture-safe overlay toggle (Center 40% tap, <=10px, <=250ms)
  useReaderGesture();

  // Immediate overlay auto-dismiss on scroll
  React.useEffect(() => {
    let ticking = false;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          if (Math.abs(currentScrollY - lastScrollY) > 10) {
            setOverlayVisible(false);
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setOverlayVisible]);

  return (
    <div 
      className={cn(
        "relative min-h-screen w-full transition-[padding] duration-150",
        isDesktopPanelOpen && "md:pr-[320px]"
      )}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <ReaderProgress />
      {/* Bottom Overlay */}
      <div 
        className={cn(
          "fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[var(--z-sticky)] transition-[transform,opacity] duration-150 ease-out flex justify-between items-end pointer-events-none",
          isOverlayVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0",
          isDesktopPanelOpen ? "md:right-[calc(320px+1rem)]" : ""
        )}
      >
        <div className="flex flex-col gap-2 pointer-events-auto max-w-[40%]">
          <div className="flex items-center gap-2 bg-black/30 dark:bg-surface-overlay/80 backdrop-blur-sm rounded-full p-1">
            <IconButton 
              aria-label="Kembali ke detail manga"
              variant="ghost"
              className="rounded-full shrink-0 min-h-[44px] min-w-[44px] text-white dark:text-text-primary hover:bg-white/20 dark:hover:bg-surface-hover drop-shadow-md"
              onClick={(e) => { 
                e.stopPropagation(); 
                router.push(getMangaDetailHref(sourceId, mangaId));
              }}
            >
              <CaretLeft size={20} weight="bold" />
            </IconButton>
            
            <div className="flex flex-col truncate pr-4 text-shadow-sm">
              <span className="text-sm font-bold text-white dark:text-text-primary truncate leading-tight drop-shadow-md">{chapterTitle}</span>
              {pageCount && <span className="text-2xs text-white/80 dark:text-text-muted leading-tight drop-shadow-md">{pageCount} halaman</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end pointer-events-auto shrink-0">
          <div className="flex items-center gap-2 bg-black/30 dark:bg-surface-overlay/80 backdrop-blur-sm rounded-full p-1">
            <IconButton 
              aria-label="Chapter sebelumnya"
              variant="ghost"
              className={cn("rounded-full min-h-[44px] min-w-[44px] text-white dark:text-text-primary hover:bg-white/20 dark:hover:bg-surface-hover drop-shadow-md hidden sm:flex", !prevChapterId && "opacity-50 cursor-not-allowed")}
              disabled={!prevChapterId}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (prevChapterId) {
                  toast.info("Membuka chapter sebelumnya...", { duration: 2000 });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => router.push(getReaderHref(sourceId, mangaId, prevChapterId)), 150);
                }
              }}
            >
              <CaretLeft size={20} weight="bold" />
            </IconButton>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full px-4 min-h-[44px] font-bold text-sm bg-white/10 dark:bg-surface-raised/50 text-white dark:text-text-primary hover:bg-white/20 dark:hover:bg-surface-hover drop-shadow-md"
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsChapterDrawerOpen(true);
              }}
            >
              <List size={16} weight="bold" className="mr-2 hidden sm:block" />
              Ch.
            </Button>

            <IconButton 
              aria-label="Chapter selanjutnya"
              variant="ghost"
              className={cn("rounded-full min-h-[44px] min-w-[44px] text-white dark:text-text-primary hover:bg-white/20 dark:hover:bg-surface-hover drop-shadow-md hidden sm:flex", !nextChapterId && "opacity-50 cursor-not-allowed")}
              disabled={!nextChapterId}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (nextChapterId) {
                  toast.info("Membuka chapter selanjutnya...", { duration: 2000 });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => router.push(getReaderHref(sourceId, mangaId, nextChapterId)), 150);
                }
              }}
            >
              <CaretRight size={20} weight="bold" />
            </IconButton>

            <div className="w-[1px] h-6 bg-white/20 dark:bg-border-glass mx-1" />

            <IconButton
              aria-label="Pengaturan pembaca"
              variant="ghost"
              className="rounded-full min-h-[44px] min-w-[44px] text-white dark:text-text-primary hover:bg-white/20 dark:hover:bg-surface-hover drop-shadow-md"
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
      {isDrawerOpen && (
        <ReaderSettingsDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
        />
      )}

      {isChapterDrawerOpen && (
        <ReaderChapterDrawer 
          isOpen={isChapterDrawerOpen}
          onClose={() => setIsChapterDrawerOpen(false)}
          chapters={chapters}
          currentChapterId={currentChapterId || ""}
          sourceId={sourceId}
          mangaId={mangaId}
        />
      )}
    </div>
  )
}
