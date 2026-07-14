import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StatsState {
  totalReadingTimeMs: number;
  addReadingTime: (ms: number) => void;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      totalReadingTimeMs: 0,
      addReadingTime: (ms) => set((state) => ({ totalReadingTimeMs: state.totalReadingTimeMs + ms })),
    }),
    {
      name: "yomirra-stats",
    }
  )
);
