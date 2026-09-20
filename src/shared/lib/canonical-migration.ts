import { useLibraryStore } from "@/shared/store/library-store";
import { useHistoryStore, HistoryItem } from "@/shared/store/history-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import { MangaKey } from "@/shared/types/collection";

let migrationRan = false;

export function runCanonicalMigration() {
  if (migrationRan) return;
  if (typeof window === "undefined") return;
  
  migrationRan = true;

  // Run lazily to avoid blocking main thread
  setTimeout(() => {
    try {
      const libraryState = useLibraryStore.getState();
      const historyState = useHistoryStore.getState();
      const collectionState = useCollectionStore.getState();

      let historyChanged = false;
      const updatedHistoryItems: Record<string, HistoryItem> = { ...historyState.items };

      for (const [key, item] of Object.entries(updatedHistoryItems)) {
        if (!item.savedTitleId) {
          const canonicalMatch = libraryState.resolveBySourceRef(item.sourceId, item.mangaId);
          if (canonicalMatch?.id) {
            updatedHistoryItems[key] = {
              ...item,
              savedTitleId: canonicalMatch.id,
            };
            historyChanged = true;
          }
        }
      }

      if (historyChanged) {
        useHistoryStore.setState({ items: updatedHistoryItems });
        if (process.env.NODE_ENV === "development") console.log("[Canonical Migration] History backfill complete.");
      }

      let collectionsChanged = false;
      const updatedMemberships = { ...collectionState.membershipsByManga };
      const updatedReadingStatus = { ...collectionState.readingStatusByManga };

      for (const legacyKey of Object.keys(updatedMemberships) as MangaKey[]) {
        if (legacyKey.includes("::")) {
          const [sourceId, mangaId] = legacyKey.split("::");
          const canonicalMatch = libraryState.resolveBySourceRef(sourceId, mangaId);
          if (canonicalMatch?.id && canonicalMatch.id !== legacyKey) {
            const canonicalId = canonicalMatch.id as MangaKey;
            
            // Merge memberships (Additive)
            const legacyCollections = updatedMemberships[legacyKey] || [];
            const existingCollections = updatedMemberships[canonicalId] || [];
            
            const merged = Array.from(new Set([...existingCollections, ...legacyCollections]));
            if (merged.length > existingCollections.length) {
              updatedMemberships[canonicalId] = merged;
              collectionsChanged = true;
            }
          }
        }
      }

      for (const legacyKey of Object.keys(updatedReadingStatus) as MangaKey[]) {
        if (legacyKey.includes("::")) {
          const [sourceId, mangaId] = legacyKey.split("::");
          const canonicalMatch = libraryState.resolveBySourceRef(sourceId, mangaId);
          if (canonicalMatch?.id && canonicalMatch.id !== legacyKey) {
            const canonicalId = canonicalMatch.id as MangaKey;
            
            // Move reading status if it doesn't already exist on canonical
            if (!updatedReadingStatus[canonicalId] && updatedReadingStatus[legacyKey]) {
              updatedReadingStatus[canonicalId] = updatedReadingStatus[legacyKey];
              collectionsChanged = true;
            }
          }
        }
      }

      if (collectionsChanged) {
        useCollectionStore.setState({
          membershipsByManga: updatedMemberships,
          readingStatusByManga: updatedReadingStatus,
        });
        if (process.env.NODE_ENV === "development") console.log("[Canonical Migration] Collections backfill complete.");
      }

    } catch (err) {
      console.error("[Canonical Migration] Failed to run staged backfill:", err);
    }
  }, 2000); // 2 second delay to let main hydration finish
}
