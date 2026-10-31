"use client";
import { BOOKMARK_SUGGESTION_EVENT, bookmarkSuggestionKey, dismissBookmarkSuggestion, takeBookmarkSuggestion } from "@/shared/lib/bookmark-suggestion";
import { ReaderPageScrubber } from "./reader-page-scrubber";

import * as React from "react"
import { useRouter } from "next/navigation"
import { useReaderStore, useEffectiveReaderPreferences } from "@/shared/store/reader-store"
import { CaretLeft, Gear, CaretRight, List, CaretUp, BookmarkSimple, ArrowLeft, House } from "@phosphor-icons/react"
import { useLibraryStore } from "@/shared/store/library-store"
import { cn } from "@/shared/utils/cn"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { transitions } from "@/shared/lib/motion/tokens"

import { getMangaDetailHref, getReaderHref, getSafeMangaDetailBackHref } from "@/shared/lib/routes"
import { Chapter } from "@/shared/types/source"
import dynamic from "next/dynamic"

const ReaderSettingsDrawer = dynamic(() => import("./reader-settings-drawer").then(mod => mod.ReaderSettingsDrawer), {
  ssr: false,
})

const ReaderChapterDrawer = dynamic(() => import("./reader-chapter-drawer").then(mod => mod.ReaderChapterDrawer), {
  ssr: false,
})

import { IconButton } from "@/components/ui/icon-button"
import { StatusBarBlur } from "@/components/ui/status-bar-blur"
import { toast } from "sonner"
import { useReaderGesture } from "@/shared/hooks/use-reader-gesture"
import { useMounted } from "@/shared/hooks/use-mounted"
import { beginNavigationIntent } from "@/shared/lib/navigation-intent"

interface ReaderShellProps {
  children: React.ReactNode
  isNsfw?: boolean
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
  isNsfw,
  chapterTitle = "Chapter",
  pageCount,
  sourceId,
  mangaId,
  chapters,
  currentChapterId,
}: ReaderShellProps) {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const isOverlayVisible = useReaderStore(state => state.isOverlayVisible);
  const isDesktopPanelOpen = useReaderStore(state => state.isDesktopPanelOpen);
  const toggleDesktopPanel = useReaderStore(state => state.toggleDesktopPanel);
  const toggleOverlay = useReaderStore(state => state.toggleOverlay);
  const setOverlayVisible = useReaderStore(state => state.setOverlayVisible);
  const pageNavigation = useReaderStore(state => state.pageNavigation);
  const preferences = useEffectiveReaderPreferences(sourceId, mangaId);
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

  const isMounted = useMounted()
  const rawIsSaved = useLibraryStore((state) => state.isInLibrary(sourceId, mangaId))
  const isSaved = isMounted ? rawIsSaved : false
  const toggleLibrary = useLibraryStore((state) => state.toggleLibrary)

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rawReturnTo =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("returnTo")
        : null
    const returnTo = getSafeMangaDetailBackHref(rawReturnTo)
    const href = getMangaDetailHref(sourceId, mangaId, returnTo)
    beginNavigationIntent(href)

    router.replace(href);
  }

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasInLibrary = useLibraryStore.getState().isInLibrary(sourceId, mangaId)
    toggleLibrary({
      sourceId,
      mangaId,
      title: mangaTitle || chapterTitle.split(" - ")[0] || "Komik",
      coverUrl: "",
      isNsfw,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    const toastId = `bookmark-toggle-${sourceId}-${mangaId}`
    if (wasInLibrary) {
      toast.info("Dihapus dari Bookmark", {
        id: toastId,
        description: "Komik ini dikeluarkan dari daftar bookmark.",
      })
    } else {
      toast.success("Disimpan ke Bookmark", {
        id: toastId,
        description: "Komik ini ditambahkan ke daftar bookmark.",
      })
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
    const id = bookmarkSuggestionKey(sourceId, mangaId);
    if (!isMounted) return;
    if (isSaved) { dismissBookmarkSuggestion(sourceId, mangaId); toast.dismiss?.(id); return; }
    const showSuggestion = () => {
      if (useLibraryStore.getState().isInLibrary(sourceId, mangaId) || !takeBookmarkSuggestion(sourceId, mangaId)) return;
      toast.info("Simpan bacaan ini ke Library?", {
        id, description: "Sudah lebih dari 3 chapter. Bookmark komik ini supaya mudah dilanjutkan.", duration: 10_000,
        action: { label: "Simpan", onClick: () => {
          if (useLibraryStore.getState().isInLibrary(sourceId, mangaId)) return;
          toggleLibrary({ sourceId, mangaId, title: mangaTitle || "Komik", coverUrl: "", isNsfw, addedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          toast.success("Disimpan ke Library");
        } },
      });
    };
    showSuggestion();
    window.addEventListener(BOOKMARK_SUGGESTION_EVENT, showSuggestion);
    return () => window.removeEventListener(BOOKMARK_SUGGESTION_EVENT, showSuggestion);
  }, [isMounted, isSaved, sourceId, mangaId, mangaTitle, isNsfw, toggleLibrary]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
        toggleOverlay();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
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
          if (document.activeElement?.id === "reader-page-range") { ticking = false; return; }

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
            initial={reducedMotion ? false : { y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { y: -80, opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : transitions.smooth}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.2, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y < -20 || info.velocity.y < -200) {
                setOverlayVisible(false);
              }
            }}
            className={cn(
              "fixed top-0 left-0 right-0 z-[65] pointer-events-none touch-none",
              isDesktopPanelOpen ? "md:right-[calc(320px)]" : ""
            )}
          >
            <div className="w-full pt-[calc(var(--safe-top)+10px)] pb-3 px-3 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "yomirra-chrome pointer-events-auto relative overflow-hidden flex items-center justify-between w-full max-w-md md:max-w-2xl h-[52px] sm:h-[56px] px-2.5 sm:px-3 rounded-full transition-all duration-200 text-text-primary"
                )}
              >
                {/* Left: Back Button */}
                <motion.button
                  aria-label="Kembali ke detail komik"
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                  className="yomirra-chrome-control flex size-11 items-center justify-center rounded-xl text-text-secondary hover:text-text-primary transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={handleBack}
                >
                  <ArrowLeft size={18} weight="regular" />
                </motion.button>

                <IconButton aria-label="Kembali ke Beranda" onClick={(event) => { event.stopPropagation(); if (beginNavigationIntent("/")) router.replace("/"); }}><House size={18} weight="regular" /></IconButton>
                {/* Center: Manga Title (Top) & Chapter (Bottom) */}
                <div className="flex flex-col items-center justify-center px-3 min-w-0 flex-1 select-none">
                  <span className="text-sm sm:text-[15px] font-bold truncate w-full max-w-full tracking-tight text-center leading-tight text-text-primary">
                    {mangaTitle || chapterTitle}
                  </span>
                  {mangaTitle && chapterTitle ? (
                    <span className="text-[10.5px] font-semibold tracking-wider uppercase text-center mt-0.5 truncate w-full max-w-full text-text-muted">
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
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                  className={cn(
                    "yomirra-chrome-control flex size-11 items-center justify-center rounded-xl transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    isSaved
                      ? "bg-accent text-white border-accent shadow-xs"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  )}
                  onClick={handleToggleBookmark}
                >
                  <motion.div
                    key={isSaved ? "saved" : "unsaved"}
                    initial={reducedMotion ? false : { scale: 0.5, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={reducedMotion ? { duration: 0 } : transitions.snappy}
                    className="flex items-center justify-center"
                  >
                    <BookmarkSimple size={18} weight={isSaved ? "fill" : "regular"} />
                  </motion.div>
                </motion.button>


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
            initial={reducedMotion ? false : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { y: 80, opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : transitions.smooth}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 20 || info.velocity.y > 200) {
                setOverlayVisible(false);
              }
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[65] pointer-events-none touch-none pb-[calc(var(--safe-bottom)+12px)] px-3",
              isDesktopPanelOpen ? "md:right-[calc(320px)]" : ""
            )}
          >
            <div className="w-full flex flex-col items-center gap-3">
              {/* Floating Back to Top Button */}
              {showBackToTop && (
                <motion.button
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
                   transition={reducedMotion ? { duration: 0 } : transitions.gentle}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
                  }}
                  className="yomirra-chrome pointer-events-auto self-end flex size-10 items-center justify-center rounded-xl text-text-secondary hover:text-text-primary transition-all  cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Kembali ke atas"
                >
                  <CaretUp size={18} weight="regular" />
                </motion.button>
              )}

              {/* Yomirra Reader Control Dock */}
              <div className="yomirra-chrome pointer-events-auto flex h-[60px] w-full max-w-[440px] mx-auto items-center justify-between gap-2 rounded-full text-text-primary px-3 transition-all duration-200">
                <motion.button
                  aria-label="Chapter sebelumnya"
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                  className={cn(
                    "yomirra-chrome-control flex size-11 items-center justify-center rounded-xl text-text-secondary hover:text-text-primary transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    !prevChapterId && "opacity-30 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={!prevChapterId}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (prevChapterId) {
                      const href = getReaderHref(sourceId, mangaId, prevChapterId);
                      if (beginNavigationIntent(href)) router.replace(href);
                    }
                  }}
                >
                  <CaretLeft size={20} weight="regular" />
                </motion.button>

                <motion.button
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                  className="flex-1 h-11 rounded-xl font-bold text-sm bg-accent hover:bg-accent-hover text-white shadow-xs transition-all truncate px-3.5 flex items-center justify-center gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsChapterDrawerOpen(true);
                  }}
                >
                  <List size={18} weight="regular" className="shrink-0" />
                  <span className="truncate">Daftar chapter</span>
                </motion.button>

                <motion.button
                  aria-label="Chapter berikutnya"
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                  className={cn(
                    "yomirra-chrome-control flex size-11 items-center justify-center rounded-xl text-text-secondary hover:text-text-primary transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    !nextChapterId && "opacity-30 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={!nextChapterId}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (nextChapterId) {
                      const href = getReaderHref(sourceId, mangaId, nextChapterId);
                      if (beginNavigationIntent(href)) router.replace(href);
                    }
                  }}
                >
                  <CaretRight size={20} weight="regular" />
                </motion.button>

                <motion.button
                  aria-label="Pengaturan pembaca"
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                  className="yomirra-chrome-control flex size-11 items-center justify-center rounded-xl text-text-secondary hover:text-text-primary transition-all shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.innerWidth >= 768) {
                      toggleDesktopPanel();
                    } else {
                      setIsDrawerOpen(true);
                    }
                  }}
                >
                  <Gear size={20} weight="regular" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {preferences.showPageProgress && pageNavigation?.key === `${sourceId}::${mangaId}::${currentChapterId}` && (
        <div className={cn("fixed inset-x-0 z-[66] flex justify-center px-3 pointer-events-none", isDesktopPanelOpen && "md:right-[320px]")}
          style={{ bottom: `calc(var(--safe-bottom, 0px) + ${isOverlayVisible ? 82 : 12}px)` }}>
          <ReaderPageScrubber navigation={pageNavigation} direction={preferences.readingDirection} />
        </div>
      )}

      {children}

      {/* Settings Drawer */}
      <ReaderSettingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sourceId={sourceId}
        mangaId={mangaId}
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
