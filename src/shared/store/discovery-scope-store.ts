import { create } from "zustand";

/** Session-only Jelajah selection. Cari owns its separate SearchFilterStore. */
export const useDiscoveryScopeStore = create<{
  sourceId: string | null;
  setSourceId: (sourceId: string) => void;
}>((set) => ({ sourceId: null, setSourceId: (sourceId) => set({ sourceId }) }));
