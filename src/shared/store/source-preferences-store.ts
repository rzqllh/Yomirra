import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushSourcePreferences } from "@/shared/lib/sync-utils";

interface SourcePreferencesState {
  disabledSources: string[];
  
  toggleSource: (sourceId: string) => void;
  isSourceDisabled: (sourceId: string) => boolean;
  syncWithCloud: (cloudDisabledSources: string[]) => void;
}

export const useSourcePreferencesStore = create<SourcePreferencesState>()(
  persist(
    (set, get) => ({
      disabledSources: [],

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
        pushSourcePreferences(newDisabled);
        
        return { disabledSources: newDisabled };
      }),

      isSourceDisabled: (sourceId: string) => {
        return get().disabledSources.includes(sourceId);
      },

      syncWithCloud: (cloudDisabledSources: string[]) => set({
        disabledSources: cloudDisabledSources
      }),
    }),
    {
      name: "yomirra-source-preferences",
    }
  )
);
