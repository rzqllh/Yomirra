import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReaderPreferences } from "@/shared/types/manga";

interface ReaderState {
  preferences: ReaderPreferences;
  updatePreferences: (prefs: Partial<ReaderPreferences>) => void;
  isOverlayVisible: boolean;
  toggleOverlay: () => void;
  setOverlayVisible: (visible: boolean) => void;
  isDesktopPanelOpen: boolean;
  toggleDesktopPanel: () => void;
}

const defaultPreferences: ReaderPreferences = {
  imageFit: "width",
  pageGap: "none",
  background: "black",
  toolbarBehavior: "auto-hide",
  preloadIntensity: "balanced",
  showPageProgress: true,
  keepScreenAwake: true,
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      updatePreferences: (newPrefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPrefs },
        })),
      isOverlayVisible: true,
      toggleOverlay: () =>
        set((state) => ({ isOverlayVisible: !state.isOverlayVisible })),
      setOverlayVisible: (visible) => set({ isOverlayVisible: visible }),
      isDesktopPanelOpen: true,
      toggleDesktopPanel: () =>
        set((state) => ({ isDesktopPanelOpen: !state.isDesktopPanelOpen })),
    }),
    {
      name: "manga-reader-settings", // keep the same name for migration
      partialize: (state) => ({ preferences: state.preferences, isDesktopPanelOpen: state.isDesktopPanelOpen }),
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
