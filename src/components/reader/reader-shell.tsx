"use client";
import { BOOKMARK_SUGGESTION_EVENT, bookmarkSuggestionKey, dismissBookmarkSuggestion, takeBookmarkSuggestion } from "@/shared/lib/bookmark-suggestion";
import { ReaderPageScrubber } from "./reader-page-scrubber";

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useReaderStore, useEffectiveReaderPreferences } from "@/shared/store/reader-store"
import { CaretLeft, CaretDoubleLeft, Gear, CaretRight, CaretDoubleRight, List, CaretUp, BookmarkSimple, ArrowLeft, House } from "@phosphor-icons/react"
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

import { StatusBarBlur } from "@/components/ui/status-bar-blur"
import { toast } from "sonner"
import { useReaderGesture } from "@/shared/hooks/use-reader-gesture"
import { useMounted } from "@/shared/hooks/use-mounted"
import { beginNavigationIntent } from "@/shared/lib/navigation-intent"

interface ReaderShellProps {
  children: React.ReactNode
  isNsfw?: boolean
  mangaTitle?: string
  coverUrl?: string
  chapterTitle?: string
  pageCount?: number
  currentChapterId?: string
  sourceId: string
  mangaId: string
  chapters?: Chapter[]
  format?: string
}

export function ReaderShell({
  children,
  mangaTitle,
  coverUrl,
  isNsfw,
  chapterTitle = "Chapter",
  pageCount,
  sourceId,
  mangaId,
  chapters,
  currentChapterId,
  format,
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

  const isScrubbingRef = React.useRef(false);
  const scrubbingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScrubbingChange = React.useCallback((isScrubbing: boolean) => {
    if (scrubbingTimerRef.current) {
      clearTimeout(scrubbingTimerRef.current);
      scrubbingTimerRef.current = null;
    }

    if (isScrubbing) {
      isScrubbingRef.current = true;
      setOverlayVisible(true);
    } else {
      // Grace period to allow smooth-scroll inertia and frame settlement
      scrubbingTimerRef.current = setTimeout(() => {
        isScrubbingRef.current = false;
      }, 600);
    }
  }, [setOverlayVisible]);

  React.useEffect(() => {
    return () => {
      if (scrubbingTimerRef.current) {
        clearTimeout(scrubbingTimerRef.current);
      }
    };
  }, []);


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

  const getResolvedCoverUrl = () => {
    if (coverUrl) return coverUrl;
    const existing = useLibraryStore.getState().items[`${sourceId}::${mangaId}`];
    return existing?.coverUrl || "";
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasInLibrary = useLibraryStore.getState().isInLibrary(sourceId, mangaId)
    toggleLibrary({
      sourceId,
      mangaId,
      title: mangaTitle || chapterTitle.split(" - ")[0] || "Komik",
      coverUrl: getResolvedCoverUrl(),
      isNsfw,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    const toastId = `bookmark-toggle-${sourceId}-${mangaId}`
    if (wasInLibrary) {
      toast.info("Dihapus dari Bookmark", { id: toastId })
    } else {
      toast.success("Disimpan ke Bookmark", { id: toastId })
    }
  }

  const { resolvedTheme } = useTheme();
  const isLightReader =
    preferences.background === "mist" ||
    (preferences.background === "system" && resolvedTheme === "light");

  const getBackgroundColor = () => {
    switch (preferences.background) {
      case "system":
        return resolvedTheme === "light" ? "#eef0f5" : "#000000";
      case "mist":
        return "#eef0f5";
      case "deepLagoon":
        return "#003135";
      case "black":
      default:
        return "#000000";
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
          toggleLibrary({ sourceId, mangaId, title: mangaTitle || "Komik", coverUrl: getResolvedCoverUrl(), isNsfw, addedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
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
          const activeId = document.activeElement?.id;
          const isRangeActive = activeId === "reader-page-range" || activeId === "reader-webtoon-range";

          if (isScrubbingRef.current || isRangeActive) {
            lastScrollY = currentScrollY;
            accumulatedDiff = 0;
            ticking = false;
            return;
          }

          setShowBackToTop(currentScrollY > 1200);

          // Reset accumulator if scrolling changes direction
          if (Math.sign(diff) !== Math.sign(accumulatedDiff)) {
            accumulatedDiff = 0;
          }
          accumulatedDiff += diff;

          const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;

          if (isAtBottom) {
            setOverlayVisible(true);
          } else if (accumulatedDiff > 60) {
            setOverlayVisible(false);
            accumulatedDiff = 0; // Reset after triggering
          } else if (accumulatedDiff < -30) {
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

  // Desktop mouse proximity & arrow key awareness for showing chrome without forcing click
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
      const isNearTop = e.clientY <= 70;
      const isNearBottom = e.clientY >= window.innerHeight - 90;

      if (isNearTop || isNearBottom) {
        setOverlayVisible(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        setOverlayVisible(true);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setOverlayVisible]);

  return (
    <div
      className={cn(
        "relative min-h-screen w-full transition-[padding,background-color] duration-150",
        isDesktopPanelOpen && "md:pr-[320px]",
        isLightReader ? "light" : "dark"
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
              <header
                className={cn(
                  "yomirra-chrome pointer-events-auto relative overflow-hidden grid grid-cols-[84px_1fr_84px] sm:grid-cols-[96px_1fr_96px] items-center w-full max-w-lg md:max-w-2xl h-[54px] sm:h-[58px] px-2 sm:px-3 rounded-2xl transition-all duration-200 text-text-primary shadow-lg"
                )}
              >
                {/* Left Cluster: Back to Detail + Home Navigation */}
                <div className="flex items-center gap-1 shrink-0">
                  <motion.button
                    aria-label="Kembali ke detail komik"
                    whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                    className="yomirra-chrome-control flex size-9 sm:size-10 items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 transition-all shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    onClick={handleBack}
                  >
                    <ArrowLeft size={18} weight="regular" />
                  </motion.button>

                  <motion.button
                    aria-label="Kembali ke Beranda"
                    whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                    className="yomirra-chrome-control flex size-9 sm:size-10 items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 transition-all shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (beginNavigationIntent("/")) router.replace("/");
                    }}
                  >
                    <House size={18} weight="regular" />
                  </motion.button>
                </div>

                {/* Center Cluster: Mathematically & Visually Centered Manga & Chapter Hierarchy */}
                <div className="flex flex-col items-center justify-center px-1.5 min-w-0 select-none text-center overflow-hidden">
                  <span
                    className="text-xs sm:text-[12.5px] font-medium text-text-muted truncate w-full max-w-full text-center leading-tight tracking-tight"
                    title={mangaTitle || chapterTitle}
                  >
                    {mangaTitle || chapterTitle}
                  </span>
                  {mangaTitle && chapterTitle ? (
                    <span
                      className="text-[13px] sm:text-[14px] font-bold text-text-primary truncate w-full max-w-full text-center mt-0.5 leading-tight tracking-tight"
                      title={chapterTitle}
                    >
                      {chapterTitle}
                    </span>
                  ) : pageCount ? (
                    <span
                      className="text-[12px] sm:text-[13px] font-semibold text-text-muted truncate w-full max-w-full text-center mt-0.5 leading-tight tracking-tight"
                      title={`${pageCount} halaman`}
                    >
                      {pageCount} halaman
                    </span>
                  ) : null}
                </div>

                {/* Right Cluster: Bookmark Action with Symmetrical Width */}
                <div className="flex items-center justify-end shrink-0">
                  <motion.button
                    aria-label={isSaved ? "Hapus dari bookmark" : "Simpan ke bookmark"}
                    whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                    className={cn(
                      "yomirra-chrome-control flex size-9 sm:size-10 items-center justify-center rounded-xl transition-all shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      isSaved
                        ? "bg-accent text-accent-on border-accent shadow-xs"
                        : "text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95"
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
              </header>
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
              "yomirra-dock-frame fixed bottom-0 left-0 right-0 z-[65] pointer-events-none touch-none",
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
                  className="yomirra-chrome pointer-events-auto self-end flex size-10 items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 transition-all cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label="Kembali ke bagian atas pembaca"
                >
                  <CaretUp size={18} weight="regular" />
                </motion.button>
              )}

              {/* Yomirra Reader Unified Control Dock */}
              <div role="group" aria-label="Kontrol pembaca" className="yomirra-chrome yomirra-dock-surface yomirra-reader-dock pointer-events-auto flex w-full max-w-[460px] flex-col gap-2 p-2 sm:p-2.5 text-text-primary">
                {/* Embedded Page Scrubber when page navigation is available */}
                {preferences.showPageProgress && pageNavigation?.key === `${sourceId}::${mangaId}::${currentChapterId}` && (
                  <>
                    <ReaderPageScrubber
                      navigation={pageNavigation}
                      direction={preferences.readingDirection}
                      format={format}
                      onScrubbingChange={handleScrubbingChange}
                    />
                    <div className="h-px w-full bg-border-subtle" />
                  </>
                )}

                {/* Chapter Navigation Controls */}
                <div className="flex h-[var(--dock-target)] items-center justify-between gap-1">
                  <motion.button
                    aria-label="Chapter sebelumnya"
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className={cn(
                      "yomirra-chrome-control flex size-11 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 transition-all shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
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
                    <CaretDoubleLeft size={20} weight="regular" />
                  </motion.button>

                  <motion.button
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className="min-w-0 flex-1 h-9 rounded-full bg-surface-base/60 hover:bg-surface-raised border border-border-subtle/80 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all px-3 flex items-center justify-center gap-1.5 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsChapterDrawerOpen(true);
                    }}
                  >
                    <List size={16} weight="regular" className="shrink-0 text-accent" />
                    <span className="truncate">Daftar chapter</span>
                  </motion.button>

                  <motion.button
                    aria-label="Chapter berikutnya"
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className={cn(
                      "yomirra-chrome-control flex size-11 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 transition-all shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
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
                    <CaretDoubleRight size={20} weight="regular" />
                  </motion.button>

                  <motion.button
                    aria-label="Pengaturan pembaca"
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className="yomirra-chrome-control flex size-11 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover/80 active:scale-95 transition-all shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unobtrusive Minimal Page Badge while reading (overlay hidden) */}
      {!isOverlayVisible && preferences.showPageProgress && pageNavigation?.key === `${sourceId}::${mangaId}::${currentChapterId}` && (
        <div
          className={cn(
            "fixed right-3 z-30 pointer-events-none transition-all duration-200",
            isDesktopPanelOpen && "md:right-[332px]"
          )}
          style={{ bottom: "calc(var(--safe-bottom, 0px) + 12px)" }}
        >
          <ReaderPageScrubber
            navigation={pageNavigation}
            direction={preferences.readingDirection}
            format={format}
            minimal
          />
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
