import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CONTENT_PREFERENCE_COOKIE, DATA_SAVER_COOKIE, LANGUAGE_PREFERENCE_COOKIE } from "@/shared/sources/content-policy";
import { clearAutomaticAppCaches } from "@/shared/lib/pwa-cache-policy";

function expireAutomaticCachesAfterNsfwOptOut(): void {
  if (typeof caches === "undefined") return;
  // Clear automatic metadata, images and pages from opt-in sessions.
  // Explicit offline downloads and personal records remain untouched.
  void clearAutomaticAppCaches(caches).catch(() => {
    // Storage can be unavailable; UI content boundaries still apply.
  });
}

function syncReadPreferenceCookie(hideNsfw: boolean): void {
  if (typeof document !== "undefined") {
    document.cookie = `${CONTENT_PREFERENCE_COOKIE}=${hideNsfw ? "true" : "false"}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

function syncOtherReadCookies(state: Pick<SettingsState, "dataSaver" | "preferredLanguages">): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DATA_SAVER_COOKIE}=${state.dataSaver === true}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `${LANGUAGE_PREFERENCE_COOKIE}=${encodeURIComponent((state.preferredLanguages ?? DEFAULT_PREFERRED_LANGUAGES).join(","))}; path=/; max-age=31536000; SameSite=Lax`;
}

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

  listingViewMode: "grid" | "compact";
  setListingViewMode: (mode: "grid" | "compact") => void;

  // Guest Sync Reminder Banner
  guestBannerSnoozedUntil: number | null;
  guestBannerDismissCount: number;
  dismissGuestBanner: (totalItems: number) => void;
  resetGuestBanner: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      dataSaver: false,
      setDataSaver: (enabled) => { set({ dataSaver: enabled }); syncOtherReadCookies(get()); },
      hideNsfw: true, // Default to true for safety
      setHideNsfw: (enabled) => {
        const wasHidden = get().hideNsfw;
        syncReadPreferenceCookie(enabled);
        set({ hideNsfw: enabled });
        if (enabled && !wasHidden) expireAutomaticCachesAfterNsfwOptOut();
      },
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
      setPreferredLanguages: (langs) => { set({ preferredLanguages: langs }); syncOtherReadCookies(get()); },
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

      listingViewMode: "grid",
      setListingViewMode: (mode) => set({ listingViewMode: mode }),

      // Guest Sync Reminder Banner Defaults
      guestBannerSnoozedUntil: null,
      guestBannerDismissCount: 0,
      dismissGuestBanner: (totalItems: number) => set((state) => {
        const isEscalated = totalItems >= 15 && state.guestBannerDismissCount > 0;
        const days = isEscalated ? 3 : 7;
        const durationMs = days * 24 * 60 * 60 * 1000;
        return {
          guestBannerSnoozedUntil: Date.now() + durationMs,
          guestBannerDismissCount: state.guestBannerDismissCount + 1,
        };
      }),
      resetGuestBanner: () => set({
        guestBannerSnoozedUntil: null,
        guestBannerDismissCount: 0,
      }),
    }),
    {
      name: "yomirra-settings",
      onRehydrateStorage: () => (state) => {
        syncReadPreferenceCookie(state?.hideNsfw !== false);
        if (state) syncOtherReadCookies(state);
      },
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

/**
 * Precedence: explicit user setting > site default > hardcoded fallback
 */
export function resolveEffectiveDataSaver(
  userExplicitSetting?: boolean | null,
  siteDefault?: boolean | null,
  hardcodedFallback: boolean = false
): boolean {
  if (typeof userExplicitSetting === "boolean") {
    return userExplicitSetting;
  }
  if (typeof siteDefault === "boolean") {
    return siteDefault;
  }
  return hardcodedFallback;
}
