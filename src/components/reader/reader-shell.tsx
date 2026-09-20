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
            {/* Compact Transparent Status Bar Blur Layer (Strictly confined to safe-top) */}
            <div
              className="absolute inset-x-0 top-0 pointer-events-none -z-10 overflow-hidden"
              style={{
                height: "var(--safe-top, env(safe-area-inset-top, 44px))",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                maskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) calc(var(--safe-top, env(safe-area-inset-top, 44px)) - 8px), rgba(0,0,0,0) 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) calc(var(--safe-top, env(safe-area-inset-top, 44px)) - 8px), rgba(0,0,0,0) 100%)",
              }}
            />

            <div className="w-full pt-[calc(var(--safe-top)+10px)] pb-3 px-3 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "pointer-events-auto relative overflow-hidden flex items-center justify-between w-full max-w-[420px] h-[52px] px-2 rounded-[18px] transition-all duration-300 shadow-sm border",
                  preferences.background === 'mist'
                    ? "bg-white/80 backdrop-blur-xl border-black/10 text-gray-900 shadow-md"
                    : "bg-black/65 backdrop-blur-xl border-white/15 text-white shadow-lg"
                )}
              >
                {/* Left: Back Button (Squircle) */}
                <motion.button
                  aria-label="Kembali ke detail komik"
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[10px] transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                    preferences.background === 'mist'
                      ? "text-gray-800 hover:bg-black/5"
                      : "text-white/85 hover:text-white hover:bg-white/10"
                  )}
                  onClick={handleBack}
                >
                  <ArrowLeft size={20} weight="bold" />
                </motion.button>

                {/* Center: Manga Title (Top) & Chapter (Bottom) */}
                <div className="flex flex-col items-center justify-center px-2 min-w-0 flex-1 select-none">
                  <span className={cn(
                    "text-sm font-bold truncate max-w-[200px] sm:max-w-[260px] tracking-tight text-center leading-tight",
                    preferences.background === 'mist' ? "text-gray-950" : "text-white"
                  )}>
                    {mangaTitle || chapterTitle}
                  </span>
                  {mangaTitle && chapterTitle ? (
                    <span className={cn(
                      "text-[10px] font-semibold tracking-wider uppercase text-center mt-0.5 truncate max-w-[190px] sm:max-w-[240px]",
                      preferences.background === 'mist' ? "text-gray-500" : "text-white/60"
                    )}>
                      {chapterTitle}
                    </span>
                  ) : pageCount ? (
                    <span className={cn(
                      "text-[10px] font-semibold tracking-wider uppercase text-center mt-0.5",
                      preferences.background === 'mist' ? "text-gray-500" : "text-white/60"
                    )}>
                      {pageCount} halaman
                    </span>
                  ) : null}
                </div>

                {/* Right: Bookmark Button (Squircle) */}
                <motion.button
                  aria-label={isSaved ? "Hapus dari bookmark" : "Simpan ke bookmark"}
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[10px] transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                    isSaved
                      ? "bg-accent text-white shadow-[0_2px_12px_rgba(99,102,241,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/20"
                      : preferences.background === 'mist'
                        ? "text-gray-800 hover:bg-black/5"
                        : "text-white/85 hover:text-white hover:bg-white/10"
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
                    <BookmarkSimple size={19} weight={isSaved ? "fill" : "bold"} />
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

              {/* iOS Liquid Glass Concentric Squircle Dock */}
              <div className="pointer-events-auto flex h-[58px] w-full max-w-[420px] mx-auto items-center justify-between gap-1.5 rounded-[22px] liquid-glass text-text-primary px-2.5 transition-all duration-300">


                {/* 2. Prev Chapter (Squircle) */}
                <motion.button
                  aria-label="Chapter sebelumnya"
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-[12px] transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                    preferences.background === 'mist'
                      ? "text-gray-800 hover:bg-black/5"
                      : "text-white/80 hover:text-white hover:bg-white/10",
                    !prevChapterId && "opacity-25 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={!prevChapterId}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (prevChapterId) {
                      toast.info("Membuka chapter sebelumnya...", { duration: 1500 });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setTimeout(() => router.replace(getReaderHref(sourceId, mangaId, prevChapterId)), 150);
                    }
                  }}
                >
                  <CaretLeft size={20} weight="bold" />
                </motion.button>

                {/* 3. Chapter List Drawer Trigger (Squircle rounded-[12px], NOT Pill!) */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 h-10 rounded-[12px] font-bold text-sm bg-accent hover:bg-accent-hover text-white shadow-[0_4px_16px_rgba(108,106,250,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all truncate px-2.5 sm:px-3 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsChapterDrawerOpen(true);
                  }}
                >
                  <List size={18} weight="bold" className="mr-1.5 shrink-0" />
                  <span className="truncate">Daftar Chapter</span>
                </motion.button>

                {/* 4. Next Chapter (Squircle) */}
                <motion.button
                  aria-label="Chapter selanjutnya"
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-[12px] transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                    preferences.background === 'mist'
                      ? "text-gray-800 hover:bg-black/5"
                      : "text-white/80 hover:text-white hover:bg-white/10",
                    !nextChapterId && "opacity-25 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={!nextChapterId}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (nextChapterId) {
                      toast.info("Membuka chapter selanjutnya...", { duration: 1500 });
                      setTimeout(() => router.replace(getReaderHref(sourceId, mangaId, nextChapterId)), 150);
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <CaretRight size={20} weight="bold" />
                </motion.button>

                {/* 5. Reader Settings (Squircle) */}
                <motion.button
                  aria-label="Pengaturan pembaca"
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-[12px] transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                    preferences.background === 'mist'
                      ? "text-gray-800 hover:bg-black/5"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
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

      {/* Top Viewport Reading Progress Bar - Active when header is hidden (Auto-hide transition) */}
      <AnimatePresence>
        {!isOverlayVisible && preferences.showPageProgress && (
          <motion.div
            key="top-viewport-progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[99999] top-0 left-0 right-0 h-[2.5px] pointer-events-none"
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
