import * as React from "react";
import { QueryClient } from "@tanstack/react-query";
import { StreamItem } from "@/components/reader/continuous-vertical-reader";
import { getReaderHref } from "@/shared/lib/routes";
import { Virtualizer } from "@tanstack/react-virtual";

interface UseReaderScrollOptions {
  streamItems: StreamItem[];
  virtualizer: Virtualizer<Window, Element>;
  sourceId: string;
  mangaId: string;
  chapterId: string;
  nextChapterId?: string;
  saveProgress: (sourceId: string, mangaId: string, chapterId: string, pageIndex: number, pageOffset?: number) => void;
  queryClient: QueryClient;
}

export function useReaderScroll({
  streamItems,
  virtualizer,
  sourceId,
  mangaId,
  chapterId,
  nextChapterId,
  saveProgress,
  queryClient,
}: UseReaderScrollOptions) {
  const lastActiveChapter = React.useRef(chapterId);
  const scrollStopTimer = React.useRef<NodeJS.Timeout>(undefined);
  const pendingProgressSave = React.useRef<{ chapterId: string; pageIndex: number; offset: number } | null>(null);
  
  // Flush progress immediately if there's pending save
  const flushProgress = React.useCallback(() => {
    if (pendingProgressSave.current) {
      const { chapterId: cId, pageIndex, offset } = pendingProgressSave.current;
      saveProgress(sourceId, mangaId, cId, pageIndex, offset);
      pendingProgressSave.current = null;
    }
  }, [saveProgress, sourceId, mangaId]);

  React.useEffect(() => {
    let ticking = false;
    let hasPrefetched = false;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const now = performance.now();
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          
          // Calculate velocity (pixels per ms)
          const dt = now - lastScrollTime;
          const velocity = dt > 0 ? Math.abs(currentScrollY - lastScrollY) / dt : 0;
          
          lastScrollY = currentScrollY;
          lastScrollTime = now;
          
          // Preload trigger (~2 viewport heights before end AND velocity is positive or already prefetched)
          // We only prefetch if scrolling down reasonably fast (>0.5px/ms) or very close to bottom (< 1 viewport)
          if (!hasPrefetched && nextChapterId && navigator.onLine) {
            const isVeryClose = currentScrollY >= maxScroll - window.innerHeight;
            const isApproachingFast = currentScrollY >= maxScroll - (window.innerHeight * 2) && velocity > 0.5;
            
            if (maxScroll > 0 && (isVeryClose || isApproachingFast)) {
              hasPrefetched = true;
              import("@/shared/api-client").then(m => {
                const queryKey = ["pages", sourceId, nextChapterId];
                queryClient.prefetchQuery({
                  queryKey,
                  queryFn: () => m.apiClient.getPages(sourceId, mangaId, nextChapterId)
                }).then(() => {
                  // After JSON is fetched, preload images via fetch to populate browser cache
                  const data = queryClient.getQueryData<{ pages: { url: string }[] }>(queryKey);
                  if (data && data.pages) {
                    // Preload first 3 pages of next chapter
                    data.pages.slice(0, 3).forEach((p) => {
                      fetch(p.url, { mode: 'no-cors' }).catch(() => {});
                    });
                  }
                });
              });
            }
          }

          // Identify active item for URL replacing and progress
          const virtualItems = virtualizer.getVirtualItems();
          if (virtualItems.length > 0) {
            const centerItem = virtualItems.find(
              (item) => item.start <= currentScrollY + window.innerHeight / 2 && item.end >= currentScrollY + window.innerHeight / 2
            ) || virtualItems[0];
            
            const activeStreamItem = streamItems[centerItem.index];
            
            if (activeStreamItem && activeStreamItem.type === 'image') {
              // Update URL if chapter crossed
              if (activeStreamItem.chapterId !== lastActiveChapter.current) {
                lastActiveChapter.current = activeStreamItem.chapterId;
                window.history.replaceState(null, '', getReaderHref(sourceId, mangaId, activeStreamItem.chapterId));
              }

              // Coalesce write progress on scroll stop (300ms idle)
              const offset = currentScrollY - centerItem.start;
              pendingProgressSave.current = {
                chapterId: activeStreamItem.chapterId,
                pageIndex: activeStreamItem.pageIndex,
                offset,
              };

              if (scrollStopTimer.current) {
                clearTimeout(scrollStopTimer.current);
              }
              scrollStopTimer.current = setTimeout(() => {
                flushProgress();
              }, 300);
            }
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollStopTimer.current) {
        clearTimeout(scrollStopTimer.current);
      }
      // Flush immediately on unmount to not lose progress
      flushProgress();
    };
  }, [sourceId, mangaId, nextChapterId, queryClient, streamItems, virtualizer, flushProgress]);
}
