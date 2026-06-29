import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  dataSaver: boolean;
  setDataSaver: (enabled: boolean) => void;
  hideNsfw: boolean;
  setHideNsfw: (enabled: boolean) => void;
  lastSyncedAt: string | null;
  setLastSyncedAt: (date: string | null) => void;
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
    }),
    {
      name: "yomirra-settings",
      partialize: (state) => {
        // Remove transient states from persistence
        return state;
      },
    }
  )
);
