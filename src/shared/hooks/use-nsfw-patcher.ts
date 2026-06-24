import { useEffect, useRef } from "react";
import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore } from "@/shared/store/history-store";
import { useNsfwSourceIds } from "./use-nsfw-source-ids";

export function useNsfwPatcher() {
  const nsfwSourceIds = useNsfwSourceIds();
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run if we actually have the NSFW source IDs loaded
    // and if we haven't already run in this session
    if (nsfwSourceIds.size === 0 || hasRun.current) return;

    const runPatcher = () => {
      // Check if we've ever patched before on this device
      const patched = localStorage.getItem("yomirra_nsfw_patched_v2");
      if (patched === "true") return;

      const libraryStore = useLibraryStore.getState();
      const historyStore = useHistoryStore.getState();

      let patchedCount = 0;

      // Patch Library
      Object.entries(libraryStore.items).forEach(([id, item]) => {
        if (nsfwSourceIds.has(item.sourceId) && item.isNsfw !== true) {
          libraryStore.updateLibraryItem(item.sourceId, item.mangaId, { isNsfw: true });
          patchedCount++;
        }
      });

      // Patch History
      Object.entries(historyStore.items).forEach(([id, item]) => {
        if (nsfwSourceIds.has(item.sourceId) && item.isNsfw !== true) {
          historyStore._setItemLocal({ ...item, isNsfw: true });
          patchedCount++;
        }
      });

      if (patchedCount > 0 && process.env.NODE_ENV === "development") {
        console.log(`[NSFW Patcher] Auto-patched ${patchedCount} legacy items with isNsfw=true`);
      }

      // Mark as patched so we don't iterate again on future loads
      localStorage.setItem("yomirra_nsfw_patched_v2", "true");
      hasRun.current = true;
    };

    runPatcher();
  }, [nsfwSourceIds]);
}
