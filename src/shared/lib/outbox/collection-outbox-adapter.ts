import { enqueueOutboxMutation, type EnqueueResult } from "./outbox-manager";
import type { Collection, CollectionState, MangaKey, ReadingStatus } from "@/shared/types/collection";

const COLLECTION_DURABLE_KEY = "yomirra-collections";

export interface CollectionPayload {
  collections: Collection[];
  membershipsByManga: Record<MangaKey, string[]>;
  readingStatusByManga?: Record<MangaKey, ReadingStatus>;
}

interface PersistedCollectionStateContainer {
  state: CollectionState;
  version: number;
}

/**
 * Enqueues a durable collections update into the outbox journal and atomically
 * updates the local persisted custom collections state.
 */
export async function enqueueCollectionsUpsert(
  payload: CollectionPayload,
  options?: {
    baseServerRevision?: number;
    userId?: string;
  }
): Promise<EnqueueResult> {
  const entityId = "user_collections_root";

  return enqueueOutboxMutation<CollectionPayload>({
    entityType: "collection",
    entityId,
    operation: "upsert",
    payload,
    baseServerRevision: options?.baseServerRevision ?? 0,
    userId: options?.userId,
    durableStateKey: COLLECTION_DURABLE_KEY,
    updateDurableState: (currentRaw) => {
      let stateObj: PersistedCollectionStateContainer = {
        state: {
          collections: [],
          membershipsByManga: {},
          readingStatusByManga: {},
        },
        version: 1,
      };
      if (currentRaw) {
        try {
          const parsed = JSON.parse(currentRaw) as Partial<PersistedCollectionStateContainer>;
          if (parsed && typeof parsed === "object") {
            stateObj = {
              state: {
                collections: Array.isArray(parsed.state?.collections) ? parsed.state.collections : [],
                membershipsByManga: parsed.state?.membershipsByManga ?? {},
                readingStatusByManga: parsed.state?.readingStatusByManga ?? {},
              },
              version: typeof parsed.version === "number" ? parsed.version : 1,
            };
          }
        } catch {
          // fallback to fresh
        }
      }
      stateObj.state.collections = payload.collections;
      stateObj.state.membershipsByManga = payload.membershipsByManga;
      if (payload.readingStatusByManga) {
        stateObj.state.readingStatusByManga = payload.readingStatusByManga;
      }
      return JSON.stringify(stateObj);
    },
  });
}

/**
 * Enqueues a durable collection removal into the outbox journal and atomically
 * removes the collection and its memberships from local persisted state.
 */
export async function enqueueCollectionDelete(
  collectionId: string,
  options?: {
    baseServerRevision?: number;
    userId?: string;
  }
): Promise<EnqueueResult> {
  const entityId = `collection::${collectionId}`;

  return enqueueOutboxMutation<{ deletedCollectionId: string }>({
    entityType: "collection",
    entityId,
    operation: "delete",
    payload: { deletedCollectionId: collectionId },
    baseServerRevision: options?.baseServerRevision ?? 0,
    userId: options?.userId,
    durableStateKey: COLLECTION_DURABLE_KEY,
    updateDurableState: (currentRaw) => {
      let stateObj: PersistedCollectionStateContainer = {
        state: {
          collections: [],
          membershipsByManga: {},
          readingStatusByManga: {},
        },
        version: 1,
      };
      if (currentRaw) {
        try {
          const parsed = JSON.parse(currentRaw) as Partial<PersistedCollectionStateContainer>;
          if (parsed && typeof parsed === "object") {
            stateObj = {
              state: {
                collections: Array.isArray(parsed.state?.collections) ? parsed.state.collections : [],
                membershipsByManga: parsed.state?.membershipsByManga ?? {},
                readingStatusByManga: parsed.state?.readingStatusByManga ?? {},
              },
              version: typeof parsed.version === "number" ? parsed.version : 1,
            };
          }
          if (stateObj?.state?.collections) {
            stateObj.state.collections = stateObj.state.collections.filter(
              (c: Collection) => c.id !== collectionId
            );
          }
          if (stateObj?.state?.membershipsByManga) {
            for (const [mangaKey, list] of Object.entries(stateObj.state.membershipsByManga)) {
              stateObj.state.membershipsByManga[mangaKey] = (list as string[]).filter(
                (id) => id !== collectionId
              );
            }
          }
        } catch {
          // ignore
        }
      }
      return JSON.stringify(stateObj);
    },
  });
}
