import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DB_NAME,
  STORE_KEYVAL,
  STORE_SYNC_JOURNAL,
  STORE_TOMBSTONES,
  STORE_SYNC_METADATA,
  STORE_AUDIT_LOG,
  openDurableDB,
  closeDurableDB,
  resetIDBForTesting,
  runAtomicTransaction,
  addJournalEntry,
  getJournalEntries,
  updateJournalEntryStatus,
  removeJournalEntry,
  putTombstone,
  getTombstone,
  getTombstonesForUser,
  setSyncMetadata,
  getSyncMetadata,
  addReconciliationAudit,
  getReconciliationAudits,
  acquireSyncLease,
  renewSyncLease,
  releaseSyncLease,
  checkStorageQuota,
  exportEmergencyBackup,
  idbStorage,
} from "../idb-storage";
import type {
  SyncJournalEntry,
  TombstoneRecord,
  ReconciliationAuditEntry,
} from "@/shared/types/durable-sync";

// ---------------------------------------------------------------------------
// High-Fidelity In-Memory IDB Mock for v1 -> v2 Migration & Concurrency
// ---------------------------------------------------------------------------

class MockIDBIndex {
  constructor(
    public name: string,
    public keyPath: string | string[],
    public storeData: Map<any, any>
  ) {}

  getAll(query?: any): any {
    const req: any = {};
    setTimeout(() => {
      const results: any[] = [];
      for (const value of this.storeData.values()) {
        if (query === undefined) {
          results.push(value);
        } else if (Array.isArray(this.keyPath)) {
          const match = this.keyPath.every((k, i) => value[k] === (Array.isArray(query) ? query[i] : query));
          if (match) results.push(value);
        } else if (value[this.keyPath] === query) {
          results.push(value);
        }
      }
      req.result = results;
      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  }

  get(query: any): any {
    const req: any = {};
    setTimeout(() => {
      let found: any = undefined;
      for (const value of this.storeData.values()) {
        if (Array.isArray(this.keyPath)) {
          const match = this.keyPath.every((k, i) => value[k] === (Array.isArray(query) ? query[i] : query));
          if (match) {
            found = value;
            break;
          }
        } else if (value[this.keyPath] === query) {
          found = value;
          break;
        }
      }
      req.result = found;
      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  }
}

class MockIDBObjectStore {
  public indices: Map<string, MockIDBIndex> = new Map();

  constructor(
    public name: string,
    public keyPath: string | string[] | null,
    public data: Map<any, any>,
    private tx: MockIDBTransaction,
    private throwOnWrite = false
  ) {}

  createIndex(name: string, keyPath: string | string[], options?: any) {
    const index = new MockIDBIndex(name, keyPath, this.data);
    this.indices.set(name, index);
    return index;
  }

  index(name: string): MockIDBIndex {
    const idx = this.indices.get(name);
    if (!idx) throw new Error(`Index ${name} not found on store ${this.name}`);
    return idx;
  }

  private serializeKey(key: any): string {
    return Array.isArray(key) ? JSON.stringify(key) : String(key);
  }

  get(key: any): any {
    const req: any = {};
    setTimeout(() => {
      const sKey = this.serializeKey(key);
      req.result = this.data.get(sKey);
      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  }

  put(value: any, key?: any): any {
    const req: any = {};
    setTimeout(() => {
      if (this.throwOnWrite) {
        const error = new DOMException("Quota exceeded", "QuotaExceededError");
        req.error = error;
        this.tx.error = error;
        req.onerror?.({ target: req });
        this.tx.abort();
        return;
      }

      let actualKey = key;
      if (!actualKey && this.keyPath) {
        if (Array.isArray(this.keyPath)) {
          actualKey = this.keyPath.map((k) => value[k]);
        } else {
          actualKey = value[this.keyPath];
        }
      }
      const sKey = this.serializeKey(actualKey);
      this.data.set(sKey, JSON.parse(JSON.stringify(value)));
      req.result = actualKey;
      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  }

  delete(key: any): any {
    const req: any = {};
    setTimeout(() => {
      const sKey = this.serializeKey(key);
      this.data.delete(sKey);
      req.result = undefined;
      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  }

  getAll(): any {
    const req: any = {};
    setTimeout(() => {
      req.result = Array.from(this.data.values());
      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  }

  openCursor(): any {
    const req: any = {};
    setTimeout(() => {
      const entries = Array.from(this.data.entries());
      let index = 0;

      function step() {
        if (index < entries.length) {
          const [k, v] = entries[index];
          let originalKey: any = k;
          try {
            if (k.startsWith("[") || k.startsWith("{")) originalKey = JSON.parse(k);
          } catch {
            // keep as string
          }
          const cursor = {
            key: originalKey,
            value: v,
            continue: () => {
              index++;
              step();
            },
          };
          req.result = cursor;
          req.onsuccess?.({ target: req });
        } else {
          req.result = null;
          req.onsuccess?.({ target: req });
        }
      }
      step();
    }, 0);
    return req;
  }
}

class MockIDBTransaction {
  public oncomplete?: (e: any) => void;
  public onerror?: (e: any) => void;
  public onabort?: (e: any) => void;
  public error?: any;
  private aborted = false;
  private objectStores: Map<string, MockIDBObjectStore> = new Map();
  private snapshotBeforeTx: Map<string, Map<string, any>> = new Map();

  constructor(
    public storeNames: string[],
    public mode: "readonly" | "readwrite",
    public db: MockIDBDatabase
  ) {
    // Snapshot state for atomic rollback simulation
    for (const name of storeNames) {
      const storeMap = db.backingData.get(name);
      if (storeMap) {
        this.snapshotBeforeTx.set(name, new Map(storeMap));
      }
    }

    setTimeout(() => {
      if (!this.aborted && !this.error) {
        this.oncomplete?.({ target: this });
      }
    }, 20);
  }

  objectStore(name: string): MockIDBObjectStore {
    if (!this.storeNames.includes(name)) {
      throw new Error(`Store ${name} was not included in transaction store list`);
    }
    if (this.objectStores.has(name)) {
      return this.objectStores.get(name)!;
    }

    let dataMap = this.db.backingData.get(name);
    if (!dataMap) {
      dataMap = new Map();
      this.db.backingData.set(name, dataMap);
    }
    const store = new MockIDBObjectStore(
      name,
      this.db.storeConfigs.get(name)?.keyPath ?? null,
      dataMap,
      this,
      this.db.simulateQuotaError
    );

    // Populate preserved index definitions from DB
    const indices = this.db.storeIndexConfigs.get(name);
    if (indices) {
      for (const [idxName, idx] of indices.entries()) {
        store.indices.set(idxName, new MockIDBIndex(idxName, idx.keyPath, dataMap));
      }
    }

    this.objectStores.set(name, store);
    return store;
  }

  abort(): void {
    this.aborted = true;
    // Rollback changes
    for (const [name, snapshot] of this.snapshotBeforeTx.entries()) {
      this.db.backingData.set(name, new Map(snapshot));
    }
    setTimeout(() => {
      this.onabort?.({ target: this });
    }, 0);
  }
}

class MockIDBDatabase {
  public name: string = DB_NAME;
  public version: number;
  public objectStoreNames: {
    contains: (name: string) => boolean;
    readonly length: number;
  };
  public storeConfigs: Map<string, { keyPath: string | string[] | null }> = new Map();
  public backingData: Map<string, Map<string, any>> = new Map();
  public storeIndexConfigs: Map<string, Map<string, MockIDBIndex>> = new Map();
  public onversionchange?: () => void;
  public simulateQuotaError = false;
  public isClosed = false;

  constructor(version: number) {
    this.version = version;
    this.objectStoreNames = {
      contains: (name: string) => this.storeConfigs.has(name),
      length: 0,
    };
    Object.defineProperty(this.objectStoreNames, "length", {
      get: () => this.storeConfigs.size,
    });
  }

  createObjectStore(name: string, options?: { keyPath?: string | string[] }): MockIDBObjectStore {
    this.storeConfigs.set(name, { keyPath: options?.keyPath ?? null });
    if (!this.backingData.has(name)) {
      this.backingData.set(name, new Map());
    }
    const dummyTx = new MockIDBTransaction([name], "readwrite", this);
    const store = new MockIDBObjectStore(name, options?.keyPath ?? null, this.backingData.get(name)!, dummyTx);
    this.storeIndexConfigs.set(name, store.indices);
    return store;
  }

  transaction(storeNames: string | string[], mode: "readonly" | "readwrite" = "readonly"): MockIDBTransaction {
    if (this.isClosed) {
      throw new Error("InvalidStateError: Database connection is closed");
    }
    const list = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new MockIDBTransaction(list, mode, this);
  }

  close(): void {
    this.isClosed = true;
  }
}

// Global harness simulator state
let activeMockDB: MockIDBDatabase | null = null;
let simulatedOldVersion = 1;

function setupMockIndexedDB(initialVersion = 1, initialKeyvalData: Record<string, any> = {}) {
  const db = new MockIDBDatabase(initialVersion);
  // Pre-seed v1 keyval if requested
  if (initialVersion >= 1) {
    db.createObjectStore(STORE_KEYVAL);
    const keyvalMap = db.backingData.get(STORE_KEYVAL)!;
    for (const [k, v] of Object.entries(initialKeyvalData)) {
      keyvalMap.set(k, v);
    }
  }

  activeMockDB = db;

  const mockOpen = (name: string, version: number) => {
    const req: any = {};
    setTimeout(() => {
      if (!activeMockDB || activeMockDB.isClosed) {
        const newDb = new MockIDBDatabase(activeMockDB?.version ?? version);
        if (activeMockDB) {
          newDb.backingData = activeMockDB.backingData;
          newDb.storeConfigs = activeMockDB.storeConfigs;
          newDb.storeIndexConfigs = activeMockDB.storeIndexConfigs;
        }
        activeMockDB = newDb;
      }

      const oldV = simulatedOldVersion;
      req.result = activeMockDB;

      if (version > oldV) {
        req.transaction = activeMockDB!.transaction(Array.from(activeMockDB!.storeConfigs.keys()), "readwrite");
        req.onupgradeneeded?.({
          oldVersion: oldV,
          newVersion: version,
          target: req,
        });
        activeMockDB!.version = version;
        simulatedOldVersion = version;
      }

      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  };

  (window as any).indexedDB = {
    open: vi.fn(mockOpen),
  };
}

// ---------------------------------------------------------------------------
// TEST SUITE: Q138 Durable Storage v2 Engine (PR-1)
// ---------------------------------------------------------------------------

describe("Q138 Durable Storage v2 Engine (PR-1 Specification & Invariants)", () => {
  beforeEach(() => {
    resetIDBForTesting();
    localStorage.clear();
    simulatedOldVersion = 1;
  });

  afterEach(async () => {
    await closeDurableDB();
    resetIDBForTesting();
    delete (window as any).indexedDB;
  });

  // =========================================================================
  // 1. Database Upgrade v1 -> v2 & keyval Preservation
  // =========================================================================
  describe("1. Upgrade yomirra-store v1 → v2 & Invariant Preservation", () => {
    it("preserves existing v1 keyval data completely without data loss", async () => {
      // Simulate existing v1 database with existing bookmarks & user state
      setupMockIndexedDB(1, {
        "yomirra-library": JSON.stringify({ items: { "manga-1": { title: "Frieren" } } }),
        "yomirra-settings": JSON.stringify({ theme: "dark" }),
      });

      // Trigger v2 open
      const db = await openDurableDB();
      expect(db.version).toBe(2);

      // Verify keyval was preserved intact
      const libraryData = await idbStorage.getItem("yomirra-library");
      expect(libraryData).toBe(JSON.stringify({ items: { "manga-1": { title: "Frieren" } } }));

      const settingsData = await idbStorage.getItem("yomirra-settings");
      expect(settingsData).toBe(JSON.stringify({ theme: "dark" }));
    });

    it("creates all 4 new object stores with required compound/single keys & indices", async () => {
      setupMockIndexedDB(1, {});
      const db = await openDurableDB();

      expect(db.objectStoreNames.contains(STORE_KEYVAL)).toBe(true);
      expect(db.objectStoreNames.contains(STORE_SYNC_JOURNAL)).toBe(true);
      expect(db.objectStoreNames.contains(STORE_TOMBSTONES)).toBe(true);
      expect(db.objectStoreNames.contains(STORE_SYNC_METADATA)).toBe(true);
      expect(db.objectStoreNames.contains(STORE_AUDIT_LOG)).toBe(true);

      // Check keyPaths
      expect(activeMockDB!.storeConfigs.get(STORE_SYNC_JOURNAL)?.keyPath).toBe("id");
      expect(activeMockDB!.storeConfigs.get(STORE_TOMBSTONES)?.keyPath).toEqual([
        "userId",
        "entityType",
        "entityId",
      ]);
      expect(activeMockDB!.storeConfigs.get(STORE_SYNC_METADATA)?.keyPath).toBe("key");
      expect(activeMockDB!.storeConfigs.get(STORE_AUDIT_LOG)?.keyPath).toBe("id");
    });
  });

  // =========================================================================
  // 2. Atomic Multi-Store Transactions (Commit & Rollback)
  // =========================================================================
  describe("2. Atomic Multi-Store Transactions", () => {
    beforeEach(() => {
      setupMockIndexedDB(2, {});
    });

    it("commits atomically across keyval and sync_journal", async () => {
      const journalEntry: SyncJournalEntry = {
        id: "op-uuid-1",
        userId: "user-123",
        entityType: "library",
        entityId: "manga-abc",
        operation: "upsert",
        payload: { title: "One Piece", lastReadChapter: 1100 },
        baseServerRevision: 5,
        status: "pending",
        createdAt: Date.now(),
        retryCount: 0,
      };

      await runAtomicTransaction([STORE_KEYVAL, STORE_SYNC_JOURNAL], async (stores) => {
        // 1. Write keyval (Zustand persistent mirror)
        await stores[STORE_KEYVAL].put(JSON.stringify({ title: "One Piece" }), "library-cache");
        // 2. Write outbox journal
        await stores[STORE_SYNC_JOURNAL].put(journalEntry);
      });

      // Verify both were written
      const cached = await idbStorage.getItem("library-cache");
      expect(cached).toBe(JSON.stringify({ title: "One Piece" }));

      const entries = await getJournalEntries("user-123");
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe("op-uuid-1");
      expect(entries[0].entityId).toBe("manga-abc");
    });

    it("aborts and rolls back all stores when an operation or callback throws", async () => {
      await idbStorage.setItem("existing-entry", "safe-prior-value");

      const failingAction = runAtomicTransaction([STORE_KEYVAL, STORE_SYNC_JOURNAL], async (stores) => {
        await stores[STORE_KEYVAL].put("modified-value", "existing-entry");
        await stores[STORE_SYNC_JOURNAL].put({
          id: "op-uuid-fail",
          userId: "user-123",
          entityType: "library",
          entityId: "manga-fail",
          operation: "delete",
          payload: {},
          baseServerRevision: 1,
          status: "pending",
          createdAt: Date.now(),
          retryCount: 0,
        });

        // Intentional crash mid-transaction
        throw new Error("Simulated unexpected disk write crash");
      });

      await expect(failingAction).rejects.toThrow("Simulated unexpected disk write crash");

      // Verify atomic rollback: neither the keyval modification nor the journal entry persisted
      const val = await idbStorage.getItem("existing-entry");
      expect(val).toBe("safe-prior-value");

      const entries = await getJournalEntries("user-123");
      expect(entries).toHaveLength(0);
    });

    it("prevents false success when an async callback throws after IDB operations finish", async () => {
      const delayedFailure = runAtomicTransaction([STORE_KEYVAL], async (stores) => {
        await stores[STORE_KEYVAL].put("transient-val", "transient-key");
        // Async tick delay simulating secondary validation failure
        await new Promise((r) => setTimeout(r, 25));
        throw new Error("Late async business validation failure");
      });

      await expect(delayedFailure).rejects.toThrow("Late async business validation failure");
    });
  });

  // =========================================================================
  // 3. Multi-Tab Lease Coordination with Ownership Token Verification
  // =========================================================================
  describe("3. Multi-Tab Lease Coordination with Ownership Token Verification", () => {
    beforeEach(() => {
      setupMockIndexedDB(2, {});
    });

    it("allows only one tab to acquire the sync lease and rejects competing tabs as busy", async () => {
      const tab1Result = await acquireSyncLease("tab-uuid-alpha", 30000);
      expect(tab1Result.acquired).toBe(true);
      expect(tab1Result.token).toBeDefined();

      // Second tab attempts to acquire while Tab 1 is holding the lease
      const tab2Result = await acquireSyncLease("tab-uuid-beta", 30000);
      expect(tab2Result.acquired).toBe(false);
      expect(tab2Result.reason).toBe("lease_busy");
      expect(tab2Result.leaseExpiresAt).toBe(tab1Result.leaseExpiresAt);
    });

    it("renews lease only when presenting the verified ownership token", async () => {
      const initial = await acquireSyncLease("tab-uuid-alpha", 10000);
      expect(initial.acquired).toBe(true);
      const token = initial.token!;

      // 1. Wrong token -> REJECTED
      const invalidTokenRenew = await renewSyncLease("tab-uuid-alpha", "wrong-token-xyz", 25000);
      expect(invalidTokenRenew.renewed).toBe(false);
      expect(invalidTokenRenew.reason).toBe("token_mismatch");

      // 2. Wrong holderId -> REJECTED
      const invalidHolderRenew = await renewSyncLease("tab-uuid-intruder", token, 25000);
      expect(invalidHolderRenew.renewed).toBe(false);
      expect(invalidHolderRenew.reason).toBe("holder_mismatch");

      // 3. Correct holderId + verified token -> GRANTED
      const validRenew = await renewSyncLease("tab-uuid-alpha", token, 25000);
      expect(validRenew.renewed).toBe(true);
      expect(validRenew.token).toBe(token);
      expect(validRenew.leaseExpiresAt).toBeGreaterThanOrEqual(initial.leaseExpiresAt!);
    });

    it("recovers and grants lease to a new tab when prior lease expires (crashed tab simulation)", async () => {
      // Tab 1 acquires short 50ms lease and crashes without releasing
      const tab1Result = await acquireSyncLease("tab-uuid-crashed", 50);
      expect(tab1Result.acquired).toBe(true);
      const staleToken = tab1Result.token!;

      // Wait 60ms for lease TTL to expire
      await new Promise((r) => setTimeout(r, 65));

      // Attempting to renew expired lease is rejected
      const lateRenew = await renewSyncLease("tab-uuid-crashed", staleToken, 10000);
      expect(lateRenew.renewed).toBe(false);
      expect(lateRenew.reason).toBe("lease_expired");

      // Tab 2 arrives after crash: lease expired -> granted with fresh token
      const tab2Result = await acquireSyncLease("tab-uuid-active", 30000);
      expect(tab2Result.acquired).toBe(true);
      expect(tab2Result.token).toBeDefined();
      expect(tab2Result.token).not.toBe(staleToken);
    });

    it("releases lease cleanly only when presenting the verified token", async () => {
      const initial = await acquireSyncLease("tab-uuid-alpha", 30000);
      const token = initial.token!;

      // Release with wrong token fails
      const failedRelease = await releaseSyncLease("tab-uuid-alpha", "wrong-token");
      expect(failedRelease).toBe(false);

      // Release with correct token succeeds
      const released = await releaseSyncLease("tab-uuid-alpha", token);
      expect(released).toBe(true);

      // Tab 2 can now acquire immediately without waiting for TTL
      const tab2Result = await acquireSyncLease("tab-uuid-beta", 30000);
      expect(tab2Result.acquired).toBe(true);
    });
  });

  // =========================================================================
  // 4. Storage Quota Pressure & Emergency JSON Backup Export
  // =========================================================================
  describe("4. Storage Quota Pressure & Emergency Backup Export", () => {
    beforeEach(() => {
      setupMockIndexedDB(2, {});
    });

    it("propagates QuotaExceededError cleanly on write failure without silent data loss", async () => {
      activeMockDB!.simulateQuotaError = true;

      await expect(
        addJournalEntry({
          id: "op-quota-test",
          userId: "user-123",
          entityType: "library",
          entityId: "manga-quota",
          operation: "upsert",
          payload: { title: "Big Data" },
          baseServerRevision: 1,
          status: "pending",
          createdAt: Date.now(),
          retryCount: 0,
        })
      ).rejects.toMatchObject({
        name: "QuotaExceededError",
      });
    });

    it("detects storage pressure threshold (usage >= 90% quota)", async () => {
      // Mock navigator.storage.estimate
      const originalNav = window.navigator;
      (window as any).navigator = {
        ...originalNav,
        storage: {
          estimate: vi.fn().mockResolvedValue({
            usage: 950_000_000,
            quota: 1_000_000_000, // 95% used
          }),
        },
      };

      try {
        const quotaInfo = await checkStorageQuota();
        expect(quotaInfo.usage).toBe(950_000_000);
        expect(quotaInfo.quota).toBe(1_000_000_000);
        expect(quotaInfo.percentage).toBe(95);
        expect(quotaInfo.isPressure).toBe(true);
      } finally {
        (window as any).navigator = originalNav;
      }
    });

    it("exports emergency JSON backup snapshot covering all 5 stores faithfully", async () => {
      // Populate state across all stores
      await idbStorage.setItem("user-theme", "mist");

      await addJournalEntry({
        id: "journal-entry-1",
        userId: "user-backup",
        entityType: "library",
        entityId: "manga-backup-1",
        operation: "upsert",
        payload: { title: "Berserk" },
        baseServerRevision: 2,
        status: "pending",
        createdAt: 1700000000000,
        retryCount: 0,
      });

      await putTombstone({
        userId: "user-backup",
        entityType: "library",
        entityId: "manga-tombstone-1",
        deletedAt: 1700000001000,
        tombstoneExpiresAt: 1700000001000 + 30 * 86400000,
      });

      await setSyncMetadata("sync_watermark", 1699999999000);

      await addReconciliationAudit({
        id: "audit-entry-1",
        timestamp: 1700000002000,
        mode: "mode2_full_resync",
        action: "quarantine_untracked_ghost_records",
        quarantinedEntities: [{ entityType: "library", entityId: "ghost-manga-99" }],
      });

      // Export snapshot
      const snapshot = await exportEmergencyBackup();

      expect(snapshot.dbVersion).toBe(2);
      expect(snapshot.exportedAt).toBeGreaterThan(0);
      expect(snapshot.keyval["user-theme"]).toBe("mist");
      expect(snapshot.syncJournal).toHaveLength(1);
      expect(snapshot.syncJournal[0].id).toBe("journal-entry-1");
      expect(snapshot.tombstones).toHaveLength(1);
      expect(snapshot.tombstones[0].entityId).toBe("manga-tombstone-1");
      expect(snapshot.syncMetadata).toHaveLength(1);
      expect(snapshot.syncMetadata[0].key).toBe("sync_watermark");
      expect(snapshot.reconciliationAuditLog).toHaveLength(1);
      expect(snapshot.reconciliationAuditLog[0].id).toBe("audit-entry-1");

      // Verify snapshot can be cleanly JSON-serialized without circular dependencies
      const json = JSON.stringify(snapshot);
      expect(json).toContain("Berserk");
      expect(json).toContain("ghost-manga-99");
    });
  });

  // =========================================================================
  // 5. Browser Restart & Connection Rehydration
  // =========================================================================
  describe("5. Browser Restart & Connection Rehydration", () => {
    it("preserves state across simulated tab close, restart, and reconnection", async () => {
      setupMockIndexedDB(2, {});

      // Step 1: Session 1 writes data
      await addJournalEntry({
        id: "session-1-entry",
        userId: "user-session",
        entityType: "library",
        entityId: "manga-session",
        operation: "upsert",
        payload: { title: "Dungeon Meshi" },
        baseServerRevision: 1,
        status: "pending",
        createdAt: Date.now(),
        retryCount: 0,
      });
      await idbStorage.setItem("session-key", "session-value");

      // Step 2: Simulate tab close / browser termination
      await closeDurableDB();
      resetIDBForTesting();

      // Step 3: Session 2 reopens DB
      const reopenedDb = await openDurableDB();
      expect(reopenedDb.name).toBe(DB_NAME);
      expect((reopenedDb as any).isClosed).toBe(false);

      // Verify data is completely intact
      const keyvalVal = await idbStorage.getItem("session-key");
      expect(keyvalVal).toBe("session-value");

      const journalEntries = await getJournalEntries("user-session");
      expect(journalEntries).toHaveLength(1);
      expect(journalEntries[0].id).toBe("session-1-entry");
      expect(journalEntries[0].payload).toEqual({ title: "Dungeon Meshi" });
    });
  });

  // =========================================================================
  // 6. Store-Specific Helper Functions (Journal, Tombstones, Meta, Audit)
  // =========================================================================
  describe("6. Store-Specific Helper Functions", () => {
    beforeEach(() => {
      setupMockIndexedDB(2, {});
    });

    it("supports updating journal status, lease expiration, and deletion", async () => {
      await addJournalEntry({
        id: "op-status-test",
        userId: "user-ops",
        entityType: "library",
        entityId: "manga-ops",
        operation: "upsert",
        payload: { title: "Chainsaw Man" },
        baseServerRevision: 3,
        status: "pending",
        createdAt: Date.now(),
        retryCount: 0,
      });

      // Update to processing with lease
      await updateJournalEntryStatus("op-status-test", "processing", Date.now() + 30000);
      let entries = await getJournalEntries("user-ops", "processing");
      expect(entries).toHaveLength(1);
      expect(entries[0].status).toBe("processing");
      expect(entries[0].leaseExpiresAt).toBeGreaterThan(0);

      // Remove entry
      await removeJournalEntry("op-status-test");
      entries = await getJournalEntries("user-ops");
      expect(entries).toHaveLength(0);
    });

    it("supports tombstone creation, retrieval, and user query", async () => {
      const record: TombstoneRecord = {
        userId: "user-tomb",
        entityType: "library",
        entityId: "manga-deleted",
        deletedAt: 1700000000000,
        tombstoneExpiresAt: 1700000000000 + 30 * 86400000,
      };

      await putTombstone(record);

      const retrieved = await getTombstone("user-tomb", "library", "manga-deleted");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.deletedAt).toBe(1700000000000);

      const userTombstones = await getTombstonesForUser("user-tomb");
      expect(userTombstones).toHaveLength(1);
      expect(userTombstones[0].entityId).toBe("manga-deleted");
    });

    it("supports metadata and reconciliation audit logging", async () => {
      await setSyncMetadata("last_sync_rev", 42);
      const rev = await getSyncMetadata<number>("last_sync_rev");
      expect(rev).toBe(42);

      const auditEntry: ReconciliationAuditEntry = {
        id: "audit-test-1",
        timestamp: Date.now(),
        mode: "mode1_incremental",
        action: "prune_synced_outbox",
        quarantinedEntities: [],
        details: "Cleaned 5 entries",
      };

      await addReconciliationAudit(auditEntry);
      const audits = await getReconciliationAudits(10);
      expect(audits).toHaveLength(1);
      expect(audits[0].action).toBe("prune_synced_outbox");
    });
  });
});
