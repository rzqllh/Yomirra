"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useReaderStore } from "@/shared/store/reader-store"
import { CaretLeft, Gear, CaretRight, List, X, CaretUp } from "@phosphor-icons/react"
import { cn } from "@/shared/utils/cn"
import { motion } from "motion/react"

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
  const [showBackToTop, setShowBackToTop] = React.useState(false)

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

  // Immediate overlay auto-dismiss on scroll down, show on scroll up with delta accumulation
  React.useEffect(() => {
    let ticking = false;
    let lastScrollY = window.scrollY;
    let accumulatedDiff = 0;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY;
          
          setShowBackToTop(currentScrollY > 1200);

          // Reset accumulator if scrolling changes direction
          if (Math.sign(diff) !== Math.sign(accumulatedDiff)) {
            accumulatedDiff = 0;
          }
          accumulatedDiff += diff;

          const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;
          
          if (isAtBottom) {
            setOverlayVisible(false);
          } else if (accumulatedDiff > 80) {
            setOverlayVisible(false);
            accumulatedDiff = 0; // Reset after triggering
          } else if (accumulatedDiff < -80) {
            setOverlayVisible(true);
            accumulatedDiff = 0; // Reset after triggering
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
      {/* Top Overlay (Info) */}
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-[var(--z-sticky)] transition-[transform,opacity] duration-200 ease-out pointer-events-none pt-[env(safe-area-inset-top)]",
          isOverlayVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
          isDesktopPanelOpen ? "md:right-[calc(320px)]" : ""
        )}
      >
        <div className={cn(
          "w-full pt-4 pb-12 px-6 flex justify-center",
          preferences.background === 'mist' 
            ? "bg-gradient-to-b from-white/90 via-white/50 to-transparent" 
            : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
        )}>
          <div className="flex flex-col items-center text-center pointer-events-auto max-w-md">
            <span className={cn(
              "text-sm md:text-base font-bold drop-shadow-lg truncate w-full tracking-wide",
              preferences.background === 'mist' ? "text-gray-900" : "text-white"
            )}>{chapterTitle}</span>
            {pageCount && (
              <span className={cn(
                "text-[11px] font-semibold tracking-widest uppercase drop-shadow-md mt-0.5",
                preferences.background === 'mist' ? "text-gray-600" : "text-white/70"
              )}>
                {pageCount} halaman
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Overlay (Controls) */}
      <div 
        className={cn(
          "fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[var(--z-sticky)] transition-[transform,opacity] duration-200 ease-out flex justify-center pointer-events-none",
          isOverlayVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0",
          isDesktopPanelOpen ? "md:right-[calc(320px+1rem)]" : ""
        )}
      >
        <div className="flex w-full max-w-[400px] justify-center items-end gap-3">
          
          {/* Back Circle */}
          <IconButton 
            aria-label="Kembali ke detail manga"
            variant="ghost"
            className="pointer-events-auto flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-surface-glass backdrop-blur-md shadow-sm border border-border-default/30 transition-all duration-300 text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10"
            onClick={(e) => { 
              e.stopPropagation(); 
              router.push(getMangaDetailHref(sourceId, mangaId));
            }}
          >
            <X size={22} weight="bold" />
          </IconButton>
          
          {/* Center Pill: Prev - Ch - Next */}
          <div className="pointer-events-auto flex h-[56px] flex-1 items-center justify-between gap-1 rounded-full bg-surface-glass backdrop-blur-md px-1.5 shadow-sm border border-border-default/30">
            <IconButton 
              aria-label="Chapter sebelumnya"
              variant="ghost"
              className={cn("group relative flex items-center justify-center h-[44px] w-[44px] rounded-full outline-none transition-all duration-300 ease-out text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10", !prevChapterId && "opacity-30 cursor-not-allowed")}
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
              <CaretLeft size={20} weight="regular" />
            </IconButton>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full flex-1 px-2 h-[44px] font-bold text-[13px] bg-accent/15 text-accent hover:bg-accent/25 border border-accent/20 transition-all mx-1"
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsChapterDrawerOpen(true);
              }}
            >
              <List size={16} weight="fill" className="mr-1.5" />
              Ch.
            </Button>

            <IconButton 
              aria-label="Chapter selanjutnya"
              variant="ghost"
              className={cn("group relative flex items-center justify-center h-[44px] w-[44px] rounded-full outline-none transition-all duration-300 ease-out text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10", !nextChapterId && "opacity-30 cursor-not-allowed")}
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
              <CaretRight size={20} weight="regular" />
            </IconButton>
          </div>

          {/* Right Controls: Settings Circle & Back to Top */}
          <div className="flex flex-col gap-3 pointer-events-none items-center">
            {showBackToTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="pointer-events-auto flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-glass backdrop-blur-md shadow-sm border border-border-default/30 text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Kembali ke atas"
              >
                <CaretUp size={20} weight="bold" />
              </motion.button>
            )}

            <IconButton
              aria-label="Pengaturan pembaca"
              className="pointer-events-auto flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-surface-glass backdrop-blur-md shadow-sm border border-border-default/30 transition-all duration-300 text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (window.innerWidth >= 768) {
                  toggleDesktopPanel();
                } else {
                  setIsDrawerOpen(true); 
                }
              }}
            >
              <Gear size={22} weight="regular" />
            </IconButton>
            
            {/* Opsi Revert untuk Settings */}
            {/* <IconButton
              aria-label="Pengaturan pembaca"
              variant="ghost"
              className="pointer-events-auto flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-surface-glass backdrop-blur-md shadow-sm border border-border-default/30 transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth >= 768) {
                  toggleDesktopPanel();
                } else {
                  setIsDrawerOpen(true);
                }
              }}
            >
              <Gear size={22} weight="regular" className="text-text-secondary hover:text-text-primary transition-colors" />
            </IconButton> */}
          </div>
        </div>
      </div>

      {children}

      {/* Settings Drawer */}
      <ReaderSettingsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

      <ReaderChapterDrawer 
        isOpen={isChapterDrawerOpen}
        onClose={() => setIsChapterDrawerOpen(false)}
        chapters={chapters}
        currentChapterId={currentChapterId || ""}
        sourceId={sourceId}
        mangaId={mangaId}
      />
    </div>
  )
}
