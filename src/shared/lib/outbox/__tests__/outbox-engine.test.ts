import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isOutboxPathEnabled,
  setOutboxPathEnabledForTesting,
  enqueueLibraryUpsert,
  enqueueLibraryDelete,
  enqueueHistoryUpsert,
  enqueueHistoryDelete,
  enqueueMangaHistoryBatchDelete,
  enqueueCollectionsUpsert,
  enqueueCollectionDelete,
  reconcileStartupOutbox,
  getPendingOutboxEntries,
  updateOutboxStatus,
  GUEST_USER_ID,
} from "../index";
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
  idbStorage,
} from "@/shared/lib/idb-storage";
import type { LibraryItem } from "@/shared/store/library-store";
import type { HistoryItem } from "@/shared/store/history-store";
import type { Collection } from "@/shared/types/collection";

// ---------------------------------------------------------------------------
// High-Fidelity IDB Test Harness
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
          const match = this.keyPath.every(
            (k, i) => value[k] === (Array.isArray(query) ? query[i] : query)
          );
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

  createIndex(name: string, keyPath: string | string[]) {
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
    const store = new MockIDBObjectStore(
      name,
      options?.keyPath ?? null,
      this.backingData.get(name)!,
      dummyTx
    );
    this.storeIndexConfigs.set(name, store.indices);
    return store;
  }

  transaction(
    storeNames: string | string[],
    mode: "readonly" | "readwrite" = "readonly"
  ): MockIDBTransaction {
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

let activeMockDB: MockIDBDatabase | null = null;

function setupMockIndexedDB() {
  const db = new MockIDBDatabase(2);
  // Pre-seed all v2 stores
  db.createObjectStore(STORE_KEYVAL);
  const journalStore = db.createObjectStore(STORE_SYNC_JOURNAL, { keyPath: "id" });
  journalStore.createIndex("userId", "userId");
  journalStore.createIndex("status", "status");
  journalStore.createIndex("createdAt", "createdAt");
  journalStore.createIndex("entityKey", ["userId", "entityType", "entityId"]);

  const tombstonesStore = db.createObjectStore(STORE_TOMBSTONES, {
    keyPath: ["userId", "entityType", "entityId"],
  });
  tombstonesStore.createIndex("deletedAt", "deletedAt");
  tombstonesStore.createIndex("userId", "userId");

  db.createObjectStore(STORE_SYNC_METADATA, { keyPath: "key" });
  const auditStore = db.createObjectStore(STORE_AUDIT_LOG, { keyPath: "id" });
  auditStore.createIndex("timestamp", "timestamp");

  activeMockDB = db;

  const mockOpen = (_name: string, version: number) => {
    const req: any = {};
    setTimeout(() => {
      req.result = activeMockDB;
      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  };

  (window as any).indexedDB = {
    open: vi.fn(mockOpen),
  };
}

// ---------------------------------------------------------------------------
// TEST SUITE: PR-2 Outbox-First Write Path Engine & Adapters
// ---------------------------------------------------------------------------

describe("Q138 PR-2: Outbox-First Write Path Engine & Dark Launch Activation Gate", () => {
  beforeEach(() => {
    resetIDBForTesting();
    localStorage.clear();
    setOutboxPathEnabledForTesting(null);
    setupMockIndexedDB();
  });

  afterEach(async () => {
    await closeDurableDB();
    resetIDBForTesting();
    setOutboxPathEnabledForTesting(null);
    delete (window as any).indexedDB;
  });

  // =========================================================================
  // 1. Activation Gate & Dark Launch Invariant
  // =========================================================================
  describe("1. Dark Launch Activation Gate Invariants", () => {
    it("is strictly disabled by default at runtime", () => {
      expect(isOutboxPathEnabled()).toBe(false);
    });

    it("can be enabled via testing override and cleanly reset", () => {
      setOutboxPathEnabledForTesting(true);
      expect(isOutboxPathEnabled()).toBe(true);

      setOutboxPathEnabledForTesting(false);
      expect(isOutboxPathEnabled()).toBe(false);

      setOutboxPathEnabledForTesting(null);
      expect(isOutboxPathEnabled()).toBe(false);
    });
  });

  // =========================================================================
  // 2. Library Outbox Mutation Adapter
  // =========================================================================
  describe("2. Library Outbox Mutation Adapter", () => {
    const sampleManga: LibraryItem = {
      sourceId: "mangadex",
      mangaId: "frieren-123",
      title: "Sousou no Frieren",
      coverUrl: "https://example.com/frieren.jpg",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("atomically commits library upsert to keyval and sync_journal", async () => {
      const result = await enqueueLibraryUpsert(sampleManga, { userId: "user-alpha" });
      expect(result.opId).toBeDefined();
      expect(result.userId).toBe("user-alpha");
      expect(result.coalesced).toBe(false);

      // Verify persistent keyval reflects the change
      const rawKeyval = await idbStorage.getItem("yomirra-library");
      expect(rawKeyval).toBeDefined();
      const stateObj = JSON.parse(rawKeyval!);
      expect(stateObj.state.items["mangadex::frieren-123"].title).toBe("Sousou no Frieren");

      // Verify sync_journal entry
      const pending = await getPendingOutboxEntries("user-alpha");
      expect(pending).toHaveLength(1);
      expect(pending[0].entityType).toBe("library");
      expect(pending[0].entityId).toBe("mangadex::frieren-123");
      expect(pending[0].operation).toBe("upsert");
      expect(pending[0].status).toBe("pending");
    });

    it("coalesces sequential offline updates to the same manga without bloating outbox", async () => {
      // First write
      const r1 = await enqueueLibraryUpsert(sampleManga, { userId: "user-alpha" });

      // Second write while still offline (updating rating)
      const updatedManga: LibraryItem = {
        ...sampleManga,
        userRating: 9,
      };
      const r2 = await enqueueLibraryUpsert(updatedManga, { userId: "user-alpha" });

      expect(r2.coalesced).toBe(true);
      expect(r2.opId).toBe(r1.opId);

      // Outbox still has exactly 1 entry with merged payload
      const pending = await getPendingOutboxEntries("user-alpha");
      expect(pending).toHaveLength(1);
      expect((pending[0].payload as any).userRating).toBe(9);
    });

    it("atomically handles delete by writing tombstone and updating keyval", async () => {
      // 1. Initial insert
      await enqueueLibraryUpsert(sampleManga, { userId: "user-alpha" });

      // 2. Delete
      const delResult = await enqueueLibraryDelete("mangadex", "frieren-123", {
        userId: "user-alpha",
      });
      expect(delResult.opId).toBeDefined();

      // Keyval should no longer contain the item
      const rawKeyval = await idbStorage.getItem("yomirra-library");
      const stateObj = JSON.parse(rawKeyval!);
      expect(stateObj.state.items["mangadex::frieren-123"]).toBeUndefined();

      // Outbox has delete mutation
      const pending = await getPendingOutboxEntries("user-alpha");
      expect(pending).toHaveLength(1);
      expect(pending[0].operation).toBe("delete");

      // Tombstone store contains tombstone record
      const tombstoneMap = activeMockDB!.backingData.get(STORE_TOMBSTONES)!;
      const tombstoneRecord = tombstoneMap.get(
        JSON.stringify(["user-alpha", "library", "mangadex::frieren-123"])
      );
      expect(tombstoneRecord).toBeDefined();
      expect(tombstoneRecord.deletedAt).toBeGreaterThan(0);
    });

    it("preserves userRating in keyval by marking isBookmarked false instead of deleting", async () => {
      const ratedManga: LibraryItem = {
        ...sampleManga,
        userRating: 10,
        isBookmarked: true,
      };

      await enqueueLibraryUpsert(ratedManga, { userId: "user-alpha" });

      await enqueueLibraryDelete("mangadex", "frieren-123", { userId: "user-alpha" });

      const rawKeyval = await idbStorage.getItem("yomirra-library");
      const stateObj = JSON.parse(rawKeyval!);
      const item = stateObj.state.items["mangadex::frieren-123"];
      expect(item).toBeDefined();
      expect(item.userRating).toBe(10);
      expect(item.isBookmarked).toBe(false);
    });

    it("handles explicit restore by clearing local tombstone and marking isExplicitRestore", async () => {
      await enqueueLibraryDelete("mangadex", "frieren-123", { userId: "user-alpha" });

      // User explicitly re-bookmarks
      await enqueueLibraryUpsert(sampleManga, {
        userId: "user-alpha",
        isExplicitRestore: true,
      });

      const pending = await getPendingOutboxEntries("user-alpha");
      expect(pending).toHaveLength(1);
      expect(pending[0].operation).toBe("upsert");
      expect(pending[0].isExplicitRestore).toBe(true);

      // Tombstone is removed
      const tombstoneMap = activeMockDB!.backingData.get(STORE_TOMBSTONES)!;
      const tombstoneRecord = tombstoneMap.get(
        JSON.stringify(["user-alpha", "library", "mangadex::frieren-123"])
      );
      expect(tombstoneRecord).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. History Outbox Mutation Adapter
  // =========================================================================
  describe("3. History Outbox Mutation Adapter", () => {
    const sampleHistory: HistoryItem = {
      sourceId: "mangadex",
      mangaId: "one-piece",
      chapterId: "ch-1100",
      mangaTitle: "One Piece",
      chapterTitle: "Chapter 1100",
      pageIndex: 12,
      totalPages: 19,
      readAt: Date.now(),
    };

    it("atomically enqueues history upsert and updates yomirra-history state", async () => {
      const res = await enqueueHistoryUpsert(sampleHistory, { userId: "user-beta" });
      expect(res.opId).toBeDefined();

      const rawKeyval = await idbStorage.getItem("yomirra-history");
      const stateObj = JSON.parse(rawKeyval!);
      expect(stateObj.state.items["mangadex::one-piece::ch-1100"].pageIndex).toBe(12);

      const pending = await getPendingOutboxEntries("user-beta");
      expect(pending).toHaveLength(1);
      expect(pending[0].entityType).toBe("history");
      expect(pending[0].entityId).toBe("mangadex::one-piece::ch-1100");
    });

    it("supports single chapter deletion and batch chapter deletion", async () => {
      await enqueueHistoryUpsert(sampleHistory, { userId: "user-beta" });

      const delRes = await enqueueHistoryDelete("mangadex", "one-piece", "ch-1100", {
        userId: "user-beta",
      });
      expect(delRes.opId).toBeDefined();

      const rawKeyval = await idbStorage.getItem("yomirra-history");
      const stateObj = JSON.parse(rawKeyval!);
      expect(stateObj.state.items["mangadex::one-piece::ch-1100"]).toBeUndefined();

      // Batch delete test
      const batchRes = await enqueueMangaHistoryBatchDelete(
        "mangadex",
        "one-piece",
        ["ch-1", "ch-2", "ch-3"],
        { userId: "user-beta" }
      );
      expect(batchRes).toHaveLength(3);
      const pendingBatch = await getPendingOutboxEntries("user-beta");
      expect(pendingBatch).toHaveLength(4);
      expect(pendingBatch.every((p) => p.operation === "delete")).toBe(true);
    });
  });

  // =========================================================================
  // 4. Collections Outbox Mutation Adapter
  // =========================================================================
  describe("4. Collections Outbox Mutation Adapter", () => {
    const sampleCollection: Collection = {
      id: "col-shonen",
      name: "Favorite Shonen",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: 0,
    };

    it("atomically enqueues collections upsert and updates local state", async () => {
      await enqueueCollectionsUpsert(
        {
          collections: [sampleCollection],
          membershipsByManga: { "mangadex::one-piece": ["col-shonen"] },
        },
        { userId: "user-gamma" }
      );

      const rawKeyval = await idbStorage.getItem("yomirra-collections");
      const stateObj = JSON.parse(rawKeyval!);
      expect(stateObj.state.collections).toHaveLength(1);
      expect(stateObj.state.collections[0].name).toBe("Favorite Shonen");
      expect(stateObj.state.membershipsByManga["mangadex::one-piece"]).toEqual(["col-shonen"]);

      const pending = await getPendingOutboxEntries("user-gamma");
      expect(pending).toHaveLength(1);
      expect(pending[0].entityType).toBe("collection");
    });

    it("enqueues collection deletion and purges collection from local state", async () => {
      await enqueueCollectionsUpsert(
        {
          collections: [sampleCollection],
          membershipsByManga: { "mangadex::one-piece": ["col-shonen"] },
        },
        { userId: "user-gamma" }
      );

      await enqueueCollectionDelete("col-shonen", { userId: "user-gamma" });

      const rawKeyval = await idbStorage.getItem("yomirra-collections");
      const stateObj = JSON.parse(rawKeyval!);
      expect(stateObj.state.collections).toHaveLength(0);
      expect(stateObj.state.membershipsByManga["mangadex::one-piece"]).toHaveLength(0);
    });
  });

  // =========================================================================
  // 5. UID Isolation & Guest Boundary
  // =========================================================================
  describe("5. UID Isolation & Guest Boundary", () => {
    it("partitions outbox mutations by user and isolates guest data", async () => {
      // 1. User Alpha enqueues
      await enqueueLibraryUpsert(
        { sourceId: "s1", mangaId: "m1", title: "Manga 1", addedAt: "", updatedAt: "" },
        { userId: "user-alpha" }
      );

      // 2. Guest enqueues
      await enqueueLibraryUpsert(
        { sourceId: "s2", mangaId: "m2", title: "Manga 2", addedAt: "", updatedAt: "" },
        { userId: GUEST_USER_ID }
      );

      // User Alpha outbox only contains User Alpha
      const alphaEntries = await getPendingOutboxEntries("user-alpha");
      expect(alphaEntries).toHaveLength(1);
      expect(alphaEntries[0].entityId).toBe("s1::m1");

      // Guest outbox only contains Guest
      const guestEntries = await getPendingOutboxEntries(GUEST_USER_ID);
      expect(guestEntries).toHaveLength(1);
      expect(guestEntries[0].entityId).toBe("s2::m2");

      // User Beta (new login) has empty outbox
      const betaEntries = await getPendingOutboxEntries("user-beta");
      expect(betaEntries).toHaveLength(0);
    });
  });

  // =========================================================================
  // 6. Startup Reconciliation & Crash Recovery
  // =========================================================================
  describe("6. Startup Reconciliation & Crash Recovery", () => {
    it("recovers entries stuck in processing due to prior crash when lease has expired", async () => {
      const res = await enqueueLibraryUpsert(
        { sourceId: "s1", mangaId: "m1", title: "Manga 1", addedAt: "", updatedAt: "" },
        { userId: "user-crash" }
      );

      // Simulate sync worker crashed: status became 'processing' with expired lease
      await updateOutboxStatus(res.opId, "processing", {
        leaseExpiresAt: Date.now() - 5000, // expired 5 seconds ago
      });

      // Confirm it's currently marked processing
      const journalMap = activeMockDB!.backingData.get(STORE_SYNC_JOURNAL)!;
      expect(journalMap.get(res.opId).status).toBe("processing");

      // Startup reconciliation runs
      const summary = await reconcileStartupOutbox("user-crash");
      expect(summary.crashedLeasesRecovered).toBe(1);
      expect(summary.recoveredOpIds).toContain(res.opId);
      expect(summary.totalPending).toBe(1);

      // Confirm status was reset to pending with incremented retryCount
      expect(journalMap.get(res.opId).status).toBe("pending");
      expect(journalMap.get(res.opId).retryCount).toBe(1);
    });

    it("does not reset active unexpired processing leases belonging to a live tab", async () => {
      const res = await enqueueLibraryUpsert(
        { sourceId: "s1", mangaId: "m1", title: "Manga 1", addedAt: "", updatedAt: "" },
        { userId: "user-live" }
      );

      // Lease active for next 25 seconds
      await updateOutboxStatus(res.opId, "processing", {
        leaseExpiresAt: Date.now() + 25000,
      });

      const summary = await reconcileStartupOutbox("user-live");
      expect(summary.crashedLeasesRecovered).toBe(0);
      expect(summary.totalPending).toBe(0); // currently in flight, not pending
    });
  });

  // =========================================================================
  // 7. Storage Failure Recovery
  // =========================================================================
  describe("7. Storage Failure Recovery", () => {
    it("propagates QuotaExceededError and prevents in-memory corruption", async () => {
      activeMockDB!.simulateQuotaError = true;

      await expect(
        enqueueLibraryUpsert(
          { sourceId: "s1", mangaId: "m1", title: "Manga 1", addedAt: "", updatedAt: "" },
          { userId: "user-quota" }
        )
      ).rejects.toMatchObject({
        name: "QuotaExceededError",
      });

      // Verify no corrupted entries were written to sync_journal
      const journalMap = activeMockDB!.backingData.get(STORE_SYNC_JOURNAL)!;
      expect(journalMap.size).toBe(0);
    });
  });
});
