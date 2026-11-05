import {
  enqueueOutboxMutation,
  enqueueOutboxBatchMutations,
  type EnqueueResult,
  type BatchMutationItem,
} from "./outbox-manager";
import type { HistoryItem } from "@/shared/store/history-store";

const HISTORY_DURABLE_KEY = "yomirra-history";

interface PersistedHistoryStateContainer {
  state: {
    items: Record<string, HistoryItem>;
  };
  version: number;
}

export function getHistoryEntityId(sourceId: string, mangaId: string, chapterId: string): string {
  return `${sourceId}::${mangaId}::${chapterId}`;
}

/**
 * Enqueues a durable reading history item upsert into the outbox journal and atomically
 * updates the local persisted history state.
 */
export async function enqueueHistoryUpsert(
  item: HistoryItem,
  options?: {
    baseServerRevision?: number;
    userId?: string;
  }
): Promise<EnqueueResult> {
  const entityId = getHistoryEntityId(item.sourceId, item.mangaId, item.chapterId);

  return enqueueOutboxMutation<HistoryItem>({
    entityType: "history",
    entityId,
    operation: "upsert",
    payload: item,
    baseServerRevision: options?.baseServerRevision ?? 0,
    userId: options?.userId,
    durableStateKey: HISTORY_DURABLE_KEY,
    updateDurableState: (currentRaw) => {
      let stateObj: PersistedHistoryStateContainer = { state: { items: {} }, version: 2 };
      if (currentRaw) {
        try {
          const parsed = JSON.parse(currentRaw) as Partial<PersistedHistoryStateContainer>;
          if (parsed && typeof parsed === "object" && parsed.state) {
            stateObj = {
              state: { items: parsed.state.items ?? {} },
              version: typeof parsed.version === "number" ? parsed.version : 2,
            };
          }
        } catch {
          stateObj = { state: { items: {} }, version: 2 };
        }
      }
      stateObj.state.items[entityId] = item;
      return JSON.stringify(stateObj);
    },
  });
}

/**
 * Enqueues a durable reading history deletion into the outbox journal and atomically
 * removes the item from the local persisted history state.
 */
export async function enqueueHistoryDelete(
  sourceId: string,
  mangaId: string,
  chapterId: string,
  options?: {
    baseServerRevision?: number;
    userId?: string;
  }
): Promise<EnqueueResult> {
  const entityId = getHistoryEntityId(sourceId, mangaId, chapterId);

  return enqueueOutboxMutation<Partial<HistoryItem>>({
    entityType: "history",
    entityId,
    operation: "delete",
    payload: { sourceId, mangaId, chapterId },
    baseServerRevision: options?.baseServerRevision ?? 0,
    userId: options?.userId,
    durableStateKey: HISTORY_DURABLE_KEY,
    updateDurableState: (currentRaw) => {
      let stateObj: PersistedHistoryStateContainer = { state: { items: {} }, version: 2 };
      if (currentRaw) {
        try {
          const parsed = JSON.parse(currentRaw) as Partial<PersistedHistoryStateContainer>;
          if (parsed && typeof parsed === "object" && parsed.state) {
            stateObj = {
              state: { items: parsed.state.items ?? {} },
              version: typeof parsed.version === "number" ? parsed.version : 2,
            };
          }
          if (stateObj?.state?.items) {
            delete stateObj.state.items[entityId];
          }
        } catch {
          stateObj = { state: { items: {} }, version: 2 };
        }
      }
      return JSON.stringify(stateObj);
    },
  });
}

/**
 * Enqueues batch deletion of all history items for a specific manga in a single
 * atomic transaction to eliminate N+1 IDB transactions.
 */
export async function enqueueMangaHistoryBatchDelete(
  sourceId: string,
  mangaId: string,
  chapterIds: string[],
  options?: {
    userId?: string;
  }
): Promise<EnqueueResult[]> {
  if (chapterIds.length === 0) return [];

  const mutations: BatchMutationItem<Partial<HistoryItem>>[] = chapterIds.map((chapterId) => ({
    entityType: "history" as const,
    entityId: getHistoryEntityId(sourceId, mangaId, chapterId),
    operation: "delete" as const,
    payload: { sourceId, mangaId, chapterId },
    baseServerRevision: 0,
  }));

  const chapterIdSet = new Set(chapterIds);

  return enqueueOutboxBatchMutations({
    mutations,
    userId: options?.userId,
    durableStateKey: HISTORY_DURABLE_KEY,
    updateDurableState: (currentRaw) => {
      let stateObj: PersistedHistoryStateContainer = { state: { items: {} }, version: 2 };
      if (currentRaw) {
        try {
          const parsed = JSON.parse(currentRaw) as Partial<PersistedHistoryStateContainer>;
          if (parsed && typeof parsed === "object" && parsed.state) {
            stateObj = {
              state: { items: parsed.state.items ?? {} },
              version: typeof parsed.version === "number" ? parsed.version : 2,
            };
          }
          if (stateObj?.state?.items) {
            for (const [key, item] of Object.entries(stateObj.state.items)) {
              if (
                item.sourceId === sourceId &&
                item.mangaId === mangaId &&
                chapterIdSet.has(item.chapterId)
              ) {
                delete stateObj.state.items[key];
              }
            }
          }
        } catch {
          stateObj = { state: { items: {} }, version: 2 };
        }
      }
      return JSON.stringify(stateObj);
    },
  });
}
