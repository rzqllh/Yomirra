import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushSourcePreferences } from "@/shared/lib/sync-utils";

interface SourcePreferencesState {
  disabledSources: string[];
  hiddenFromHomeSources: string[];
  
  toggleSource: (sourceId: string) => void;
  isSourceDisabled: (sourceId: string) => boolean;
  toggleHomeSource: (sourceId: string) => void;
  isSourceHiddenFromHome: (sourceId: string) => boolean;
  syncWithCloud: (cloudDisabledSources: string[], cloudHiddenFromHomeSources?: string[]) => void;
}

export const useSourcePreferencesStore = create<SourcePreferencesState>()(
  persist(
    (set, get) => ({
      disabledSources: [],
      hiddenFromHomeSources: [],

      toggleSource: (sourceId: string) => set((state) => {
        let newDisabled: string[];
        if (state.disabledSources.includes(sourceId)) {
          // It was disabled, now enable it (remove from disabled array)
          newDisabled = state.disabledSources.filter(id => id !== sourceId);
        } else {
          // It was enabled, now disable it (add to disabled array)
          newDisabled = [...state.disabledSources, sourceId];
        }
        
        // Push to Firebase in background
        pushSourcePreferences(newDisabled, state.hiddenFromHomeSources);
        
        // Sync to cookie for server-side filtering
        if (typeof document !== 'undefined') {
          document.cookie = `yomirra-disabled-sources=${encodeURIComponent(JSON.stringify(newDisabled))}; path=/; max-age=31536000`;
        }
        
        return { disabledSources: newDisabled };
      }),

      isSourceDisabled: (sourceId: string) => {
        return get().disabledSources.includes(sourceId);
      },

      toggleHomeSource: (sourceId: string) => set((state) => {
        let newHidden: string[];
        if (state.hiddenFromHomeSources.includes(sourceId)) {
          newHidden = state.hiddenFromHomeSources.filter(id => id !== sourceId);
        } else {
          newHidden = [...state.hiddenFromHomeSources, sourceId];
        }
        pushSourcePreferences(state.disabledSources, newHidden);
        return { hiddenFromHomeSources: newHidden };
      }),

      isSourceHiddenFromHome: (sourceId: string) => {
        return get().hiddenFromHomeSources.includes(sourceId);
      },

      syncWithCloud: (cloudDisabledSources: string[], cloudHiddenFromHomeSources: string[] = []) => {
        if (typeof document !== 'undefined') {
          document.cookie = `yomirra-disabled-sources=${encodeURIComponent(JSON.stringify(cloudDisabledSources))}; path=/; max-age=31536000`;
        }
        set({ disabledSources: cloudDisabledSources, hiddenFromHomeSources: cloudHiddenFromHomeSources })
      },
    }),
    {
      name: "yomirra-source-preferences",
      onRehydrateStorage: () => (state) => {
        // Ensure cookie is set on initial load if it exists in local storage
        if (state && typeof document !== 'undefined') {
          document.cookie = `yomirra-disabled-sources=${encodeURIComponent(JSON.stringify(state.disabledSources))}; path=/; max-age=31536000`;
        }
      }
    }
  )
);
