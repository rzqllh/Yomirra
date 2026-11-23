# Canonical Dedupe v1 — implementation and release gates

## Approved behavior (2026-11-23)

- One canonical catalog entry per **verified** work across Home, Search, Catalog, Library, History, and Detail.
- Cover/title opens canonical detail; **Lanjut** honors an explicit preferred source, then latest read source if no preference.
- Unavailable preferred source opens a contextual source picker without overwriting the preference. Device offline is **not** a source outage.
- Guest preferences are device-local; logged-in preferences synchronize across devices. Guest/cloud conflicts are reviewed **once per merge** in a consolidated dialog, then committed and synchronized.
- Bookmark ownership is canonical; chapter cursors, downloads, and history remain source-specific.
- Merge/split preserves link provenance and legacy data; unverified title similarity never authorizes a persistent merge.

## Existing reusable foundations verified from main

- `src/shared/lib/canonical-search.ts`: source-local search clustering; **HIGH_CONFIDENCE is heuristic, not global verification**.
- `src/shared/store/library-store.ts`: saved title IDs and linkedSources, with local persistence and cloud sync.
- `src/shared/store/history-store.ts`: history and progress per source/chapter.
- `src/shared/store/settings-store.ts`: preferred source map is **local persisted state**.
- `src/shared/lib/guest-merge-engine.ts`: cloud commit and guest merge cover library/history only.
- `src/components/komik/canonical-source-dialog.tsx`: source selection dialog; current discovery cards may show it before detail.

## Evidence status

| Capability | Status |
|---|---|
| Verified-only reversible presentation grouping | Implemented as pure library helper; not yet wired to UI |
| Smart-resume decision policy | Implemented as pure helper; not yet wired to navigation |
| Guest/cloud preferred-source conflict plan | Implemented as pure helper; not yet wired to guest merge dialog |
| Global stable canonical registry | NOT_IMPLEMENTED; requires authoritative verified mapping with split and audit provenance |
| Canonical detail route | NOT_IMPLEMENTED |
| Library/History and Search global dedupe UI | NOT_IMPLEMENTED |
| Sync preferred source and guest resolution to cloud | NOT_IMPLEMENTED; Firestore security/rules not verified |
| Non-destructive persistence migration | NOT_IMPLEMENTED; legacy storage must not be deleted |
| Cross-device, offline PWA, NSFW and migration E2E | NOT_RUN |

## Release blockers

Do not merge this PR into `main` until every P0 acceptance test in the approved contract has evidence, including:
wrong-identity collision prevention; preferred unavailable without silent mutation; source-specific history integrity;
canonical bookmark idempotence; cross-device sync; NSFW and disabled source isolation;
verified merge/split restoration; replay-safe guest merge; reversible migration.

A green lint, build, or unit-test run does **not** satisfy these product acceptance criteria.
Read-only pure helpers do not imply a live system or a safe Firestore migration.
