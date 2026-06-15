import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ReaderProgress {
  scrollY: number;
  page: number;
  timestamp: number;
}

interface ReaderProgressState {
  progress: Record<string, ReaderProgress>;
  saveProgress: (sourceId: string, mangaId: string, chapterId: string, scrollY: number, page: number) => void;
  getProgress: (sourceId: string, mangaId: string, chapterId: string) => ReaderProgress | undefined;
}

const getProgressKey = (sourceId: string, mangaId: string, chapterId: string) => 
  `progress:${sourceId}:${mangaId}:${chapterId}`;

export const useReaderProgressStore = create<ReaderProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      saveProgress: (sourceId, mangaId, chapterId, scrollY, page) => set((state) => {
        const key = getProgressKey(sourceId, mangaId, chapterId);
        
        // Clean up old progress (> 7 days)
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        
        const newProgress = { ...state.progress };
        
        // Cleanup loop
        Object.keys(newProgress).forEach(k => {
          if (now - newProgress[k].timestamp > SEVEN_DAYS) {
            delete newProgress[k];
          }
        });

        newProgress[key] = {
          scrollY,
          page,
          timestamp: now
        };

        return { progress: newProgress };
      }),

      getProgress: (sourceId, mangaId, chapterId) => {
        const key = getProgressKey(sourceId, mangaId, chapterId);
        const item = get().progress[key];
        
        if (!item) return undefined;
        
        // Ignore if older than 7 days
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - item.timestamp > SEVEN_DAYS) return undefined;
        
        return item;
      }
    }),
    {
      name: "yomirra-reader-progress"
    }
  )
);
