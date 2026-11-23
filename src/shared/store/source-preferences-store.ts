import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushSourcePreferences } from "@/shared/lib/sync-utils";
import { DEFAULT_DISABLED_SOURCE_IDS, applyDefaultDisabledSources, SOURCE_PREFERENCE_POLICY_VERSION } from "@/shared/sources/source-defaults";

interface SourcePreferencesState {
  disabledSources: string[];
  hiddenFromHomeSources: string[];
  
  toggleSource: (sourceId: string) => void;
  isSourceDisabled: (sourceId: string) => boolean;
  toggleHomeSource: (sourceId: string) => void;
  isSourceHiddenFromHome: (sourceId: string) => boolean;
  syncWithCloud: (cloudDisabledSources: string[], cloudHiddenFromHomeSources?: string[], policyVersion?: number) => void;
  clearPreferences: () => void;
}

export const useSourcePreferencesStore = create<SourcePreferencesState>()(
  persist(
    (set, get) => ({
      disabledSources: [...DEFAULT_DISABLED_SOURCE_IDS],
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

      syncWithCloud: (cloudDisabledSources: string[], cloudHiddenFromHomeSources: string[] = [], policyVersion = 0) => {
        const disabled = policyVersion >= SOURCE_PREFERENCE_POLICY_VERSION
          ? cloudDisabledSources : applyDefaultDisabledSources(cloudDisabledSources);
        if (typeof document !== 'undefined') {
          document.cookie = `yomirra-disabled-sources=${encodeURIComponent(JSON.stringify(disabled))}; path=/; max-age=31536000`;
        }
        set({ disabledSources: disabled, hiddenFromHomeSources: cloudHiddenFromHomeSources })
      },

      clearPreferences: () => {
        if (typeof document !== 'undefined') {
          document.cookie = `yomirra-disabled-sources=${encodeURIComponent(JSON.stringify(DEFAULT_DISABLED_SOURCE_IDS))}; path=/; max-age=31536000`;
        }
        set({ disabledSources: [...DEFAULT_DISABLED_SOURCE_IDS], hiddenFromHomeSources: [] });
        void pushSourcePreferences([...DEFAULT_DISABLED_SOURCE_IDS], []);
      },
    }),
    {
      name: "yomirra-source-preferences",
      version: 2,
      migrate: (stored: unknown, version) => {
        const old = (stored && typeof stored === "object" ? stored : {}) as Partial<SourcePreferencesState>;
        return {
          ...old,
          disabledSources: version < 2
            ? applyDefaultDisabledSources(Array.isArray(old.disabledSources) ? old.disabledSources : [])
            : (Array.isArray(old.disabledSources) ? old.disabledSources : [...DEFAULT_DISABLED_SOURCE_IDS]),
        } as SourcePreferencesState;
      },
      onRehydrateStorage: () => (state) => {
        // Ensure cookie is set on initial load if it exists in local storage
        if (state && typeof document !== 'undefined') {
          document.cookie = `yomirra-disabled-sources=${encodeURIComponent(JSON.stringify(state.disabledSources))}; path=/; max-age=31536000`;
        }
      }
    }
  )
);
