import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SourceRoutingMode = "MANUAL" | "PREFERRED" | "AUTO_SAFE";

export const DEFAULT_GLOBAL_SOURCE_ORDER: string[] = [
  "mangadex",
  "komiku",
  "komiknesia",
  "komikindo",
  "komiku-ii",
  "asurascans",
  "shinigami",
];

export const DEFAULT_PREFERRED_LANGUAGES: string[] = ["id", "en"];

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

  routingMode: SourceRoutingMode;
  setRoutingMode: (mode: SourceRoutingMode) => void;
  globalSourceOrder: string[];
  setGlobalSourceOrder: (order: string[]) => void;
  preferredLanguages: string[];
  setPreferredLanguages: (langs: string[]) => void;
  perTitleSourcePreferences: Record<string, string>;
  setPerTitleSourcePreference: (titleKey: string, sourceId: string) => void;
  clearPerTitleSourcePreference: (titleKey: string) => void;
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

      routingMode: "PREFERRED",
      setRoutingMode: (mode) => set({ routingMode: mode }),
      globalSourceOrder: DEFAULT_GLOBAL_SOURCE_ORDER,
      setGlobalSourceOrder: (order) => set({ globalSourceOrder: order }),
      preferredLanguages: DEFAULT_PREFERRED_LANGUAGES,
      setPreferredLanguages: (langs) => set({ preferredLanguages: langs }),
      perTitleSourcePreferences: {},
      setPerTitleSourcePreference: (titleKey, sourceId) => set((state) => ({
        perTitleSourcePreferences: {
          ...state.perTitleSourcePreferences,
          [titleKey]: sourceId,
        }
      })),
      clearPerTitleSourcePreference: (titleKey) => set((state) => {
        const next = { ...state.perTitleSourcePreferences };
        delete next[titleKey];
        return { perTitleSourcePreferences: next };
      }),
    }),
    {
      name: "yomirra-settings",
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          persistedState.checkOnAppStart = true;
          persistedState.minimumCheckIntervalMinutes = 15;
          persistedState.notifyForAllLibraryItems = true;
          persistedState.mutedMangaKeys = [];
        }
        if (version < 2) {
          persistedState.routingMode = persistedState.routingMode || "PREFERRED";
          persistedState.globalSourceOrder = persistedState.globalSourceOrder || DEFAULT_GLOBAL_SOURCE_ORDER;
          persistedState.preferredLanguages = persistedState.preferredLanguages || DEFAULT_PREFERRED_LANGUAGES;
          persistedState.perTitleSourcePreferences = persistedState.perTitleSourcePreferences || {};
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
