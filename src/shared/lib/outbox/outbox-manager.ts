import {
  STORE_KEYVAL,
  STORE_SYNC_JOURNAL,
  STORE_TOMBSTONES,
  runAtomicTransaction,
  promisifyRequest,
  checkStorageQuota,
  exportEmergencyBackup,
} from "@/shared/lib/idb-storage";
import type {
  SyncJournalEntry,
  TombstoneRecord,
  SyncEntityType,
  OutboxOperationType,
  OutboxStatus,
} from "@/shared/types/durable-sync";
import { getLocalDataOwnerUid } from "@/shared/lib/local-data-owner";

export const GUEST_USER_ID = "__guest__";
const TOMBSTONE_RETENTION_MS = 180 * 24 * 60 * 60 * 1000; // 180 days default retention

export interface EnqueueMutationParams<T = unknown> {
  entityType: SyncEntityType;
  entityId: string;
  operation: OutboxOperationType;
  payload: Partial<T>;
  baseServerRevision?: number;
  isExplicitRestore?: boolean;
  userId?: string;
  durableStateKey: string;
  updateDurableState: (currentRaw: string | null) => string;
}

export interface BatchMutationItem<T = unknown> {
  entityType: SyncEntityType;
  entityId: string;
  operation: OutboxOperationType;
  payload: Partial<T>;
  baseServerRevision?: number;
  isExplicitRestore?: boolean;
}

export interface EnqueueBatchMutationsParams {
  mutations: BatchMutationItem[];
  userId?: string;
  durableStateKey?: string;
  updateDurableState?: (currentRaw: string | null) => string;
}

export interface EnqueueResult {
  opId: string;
  userId: string;
  coalesced: boolean;
}

/**
 * Resolves the active user ID for outbox scoping.
 * If authenticated, returns user's UID. If anonymous/guest, returns "__guest__".
 */
export function resolveActiveOutboxUid(explicitUid?: string): string {
  if (explicitUid && explicitUid.trim().length > 0) {
    return explicitUid;
  }
  const authUid = getLocalDataOwnerUid();
  return authUid && authUid.trim().length > 0 ? authUid : GUEST_USER_ID;
}

/**
 * Atomically enqueues a mutation to the durable `sync_journal` and updates the
 * durable local `keyval` store within a single IDB transaction.
 *
 * Guarantees:
 * 1. Atomicity: If quota is exceeded or writing fails, local state is NOT mutated.
 * 2. Idempotency & Coalescing: Coalesces rapid offline edits to avoid outbox bloat.
 * 3. UID Isolation: Enforces partition between authenticated users and guest sessions.
 * 4. Tombstone Recording: Automatically writes tombstone records on DELETE operations.
 */
export async function enqueueOutboxMutation<T = unknown>(
  params: EnqueueMutationParams<T>
): Promise<EnqueueResult> {
  const {
    entityType,
    entityId,
    operation,
    payload,
    baseServerRevision = 0,
    isExplicitRestore = false,
    durableStateKey,
    updateDurableState,
  } = params;

  const userId = resolveActiveOutboxUid(params.userId);
  const now = Date.now();

  return runAtomicTransaction(
    [STORE_KEYVAL, STORE_SYNC_JOURNAL, STORE_TOMBSTONES],
    async (stores) => {
      const journalStore = stores[STORE_SYNC_JOURNAL];
      const tombstonesStore = stores[STORE_TOMBSTONES];
      const keyvalStore = stores[STORE_KEYVAL];

      // 1. Check for existing pending mutation for this entity to coalesce
      const index = journalStore.index("entityKey");
      const pendingMatches = await promisifyRequest<SyncJournalEntry<T>[]>(
        index.getAll([userId, entityType, entityId])
      );

      // Find uncommitted pending entries
      const existingPending = pendingMatches.find((e) => e.status === "pending");

      let opId: string;
      let coalesced = false;

      if (existingPending) {
        opId = existingPending.id;
        coalesced = true;

        if (operation === "upsert" && existingPending.operation === "upsert") {
          // Merge payload for sequential upserts
          existingPending.payload = {
            ...existingPending.payload,
            ...payload,
          };
          existingPending.createdAt = now;
          if (isExplicitRestore) {
            existingPending.isExplicitRestore = true;
          }
          await promisifyRequest(journalStore.put(existingPending));
        } else if (operation === "delete") {
          // Terminal deletion supersedes previous pending upserts
          existingPending.operation = "delete";
          existingPending.payload = payload;
          existingPending.createdAt = now;
          await promisifyRequest(journalStore.put(existingPending));
        } else if (operation === "upsert" && existingPending.operation === "delete") {
          // User deleted then restored/re-added while offline
          existingPending.operation = "upsert";
          existingPending.payload = payload;
          existingPending.createdAt = now;
          existingPending.isExplicitRestore = isExplicitRestore || true;
          await promisifyRequest(journalStore.put(existingPending));
        }
      } else {
        opId =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `op-${now}-${Math.random().toString(36).slice(2, 9)}`;

        const newEntry: SyncJournalEntry<T> = {
          id: opId,
          userId,
          entityType,
          entityId,
          operation,
          payload,
          baseServerRevision,
          status: "pending",
          createdAt: now,
          retryCount: 0,
          isExplicitRestore,
        };

        await promisifyRequest(journalStore.put(newEntry));
      }

      // 2. Handle Tombstones on Delete / Restore
      if (operation === "delete") {
        const tombstone: TombstoneRecord = {
          userId,
          entityType,
          entityId,
          deletedAt: now,
          tombstoneExpiresAt: now + TOMBSTONE_RETENTION_MS,
        };
        await promisifyRequest(tombstonesStore.put(tombstone));
      } else if (isExplicitRestore) {
        // If explicitly restoring, remove tombstone from local retention store
        await promisifyRequest(tombstonesStore.delete([userId, entityType, entityId]));
      }

      // 3. Atomically update local durable state in keyval store
      const currentRaw = await promisifyRequest<string | undefined>(
        keyvalStore.get(durableStateKey)
      );
      const nextRaw = updateDurableState(currentRaw ?? null);
      await promisifyRequest(keyvalStore.put(nextRaw, durableStateKey));

      return {
        opId,
        userId,
        coalesced,
      };
    }
  ).catch(async (err) => {
    // Check if failure is due to storage quota pressure
    try {
      const quota = await checkStorageQuota();
      if (quota.isPressure) {
        console.warn("[outbox-manager] Storage pressure detected during enqueue. Triggering emergency backup.");
        await exportEmergencyBackup().catch(() => {});
      }
    } catch {
      // ignore secondary errors during recovery check
    }
    throw err;
  });
}

/**
 * Atomically enqueues a batch of mutations to `sync_journal` and updates local durable state
 * in `keyval` once in a single atomic transaction. Prevents N+1 IDB transactions.
 */
export async function enqueueOutboxBatchMutations(
  params: EnqueueBatchMutationsParams
): Promise<EnqueueResult[]> {
  const {
    mutations,
    userId: explicitUserId,
    durableStateKey,
    updateDurableState,
  } = params;

  if (mutations.length === 0) return [];

  const userId = resolveActiveOutboxUid(explicitUserId);
  const now = Date.now();

  return runAtomicTransaction(
    [STORE_KEYVAL, STORE_SYNC_JOURNAL, STORE_TOMBSTONES],
    async (stores) => {
      const journalStore = stores[STORE_SYNC_JOURNAL];
      const tombstonesStore = stores[STORE_TOMBSTONES];
      const keyvalStore = stores[STORE_KEYVAL];
      const index = journalStore.index("entityKey");

      const results: EnqueueResult[] = [];

      for (const item of mutations) {
        const {
          entityType,
          entityId,
          operation,
          payload,
          baseServerRevision = 0,
          isExplicitRestore = false,
        } = item;

        const pendingMatches = await promisifyRequest<SyncJournalEntry[]>(
          index.getAll([userId, entityType, entityId])
        );
        const existingPending = pendingMatches.find((e) => e.status === "pending");

        let opId: string;
        let coalesced = false;

        if (existingPending) {
          opId = existingPending.id;
          coalesced = true;

          if (operation === "upsert" && existingPending.operation === "upsert") {
            existingPending.payload = {
              ...existingPending.payload,
              ...payload,
            };
            existingPending.createdAt = now;
            if (isExplicitRestore) {
              existingPending.isExplicitRestore = true;
            }
            await promisifyRequest(journalStore.put(existingPending));
          } else if (operation === "delete") {
            existingPending.operation = "delete";
            existingPending.payload = payload;
            existingPending.createdAt = now;
            await promisifyRequest(journalStore.put(existingPending));
          } else if (operation === "upsert" && existingPending.operation === "delete") {
            existingPending.operation = "upsert";
            existingPending.payload = payload;
            existingPending.createdAt = now;
            existingPending.isExplicitRestore = isExplicitRestore || true;
            await promisifyRequest(journalStore.put(existingPending));
          }
        } else {
          opId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `op-${now}-${Math.random().toString(36).slice(2, 9)}`;

          const newEntry: SyncJournalEntry = {
            id: opId,
            userId,
            entityType,
            entityId,
            operation,
            payload,
            baseServerRevision,
            status: "pending",
            createdAt: now,
            retryCount: 0,
            isExplicitRestore,
          };

          await promisifyRequest(journalStore.put(newEntry));
        }

        if (operation === "delete") {
          const tombstone: TombstoneRecord = {
            userId,
            entityType,
            entityId,
            deletedAt: now,
            tombstoneExpiresAt: now + TOMBSTONE_RETENTION_MS,
          };
          await promisifyRequest(tombstonesStore.put(tombstone));
        } else if (isExplicitRestore) {
          await promisifyRequest(tombstonesStore.delete([userId, entityType, entityId]));
        }

        results.push({ opId, userId, coalesced });
      }

      if (durableStateKey && updateDurableState) {
        const currentRaw = await promisifyRequest<string | undefined>(
          keyvalStore.get(durableStateKey)
        );
        const nextRaw = updateDurableState(currentRaw ?? null);
        await promisifyRequest(keyvalStore.put(nextRaw, durableStateKey));
      }

      return results;
    }
  ).catch(async (err) => {
    try {
      const quota = await checkStorageQuota();
      if (quota.isPressure) {
        console.warn("[outbox-manager] Storage pressure detected during batch enqueue. Triggering emergency backup.");
        await exportEmergencyBackup().catch(() => {});
      }
    } catch {
      // ignore secondary errors during recovery check
    }
    throw err;
  });
}

/**
 * Retrieves all pending outbox mutations for a specific user, or for all users.
 * Automatically considers expired leases as pending (crash recovery).
 */
export async function getPendingOutboxEntries(
  userId?: string
): Promise<SyncJournalEntry[]> {
  const targetUid = userId ? resolveActiveOutboxUid(userId) : undefined;
  const db = await runAtomicTransaction([STORE_SYNC_JOURNAL], async (stores) => {
    const store = stores[STORE_SYNC_JOURNAL];
    const now = Date.now();

    let allEntries: SyncJournalEntry[];
    if (targetUid) {
      const index = store.index("userId");
      allEntries = await promisifyRequest<SyncJournalEntry[]>(index.getAll(targetUid));
    } else {
      allEntries = await promisifyRequest<SyncJournalEntry[]>(store.getAll());
    }

    // Filter for pending or expired processing leases
    return allEntries.filter((entry) => {
      if (entry.status === "pending") return true;
      if (entry.status === "processing" && entry.leaseExpiresAt && entry.leaseExpiresAt <= now) {
        return true;
      }
      return false;
    });
  });

  return db;
}

/**
 * Updates the status of an outbox mutation (e.g. processing, synced, failed).
 */
export async function updateOutboxStatus(
  opId: string,
  status: OutboxStatus,
  options?: { leaseExpiresAt?: number; lastError?: string }
): Promise<void> {
  return runAtomicTransaction([STORE_SYNC_JOURNAL], async (stores) => {
    const store = stores[STORE_SYNC_JOURNAL];
    const entry = await promisifyRequest<SyncJournalEntry | undefined>(store.get(opId));
    if (!entry) return;

    entry.status = status;
    if (options?.leaseExpiresAt !== undefined) {
      entry.leaseExpiresAt = options.leaseExpiresAt;
    }
    if (options?.lastError !== undefined) {
      entry.lastError = options.lastError;
      entry.retryCount = (entry.retryCount || 0) + 1;
    }

    await promisifyRequest(store.put(entry));
  });
}
