import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  dataSaver: boolean;
  setDataSaver: (enabled: boolean) => void;
  hideNsfw: boolean;
  setHideNsfw: (enabled: boolean) => void;
  lastSyncedAt: string | null;
  setLastSyncedAt: (date: string | null) => void;
  keepScreenAwake: boolean;
  setKeepScreenAwake: (enabled: boolean) => void;

  // Notification Preferences
  checkOnAppStart: boolean;
  setCheckOnAppStart: (enabled: boolean) => void;
  minimumCheckIntervalMinutes: number;
  setMinimumCheckIntervalMinutes: (minutes: number) => void;
  notifyForAllLibraryItems: boolean;
  setNotifyForAllLibraryItems: (enabled: boolean) => void;
  mutedMangaKeys: string[];
  muteManga: (key: string) => void;
  unmuteManga: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dataSaver: false,
      setDataSaver: (enabled) => set({ dataSaver: enabled }),
      hideNsfw: true, // Default to true for safety
      setHideNsfw: (enabled) => set({ hideNsfw: enabled }),
      lastSyncedAt: null,
      setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
      keepScreenAwake: true,
      setKeepScreenAwake: (enabled) => set({ keepScreenAwake: enabled }),

      // Notification Preferences Defaults
      checkOnAppStart: true,
      setCheckOnAppStart: (enabled) => set({ checkOnAppStart: enabled }),
      minimumCheckIntervalMinutes: 15,
      setMinimumCheckIntervalMinutes: (minutes) => set({ minimumCheckIntervalMinutes: minutes }),
      notifyForAllLibraryItems: true,
      setNotifyForAllLibraryItems: (enabled) => set({ notifyForAllLibraryItems: enabled }),
      mutedMangaKeys: [],
      muteManga: (key) => set((state) => ({
        mutedMangaKeys: state.mutedMangaKeys.includes(key)
          ? state.mutedMangaKeys
          : [...state.mutedMangaKeys, key]
      })),
      unmuteManga: (key) => set((state) => ({
        mutedMangaKeys: state.mutedMangaKeys.filter(k => k !== key)
      })),
    }),
    {
      name: "yomirra-settings",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Safe migration from v0 to v1
          persistedState.checkOnAppStart = true;
          persistedState.minimumCheckIntervalMinutes = 15;
          persistedState.notifyForAllLibraryItems = true;
          persistedState.mutedMangaKeys = [];
        }
        return persistedState as SettingsState;
      },
      partialize: (state) => {
        // Remove transient states from persistence
        return state;
      },
    }
  )
);
