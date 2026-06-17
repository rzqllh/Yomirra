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
import { ReaderProgress } from "./reader-progress"

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
  React.useEffect(() => {
    let pointerState = { startX: 0, startY: 0, time: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Ignore if clicking on UI elements
      if ((e.target as Element).closest('button, a, [role="button"], .pointer-events-auto')) return;
      
      pointerState = {
        startX: e.clientX,
        startY: e.clientY,
        time: Date.now()
      };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if ((e.target as Element).closest('button, a, [role="button"], .pointer-events-auto')) return;

      const duration = Date.now() - pointerState.time;
      const deltaX = Math.abs(e.clientX - pointerState.startX);
      const deltaY = Math.abs(e.clientY - pointerState.startY);

      // Strict intent disambiguation
      if (duration <= 250 && deltaX <= 10 && deltaY <= 10) {
        const viewportHeight = window.innerHeight;
        const tapY = e.clientY;
        const topBoundary = viewportHeight * 0.3;
        const bottomBoundary = viewportHeight * 0.7;

        // Only toggle if tap is within the center 40%
        if (tapY >= topBoundary && tapY <= bottomBoundary) {
          toggleOverlay();
        }
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [toggleOverlay]);

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
      {/* Top Overlay */}
      <div 
        className={cn(
          "fixed top-4 left-4 right-4 z-[var(--z-sticky)] transition-[transform,opacity] duration-150 ease-out flex justify-between pointer-events-none",
          isOverlayVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0",
          isDesktopPanelOpen ? "md:right-[calc(320px+1rem)]" : ""
        )}
        style={{ marginTop: 'var(--safe-top)' }}
      >
        <div className="flex items-center gap-2 bg-black/20 dark:bg-surface-overlay/80 backdrop-blur-md border border-border-glass rounded-full p-1 shadow-md pointer-events-auto max-w-[75%] md:max-w-md">
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

        <div className="bg-black/20 dark:bg-surface-overlay/80 backdrop-blur-xl border border-border-glass rounded-full p-1 shadow-md pointer-events-auto shrink-0">
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
