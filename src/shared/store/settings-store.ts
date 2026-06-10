import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  dataSaver: boolean;
  setDataSaver: (enabled: boolean) => void;
  hideNsfw: boolean;
  setHideNsfw: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dataSaver: false,
      setDataSaver: (enabled) => set({ dataSaver: enabled }),
      hideNsfw: true, // Default to true for safety
      setHideNsfw: (enabled) => set({ hideNsfw: enabled }),
    }),
    {
      name: "yomirra-settings",
    }
  )
);
