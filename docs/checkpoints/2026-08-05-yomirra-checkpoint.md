# 2026-08-05 Yomirra Checkpoint

## A. Repository State

* Branch: main
* Current HEAD before the checkpoint commit: e51c6b4 (refactor(ui): unify filter chips and icon actions)
* Current date: 2026-08-05
* Source working-tree status: Clean (no uncommitted source files)
* Staged status: Empty

Current completed commits:

| Batch            | Commit    | Description                                             |
| ---------------- | --------- | ------------------------------------------------------- |
| Offline Reader   | `9de51a0` | `fix(reader): repair offline fallback and blob cleanup` |
| Download Manager | `d263acc` | `feat(downloads): add batch download management`        |
| UI Convergence   | `e51c6b4` | `refactor(ui): unify filter chips and icon actions`     |

Unauthorized changes to these files were reverted:
```text
src/components/app/top-nav.tsx
src/components/source/source-card.tsx
```

Known untracked non-production files:
```text
.codex/hooks.json
lint-results-utf8.txt
lint-results.json
lint-results.txt
test-results.json
```

## B. Completed Implementation

### Batch 1: Offline Reader

Files:
```text
src/components/reader/reader-image.tsx
src/components/reader/reader-view.tsx
src/components/reader/__tests__/reader-image.test.tsx
src/components/reader/__tests__/reader-view.test.tsx
```

Completed behavior:
* offline `/offline-images/...` URLs bypass Next Image optimization
* optimization rule:
```tsx
unoptimized={Boolean(offlineUrl) || !dataSaver}
```
* failed offline URL falls back to the original page URL exactly once when online
* fully offline failure does not attempt online fallback
* fallback loops are prevented
* normal online-image retry behavior remains separate
* Blob URLs created by ReaderView are revoked on cleanup and chapter changes

### Batch 2: Download Manager

Files:
```text
src/shared/store/download-store.ts
src/shared/store/__tests__/download-store.test.ts
src/app/(web)/downloads/page.tsx
src/app/(web)/settings/page.tsx
src/components/ui/checkbox.tsx
```

Completed behavior:
* added `removeDownloads(ids: string[]): Promise<void>`
* IDs are normalized and deduplicated
* Cache Storage is opened once
* cache keys are read once
* matching selected-download cache entries are deleted
* unrelated entries are preserved
* successful IDs are removed from Zustand state once
* failed IDs remain available after partial failure
* stale Zustand records can be removed even when their cache entries were already evicted
* `removeDownload(id)` delegates to `removeDownloads([id])`
* existing `/downloads` page now supports selection of completed downloads
* Settings links to `/downloads`
* no duplicate `/settings/downloads` route was created

### Batch 3: Low-Risk UI Convergence

Files:
```text
src/components/ui/filter-chip.tsx
src/components/search/search-filter-drawer.tsx
src/components/library/library-filter-drawer.tsx
src/components/downloads/storage-warning-banner.tsx
src/components/ui/search-input.tsx
src/components/app/theme-toggle.tsx
```

Completed behavior:
* introduced canonical `FilterChip`
* migrated eleven Search and Library filter controls
* migrated the authorized low-risk IconButton callers:
  * SearchInput clear action
  * ThemeToggle
  * StorageWarningBanner dismiss action
* no Search Drawer hitbox workaround was implemented
* no broad raw-button migration was performed

## C. Final Verification State

| Check                | Result                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| Typecheck            | Pass, 0 errors                                                           |
| Reader tests         | 6 passed                                                                 |
| Download-store tests | 7 passed                                                                 |
| Global tests         | 24 passed, 3 failed                                                      |
| Build                | Pass                                                                     |
| Modified-file lint   | 4 pre-existing Search Drawer errors, 0 warnings introduced by this slice |
| `git diff --check`   | Clean                                                                    |

Global test failures remain baseline failures:
* two failures in `history-store.test.ts`
* one failure in `redis-cache.test.ts`

These were not introduced or repaired by the completed implementation slice.

The four remaining lint errors are pre-existing Search Drawer findings:
* three `react-hooks/set-state-in-effect`
* one `@typescript-eslint/no-explicit-any`

## D. Runtime-Unresolved Items

1. Physical mobile safe-area behavior.
2. Sticky Download Manager action bar on a physical mobile device.
3. Actual Service Worker control of the reader route.
4. Service Worker cache-hit and cache-miss behavior.
5. PWA reader navigation while fully offline.
6. Browser-integrated fallback after Cache Storage eviction.
7. Real Safari and Chrome Blob-memory behavior.
8. Download Manager GUI behavior for partial deletion failure.
9. Search Drawer hitbox root cause.
10. MangaDex failure on Vercel.
11. Komikindo failure on Vercel.

## E. Deferred Work Backlog

### Next Priority 1: Runtime Verification of Completed Work
Before new architecture work:
* test reader with Data Saver on and off
* test valid offline chapter
* delete one cached image and verify behavior online
* delete one cached image and verify behavior offline
* verify navigation from `/downloads` while offline
* verify chapter switching and reopening
* verify Download Manager selection and deletion on mobile viewport
* verify safe-area inset
* verify partial-failure UI

### Next Priority 2: Search Drawer Diagnosis
Status: `Unresolved. Requires measured mobile reproduction.`

Required diagnostics:
* target bounding rectangle
* `document.elementFromPoint`
* `pointerdown` receiver
* `click` receiver
* Drawer transform
* scroll-container transform
* overlay bounds and pointer events
* Vaul drag state
* target DOM identity
* React keys
* source ordering before and after async updates

### Next Priority 3: Vercel Upstream Diagnostics
Treat MangaDex and Komikindo separately.
Deploy sanitized preview diagnostics capturing:
* source
* upstream hostname
* status
* elapsed time
* timeout versus network failure
* content type
* redirect chain
* `Retry-After`
* relevant sanitized headers
* fetch versus parsing failure

### Next Priority 4: Remaining UI System Work
Deferred:
* TopNav
* Header
* source cards
* manga actions
* bookmark controls
* library layout controls
* downloads controls beyond the completed feature
* reader controls
* rating control
* carousel controls
* broad Button hardening
* documentation migration
* lint enforcement
* remaining malformed-token cleanup

### Next Priority 5: Offline Architecture Decision
Only after real PWA testing, decide whether the final canonical mechanism is:
* raw Service Worker URLs
* Blob URLs
* or both with clearly separate responsibilities

## F. Guardrails for the Next Session

The next agent must:
* read this checkpoint before editing
* inspect the three completed commits
* run `git status`
* not redo completed batches
* not recreate `IconButton`
* not create `/settings/downloads`
* not modify deferred areas without an explicit new phase
* distinguish unit-tested behavior from runtime-confirmed behavior
* preserve the existing three-commit boundaries
* use ponytail full for implementation
* use Impeccable only for UI refinement
* use architecture cleanup only for proven shared seams
* avoid new dependencies unless explicitly approved

## G. Resume Commands

```bash
git status --short --untracked-files=all
git log -4 --oneline
pnpm typecheck
pnpm test --run src/components/reader/__tests__
pnpm test --run src/shared/store/__tests__/download-store.test.ts
```

## H. Resume Prompt

```text
Read docs/checkpoints/2026-08-05-yomirra-checkpoint.md completely.

Treat it as the source of truth for the previous session.

Inspect the current Git status and the three implementation commits before
making changes.

Do not redo completed Batch 1, Batch 2, or Batch 3 work.

Report:
1. current repository state
2. whether the three commits are present
3. remaining unresolved runtime items
4. the recommended next executable slice

Do not implement until the next slice is explicitly approved.
```
