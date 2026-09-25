"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useReaderStore } from "@/shared/store/reader-store"
import { CaretLeft, Gear, CaretRight, List, CaretUp, BookmarkSimple, BookOpen, ArrowLeft } from "@phosphor-icons/react"
import { useLibraryStore } from "@/shared/store/library-store"
import { cn } from "@/shared/utils/cn"
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react"
import { transitions } from "@/shared/lib/motion/tokens"

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
import { StatusBarBlur } from "@/components/ui/status-bar-blur"
import { toast } from "sonner"
import { useReaderGesture } from "@/shared/hooks/use-reader-gesture"
import { useMounted } from "@/shared/hooks/use-mounted"

interface ReaderShellProps {
  children: React.ReactNode
  mangaTitle?: string
  chapterTitle?: string
  pageCount?: number
  currentChapterId?: string
  sourceId: string
  mangaId: string
  chapters?: Chapter[]
}

export function ReaderShell({
  children,
  mangaTitle,
  chapterTitle = "Chapter",
  pageCount,
  sourceId,
  mangaId,
  chapters,
  currentChapterId,
}: ReaderShellProps) {
  const router = useRouter()
  const { preferences, isOverlayVisible, isDesktopPanelOpen, toggleDesktopPanel, toggleOverlay, setOverlayVisible, pagedProgress } = useReaderStore()
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = React.useState(false)
  const [showBackToTop, setShowBackToTop] = React.useState(false)

  const { scrollYProgress } = useScroll()
  const springScrollProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })
  const isPaged = preferences.readingMode === "paged"

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

  const isMounted = useMounted()
  const rawIsSaved = useLibraryStore((state) => state.isInLibrary(sourceId, mangaId))
  const isSaved = isMounted ? rawIsSaved : false
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary)

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    const returnTo =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("returnTo") || undefined
        : undefined
    router.replace(getMangaDetailHref(sourceId, mangaId, returnTo))
  }

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleLibrary({
      sourceId,
      mangaId,
      title: mangaTitle || chapterTitle.split(" - ")[0] || "Komik",
      coverUrl: "",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    toast.success(isSaved ? "Dihapus dari bookmark" : "Disimpan ke bookmark")
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
        isDesktopPanelOpen && "md:pr-[320px]",
        preferences.background !== 'mist' && "dark"
      )}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {/* Compact Transparent Status Bar Blur Layer (Locked precisely to safe-top notch with zero bleed) */}
      <StatusBarBlur className={cn(isDesktopPanelOpen && "md:right-[320px]")} />

      {/* Top Overlay (Option A: Back + Info + Bookmark with Spring Animation & High Contrast) */}
      <AnimatePresence>
        {isOverlayVisible && (
          <motion.div
            key="reader-top-overlay"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={transitions.smooth}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.2, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y < -20 || info.velocity.y < -200) {
                setOverlayVisible(false);
              }
            }}
            className={cn(
              "fixed top-0 left-0 right-0 z-[var(--z-sticky)] pointer-events-none touch-none",
              isDesktopPanelOpen ? "md:right-[calc(320px)]" : ""
            )}
          >
            <div className="w-full pt-[calc(var(--safe-top)+10px)] pb-3 px-3 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "pointer-events-auto relative overflow-hidden flex items-center justify-between w-full max-w-md md:max-w-2xl h-[52px] sm:h-[56px] px-2.5 sm:px-3 rounded-full transition-all duration-300 shadow-xl border",
                  "bg-surface-overlay/95 backdrop-blur-xl border-border-subtle text-text-primary"
                )}
              >
                {/* Left: Back Button */}
                <motion.button
                  aria-label="Kembali ke detail komik"
                  whileTap={{ scale: 0.9 }}
                  className="flex size-9 items-center justify-center rounded-xl bg-surface-raised hover:bg-surface-hover active:scale-95 text-text-secondary hover:text-text-primary border border-border-subtle transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={handleBack}
                >
                  <ArrowLeft size={18} weight="bold" />
                </motion.button>

                {/* Center: Manga Title (Top) & Chapter (Bottom) */}
                <div className="flex flex-col items-center justify-center px-3 min-w-0 flex-1 select-none">
                  <span className="text-sm sm:text-[15px] font-bold truncate max-w-[220px] sm:max-w-[400px] tracking-tight text-center leading-tight text-text-primary">
                    {mangaTitle || chapterTitle}
                  </span>
                  {mangaTitle && chapterTitle ? (
                    <span className="text-[10.5px] font-semibold tracking-wider uppercase text-center mt-0.5 truncate max-w-[200px] sm:max-w-[360px] text-text-muted">
                      {chapterTitle}
                    </span>
                  ) : pageCount ? (
                    <span className="text-[10.5px] font-semibold tracking-wider uppercase text-center mt-0.5 text-text-muted">
                      {pageCount} halaman
                    </span>
                  ) : null}
                </div>

                {/* Right: Bookmark Button */}
                <motion.button
                  aria-label={isSaved ? "Hapus dari bookmark" : "Simpan ke bookmark"}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl transition-all shrink-0 cursor-pointer outline-none border focus-visible:ring-2 focus-visible:ring-accent",
                    isSaved
                      ? "bg-accent text-white border-accent shadow-xs"
                      : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  )}
                  onClick={handleToggleBookmark}
                >
                  <motion.div
                    key={isSaved ? "saved" : "unsaved"}
                    initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="flex items-center justify-center"
                  >
                    <BookmarkSimple size={18} weight={isSaved ? "fill" : "bold"} />
                  </motion.div>
                </motion.button>

                {/* Bottom edge reading progress bar (start to finish) */}
                {preferences.showPageProgress && (
                  <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-black/10 dark:bg-white/10 pointer-events-none overflow-hidden">
                    {isPaged ? (
                      <motion.div
                        data-testid="reader-progress-bar"
                        className="h-full bg-accent origin-left shadow-[0_0_8px_var(--color-accent)]"
                        initial={false}
                        animate={{ width: `${Math.max(0, Math.min(100, pagedProgress * 100))}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    ) : (
                      <motion.div
                        data-testid="reader-progress-bar"
                        className="h-full bg-accent origin-left shadow-[0_0_8px_var(--color-accent)]"
                        style={{ scaleX: springScrollProgress }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Overlay (Option A: Compact High-Contrast Squircle Dock with Spring Animation) */}
      <AnimatePresence>
        {isOverlayVisible && (
          <motion.div
            key="reader-bottom-overlay"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={transitions.smooth}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 20 || info.velocity.y > 200) {
                setOverlayVisible(false);
              }
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] pointer-events-none touch-none pb-[calc(var(--safe-bottom)+12px)] px-3",
              isDesktopPanelOpen ? "md:right-[calc(320px)]" : ""
            )}
          >
            <div className="w-full flex flex-col items-center gap-3">
              {/* Floating Back to Top Button (Squircle) */}
              {showBackToTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="pointer-events-auto self-end flex h-10 w-10 items-center justify-center rounded-[12px] liquid-glass text-white/80 transition-all active:scale-95 cursor-pointer outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                  aria-label="Kembali ke atas"
                >
                  <CaretUp size={18} weight="bold" />
                </motion.button>
              )}

              {/* Floating Back to Top Button */}
              {showBackToTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="pointer-events-auto self-end flex size-10 items-center justify-center rounded-xl bg-surface-overlay/95 backdrop-blur-xl border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all active:scale-95 cursor-pointer outline-none shadow-lg focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Kembali ke atas"
                >
                  <CaretUp size={18} weight="bold" />
                </motion.button>
              )}

              {/* Yomirra Ink Editorial Bottom Dock */}
              <div className="pointer-events-auto flex h-[58px] sm:h-[62px] w-full max-w-[440px] sm:max-w-[480px] mx-auto items-center justify-between gap-2 rounded-full bg-surface-overlay/95 backdrop-blur-xl border border-border-subtle text-text-primary px-3 shadow-2xl transition-all duration-300">
                <motion.button
                  aria-label="Chapter sebelumnya"
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl bg-surface-raised hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    !prevChapterId && "opacity-30 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={!prevChapterId}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (prevChapterId) {
                      toast.info("Membuka chapter sebelumnya...", { duration: 1500 });
                      router.replace(getReaderHref(sourceId, mangaId, prevChapterId));
                    }
                  }}
                >
                  <CaretLeft size={20} weight="bold" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 h-10 rounded-xl font-bold text-sm bg-accent hover:bg-accent-hover text-white shadow-xs transition-all truncate px-3 flex items-center justify-center gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsChapterDrawerOpen(true);
                  }}
                >
                  <List size={18} weight="bold" className="shrink-0" />
                  <span className="truncate">Daftar Chapter</span>
                </motion.button>

                <motion.button
                  aria-label="Chapter selanjutnya"
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl bg-surface-raised hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    !nextChapterId && "opacity-30 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={!nextChapterId}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (nextChapterId) {
                      toast.info("Membuka chapter selanjutnya...", { duration: 1500 });
                      router.replace(getReaderHref(sourceId, mangaId, nextChapterId));
                    }
                  }}
                >
                  <CaretRight size={20} weight="bold" />
                </motion.button>

                <motion.button
                  aria-label="Pengaturan pembaca"
                  whileTap={{ scale: 0.9 }}
                  className="flex size-10 items-center justify-center rounded-xl bg-surface-raised hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.innerWidth >= 768) {
                      toggleDesktopPanel();
                    } else {
                      setIsDrawerOpen(true);
                    }
                  }}
                >
                  <Gear size={20} weight="bold" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Viewport Reading Progress Bar - Active when header is hidden (Auto-hide transition to status bar) */}
      <AnimatePresence>
        {!isOverlayVisible && preferences.showPageProgress && (
          <motion.div
            key="top-viewport-progress"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed z-[99999] top-[var(--safe-top,0px)] md:top-0 left-0 right-0 h-[2.5px] pointer-events-none bg-black/20 dark:bg-white/10 overflow-hidden transition-[padding] duration-150",
              isDesktopPanelOpen && "md:right-[320px]"
            )}
          >
            {isPaged ? (
              <motion.div
                data-testid="top-viewport-progress-bar"
                className="h-full bg-accent origin-left shadow-[0_0_8px_var(--color-accent),0_1px_2px_rgba(0,0,0,0.3)]"
                initial={false}
                animate={{ width: `${Math.max(0, Math.min(100, pagedProgress * 100))}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            ) : (
              <motion.div
                data-testid="top-viewport-progress-bar"
                className="h-full bg-accent origin-left shadow-[0_0_8px_var(--color-accent),0_1px_2px_rgba(0,0,0,0.3)]"
                style={{ scaleX: springScrollProgress }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
