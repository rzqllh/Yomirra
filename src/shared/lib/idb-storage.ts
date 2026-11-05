import type { StateStorage } from "zustand/middleware";
import type {
  SyncJournalEntry,
  TombstoneRecord,
  SyncMetadataRecord,
  ReconciliationAuditEntry,
  StorageQuotaInfo,
  EmergencyBackupSnapshot,
  SyncEntityType,
  OutboxStatus,
} from "@/shared/types/durable-sync";

export const DB_NAME = "yomirra-store";
export const DB_VERSION = 2; // Upgraded from v1 for Q138 Durable Sync

export const STORE_KEYVAL = "keyval";
export const STORE_SYNC_JOURNAL = "sync_journal";
export const STORE_TOMBSTONES = "tombstones";
export const STORE_SYNC_METADATA = "sync_metadata";
export const STORE_AUDIT_LOG = "reconciliation_audit_log";

const LEASE_METADATA_KEY = "sync_active_lease";
const DEFAULT_LEASE_TTL = 30000; // 30 seconds

let dbPromise: Promise<IDBDatabase> | null = null;

export function isIndexedDBSupported(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

/**
 * Resets the cached database promise for testing and lifecycle management.
 */
export function resetIDBForTesting(): void {
  dbPromise = null;
}

/**
 * Closes the active IndexedDB connection if open.
 */
export async function closeDurableDB(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      // ignore
    } finally {
      dbPromise = null;
    }
  }
}

/**
 * Helper to promisify standard IndexedDB requests.
 */
export function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Opens or upgrades the Yomirra IndexedDB database to v2.
 * Strictly preserves existing `keyval` data while adding the 4 durable sync stores.
 */
export function openDurableDB(): Promise<IDBDatabase> {
  if (!isIndexedDBSupported()) {
    return Promise.reject(new Error("IndexedDB is not supported or running on server"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        // 1. Preserve existing v1 keyval store (or create if fresh install)
        if (!db.objectStoreNames.contains(STORE_KEYVAL)) {
          db.createObjectStore(STORE_KEYVAL);
        }

        // 2. Add durable outbox journal
        if (!db.objectStoreNames.contains(STORE_SYNC_JOURNAL)) {
          const journal = db.createObjectStore(STORE_SYNC_JOURNAL, { keyPath: "id" });
          journal.createIndex("userId", "userId", { unique: false });
          journal.createIndex("status", "status", { unique: false });
          journal.createIndex("createdAt", "createdAt", { unique: false });
          journal.createIndex("entityKey", ["userId", "entityType", "entityId"], { unique: false });
        }

        // 3. Add tombstone retention store
        if (!db.objectStoreNames.contains(STORE_TOMBSTONES)) {
          const tombstones = db.createObjectStore(STORE_TOMBSTONES, {
            keyPath: ["userId", "entityType", "entityId"],
          });
          tombstones.createIndex("deletedAt", "deletedAt", { unique: false });
          tombstones.createIndex("userId", "userId", { unique: false });
        }

        // 4. Add sync coordination metadata & leases
        if (!db.objectStoreNames.contains(STORE_SYNC_METADATA)) {
          db.createObjectStore(STORE_SYNC_METADATA, { keyPath: "key" });
        }

        // 5. Add auditable reconciliation log
        if (!db.objectStoreNames.contains(STORE_AUDIT_LOG)) {
          const audit = db.createObjectStore(STORE_AUDIT_LOG, { keyPath: "id" });
          audit.createIndex("timestamp", "timestamp", { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        // Multi-tab version change handler to prevent upgrade deadlocks
        db.onversionchange = () => {
          console.warn("[idb-storage] Database version change requested by another tab. Closing connection.");
          db.close();
          dbPromise = null;
        };

        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };

      request.onblocked = () => {
        console.warn("[idb-storage] IndexedDB upgrade blocked by an unclosed tab.");
      };
    });
  }

  return dbPromise;
}

/**
 * Backward-compatible getIDB getter.
 */
export function getIDB(): Promise<IDBDatabase> {
  return openDurableDB();
}

/**
 * Executes an atomic transaction across multiple object stores.
 * Strictly guarantees that async operations settle before resolution, preventing
 * premature completion or false success if callbacks reject after IDB completion.
 */
export async function runAtomicTransaction<T>(
  storeNames: string[],
  fn: (stores: Record<string, IDBObjectStore>, tx: IDBTransaction) => Promise<T>
): Promise<T> {
  const db = await openDurableDB();

  return new Promise<T>((resolve, reject) => {
    let result: T;
    let callbackSettled = false;
    let callbackError: unknown = null;
    let txCompleted = false;
    let txAborted = false;
    let settled = false;

    const safeReject = (err: unknown) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    };

    const safeResolve = (val: T) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };

    const tx = db.transaction(storeNames, "readwrite");
    const stores: Record<string, IDBObjectStore> = {};
    for (const name of storeNames) {
      stores[name] = tx.objectStore(name);
    }

    tx.oncomplete = () => {
      txCompleted = true;
      if (callbackError) {
        safeReject(callbackError);
      } else if (callbackSettled) {
        safeResolve(result);
      }
    };

    tx.onerror = () => {
      safeReject(callbackError || tx.error || new Error("IDB transaction failed"));
    };

    tx.onabort = () => {
      txAborted = true;
      safeReject(callbackError || tx.error || new Error("IDB transaction aborted"));
    };

    Promise.resolve()
      .then(() => fn(stores, tx))
      .then((res) => {
        result = res;
        callbackSettled = true;
        if (callbackError) {
          safeReject(callbackError);
        } else if (txAborted) {
          safeReject(tx.error || new Error("IDB transaction aborted before callback settled"));
        } else if (txCompleted) {
          safeResolve(result);
        }
      })
      .catch((err) => {
        callbackError = err;
        callbackSettled = true;
        if (!txCompleted && !txAborted) {
          try {
            tx.abort();
          } catch {
            // Transaction might already be aborting or completed
          }
        }
        safeReject(err);
      });
  });
}

// ---------------------------------------------------------------------------
// Store-Specific Helper Functions
// ---------------------------------------------------------------------------

export async function addJournalEntry<T = unknown>(entry: SyncJournalEntry<T>): Promise<void> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_SYNC_JOURNAL, "readwrite");
  const store = tx.objectStore(STORE_SYNC_JOURNAL);
  await promisifyRequest(store.put(entry));
}

export async function getJournalEntries(
  userId?: string,
  status?: OutboxStatus
): Promise<SyncJournalEntry[]> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_SYNC_JOURNAL, "readonly");
  const store = tx.objectStore(STORE_SYNC_JOURNAL);

  if (userId) {
    const index = store.index("userId");
    const entries = await promisifyRequest<SyncJournalEntry[]>(index.getAll(userId));
    if (status) {
      return entries.filter((e) => e.status === status);
    }
    return entries;
  }

  const entries = await promisifyRequest<SyncJournalEntry[]>(store.getAll());
  if (status) {
    return entries.filter((e) => e.status === status);
  }
  return entries;
}

export async function updateJournalEntryStatus(
  id: string,
  status: OutboxStatus,
  leaseExpiresAt?: number,
  lastError?: string
): Promise<void> {
  return runAtomicTransaction([STORE_SYNC_JOURNAL], async (stores) => {
    const store = stores[STORE_SYNC_JOURNAL];
    const entry = await promisifyRequest<SyncJournalEntry | undefined>(store.get(id));
    if (!entry) return;

    entry.status = status;
    if (leaseExpiresAt !== undefined) {
      entry.leaseExpiresAt = leaseExpiresAt;
    }
    if (lastError !== undefined) {
      entry.lastError = lastError;
      entry.retryCount = (entry.retryCount || 0) + 1;
    }
    await promisifyRequest(store.put(entry));
  });
}

export async function removeJournalEntry(id: string): Promise<void> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_SYNC_JOURNAL, "readwrite");
  const store = tx.objectStore(STORE_SYNC_JOURNAL);
  await promisifyRequest(store.delete(id));
}

export async function putTombstone(tombstone: TombstoneRecord): Promise<void> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_TOMBSTONES, "readwrite");
  const store = tx.objectStore(STORE_TOMBSTONES);
  await promisifyRequest(store.put(tombstone));
}

export async function getTombstone(
  userId: string,
  entityType: SyncEntityType,
  entityId: string
): Promise<TombstoneRecord | null> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_TOMBSTONES, "readonly");
  const store = tx.objectStore(STORE_TOMBSTONES);
  const result = await promisifyRequest<TombstoneRecord | undefined>(
    store.get([userId, entityType, entityId])
  );
  return result ?? null;
}

export async function getTombstonesForUser(userId: string): Promise<TombstoneRecord[]> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_TOMBSTONES, "readonly");
  const index = tx.objectStore(STORE_TOMBSTONES).index("userId");
  const result = await promisifyRequest<TombstoneRecord[]>(index.getAll(userId));
  return result ?? [];
}

export async function removeTombstone(
  userId: string,
  entityType: SyncEntityType,
  entityId: string
): Promise<void> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_TOMBSTONES, "readwrite");
  const store = tx.objectStore(STORE_TOMBSTONES);
  await promisifyRequest(store.delete([userId, entityType, entityId]));
}

export async function setSyncMetadata<T = unknown>(key: string, value: T): Promise<void> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_SYNC_METADATA, "readwrite");
  const store = tx.objectStore(STORE_SYNC_METADATA);
  const record: SyncMetadataRecord<T> = {
    key,
    value,
    updatedAt: Date.now(),
  };
  await promisifyRequest(store.put(record));
}

export async function getSyncMetadata<T = unknown>(key: string): Promise<T | null> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_SYNC_METADATA, "readonly");
  const store = tx.objectStore(STORE_SYNC_METADATA);
  const record = await promisifyRequest<SyncMetadataRecord<T> | undefined>(store.get(key));
  return record ? record.value : null;
}

export async function addReconciliationAudit(entry: ReconciliationAuditEntry): Promise<void> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_AUDIT_LOG, "readwrite");
  const store = tx.objectStore(STORE_AUDIT_LOG);
  await promisifyRequest(store.put(entry));
}

export async function getReconciliationAudits(limit = 100): Promise<ReconciliationAuditEntry[]> {
  const db = await openDurableDB();
  const tx = db.transaction(STORE_AUDIT_LOG, "readonly");
  const store = tx.objectStore(STORE_AUDIT_LOG);
  const records = await promisifyRequest<ReconciliationAuditEntry[]>(store.getAll());
  return records.slice(-limit);
}

// ---------------------------------------------------------------------------
// Multi-Tab Lease Coordination (Fencing Token with 30s TTL Fallback)
// ---------------------------------------------------------------------------

export interface SyncLeaseRecord {
  holderId: string;
  token: string;
  expiresAt: number;
}

export async function acquireSyncLease(
  holderId: string,
  ttlMs = DEFAULT_LEASE_TTL
): Promise<{ acquired: boolean; token?: string; leaseExpiresAt?: number; reason?: string }> {
  return runAtomicTransaction([STORE_SYNC_METADATA], async (stores) => {
    const store = stores[STORE_SYNC_METADATA];
    const currentRecord = await promisifyRequest<
      SyncMetadataRecord<SyncLeaseRecord> | undefined
    >(store.get(LEASE_METADATA_KEY));

    const now = Date.now();
    const currentLease = currentRecord?.value;

    if (currentLease && currentLease.expiresAt > now) {
      return {
        acquired: false,
        reason: "lease_busy",
        leaseExpiresAt: currentLease.expiresAt,
      };
    }

    const token =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `lease-${now}-${Math.random().toString(36).slice(2, 9)}`;

    const expiresAt = now + ttlMs;
    const newRecord: SyncMetadataRecord<SyncLeaseRecord> = {
      key: LEASE_METADATA_KEY,
      value: { holderId, token, expiresAt },
      updatedAt: now,
    };

    await promisifyRequest(store.put(newRecord));

    return {
      acquired: true,
      token,
      leaseExpiresAt: expiresAt,
    };
  });
}

export async function renewSyncLease(
  holderId: string,
  token: string,
  ttlMs = DEFAULT_LEASE_TTL
): Promise<{ renewed: boolean; token?: string; leaseExpiresAt?: number; reason?: string }> {
  return runAtomicTransaction([STORE_SYNC_METADATA], async (stores) => {
    const store = stores[STORE_SYNC_METADATA];
    const currentRecord = await promisifyRequest<
      SyncMetadataRecord<SyncLeaseRecord> | undefined
    >(store.get(LEASE_METADATA_KEY));

    const now = Date.now();
    const currentLease = currentRecord?.value;

    if (!currentLease) {
      return { renewed: false, reason: "no_active_lease" };
    }

    if (currentLease.expiresAt <= now) {
      return { renewed: false, reason: "lease_expired" };
    }

    if (currentLease.holderId !== holderId) {
      return { renewed: false, reason: "holder_mismatch" };
    }

    if (currentLease.token !== token) {
      return { renewed: false, reason: "token_mismatch" };
    }

    const expiresAt = now + ttlMs;
    const updatedRecord: SyncMetadataRecord<SyncLeaseRecord> = {
      key: LEASE_METADATA_KEY,
      value: { holderId, token, expiresAt },
      updatedAt: now,
    };

    await promisifyRequest(store.put(updatedRecord));

    return {
      renewed: true,
      token,
      leaseExpiresAt: expiresAt,
    };
  });
}

export async function releaseSyncLease(holderId: string, token: string): Promise<boolean> {
  return runAtomicTransaction([STORE_SYNC_METADATA], async (stores) => {
    const store = stores[STORE_SYNC_METADATA];
    const currentRecord = await promisifyRequest<
      SyncMetadataRecord<SyncLeaseRecord> | undefined
    >(store.get(LEASE_METADATA_KEY));

    const currentLease = currentRecord?.value;

    if (!currentLease || currentLease.holderId !== holderId || currentLease.token !== token) {
      return false;
    }

    await promisifyRequest(store.delete(LEASE_METADATA_KEY));
    return true;
  });
}

// ---------------------------------------------------------------------------
// Storage Quota Monitoring & Emergency Backup Exporter
// ---------------------------------------------------------------------------

export async function checkStorageQuota(): Promise<StorageQuotaInfo> {
  if (
    typeof navigator !== "undefined" &&
    navigator.storage &&
    typeof navigator.storage.estimate === "function"
  ) {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota ?? 0;
      const usage = estimate.usage ?? 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;
      const isPressure = percentage >= 90;
      return { quota, usage, percentage, isPressure };
    } catch (e) {
      console.warn("[idb-storage] Failed to estimate storage quota:", e);
    }
  }
  return { quota: 0, usage: 0, percentage: 0, isPressure: false };
}

export async function exportEmergencyBackup(): Promise<EmergencyBackupSnapshot> {
  const db = await openDurableDB();
  const tx = db.transaction(
    [STORE_KEYVAL, STORE_SYNC_JOURNAL, STORE_TOMBSTONES, STORE_SYNC_METADATA, STORE_AUDIT_LOG],
    "readonly"
  );

  const keyvalStore = tx.objectStore(STORE_KEYVAL);
  const journalStore = tx.objectStore(STORE_SYNC_JOURNAL);
  const tombstonesStore = tx.objectStore(STORE_TOMBSTONES);
  const metaStore = tx.objectStore(STORE_SYNC_METADATA);
  const auditStore = tx.objectStore(STORE_AUDIT_LOG);

  const keyval: Record<string, unknown> = {};
  await new Promise<void>((resolve, reject) => {
    const req = keyvalStore.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        keyval[String(cursor.key)] = cursor.value;
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });

  const syncJournal = await promisifyRequest<SyncJournalEntry[]>(journalStore.getAll());
  const tombstones = await promisifyRequest<TombstoneRecord[]>(tombstonesStore.getAll());
  const syncMetadata = await promisifyRequest<SyncMetadataRecord[]>(metaStore.getAll());
  const reconciliationAuditLog = await promisifyRequest<ReconciliationAuditEntry[]>(auditStore.getAll());

  return {
    exportedAt: Date.now(),
    dbVersion: DB_VERSION,
    keyval,
    syncJournal,
    tombstones,
    syncMetadata,
    reconciliationAuditLog,
  };
}

// ---------------------------------------------------------------------------
// Backward-Compatible Zustand StateStorage Implementation (keyval store)
// ---------------------------------------------------------------------------

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;

    if (isIndexedDBSupported()) {
      try {
        const db = await openDurableDB();
        const value = await new Promise<string | null>((resolve, reject) => {
          const tx = db.transaction(STORE_KEYVAL, "readonly");
          const store = tx.objectStore(STORE_KEYVAL);
          const req = store.get(name);

          req.onsuccess = () => {
            resolve(req.result !== undefined ? (req.result as string) : null);
          };
          req.onerror = () => reject(req.error);
        });

        if (value !== null) {
          return value;
        }

        // Check legacy localStorage for migration to IDB
        try {
          const legacyValue = window.localStorage.getItem(name);
          if (legacyValue !== null) {
            await new Promise<void>((resolve, reject) => {
              const tx = db.transaction(STORE_KEYVAL, "readwrite");
              const store = tx.objectStore(STORE_KEYVAL);
              const req = store.put(legacyValue, name);
              req.onsuccess = () => resolve();
              req.onerror = () => reject(req.error);
            });
            window.localStorage.removeItem(name);
            return legacyValue;
          }
        } catch {
          // localStorage access failed
        }

        return null;
      } catch (e) {
        console.warn(`[idbStorage] Failed to read "${name}" from IndexedDB:`, e);
      }
    }

    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;

    if (isIndexedDBSupported()) {
      try {
        const db = await openDurableDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_KEYVAL, "readwrite");
          const store = tx.objectStore(STORE_KEYVAL);
          const req = store.put(value, name);

          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });

        try {
          window.localStorage.removeItem(name);
        } catch {
          // ignore
        }
        return;
      } catch (e) {
        console.warn(`[idbStorage] Failed to write "${name}" to IndexedDB:`, e);
      }
    }

    try {
      window.localStorage.setItem(name, value);
    } catch (err) {
      console.error(`[idbStorage] LocalStorage write failed for "${name}":`, err);
      throw err;
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;

    if (isIndexedDBSupported()) {
      try {
        const db = await openDurableDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_KEYVAL, "readwrite");
          const store = tx.objectStore(STORE_KEYVAL);
          const req = store.delete(name);

          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn(`[idbStorage] Failed to delete "${name}" from IndexedDB:`, e);
      }
    }

    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};
