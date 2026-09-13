# Identity Architecture — Yomirra Phase 1

> **Status:** Approved — Phase 1
> **Applies to:** Library, History, Collections, Updates, Firestore sync, Backup

---

## 1. Problem

Yomirra's library, history, collections, and update-tracking are all keyed by a composite identifier:

```text
sourceId::mangaId
```

This means:
- Removing or migrating a source destroys library membership.
- Two sources providing the same manga title appear as two unrelated entries.
- The user's reading progress cannot survive source failure.

---

## 2. Identity Primitives

### SavedTitleId

The **durable, opaque identity** for a title saved by the user.

- **Scope**: Local user-space. NOT a globally canonical work ID across all Yomirra users or providers.
- **Stability**: Immutable after creation. Never changes because a SourceRef changes.
- **Generation**:
  - **Legacy migration**: `SavedTitleId = legacySourceId + "::" + legacyMangaId` — deterministic, stable across devices.
  - **New titles (Phase 1+)**: `SavedTitleId = crypto.randomUUID()`.
- **Opacity**: The application must always treat `SavedTitleId` as an opaque string after creation, even if legacy values contain readable source identity.

### SourceRef

A reference to a title on a specific manga provider.

```typescript
type SourceRef = {
  sourceId: string;
  mangaId: string;
  addedAt: number;         // epoch ms
  matchConfidence: MatchConfidence;
};
```

### ChapterRef

A reference to a physical chapter on a specific provider.

```typescript
type ChapterRef = {
  sourceId: string;
  mangaId: string;
  chapterId: string;
};
```

### LegacyLibraryKey

```text
`${sourceId}::${mangaId}`
```

Preserved as frozen, read-only identity on `LibraryItem` during migration. Not used as the primary lookup key post-Phase-1.

### LegacyHistoryKey

```text
`${sourceId}::${mangaId}::${chapterId}`
```

Remains the Firestore document ID and localStorage key for History. Downloads also retain this key. This is intentional: chapter reads are physically bound to the source that served them.

---

## 3. Data Relationships

```text
SavedTitle (SavedTitleId)
   │
   ├── Primary SourceRef   (active reading target)
   ├── Linked SourceRef[]  (alternate / dead sources)
   │
   ├── Collections  (Record<SavedTitleId, collectionId[]>)
   ├── Updates      (Record<SavedTitleId, MangaUpdateItem>)
   └── History      (Record<LegacyHistoryKey, HistoryItem>)
          └── savedTitleId?: string  ← denormalized, best-effort

Downloads (Record<LegacyHistoryKey, DownloadItem>)
   └── Tied to original SourceRef — never migrated
```

---

## 4. MatchConfidence

Used when associating a new SourceRef with an existing SavedTitle.

| Level | Meaning | Requires User Action? |
|---|---|---|
| `CONFIRMED` | Explicit user confirmation or existing verified link | N/A — user already acted |
| `HIGH_CONFIDENCE` | Strong heuristic (normalized title + author) | Yes — promoted by user |
| `AMBIGUOUS` | Partial heuristic match | Yes — user must select |
| `NO_MATCH` | Insufficient similarity | — |

**Rule**: Heuristic matching can never silently promote a match to `CONFIRMED`. Only explicit user action does.

---

## 5. Legacy Compatibility

### Library

During Phase 1 migration, each existing `LibraryItem` is enriched:

```typescript
// Before
{ sourceId: "mangadex", mangaId: "abc", title: "...", ... }

// After
{
  id: "mangadex::abc",          // SavedTitleId (deterministic)
  sourceId: "mangadex",         // Frozen — compatibility only
  mangaId: "abc",               // Frozen — compatibility only
  schemaVersion: 2,
  primarySourceId: "mangadex",
  primaryMangaId: "abc",
  linkedSources: [],
  ...
}
```

The `sourceId` and `mangaId` fields are frozen post-migration and retained for compatibility with any remaining consumers.

### History

`HistoryItem` gains two optional fields:

```typescript
savedTitleId?: string;    // denormalized convenience — not the ownership authority
chapterNumber?: number;   // parsed from chapterTitle, used for cross-source mapping
```

Because V1 clients can REPLACE_WRITE History documents and remove these fields, the system must recover the `savedTitleId` via SourceRef lookup when missing:

```text
HistoryItem.sourceId + mangaId
    ↓
Library: find SavedTitle where primarySourceRef matches OR linkedSources contains
    ↓
SavedTitleId recovered
```

If no match is found: History is preserved as **unresolved legacy history**. It is never deleted.

### Collections / Updates

`MangaKey` type broadened to `string` (was `` `${string}::${string}` ``). Existing persisted keys remain valid as `SavedTitleId` values for legacy items. New UUID `SavedTitleId` values work without storage migration.

---

## 6. Firestore Coexistence Policy

| Collection | Owner | Write Semantics |
|---|---|---|
| `users/{uid}/library` | V1 clients | REPLACE_WRITE (legacy, no merge) |
| `users/{uid}/libraryV2` | V2 clients | REPLACE_WRITE to known-identity docs |
| `users/{uid}/history` | All clients | REPLACE_WRITE (by ChapterRef key) |

**`libraryV2` is canonical after migration. `library` is legacy read-only for V2 clients.**

V2 client lifecycle:
1. Boot: check `localStorage.getItem('yomirra-libraryV2-migrated')`.
2. Not migrated: read `library`, compute deterministic IDs, write to `libraryV2`, set migration flag.
3. Subsequent syncs: detect new V1 items in `library` not present in `libraryV2`; import one-directionally.
4. V1 deletion from `library`: NOT propagated to `libraryV2`. Absence ≠ deletion.
5. V2 deletion: remove from `libraryV2`; write tombstone to `library` best-effort.

> Old V1 clients may continue operating against `library`. Once V2 migration has occurred, `libraryV2` is the authoritative dataset. Post-migration V1 mutations are imported on a best-effort basis at next V2 sync. V1 deletions are NOT propagated to V2 canonical state.

---

## 7. Migration Strategy

### Local State Recovery

Only `library-store` requires destructive data transformation.

```
1. snapshot = localStorage.getItem('yomirra-library')
2. Write: localStorage.setItem('yomirra-library-v0-recovery', snapshot)
3. Run in-memory V1 migration
4. Validate: every item has { id, primarySourceId, schemaVersion: 2 }
5. Commit via Zustand set()
6. After confirmed rehydration: delete 'yomirra-library-v0-recovery'
```

Cleanup does NOT wait for Firestore sync. Unauthenticated users complete full cycle.

---

## 8. Relink / Dead Source Recovery

When the primary source becomes unavailable:

1. UI shows "Source Unavailable" with cached metadata and offline chapters accessible.
2. User explicitly triggers "Find Alternate Source".
3. System searches enabled sources; ranks candidates with `MatchConfidence`.
4. User selects and confirms.
5. `primarySourceRef` updated in `LibraryItem`.
6. Old source moved to `linkedSources` as `CONFIRMED`.
7. Chapter progress mapped using `chapterNumber` heuristic.

Chapter mapping outcomes:
- `EXACT`: auto-applied.
- `PROBABLE`: user confirmation required.
- `AMBIGUOUS`: user selection required.
- `UNMAPPED`: old progress preserved; user sets manually.

**No progress is ever fabricated.**

---

## 9. Downloads Contract

Downloads remain keyed by `LegacyHistoryKey`. No binary or cache migration occurs in Phase 1. After source relink, the UI resolves downloaded chapters using stored source provenance from `LibraryItem.linkedSources`. Old downloads remain reachable.

---

## 10. Version Matrix

| Artifact | Current | Phase 1 |
|---|---|---|
| Library Zustand persist | 0 | 1 |
| History Zustand persist | 1 | 1 (unchanged) |
| Collection Zustand persist | 1 | 1 (unchanged) |
| Update Zustand persist | 1 | 1 (unchanged) |
| LibraryItem schemaVersion | absent | 2 |
| Backup file schemaVersion | 2 | 3 |
| Firestore canonical library | `library` | `libraryV2` |
