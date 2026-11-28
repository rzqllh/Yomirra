"use client";
import { BOOKMARK_SUGGESTION_EVENT, bookmarkSuggestionKey, dismissBookmarkSuggestion, takeBookmarkSuggestion } from "@/shared/lib/bookmark-suggestion";
import { ReaderPageScrubber } from "./reader-page-scrubber";

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useReaderStore, useEffectiveReaderPreferences } from "@/shared/store/reader-store"
import { CaretDoubleLeft, Gear, CaretDoubleRight, List, CaretUp, BookmarkSimple, ArrowLeft, House } from "@phosphor-icons/react"
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
import { useReaderDockGate } from "@/shared/hooks/use-reader-dock-gate"
import { useMounted } from "@/shared/hooks/use-mounted"
import { useMediaQuery } from "@/shared/hooks/use-media-query"
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
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const readerRoot=React.useRef<HTMLDivElement>(null);
  const {endVisible,dockAwaitingTap}=useReaderDockGate(readerRoot,`${sourceId}::${mangaId}::${currentChapterId??""}`,preferences.readingMode);
  const dockAllowed=!endVisible&&(!dockAwaitingTap||preferences.toolbarBehavior==="always-visible");
  const showDock=isOverlayVisible&&dockAllowed;

  const isScrubbingRef = React.useRef(false);
  const scrubbingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScrubbingChange = React.useCallback((isScrubbing: boolean) => {
    if (scrubbingTimerRef.current) {
      clearTimeout(scrubbingTimerRef.current);
      scrubbingTimerRef.current = null;
    }

    if (isScrubbing) {
      isScrubbingRef.current = true;
    } else {
      // Grace period to allow smooth-scroll inertia and frame settlement
      scrubbingTimerRef.current = setTimeout(() => {
        isScrubbingRef.current = false;
      }, 600);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (scrubbingTimerRef.current) {
        clearTimeout(scrubbingTimerRef.current);
      }
    };
  }, []);
  React.useEffect(()=>{
    const release=()=>{if(isScrubbingRef.current)handleScrubbingChange(false);};
    window.addEventListener("pointerup",release);
    window.addEventListener("pointercancel",release);
    window.addEventListener("blur",release);
    return()=>{window.removeEventListener("pointerup",release);window.removeEventListener("pointercancel",release);window.removeEventListener("blur",release);};
  },[handleScrubbingChange]);


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
      toast.info("Dihapus dari Library", { id: toastId, duration: 2200 })
    } else {
      toast.success("Disimpan ke Library", { id: toastId, duration: 2200 })
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
        id, description: "Sudah membaca lebih dari 3 chapter. Simpan judul ini agar mudah dilanjutkan.", duration: 8_000,
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
      if (e.defaultPrevented || e.target instanceof Element && e.target.closest("input,textarea,select,[contenteditable=true],[role=dialog]") || document.querySelector("[role=dialog][aria-modal=true]")) return;

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

  // Actual readers own their horizontal tap zones; shell handles only
  // fallback content. A single physical tap must never toggle twice.
  useReaderGesture(readerRoot);

  React.useEffect(() => {
    let frame:number|null=null;
    let lastScrollY=Math.max(0,window.scrollY);
    let distance=0;
    const handleScroll=()=>{
      if(frame!==null)return;
      frame=window.requestAnimationFrame(()=>{
        frame=null;
        const y=Math.max(0,window.scrollY),delta=y-lastScrollY;
        lastScrollY=y;
        setShowBackToTop(y>1200);
        // Slider focus alone is not an active scrub; release/blur ends it.
        if(isScrubbingRef.current||preferences.toolbarBehavior==="always-visible"){
          distance=0;return;
        }
        distance+=Math.abs(delta);
        if(distance>=60){setOverlayVisible(false);distance=0;}
      });
    };
    // Explicit show intent wins over scroll events already queued before it.
    // Snapshot the current position synchronously; later genuine movement can
    // still hide the chrome normally.
    const unsubscribe=useReaderStore.subscribe((state,prior)=>{
      if(state.isOverlayVisible&&!prior.isOverlayVisible){
        if(frame!==null)window.cancelAnimationFrame(frame);
        frame=null;distance=0;lastScrollY=Math.max(0,window.scrollY);
        setShowBackToTop(lastScrollY>1200);
      }
    });
    window.addEventListener("scroll",handleScroll,{passive:true});
    return()=>{unsubscribe();window.removeEventListener("scroll",handleScroll);if(frame!==null)window.cancelAnimationFrame(frame);};
  },[setOverlayVisible,preferences.toolbarBehavior,currentChapterId]);

  return (
    <div
      ref={readerRoot}
      className={cn(
        "reader-contrast-scope relative min-h-screen w-full transition-[padding,background-color] duration-150",
        isDesktopPanelOpen && "md:pr-80",
        isLightReader ? "light" : "dark"
      )}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {/* Compact Transparent Status Bar Blur Layer (Locked precisely to safe-top notch with zero bleed) */}
      <StatusBarBlur className={cn(isDesktopPanelOpen && "md:right-80")} />

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
              "fixed top-0 left-0 right-0 z-[var(--z-reader-dock)] pointer-events-none touch-none",
              isDesktopPanelOpen ? "md:right-80" : ""
            )}
          >
            <div className="w-full pt-[calc(var(--safe-top)+10px)] pb-3 px-3 flex items-center justify-center pointer-events-none">
              <header
                className={cn(
                  "pointer-events-auto relative overflow-hidden border border-border-glass reader-chrome-surface grid grid-cols-[92px_minmax(0,1fr)_92px] items-center w-full max-w-lg md:max-w-2xl min-h-14 sm:min-h-15 px-1.5 sm:px-3 rounded-2xl transition-colors duration-200 text-text-primary bg-surface-overlay shadow-none"
                )}
              >
                {/* Left Cluster: Back to Detail + Home Navigation */}
                <div className="flex items-center gap-1 shrink-0">
                  <motion.button
                    aria-label="Kembali ke detail komik"
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className="yomirra-chrome-control reader-chrome-control flex size-11 items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover/80 transition-colors motion-reduce:transition-none shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    onClick={handleBack}
                  >
                    <ArrowLeft size={18} weight="regular" />
                  </motion.button>

                  <motion.button
                    aria-label="Kembali ke Beranda"
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className="yomirra-chrome-control reader-chrome-control flex size-11 items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover/80 transition-colors motion-reduce:transition-none shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                    className="reader-chrome-muted text-xs font-medium text-text-muted truncate w-full max-w-full text-center leading-tight tracking-tight"
                    title={mangaTitle || chapterTitle}
                  >
                    {mangaTitle || chapterTitle}
                  </span>
                  {mangaTitle && chapterTitle ? (
                    <span
                      className="reader-chrome-primary text-xs sm:text-sm font-bold text-text-primary truncate w-full max-w-full text-center mt-0.5 leading-tight tracking-tight"
                      title={chapterTitle}
                    >
                      {chapterTitle}
                    </span>
                  ) : pageCount ? (
                    <span
                      className="reader-chrome-muted text-xs font-semibold text-text-muted truncate w-full max-w-full text-center mt-0.5 leading-tight tracking-tight"
                      title={`${pageCount} halaman`}
                    >
                      {pageCount} halaman
                    </span>
                  ) : null}
                </div>

                {/* Right Cluster: Bookmark Action with Symmetrical Width */}
                <div className="flex items-center justify-end shrink-0">
                  <motion.button
                    aria-label={isSaved ? "Hapus dari Library" : "Simpan ke Library"}
                    aria-pressed={isSaved}
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className={cn(
                      "yomirra-chrome-control reader-chrome-control flex size-11 items-center justify-center rounded-xl transition-colors motion-reduce:transition-none shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      isSaved
                        ? "bg-accent text-accent-on border-accent shadow-xs"
                        : "text-text-muted hover:text-text-primary hover:bg-surface-hover/80 "
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

      {/* End card owns bottom navigation; unmount immediately while visible. */}
      {dockAllowed && <AnimatePresence>
        {showDock && (
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
              "yomirra-dock-frame fixed bottom-0 left-0 right-0 z-[var(--z-reader-dock)] pointer-events-none touch-none",
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
                  className="reader-chrome-surface reader-chrome-control reader-back-to-top pointer-events-auto self-end flex size-11 items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover/80 transition-all cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label="Kembali ke bagian atas pembaca"
                >
                  <CaretUp size={18} weight="regular" />
                </motion.button>
              )}

              {/* Yomirra Reader Unified Control Dock */}
              <div role="group" aria-label="Kontrol pembaca" className="reader-chrome-surface yomirra-dock-surface yomirra-reader-dock pointer-events-auto flex w-full max-w-md flex-col gap-2 p-2 sm:p-2.5 text-text-primary">
                {/* Embedded Page Scrubber when page navigation is available */}
                {preferences.showPageProgress && pageNavigation?.key === `${sourceId}::${mangaId}::${currentChapterId}` && (
                  <>
                    <ReaderPageScrubber
                      navigation={pageNavigation}
                      direction={preferences.readingDirection}
                      format={format}
                      onScrubbingChange={handleScrubbingChange}
                    />
                    <div className="reader-chrome-divider h-px w-full" />
                  </>
                )}

                {/* Chapter Navigation Controls */}
                <div className="flex h-[var(--dock-target)] items-center justify-between gap-1">
                  <motion.button
                    aria-label="Chapter sebelumnya"
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className={cn(
                      "yomirra-chrome-control reader-chrome-control flex size-11 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover/80 transition-colors motion-reduce:transition-none shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      !prevChapterId && "cursor-not-allowed"
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
                    className="reader-chrome-control reader-chapter-control min-w-0 flex-1 h-11 rounded-full text-xs font-semibold transition-colors px-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
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
                      "yomirra-chrome-control reader-chrome-control flex size-11 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover/80 transition-colors motion-reduce:transition-none shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      !nextChapterId && "cursor-not-allowed"
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
                    aria-expanded={isDrawerOpen || (isDesktopPanelOpen && isDesktop)}
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className="yomirra-chrome-control reader-chrome-control flex size-11 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover/80 transition-colors motion-reduce:transition-none shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDesktop) {
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
      </AnimatePresence>}

      {/* Unobtrusive Minimal Page Badge while reading (overlay hidden) */}
      {dockAllowed && !isOverlayVisible && preferences.showPageProgress && pageNavigation?.key === `${sourceId}::${mangaId}::${currentChapterId}` && (
        <div
          className={cn(
            "fixed right-3 z-30 pointer-events-none transition-all duration-200",
            isDesktopPanelOpen && "md:right-83"
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
