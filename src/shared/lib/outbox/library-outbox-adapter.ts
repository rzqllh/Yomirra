import { enqueueOutboxMutation, type EnqueueResult } from "./outbox-manager";
import type { LibraryItem } from "@/shared/store/library-store";

const LIBRARY_DURABLE_KEY = "yomirra-library";

interface PersistedLibraryStateContainer {
  state: {
    items: Record<string, LibraryItem>;
  };
  version: number;
}

export function getLibraryEntityId(sourceId: string, mangaId: string, explicitId?: string): string {
  if (explicitId && explicitId.trim().length > 0) {
    return explicitId;
  }
  return `${sourceId}::${mangaId}`;
}

/**
 * Enqueues a durable library item upsert into the outbox journal and atomically
 * updates the local persisted library state.
 */
export async function enqueueLibraryUpsert(
  item: LibraryItem,
  options?: {
    baseServerRevision?: number;
    isExplicitRestore?: boolean;
    userId?: string;
  }
): Promise<EnqueueResult> {
  const entityId = getLibraryEntityId(item.sourceId, item.mangaId, item.id);

  return enqueueOutboxMutation<LibraryItem>({
    entityType: "library",
    entityId,
    operation: "upsert",
    payload: item,
    baseServerRevision: options?.baseServerRevision ?? 0,
    isExplicitRestore: options?.isExplicitRestore ?? false,
    userId: options?.userId,
    durableStateKey: LIBRARY_DURABLE_KEY,
    updateDurableState: (currentRaw) => {
      let stateObj: PersistedLibraryStateContainer = { state: { items: {} }, version: 1 };
      if (currentRaw) {
        try {
          const parsed = JSON.parse(currentRaw) as Partial<PersistedLibraryStateContainer>;
          if (parsed && typeof parsed === "object" && parsed.state) {
            stateObj = {
              state: { items: parsed.state.items ?? {} },
              version: typeof parsed.version === "number" ? parsed.version : 1,
            };
          }
        } catch {
          stateObj = { state: { items: {} }, version: 1 };
        }
      }
      stateObj.state.items[entityId] = {
        ...item,
        id: entityId,
      };
      return JSON.stringify(stateObj);
    },
  });
}

/**
 * Enqueues a durable library deletion into the outbox journal and atomically
 * removes the item from the local persisted library state (preserving rating if set).
 */
export async function enqueueLibraryDelete(
  sourceId: string,
  mangaId: string,
  options?: {
    baseServerRevision?: number;
    userId?: string;
    explicitId?: string;
  }
): Promise<EnqueueResult> {
  const entityId = getLibraryEntityId(sourceId, mangaId, options?.explicitId);

  return enqueueOutboxMutation<Partial<LibraryItem>>({
    entityType: "library",
    entityId,
    operation: "delete",
    payload: { sourceId, mangaId },
    baseServerRevision: options?.baseServerRevision ?? 0,
    userId: options?.userId,
    durableStateKey: LIBRARY_DURABLE_KEY,
    updateDurableState: (currentRaw) => {
      let stateObj: PersistedLibraryStateContainer = { state: { items: {} }, version: 1 };
      if (currentRaw) {
        try {
          const parsed = JSON.parse(currentRaw) as Partial<PersistedLibraryStateContainer>;
          if (parsed && typeof parsed === "object" && parsed.state) {
            stateObj = {
              state: { items: parsed.state.items ?? {} },
              version: typeof parsed.version === "number" ? parsed.version : 1,
            };
          }
          if (stateObj?.state?.items) {
            const existingItem = stateObj.state.items[entityId];
            if (existingItem && existingItem.userRating !== undefined) {
              // Preserve user rating by marking bookmark as false, matching library-store contract
              stateObj.state.items[entityId] = {
                ...existingItem,
                isBookmarked: false,
                updatedAt: new Date().toISOString(),
              };
            } else {
              delete stateObj.state.items[entityId];
            }
          }
        } catch {
          stateObj = { state: { items: {} }, version: 1 };
        }
      }
      return JSON.stringify(stateObj);
    },
  });
}
