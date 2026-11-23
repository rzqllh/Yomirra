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

## Evidence status (PR #161, not yet released)

This matrix describes implementation visible on `feat/canonical-dedupe-contract-20261123`, **not deployed production behavior**. Passing Typecheck/Build or Preview READY is not equivalent to verified acceptance.

| Capability | Code state | Verification boundary |
|---|---|---|
| Verified-only reversible presentation grouping | WIRED into saved Library, History, Home continue/Spotlight/Hero and eligible Search cards | Confirmed provenance or exact source identity only; no cross-source merge based on title similarity |
| Smart resume and preferred-source fallback | WIRED into History/Home and canonical saved detail | Source-specific chapter cursor only; unavailable preference must remain unchanged and surface source choice |
| Guest/cloud preferred-source conflict flow | WIRED into guest merge dialog and owner-scoped Firestore preference functions | Unit tests cover merge planning and stale snapshot; live multi-device account integration remains unverified |
| Stable global canonical identity registry | NOT IMPLEMENTED | Saved-user provenance is not a globally authoritative independent registry |
| Canonical saved/history detail route | WIRED at `/catalog/saved/[savedTitleId]` | Verified user-owned saved ID or history-only source fallback; not all globally unsaved works |
| Library/History and Search dedupe presentation | WIRED for verified saved works | Source-specific history rows remain intact; unverified and unsaved works may remain separate |
| Owner-scoped preferred source persistence | WIRED locally and via Firestore integration | Live owner-rule permissions and cross-device convergence must be verified with authorized test accounts |
| Incremental legacy compatibility | WIRED through legacy source routes/aliases and non-destructive source records | No destructive data cutover, legacy cleanup, or authoritative global migration was performed |
| Browser/mobile/PWA/NSFW acceptance | Automated unit/integration and Playwright regression cases added | Confirm latest GitHub run; real iPhone PWA, offline/weak-signal, and multi-device acceptance still require direct evidence |

Never mark an item VERIFIED merely because code exists. For every release gate, record the tested commit, CI run, environment, result, and remaining untested paths.

## Release blockers

Do not merge this PR into `main` until every P0 acceptance test in the approved contract has evidence, including:
wrong-identity collision prevention; preferred unavailable without silent mutation; source-specific history integrity;
canonical bookmark idempotence; cross-device sync; NSFW and disabled source isolation;
verified merge/split restoration; replay-safe guest merge; reversible migration.

A green lint, build, or unit-test run does **not** satisfy these product acceptance criteria.
Read-only pure helpers do not imply a live system or a safe Firestore migration.
