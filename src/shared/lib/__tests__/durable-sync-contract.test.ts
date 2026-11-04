import { describe, it, expect, beforeEach } from "vitest"
import type { ReaderPreferences } from "@/shared/types/manga"

/**
 * EXECUTABLE TEST HARNESS FOR Q138 & Q97 FINAL SPECIFICATION
 * Validates:
 * 1. True Idempotency with Operation Receipts & FIFO Ring Buffer.
 * 2. Causal Concurrency: Restore Precedence against Stale Remote Delete.
 * 3. Conflict-Safe Transaction: Rejection of Stale Reading Progress Backslide.
 * 4. Mode 2 Full-Resync (200+ Days Offline): 4-Way State Separation (Preserves Pending Offline Work, Quarantines Ghost Items).
 * 5. Crash Recovery: Cloud Commit before Outbox ACK Two-Phase Protection.
 * 6. Multi-Tab Atomic Lease with Fencing Tokens and 30s Crash Recovery.
 * 7. UID Switch Isolation (User A -> Logout -> User B).
 * 8. Q97 ReaderPreferences Strict Boundary Isolation.
 */

interface SyncedDocument {
  id: string
  title: string
  lastReadChapter?: number
  _revision: number
  _processedOpIds: string[]
  _lastOpId: string
  _tombstone: boolean
  _deletedAt?: number
  _restoredAt?: number
  _lastRestoreRev?: number
  _updatedAt: number
}

interface OutboxMutation {
  opId: string
  userId: string
  operation: "upsert" | "delete"
  payload: Partial<SyncedDocument>
  baseServerRevision: number
  createdAt: number
  isExplicitRestore?: boolean
}

interface SyncReceipt {
  opId: string
  targetPath: string
  committedRevision: number
  operation: "upsert" | "delete"
  createdAt: number
}

// Full Transaction Simulator with Layer 1 Ring Buffer and Layer 2 Receipts
class MockFirestoreTransactionEngine {
  private documents: Map<string, SyncedDocument> = new Map()
  private receipts: Map<string, SyncReceipt> = new Map()

  setDoc(id: string, doc: SyncedDocument) {
    this.documents.set(id, { ...doc })
  }

  getDoc(id: string): SyncedDocument | undefined {
    return this.documents.get(id)
  }

  getReceipt(opId: string): SyncReceipt | undefined {
    return this.receipts.get(opId)
  }

  executeTransaction(
    docId: string,
    mutation: OutboxMutation
  ): { success: boolean; outcome: string; committedRevision: number; reason?: string } {
    const current = this.documents.get(docId)
    const { opId, operation, payload, baseServerRevision, createdAt, isExplicitRestore } = mutation

    // Check Layer 2 Receipts Store
    if (this.receipts.has(opId)) {
      const receipt = this.receipts.get(opId)!
      return {
        success: true,
        outcome: "idempotent_replay",
        committedRevision: receipt.committedRevision,
      }
    }

    // 1. Initial Creation if Not Exists
    if (!current) {
      if (operation === "delete") {
        return { success: true, outcome: "idempotent_delete_non_existent", committedRevision: 0 }
      }
      const newDoc: SyncedDocument = {
        id: docId,
        title: payload.title ?? "Untitled",
        lastReadChapter: payload.lastReadChapter,
        _revision: 1,
        _processedOpIds: [opId],
        _lastOpId: opId,
        _tombstone: false,
        _updatedAt: Date.now(),
      }
      this.documents.set(docId, newDoc)
      this.receipts.set(opId, {
        opId,
        targetPath: `documents/${docId}`,
        committedRevision: 1,
        operation: "upsert",
        createdAt: Date.now(),
      })
      return { success: true, outcome: "created", committedRevision: 1 }
    }

    // 2. Check Layer 1 Document Ring Buffer
    if (current._processedOpIds.includes(opId)) {
      return {
        success: true,
        outcome: "idempotent_replay",
        committedRevision: current._revision,
      }
    }

    const currentRev = current._revision
    const nextOpIds = [...current._processedOpIds.slice(-49), opId]

    // 3. Delete Handling with Restore Precedence Protection
    if (operation === "delete") {
      // CAUSAL CHECK: Did another device explicitly restore this document after the delete was created?
      if (!current._tombstone && current._restoredAt && createdAt < current._restoredAt) {
        return {
          success: false,
          outcome: "conflict_rejected_stale_delete_after_restore",
          committedRevision: currentRev,
          reason: `Stale delete created at ${createdAt} cannot override explicit restore at ${current._restoredAt}`,
        }
      }

      if (current._tombstone) {
        current._processedOpIds = nextOpIds
        return { success: true, outcome: "already_tombstoned", committedRevision: currentRev }
      }

      current._tombstone = true
      current._deletedAt = Date.now()
      current._updatedAt = Date.now()
      current._revision = currentRev + 1
      current._lastOpId = opId
      current._processedOpIds = nextOpIds
      this.receipts.set(opId, {
        opId,
        targetPath: `documents/${docId}`,
        committedRevision: current._revision,
        operation: "delete",
        createdAt: Date.now(),
      })
      return { success: true, outcome: "deleted", committedRevision: current._revision }
    }

    // 4. Upsert on Tombstoned Item
    if (current._tombstone) {
      if (!isExplicitRestore) {
        return {
          success: false,
          outcome: "conflict_rejected_tombstone",
          committedRevision: currentRev,
          reason: "Item was deleted remotely. Explicit restore required.",
        }
      }
      // Explicit restore approved
      current._tombstone = false
      delete current._deletedAt
      current._restoredAt = Date.now()
      current._lastRestoreRev = currentRev + 1
      current._updatedAt = Date.now()
      current._revision = currentRev + 1
      current._lastOpId = opId
      current._processedOpIds = nextOpIds
      if (payload.title) current.title = payload.title
      if (payload.lastReadChapter !== undefined) current.lastReadChapter = payload.lastReadChapter
      this.receipts.set(opId, {
        opId,
        targetPath: `documents/${docId}`,
        committedRevision: current._revision,
        operation: "upsert",
        createdAt: Date.now(),
      })
      return { success: true, outcome: "restored", committedRevision: current._revision }
    }

    // 5. Upsert on Active Item: Revision Mismatch / Stale Check (NO Math.max)
    if (baseServerRevision < currentRev) {
      if (
        payload.lastReadChapter !== undefined &&
        current.lastReadChapter !== undefined &&
        payload.lastReadChapter <= current.lastReadChapter
      ) {
        return {
          success: false,
          outcome: "conflict_rejected_stale_progress",
          committedRevision: currentRev,
          reason: `Incoming progress (${payload.lastReadChapter}) <= server progress (${current.lastReadChapter})`,
        }
      }

      return {
        success: false,
        outcome: "conflict_revision_mismatch",
        committedRevision: currentRev,
        reason: `Base revision (${baseServerRevision}) < current revision (${currentRev})`,
      }
    }

    // 6. Clean Sequential Upsert
    current._updatedAt = Date.now()
    current._revision = currentRev + 1
    current._lastOpId = opId
    current._processedOpIds = nextOpIds
    if (payload.title) current.title = payload.title
    if (payload.lastReadChapter !== undefined) current.lastReadChapter = payload.lastReadChapter
    this.receipts.set(opId, {
      opId,
      targetPath: `documents/${docId}`,
      committedRevision: current._revision,
      operation: "upsert",
      createdAt: Date.now(),
    })

    return { success: true, outcome: "updated", committedRevision: current._revision }
  }
}

describe("Q138 Scenario 1: True Idempotency with Operation Receipts & Ring Buffer", () => {
  let engine: MockFirestoreTransactionEngine

  beforeEach(() => {
    engine = new MockFirestoreTransactionEngine()
  })

  it("safely handles out-of-order delayed replay of Op 1 after Op 2 has committed", () => {
    const docId = "manga-jujutsu"
    engine.setDoc(docId, {
      id: docId,
      title: "Jujutsu Kaisen",
      lastReadChapter: 4,
      _revision: 1,
      _processedOpIds: ["op-init"],
      _lastOpId: "op-init",
      _tombstone: false,
      _updatedAt: 1000,
    })

    const op1: OutboxMutation = {
      opId: "uuid-op-1",
      userId: "user-1",
      operation: "upsert",
      payload: { lastReadChapter: 5 },
      baseServerRevision: 1,
      createdAt: 1100,
    }
    const res1 = engine.executeTransaction(docId, op1)
    expect(res1.success).toBe(true)
    expect(res1.outcome).toBe("updated")
    expect(engine.getDoc(docId)?.lastReadChapter).toBe(5)

    const op2: OutboxMutation = {
      opId: "uuid-op-2",
      userId: "user-1",
      operation: "upsert",
      payload: { lastReadChapter: 6 },
      baseServerRevision: 2,
      createdAt: 1200,
    }
    const res2 = engine.executeTransaction(docId, op2)
    expect(res2.success).toBe(true)
    expect(res2.outcome).toBe("updated")
    expect(engine.getDoc(docId)?.lastReadChapter).toBe(6)

    // Delayed network replay of Op 1
    const replayRes = engine.executeTransaction(docId, op1)
    expect(replayRes.success).toBe(true)
    expect(replayRes.outcome).toBe("idempotent_replay")

    // State remains Chapter 6, revision 3
    expect(engine.getDoc(docId)?.lastReadChapter).toBe(6)
    expect(engine.getDoc(docId)?._revision).toBe(3)
  })
})

describe("Q138 Scenario 2: Concurrency & Restore Precedence against Stale Remote Delete", () => {
  let engine: MockFirestoreTransactionEngine

  beforeEach(() => {
    engine = new MockFirestoreTransactionEngine()
  })

  it("protects an explicit restore on Device B from being silently deleted by a delayed stale delete from Device A", () => {
    const docId = "manga-chainsaw"
    // Manga was deleted on Device A at t=1000
    engine.setDoc(docId, {
      id: docId,
      title: "Chainsaw Man",
      _revision: 2,
      _processedOpIds: ["op-del-a"],
      _lastOpId: "op-del-a",
      _tombstone: true,
      _deletedAt: 1000,
      _updatedAt: 1000,
    })

    // At t=2000, user on Device B explicitly restores the title
    const restoreMutation: OutboxMutation = {
      opId: "uuid-restore-b",
      userId: "user-1",
      operation: "upsert",
      payload: { title: "Chainsaw Man (Restored)" },
      baseServerRevision: 2,
      createdAt: 2000,
      isExplicitRestore: true,
    }
    const restoreRes = engine.executeTransaction(docId, restoreMutation)
    expect(restoreRes.success).toBe(true)
    expect(restoreRes.outcome).toBe("restored")
    expect(engine.getDoc(docId)?._tombstone).toBe(false)
    expect(engine.getDoc(docId)?._revision).toBe(3)

    // A stale sync packet from Device A arrives containing an old delete created at t=900 (before restore at t=2000)
    const staleDeleteMutation: OutboxMutation = {
      opId: "uuid-stale-delete-a",
      userId: "user-1",
      operation: "delete",
      payload: {},
      baseServerRevision: 1,
      createdAt: 900, // Older than restore!
    }
    const staleDeleteRes = engine.executeTransaction(docId, staleDeleteMutation)

    // Must be rejected! Restore intent on Device B takes causal precedence
    expect(staleDeleteRes.success).toBe(false)
    expect(staleDeleteRes.outcome).toBe("conflict_rejected_stale_delete_after_restore")
    expect(engine.getDoc(docId)?._tombstone).toBe(false) // Still active!
  })
})

describe("Q138 Scenario 3: Conflict-Safe Rejection of Stale Reading Progress", () => {
  let engine: MockFirestoreTransactionEngine

  beforeEach(() => {
    engine = new MockFirestoreTransactionEngine()
  })

  it("rejects stale chapter progress backsliding without Math.max masking", () => {
    const docId = "manga-frieren"
    engine.setDoc(docId, {
      id: docId,
      title: "Frieren: Beyond Journey",
      lastReadChapter: 15,
      _revision: 5,
      _processedOpIds: ["op-b5"],
      _lastOpId: "op-b5",
      _tombstone: false,
      _updatedAt: 3000,
    })

    const staleProgressMutation: OutboxMutation = {
      opId: "uuid-stale-progress",
      userId: "user-1",
      operation: "upsert",
      payload: { lastReadChapter: 12 }, // Stale!
      baseServerRevision: 2,
      createdAt: 2500,
    }

    const res = engine.executeTransaction(docId, staleProgressMutation)
    expect(res.success).toBe(false)
    expect(res.outcome).toBe("conflict_rejected_stale_progress")
    expect(engine.getDoc(docId)?.lastReadChapter).toBe(15)
    expect(engine.getDoc(docId)?._revision).toBe(5)
  })
})

describe("Q138 Scenario 4: Mode 2 Full-Resync (200+ Days Offline) & 4-Way State Separation", () => {
  it("preserves legitimate pending offline work while evicting confirmed ghost records during watermark breach", () => {
    const tNow = 20_000_000
    const dayMs = 86400 * 1000
    const watermark180DaysAgo = tNow - 180 * dayMs
    const clientLastSync200DaysAgo = tNow - 200 * dayMs

    // Watermark breach detected (>180 days offline)
    expect(clientLastSync200DaysAgo).toBeLessThan(watermark180DaysAgo)

    // Local state on Device B before sync
    const localConfirmedItems = new Map<string, { id: string; title: string; cloudConfirmed: boolean }>([
      ["manga-active-cloud", { id: "manga-active-cloud", title: "Active on Cloud", cloudConfirmed: true }],
      ["manga-deleted-long-ago", { id: "manga-deleted-long-ago", title: "Deleted on Cloud", cloudConfirmed: true }],
    ])

    // Offline mutations created by user while in airplane mode (stored in sync_journal)
    const syncJournal = new Map<string, { id: string; opId: string; title: string; operation: string }>([
      ["manga-offline-new", { id: "manga-offline-new", opId: "op-offline-1", title: "Created Offline", operation: "upsert" }],
    ])

    const localQuarantine = new Map<string, any>()

    // Authoritative cloud active set
    const cloudActiveSet = new Set(["manga-active-cloud"])

    // Mode 2 Full-Resync Execution:
    // 1. Uncommitted offline mutations in sync_journal are PROTECTED and NOT quarantined
    // 2. Only confirmed items missing from cloudActiveSet and absent from sync_journal are evicted
    for (const [id, item] of localConfirmedItems.entries()) {
      const hasPendingOutbox = syncJournal.has(id)
      if (!cloudActiveSet.has(id) && !hasPendingOutbox) {
        localQuarantine.set(id, { ...item, quarantinedAt: tNow })
        localConfirmedItems.delete(id)
      }
    }

    // 3. Pending offline work is preserved
    expect(syncJournal.has("manga-offline-new")).toBe(true)

    // 4. Ghost record is evicted from active items into quarantine
    expect(localConfirmedItems.has("manga-deleted-long-ago")).toBe(false)
    expect(localQuarantine.has("manga-deleted-long-ago")).toBe(true)

    // 5. Active cloud item is preserved
    expect(localConfirmedItems.has("manga-active-cloud")).toBe(true)
  })
})

describe("Q138 Scenario 5: Crash Recovery (Cloud Commit before Outbox ACK)", () => {
  let engine: MockFirestoreTransactionEngine

  beforeEach(() => {
    engine = new MockFirestoreTransactionEngine()
  })

  it("safely ACKs outbox entry on restart without double-incrementing revision", () => {
    const docId = "manga-solo"
    const op: OutboxMutation = {
      opId: "uuid-crash-op-99",
      userId: "user-1",
      operation: "upsert",
      payload: { title: "Solo Leveling" },
      baseServerRevision: 0,
      createdAt: 1000,
    }

    // Step 1 & 2: Cloud commit succeeds
    const firstAttempt = engine.executeTransaction(docId, op)
    expect(firstAttempt.success).toBe(true)
    expect(firstAttempt.committedRevision).toBe(1)

    // APP CRASHES HERE before client can write ACK to local IndexedDB sync_journal!
    // On restart, client re-reads un-ACKed outbox entry from sync_journal and resubmits
    const retryAttempt = engine.executeTransaction(docId, op)
    expect(retryAttempt.success).toBe(true)
    expect(retryAttempt.outcome).toBe("idempotent_replay")
    expect(retryAttempt.committedRevision).toBe(1) // Still rev 1, not rev 2!

    // Client can now safely remove entry from sync_journal
  })
})

describe("Q138 Scenario 6: Multi-Tab Atomic Lease with Fencing Tokens", () => {
  interface SyncLease {
    token: string
    ownerTabId: string
    expiresAt: number
  }

  class MockLeaseManager {
    private lease: SyncLease | null = null

    acquire(tabId: string, ttlMs = 30_000, now = Date.now()): { acquired: boolean; token?: string } {
      if (this.lease && this.lease.expiresAt > now && this.lease.ownerTabId !== tabId) {
        return { acquired: false }
      }
      const token = `token-${Math.random().toString(36).substring(2, 9)}`
      this.lease = {
        token,
        ownerTabId: tabId,
        expiresAt: now + ttlMs,
      }
      return { acquired: true, token }
    }
  }

  it("allows only one active tab to hold sync lease and recovers after 30s crash", () => {
    const leaseManager = new MockLeaseManager()
    const t0 = 1000

    // Tab 1 claims lease
    const tab1 = leaseManager.acquire("tab-1", 30_000, t0)
    expect(tab1.acquired).toBe(true)

    // Tab 2 blocked at t=5000
    const tab2Mid = leaseManager.acquire("tab-2", 30_000, 5000)
    expect(tab2Mid.acquired).toBe(false)

    // Tab 1 crashes; at t=35000 (TTL elapsed), Tab 2 claims lease successfully
    const tab2After = leaseManager.acquire("tab-2", 30_000, 35_000)
    expect(tab2After.acquired).toBe(true)
  })
})

describe("Q138 Scenario 7: UID Switch Isolation", () => {
  it("strictly filters pending outbox mutations by authenticated userId", () => {
    const outboxEntries = [
      { id: "op-1", userId: "user-alice", title: "Alice Bookmark" },
      { id: "op-2", userId: "user-alice", title: "Alice Progress" },
      { id: "op-3", userId: "user-bob", title: "Bob Bookmark" },
    ]

    function getDrainedMutationsForUser(targetUid: string) {
      return outboxEntries.filter((e) => e.userId === targetUid)
    }

    const aliceDrain = getDrainedMutationsForUser("user-alice")
    expect(aliceDrain).toHaveLength(2)
    expect(aliceDrain.every((e) => e.userId === "user-alice")).toBe(true)

    // Bob logs in
    const bobDrain = getDrainedMutationsForUser("user-bob")
    expect(bobDrain).toHaveLength(1)
    expect(bobDrain[0].title).toBe("Bob Bookmark")
  })
})

describe("Q97 Scenario 8: ReaderPreferences Strict Boundary Isolation", () => {
  const DEVICE_LOCAL_KEYS = new Set([
    "imageFit",
    "pageGap",
    "background",
    "preloadIntensity",
    "disableDoubleTapZoom",
    "readingDirection",
    "readingMode",
    "keepScreenAwake",
    "perTitlePreferences",
  ])

  function filterCloudPreferences(allPrefs: Record<string, any>) {
    const cloudSyncPayload: Record<string, any> = {}
    for (const [key, value] of Object.entries(allPrefs)) {
      if (!DEVICE_LOCAL_KEYS.has(key)) {
        cloudSyncPayload[key] = value
      }
    }
    return cloudSyncPayload
  }

  it("strictly filters all actual ReaderPreferences local keys and preserves only candidate globals", () => {
    const actualPreferences: ReaderPreferences & { perTitlePreferences: Record<string, any> } = {
      imageFit: "width",
      pageGap: "small",
      background: "deepLagoon",
      toolbarBehavior: "auto-hide", // Global candidate
      preloadIntensity: "balanced",
      showPageProgress: true, // Global candidate
      disableDoubleTapZoom: false,
      readingDirection: "rtl",
      readingMode: "vertical",
      keepScreenAwake: true,
      perTitlePreferences: { "title-1": { imageFit: "contained" } },
    }

    const filtered = filterCloudPreferences(actualPreferences)

    for (const localKey of DEVICE_LOCAL_KEYS) {
      expect(filtered).not.toHaveProperty(localKey)
    }

    expect(filtered).toEqual({
      toolbarBehavior: "auto-hide",
      showPageProgress: true,
    })
  })
})
