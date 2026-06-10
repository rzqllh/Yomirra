import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReaderSettings } from "@/shared/types/manga";

interface ReaderState {
  settings: ReaderSettings;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  isOverlayVisible: boolean;
  toggleOverlay: () => void;
  setOverlayVisible: (visible: boolean) => void;
  isDesktopPanelOpen: boolean;
  toggleDesktopPanel: () => void;
}

const defaultSettings: ReaderSettings = {
  direction: "RTL",
  mode: "PAGED",
  backgroundColor: "#000000",
  padding: 0,
  maxWidth: 800,
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
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
      name: "manga-reader-settings",
      partialize: (state) => ({ settings: state.settings, isDesktopPanelOpen: state.isDesktopPanelOpen }),
    }
  )
);
