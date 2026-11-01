import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReaderPreferences } from "@/shared/types/manga";

export interface ReaderPageNavigation {
  key: string;
  index: number;
  total: number;
  seek: (index: number) => void;
  previous?: () => void;
  next?: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
}

interface ReaderState {
  pageNavigation: ReaderPageNavigation | null;
  setPageNavigation: (navigation: ReaderPageNavigation | null) => void;
  preferences: ReaderPreferences;
  updatePreferences: (prefs: Partial<ReaderPreferences>) => void;
  perTitlePreferences: Record<string, Partial<ReaderPreferences>>;
  getTitlePreferences: (sourceId: string, mangaId: string) => ReaderPreferences;
  updateTitlePreferences: (sourceId: string, mangaId: string, prefs: Partial<ReaderPreferences>) => void;
  resetTitlePreferences: (sourceId: string, mangaId: string) => void;
  isOverlayVisible: boolean;
  toggleOverlay: () => void;
  setOverlayVisible: (visible: boolean) => void;
  isDesktopPanelOpen: boolean;
  toggleDesktopPanel: () => void;
  pagedProgress: number;
  setPagedProgress: (progress: number) => void;
}

const defaultPreferences: ReaderPreferences = {
  imageFit: "width",
  pageGap: "none",
  background: "black",
  toolbarBehavior: "auto-hide",
  preloadIntensity: "balanced",
  showPageProgress: true,
  disableDoubleTapZoom: false,
  readingDirection: 'ltr',
  readingMode: 'vertical',
  keepScreenAwake: true,
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      pageNavigation: null,
      setPageNavigation: (pageNavigation) => set({ pageNavigation }),
      updatePreferences: (newPrefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPrefs },
        })),
      perTitlePreferences: {},
      getTitlePreferences: (sourceId, mangaId) => {
        const key = `${sourceId}::${mangaId}`;
        const titleSpecific = get().perTitlePreferences[key];
        if (!titleSpecific) return get().preferences;
        return { ...get().preferences, ...titleSpecific };
      },
      updateTitlePreferences: (sourceId, mangaId, newPrefs) =>
        set((state) => {
          const key = `${sourceId}::${mangaId}`;
          const current = state.perTitlePreferences[key] || {};
          return {
            perTitlePreferences: {
              ...state.perTitlePreferences,
              [key]: { ...current, ...newPrefs },
            },
          };
        }),
      resetTitlePreferences: (sourceId, mangaId) =>
        set((state) => {
          const key = `${sourceId}::${mangaId}`;
          const next = { ...state.perTitlePreferences };
          delete next[key];
          return { perTitlePreferences: next };
        }),
      isOverlayVisible: true,
      toggleOverlay: () =>
        set((state) => ({ isOverlayVisible: !state.isOverlayVisible })),
      setOverlayVisible: (visible) => set({ isOverlayVisible: visible }),
      isDesktopPanelOpen: true,
      toggleDesktopPanel: () =>
        set((state) => ({ isDesktopPanelOpen: !state.isDesktopPanelOpen })),
      pagedProgress: 0,
      setPagedProgress: (progress) => set({ pagedProgress: Math.max(0, Math.min(1, progress)) }),
    }),
    {
      name: "manga-reader-settings", // keep the same name for migration
      partialize: (state) => ({ 
        preferences: state.preferences, 
        perTitlePreferences: state.perTitlePreferences, 
        isDesktopPanelOpen: state.isDesktopPanelOpen 
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- persistedState can be anything from localStorage including legacy versions
      merge: (persistedState: any, currentState: ReaderState) => {
        // Safe migration from old `settings` to new `preferences`
        let mergedPreferences = { ...currentState.preferences };
        
        if (persistedState) {
          // If the old state had `settings` (old ReaderSettings object)
          if (persistedState.settings) {
            // Map old backgroundColor to the new predefined backgrounds if possible
            if (persistedState.settings.backgroundColor) {
               const oldBg = persistedState.settings.backgroundColor;
               if (oldBg === "#000000") mergedPreferences.background = "black";
               else if (oldBg === "#1e293b" || oldBg === "#0f172a") mergedPreferences.background = "deepLagoon";
               else if (oldBg === "#ffffff" || oldBg === "#f8fafc") mergedPreferences.background = "mist";
            }
            
            // Map old padding to pageGap
            if (typeof persistedState.settings.padding === "number") {
               if (persistedState.settings.padding === 0) mergedPreferences.pageGap = "none";
               else if (persistedState.settings.padding <= 4) mergedPreferences.pageGap = "small";
               else mergedPreferences.pageGap = "comfortable";
            }
          }
          
          // If the user already has the new `preferences`
          if (persistedState.preferences) {
            mergedPreferences = { ...mergedPreferences, ...persistedState.preferences };
          }
        }

        return {
          ...currentState,
          ...persistedState,
          preferences: mergedPreferences,
        };
      },
    }
  )
);

/**
 * Hook to select effective reader preferences stably for a title context.
 * Uses separate stable Zustand selectors and memoizes the merged object,
 * preventing referential inequality and getSnapshot re-render thrashing.
 */
export function useEffectiveReaderPreferences(sourceId?: string, mangaId?: string): ReaderPreferences {
  const globalPreferences = useReaderStore((state) => state.preferences);
  const titleKey = sourceId && mangaId ? `${sourceId}::${mangaId}` : null;
  const perTitle = useReaderStore((state) => (titleKey ? state.perTitlePreferences[titleKey] : undefined));

  return React.useMemo(() => {
    if (!perTitle) return globalPreferences;
    return { ...globalPreferences, ...perTitle };
  }, [globalPreferences, perTitle]);
}
