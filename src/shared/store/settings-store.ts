import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  dataSaver: boolean;
  setDataSaver: (enabled: boolean) => void;
  hideNsfw: boolean;
  setHideNsfw: (enabled: boolean) => void;
  lastSyncedAt: string | null;
  setLastSyncedAt: (date: string | null) => void;
  isGodMode: boolean;
  setGodMode: (enabled: boolean) => void;
  toggleGodMode: () => void;
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
      isGodMode: false,
      setGodMode: (enabled) => set({ isGodMode: enabled }),
      toggleGodMode: () => set((state) => ({ isGodMode: !state.isGodMode })),
    }),
    {
      name: "yomirra-settings",
      partialize: (state) => {
        const { isGodMode, ...rest } = state;
        return rest;
      }
    }
  )
);
