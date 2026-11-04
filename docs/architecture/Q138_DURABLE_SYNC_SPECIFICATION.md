# Q138 & Q97: Durable Offline-First Outbox Journal & Hybrid Preference Specification

**Status:** Final Implementation Contract (PREPARATION ONLY — No Write Paths Modified)  
**Target Project:** Yomirra  
**Target Database:** Existing `yomirra-store` (Upgrade Path: v1 → v2)  
**Governor:** Xyeena Axazeela  
**Author:** Kanade Xyn (Backend/Data) & Tamaki Xyn (Database)  
**Auditor / QA:** Rinne Xyn (Independent QA)

---

## 1. Problem Statement & Root Cause Diagnosis

### 1.1 Existing Direct Firestore Writes & Rollback Defect
Currently in `src/features/library/model/library-store.ts`, mutations such as `addToLibrary` and `removeFromLibrary` trigger direct async Firestore calls (`pushLibraryItem` / `deleteLibraryItem`) via an in-memory queue (`pendingTitleWrites`).
- **Hazard 1 (Offline Rollback Resurrection):** When the client is offline or encounters a network timeout, `deleteLibraryItem` throws. The catch block in `library-store.ts` calls `rollbackMutation()`, which automatically re-inserts the deleted bookmark and shows an error toast. An offline user cannot delete a bookmark without it immediately resurrecting.
- **Hazard 2 (Unordered Cloud Sync Resurrection):** When coming back online, `use-sync.ts:runFullSync` compares local items with Firestore. Because local deletes were rolled back or lost from ephemeral memory upon tab closure/refresh, Firestore returns the item as active, resurrecting deleted bookmarks across devices.
- **Hazard 3 (Race Conditions & Client Timestamp Flaws):** Relying on client `Date.now()` allows out-of-order clock drift between devices to overwrite newer edits with older ones.

---

## 2. Four-Way Storage Architecture & State Separation

To eliminate data corruption during offline periods, multi-device sync, and full resynchronization, the client runtime strictly segregates state into four disjoint categories:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        YOMIRRA CLIENT STORAGE                          │
├──────────────────────────┬─────────────────────────┬───────────────────┤
│ 1. Cloud Synced State    │ 2. Pending Mutations    │ 3. Guest Data     │
│    (Mirrored Entities)   │    (`sync_journal`)     │    (`__guest__`)  │
│    - cloudConfirmed: true│    - Unsynced writes    │    - Anonymous    │
│    - serverRevision: N   │    - PROTECTED on sync  │    - Partitioned  │
├──────────────────────────┴─────────────────────────┴───────────────────┤
│ 4. Local-Only Records (Reader Layout, Cache, HW Preferences)          │
│    - readingMode, imageFit, pageGap, background, perTitlePreferences  │
│    - NEVER synced to cloud Firestore collections                      │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Cloud Synced State:** Verified entities mirrored from Firestore with `cloudConfirmed: true` and `lastServerRevision`.
2. **Pending Offline Mutations (`sync_journal`):** Durable local outbox operations awaiting cloud confirmation. **Strictly protected during full-resync (NEVER quarantined as stale data).**
3. **Guest Data:** Partitioned under `userId: '__guest__'`. Untouched until authenticated merge with confirmed transactional commit.
4. **Local-Only Records:** Hardware- and viewport-dependent reader preferences. Strictly excluded from Firestore payloads.

---

## 3. IndexedDB Alignment: Existing `yomirra-store` (v1 → v2 Upgrade)

### 3.1 Strict Invariant: Zero Separate Database Creation
Yomirra already relies on `yomirra-store` (`idb-storage.ts`) version 1 with object store `keyval` for Zustand state persistence.
Creating a new database name would fragment client storage, risk quota duplication, and complicate transaction coordination.
Therefore, the migration target is strictly **`yomirra-store` version 2**.

### 3.2 Upgrade Logic (`onupgradeneeded`)
```ts
const DB_NAME = "yomirra-store";
const DB_VERSION = 2; // Upgraded from v1

request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
  const db = request.result;

  // 1. Preserve existing v1 store (Zustand persist middleware compatibility)
  if (!db.objectStoreNames.contains("keyval")) {
    db.createObjectStore("keyval");
  }

  // 2. Add durable outbox journal
  if (!db.objectStoreNames.contains("sync_journal")) {
    const journal = db.createObjectStore("sync_journal", { keyPath: "id" });
    journal.createIndex("userId", "userId", { unique: false });
    journal.createIndex("status", "status", { unique: false });
    journal.createIndex("createdAt", "createdAt", { unique: false });
    journal.createIndex("entityKey", ["userId", "entityType", "entityId"], { unique: false });
  }

  // 3. Add tombstone retention store
  if (!db.objectStoreNames.contains("tombstones")) {
    const tombstones = db.createObjectStore("tombstones", { keyPath: ["userId", "entityType", "entityId"] });
    tombstones.createIndex("deletedAt", "deletedAt", { unique: false });
    tombstones.createIndex("userId", "userId", { unique: false });
  }

  // 4. Add sync coordination metadata & leases
  if (!db.objectStoreNames.contains("sync_metadata")) {
    db.createObjectStore("sync_metadata", { keyPath: "key" });
  }

  // 5. Add auditable reconciliation log
  if (!db.objectStoreNames.contains("reconciliation_audit_log")) {
    const audit = db.createObjectStore("reconciliation_audit_log", { keyPath: "id" });
    audit.createIndex("timestamp", "timestamp", { unique: false });
  }
};
```

### 3.3 Atomic IndexedDB Transaction + Zustand Rehydration Compatibility
1. **Mutation Atomicity:** Every user action opens a single IDB transaction across `keyval` (Zustand persistence) and `sync_journal` (outbox). Both write operations commit atomically on disk.
2. **Rehydration Safety:** On app boot, Zustand rehydrates from `keyval` via `idbStorage`. An outbox synchronizer then scans `sync_journal`. If an operation was in-flight during a prior abrupt shutdown, the reconciler updates Zustand via a non-destructive `syncHydrate()` action without tearing in-memory state.

---

## 4. Multi-Layered True Idempotency Architecture

To prevent delayed network packets or replays from corrupting state, Yomirra employs a three-layer idempotency guard:

```
Incoming Mutation (`opId: UUID`)
       │
       ▼
Layer 1: Document Ring Buffer (`_processedOpIds`, capacity = 50)
       ├─► Found -> IDEMPOTENT_REPLAY (Return cached revision, no-op)
       ▼ Not Found
Layer 2: Dedicated Receipts Store (`users/{uid}/sync_receipts/{opId}`)
       ├─► Found -> IDEMPOTENT_REPLAY (Return cached revision, no-op)
       ▼ Not Found
Layer 3: Monotonic Revision Guard (`baseServerRevision < currentRev`)
       └─► Rejects ancient out-of-order writes as `REVISION_CONFLICT`
```

### 4.1 Layer 1: Document FIFO Ring Buffer
- Every synced document stores `_processedOpIds: string[]` (max 50 UUIDs) and `_lastOpId: string`.
- Provides fast, zero-extra-read idempotency check inside `runTransaction`.

### 4.2 Layer 2: Dedicated Operation Receipts Collection
- Path: `users/{userId}/sync_receipts/{opId}`
- Fields:
  ```ts
  interface SyncReceipt {
    opId: string;
    targetPath: string;
    committedRevision: number;
    operation: 'upsert' | 'delete';
    createdAt: FieldValue; // serverTimestamp()
    expiresAt: Timestamp; // 90 days TTL
  }
  ```
- **Retention & Failure Semantics:**
  - Receipts are retained for 90 days. Firestore TTL policy purges expired receipts automatically.
  - If a network partition interrupts client response after Firestore commit, the client retries with the same `opId`. Layer 1 or Layer 2 detects the receipt and immediately returns success without double-incrementing revisons.

### 4.3 Layer 3: Monotonic Revision Guard
- If an ancient operation replay arrives after its `opId` was purged from both Layer 1 and Layer 2 (>90 days), its `baseServerRevision` is guaranteed to be lower than `current._revision`.
- The transaction engine identifies the causal mismatch and rejects the mutation as `conflict_revision_mismatch`, preventing ancient replays from corrupting modern data.

---

## 5. Conflict-Safe Concurrency & Causal Ordering (DELETE, UPSERT, RESTORE)

### 5.1 Causal Metadata on Firestore Documents
```ts
interface SyncedDocumentMetadata {
  _revision: number; // Monotonically increasing revision counter
  _tombstone: boolean; // Soft-deletion flag
  _deletedAt?: FieldValue; // Timestamp when tombstoned
  _restoredAt?: FieldValue; // Timestamp when explicitly restored
  _lastRestoreRev?: number; // Revision at time of restore
  _processedOpIds: string[]; // Ring buffer of recent operations
  _lastOpId: string; // Latest operation UUID
  _updatedAt: FieldValue; // serverTimestamp()
}
```

### 5.2 Deterministic Concurrency Precedence Matrix

| Current Server State | Incoming Mutation | Causal Precedence & Decision Rule | Outcome |
| :--- | :--- | :--- | :--- |
| **Any** | `opId in _processedOpIds` or Receipt exists | Idempotent duplicate check fires. | **`IDEMPOTENT_REPLAY`**: Return success without state mutation. |
| **Active (`_tombstone: false`)** | `Delete (baseRev >= currentRev)` | Legal deletion. Terminal user intent. | **`TERMINAL_DELETE`**: `_tombstone = true`, record `_deletedAt`, rev+1. |
| **Active (`_tombstone: false`)** | `Delete (baseRev < currentRev)` | Concurrently modified. | **`STALE_DELETE_EVALUATION`**: If document was explicitly restored after delete creation (`current._restoredAt > mutation.createdAt`), REJECT. Otherwise, apply terminal delete. |
| **Active (`_restoredAt > 0`)** | `Delete (createdAt < _restoredAt)` | **Restore Precedence Rule:** Device A deleted at $T_1$; Device B explicitly restored at $T_2 > T_1$. | **`REJECT: conflict_rejected_stale_delete_after_restore`**. Legitimate restore from Device B is **NEVER** silently deleted by Device A. |
| **Tombstoned (`_tombstone: true`)** | `Upsert (isExplicitRestore: false)` | Background / automatic sync. | **`REJECT: conflict_rejected_tombstone`**. Background writes cannot resurrect deleted items. |
| **Tombstoned (`_tombstone: true`)** | `Upsert (isExplicitRestore: true)` | User clicked "Bookmark Again" / "Add". | **`EXPLICIT_RESTORE`**: `_tombstone = false`, `_restoredAt = serverTimestamp()`, `_lastRestoreRev = rev + 1`, rev+1. |
| **Active (`_tombstone: false`)** | `Upsert (baseRev < currentRev)` | Concurrent reading progress update. | **`CAUSAL_PROGRESS_CHECK`**: If `incoming.chapter <= current.chapter`, REJECT with `conflict_rejected_stale_progress`. If mismatch on title/other metadata, REJECT with `conflict_revision_mismatch` for client rebase. |
| **Active (`_tombstone: false`)** | `Upsert (baseRev === currentRev)` | Clean sequential update. | **`CLEAN_UPDATE`**: Apply payload, rev+1. |

---

## 6. Anti-Resurrection Beyond Retention: Mode 2 Full-Resync Protocol

### 6.1 The Watermark Architecture
- Cloud maintains a root synchronization metadata document:  
  `users/{uid}/sync_meta/watermark`: `{ tombstoneTruncationWatermark: Timestamp }`.
- Watermark tracks the oldest timestamp for which cloud tombstone records are guaranteed intact (e.g. 180 days).

### 6.2 Dual-Mode Decision Tree
```
Client Reconnects
       │
       ▼
Read `tombstoneTruncationWatermark`
       │
       ├─────────────────────────────────────────────┐
       ▼                                             ▼
`lastSync >= watermark`                    `lastSync < watermark`
(Safe Delta Window)                        (Watermark Breached / >180 Days)
       │                                             │
       ▼                                             ▼
Mode 1: Incremental Sync                   Mode 2: Full-Resync Protocol
1. Query cloud tombstones                  1. ISOLATE `sync_journal` (DO NOT DELETE)
   (where _deletedAt > lastSync)           2. Fetch Active Cloud Set (= Sole Truth)
2. Evict matching local records            3. Reconcile confirmed local vs Cloud Set
3. Push pending outbox mutations           4. Quarantined eviction of untracked local
                                           5. Rebase & push valid pending outbox
```

### 6.3 Mode 2 Full-Resync Reconciliation Algorithm
When `client.lastSyncServerTimestamp < tombstoneTruncationWatermark`:
1. **Preserve Pending Offline Work:** All uncommitted mutations in `sync_journal` are marked protected. They represent intentional user work while offline and are **NEVER deleted or quarantined**.
2. **Authoritative Cloud Mirroring:** The set of active cloud documents is fetched as the Sole Source of Truth for existing library membership.
3. **Ghost Eviction & Auditable Quarantine:**
   - For each entity in local `yomirra-store`:
     - If `entity.cloudConfirmed === true` AND `entity.id NOT in cloudActiveSet` AND `entity.id NOT in sync_journal`:
       - The entity was deleted on another device during the missed retention window.
       - The entity is evicted from the active store and archived in `reconciliation_audit_log` (`quarantined_items`).
       - It is **STRICTLY PROHIBITED** from entering `sync_journal` or being pushed to Firestore.
4. **Outbox Rebase & Execution:**
   - Pending offline mutations in `sync_journal` are rebased against the fresh cloud state and submitted through the conflict-safe transaction engine.
5. **Watermark Reset:**
   - Local `lastSyncServerTimestamp` is updated to current server time.
6. **Mathematical Proof:** Zero ghost items can resurrect regardless of whether offline duration was 200 days, 2 years, or 10 years, while zero unsynced offline edits are lost.

---

## 7. Crash Recovery: Commit-Before-ACK Guarantee

```
Step 1: IDB Transaction -> Write Outbox Entry (`status: 'pending'`, `opId: UUID`)
Step 2: Network Call -> Firestore `runTransaction` commits -> Returns rev R
Step 3: IDB Transaction -> Remove or mark outbox entry `'completed'`
```
- **Hazard:** App crashes or process is killed between Step 2 and Step 3.
- **Recovery Protocol:**
  1. On restart, outbox drainer detects entry with status `'processing'` or `'pending'`.
  2. Lease timeout (30s) resets lease. Drainer resubmits the mutation with the exact same `opId`.
  3. Firestore Layer 1 (`_processedOpIds`) or Layer 2 (`sync_receipts`) identifies `opId`.
  4. Firestore returns `{ outcome: "idempotent_replay", committedRevision: R }` without mutating data.
  5. Client receives confirmation and executes Step 3 (ACK in IDB).
  6. Result: **At-least-once transport + exactly-once processing (True Idempotency)**.

---

## 8. Storage Pressure, Eviction & Emergency Backup

1. **Persistent Storage:** App requests `navigator.storage.persist()` on initial user authentication.
2. **Quota Monitoring:** Checks `navigator.storage.estimate()` periodically during sync cycles.
3. **Emergency Export:** If quota usage exceeds 90% or storage pressure warning is received:
   - Client triggers automated snapshot exporter: `exportEmergencyLocalBackup()`.
   - Serializes uncommitted outbox entries and bookmarks to a downloadable JSON / local blob backup.
   - Alerts user gracefully instead of failing silently with corrupted data.

---

## 9. Phased Implementation Plan per PR

To ensure isolated, zero-regression delivery, implementation will proceed in four sequential PRs:

| Phase / PR | Target Branch | Scope & Deliverables | Verification Boundary |
| :--- | :--- | :--- | :--- |
| **PR-1: IDB v2 Schema & Storage Engine** | `preview` | Upgrade `yomirra-store` to v2; add `sync_journal`, `tombstones`, `sync_metadata`, and `reconciliation_audit_log`; persist `keyval` integrity; storage quota monitor. | IDB version upgrade unit test, quota mock test, zero keyval regression. |
| **PR-2: Outbox-First Write Path Engine** | `preview` | Replace direct Firestore writes in `library-store.ts`, `history-store.ts`, `collection-store.ts` with atomic IDB transaction; remove in-memory rollback defect. | Offline bookmark deletion & creation tests; zero rollback resurrection. |
| **PR-3: Firestore Transaction Engine & Receipts** | `preview` | Implement `sync_receipts`, ring buffer, conflict-safe state machine (restore precedence, stale progress rejection), multi-tab lease (30s TTL), Mode 1 & Mode 2 Full-Resync. | Firebase Emulator 2-client contention, 200+ day watermark breach test. |
| **PR-4: Sync Diagnostics & Emergency Recovery UI** | `preview` | Settings sync status badge, conflict resolution diagnostics viewer, emergency backup export button. | UI accessibility, manual export verification, end-to-end integration pass. |
