# Yomirra — PHASE 01 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: IN_PROGRESS (read-only root-cause audit started; no implementation/QA executed)
Document branch: `docs/yomirra-master-planning-20261031`
Planning base: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`

## Goal
Canonical Catalog, Content Classification & Source Choice

## Requirement IDs
`CAT-01..CAT-15; NS-01..NS-07; SAFE-07; META-01; SEC-01; HEALTH-01`

## Entry prerequisites
P00 documentation review; read existing IDENTITY.md, canonical-search, semantic-catalog, title-matcher, source selectors, content-access, PWA caching.

## Verified current baseline (read-only)
Existing `clusterCanonicalResults()` merges per search response, not durable across pages; Redis semantic-catalog records use source-specific keys. Existing source chooser and canonical migration already exist; audit/reuse rather than rebuild. `hideNsfw:true` is stored by default; current UI uses opposite display label. MAL strict `white` classification conflicts with global UNKNOWN-with-warning contract.

## Planned tasks (NOT DONE)
1. [ ] Reproduce five-provider duplicate search and ambiguous-title false-merge on real/fixture data; record before screenshot and route.
2. [ ] Define stable canonical work-vs-edition-vs-provider-vs-chapter identity and provenance; review schema/backup compatibility and obtain owner approval before any migration.
3. [ ] Introduce verified merge confidence; do not assume one high-confidence cluster means identity verified; test alias/author/edition/year counterexamples.
4. [ ] Render one work card on aggregated surfaces. For **one** eligible binding, navigate directly to its exact provider detail; for **2+**, require picker and pin recently healthy last-used first; for **zero**, show unavailable and do not navigate. Jelajah remains source scoped.
5. [ ] Implement 3-state content classification with user-visible UNKNOWN warning, OFF default and API/cache/Reader/Library safety; leave legacy data untouched until approved.
6. [ ] Run acceptance CAT-01..15, NS-01..07, SAFE-07 in focused unit/Playwright; add results with exact SHA.

## Evidence to collect
Current: PLANNED, NOT_RUN. Required: false merge corpus, URL and binding traces, screenshots, case-by-case evidence, security review and rollback.

## Open blockers
B-04 legacy mixed-provider metadata; B-09 external mapping; B-11 AniList terms. MAL conflict must be settled before loosening existing strict mode.

## Safety and rollback
Keep legacy sourceId/mangaId and personal data; additive canonical mapping with feature gate and reversible migration only after approval.

## Required next action if work is interrupted
Start with read-only reproduction/test harness around `src/shared/lib/canonical-search.ts` and existing stored-ID contracts, then open smallest P0 fix PR. Do not claim a finished catalog until cross-page identity fixtures pass.

## Changes / tests / artifacts
- Code changes: **NONE** in this phase at planning creation.
- PRs implementing this phase: **NONE created under this planning checkpoint**.
- Tests executed during this phase: **NONE**; all tests in `../ACCEPTANCE_MATRIX.md` remain `NOT_RUN`.
- User-data, Redis records, deployment and environment configuration mutated: **NO**.
- Plan is in `../MASTER_PLAN.md` and `../PHASE_PLAN.md`; completion tracked in `../TRACKING.md`.

## Append-only execution log
- 2026-10-31 — DOCUMENTATION: phase scope, prerequisites, blockers, acceptance and continuation instruction drafted. This entry is **not a claim of implemented features or passed tests**.

### Handoff update template (append after *each* meaningful completed step)
```
YYYY-MM-DD HH:mm +07:00 | requirement IDs | branch | PR | exact SHA
CHANGE: actual files/behavior modified (or READ-ONLY evidence)
VERIFY: command/device/environment, actual outcome, evidence link; NOT_RUN cases
RISK/DECISION: approval, rollback, follow-up dependency
STATUS: PLANNED / IN_PROGRESS / IMPLEMENTED / VERIFIED / BLOCKED
NEXT: one concrete safe continuation step
```

- 2026-10-31 — READ-ONLY P01 DIAGNOSTIC: inspected `src/shared/hooks/use-search-catalog.ts`, `src/shared/lib/canonical-search.ts`, `src/server/lib/search/semantic-catalog.ts`, `src/app/api/sources/search/route.ts`, `src/components/search/search-results.tsx`, `src/components/komik/canonical-source-dialog.tsx`, `src/components/komik/manga-source-selector.tsx` and existing canonical tests at `preview@02cc664`. Search UI makes per-source TanStack queries and clusters the current page in memory, while separate aggregate API also clusters and Redis search index stores source-derived keys. Stored candidate matches are keyed separately and may be inserted into combined client results; this design can permit duplicate canonical identities across pages/search modalities and lacks durable cross-session identity. **This is code-path risk, not yet a reproduced count from live samples.** Existing picker uses static registry availability, not verified deep health or last-used healthy sorting. SearchResults produces one error banner per failed provider. Existing tests cover identical-title merging and conflicting authors but do not establish cross-page/live canonical stability. Next: add failing fixtures for cross-page identity, unknown match confidence and source ordering **before** code modifications. No tests executed at this checkpoint; no functional changes.

- 2026-10-31 — CODE/TEST WRITTEN (NOT VERIFIED): P01 narrow CAT-01 exact duplicate-row fix committed to isolated feature branch `fix/canonical-duplicate-binding-20261031` at `55a44d6f993e97c98ddc97234fcde3aaaeeb42d2`, draft PR **#86** https://github.com/rzqllh/Yomirra/pull/86 against `preview`. Diff verified: only `src/shared/lib/canonical-search.ts` (+5 lines) and `src/shared/lib/__tests__/canonical-search.test.ts` (+23 regression test lines), no schema/history/Redis change. Duplicate `(sourceId,mangaId)` rows are ignored before canonical clustering. This is a PARTIAL fix for identical provider row duplication, not a verified solution to alias or cross-page duplicates. Tests/CI: **NOT_RUN / PENDING** at commit; do not mark CAT-01 PASS. No merge/deployment done. Next: check PR #86 exact SHA CI, then continue identity/health work only after review.

- 2026-10-31 — CODE/TEST WRITTEN (NOT VERIFIED): P01 CAT-04/CAT-11 scoped source picker ordering appended to draft **PR #86** at `e4ea15f29e43ba3f475afd30234e3bbbe305ad88`. Changes only `src/components/komik/canonical-source-dialog.tsx` (+66/-3 lines) and its 3 focused ordering regression tests (+44/-1); uses existing `useSourceHealthStore` recent observed API outcomes (5-minute recency) plus matching `useHistoryStore` last-read `(sourceId,mangaId)`. Pins last-used source only if recently ONLINE, otherwise sorts online/slow/degraded/unknown/offline; still requires user click; status copy explicitly says observed response/unknown, not deep provider health. Baseline static registry eligibility remains; thorough deep/Reader health and durable canonical cross-page binding still pending. Whole feature branch comparison now 4 files, 2 commits, no Redis/DB migration. **Tests NOT_RUN / CI PENDING**. Do not mark CAT-04 or CAT-11 VERIFIED. Next: check exact SHA CI and run interactive picker tests on preview when Vercel quota allows.

- 2026-11-01 — AUTOMATED QA **PASS FOR EXACT PR #86 SHA** `e4ea15f29e43ba3f475afd30234e3bbbe305ad88`: GitHub Actions workflow **41223026141** completed SUCCESS. Jobs `Verify & Build` and `Browser Smoke (Chromium and WebKit)` both SUCCESS. PR #86 moved from draft to **ready for review**; not merged. Vercel status **FAILURE build-rate-limit**; no READY preview deployment at exact SHA verified. This passes code/browser automation only, not live release, physical device, data mapping or CAT full requirements.

- 2026-11-01 — MERGED TO PREVIEW: PR **#86** exact-head automated CI PASS, squash commit `21b05dbf9f95700cafd3b0de1ce67611028576dd` on `preview`. Partial canonical duplicate (same source binding) and manual picker healthy last-used ordering are now IN PREVIEW SOURCE, **not verified on currently deployed Preview UI** due Vercel quota. Durable work identity, aliases/false merge, per-chapter health, MAL mapping, NSFW classification, source comparison remain OPEN. CAT-01/CAT-04 not fully verified; CAT-11 implemented but not live-verified.

- 2026-11-01 — CODE/TEST WRITTEN, CI PENDING: draft PR #92 https://github.com/rzqllh/Yomirra/pull/92, HEAD `3184fd7f97b6723bc03d4501e0825483ce5bd4b0`; `settings-view.tsx` now proposes `Tampilkan NSFW` with UI OFF mapped to internal `hideNsfw=true`, no migration; adds Settings Jest/Vitest + Playwright toggle regression. No actual content filtering is altered, and UNKNOWN warning across surfaces still OPEN.
- 2026-11-01 — CODE/TEST WRITTEN, CI PENDING: draft PR #93 https://github.com/rzqllh/Yomirra/pull/93, HEAD `8d5fa0d2876c07f4a8c545c2f17fb5125ad9a4e0`. `getRequestReadOptions` now proposed to require persisted `yomirra-hide-nsfw=false` cookie to opt-in; URL query can only tighten safety, never override OFF; added direct NextRequest cookie/query regression tests. No user state/Redis/data changes. Security assessment of other server call sites remains to do.
- 2026-11-01 — CODE/TEST WRITTEN, CI PENDING: draft PR #94 https://github.com/rzqllh/Yomirra/pull/94, HEAD `f1b453ba4ff1e9ee90931d9e3435e19d0032fa75`. A lone provider item is no longer incorrectly labelled HIGH_CONFIDENCE before actual match; matched provider cluster promoted to HIGH. No canonical key, matching threshold or persistence changes; durable identity still unmet. 2 new regression tests; review and CI required.
- P0 OPEN: actual UNKNOWN-with-warning tri-state across UI/API/PWA, MAL strict nonwhite conflict, stable canonical ID and false title-only merges, source deep health, legacy migration B-04, preview real Redis/physical devices. None accepted as PASS by these narrow PRs.

- 2026-11-01 — QA STATUS RECHECK: P01 draft #92 NSFW toggle, #93 cookie authorization, #94 unmatched confidence all exist on isolated feature branches and were IN_PROGRESS in exact-head GitHub CI at check. Until full Verify & Build + Browser Smoke completed SUCCESS, remain code-written / tests pending; do not merge into Preview or mark NS-01/SEC-01/CAT-02 VERIFIED.

- 2026-11-01 — MERGED TO PREVIEW: NS-01 UI polarity PR **#92** squash `75153e7dcc5c97853822c800ba8435a37e9dc0d7`; source HEAD `3184fd7f97b6723bc03d4501e0825483ce5bd4b0` GitHub Actions Verify & Build plus Chromium/WebKit Browser Smoke completed SUCCESS. User-facing Settings now labelled `Tampilkan NSFW` with default OFF, mapped to existing stored `hideNsfw` boolean. **This does not prove NSFW UNKNOWN warning/full exclusion or current Vercel Preview deployed SHA.** No personal data migration.

- 2026-11-01 — MERGED TO PREVIEW: SEC-01 safer request preference PR **#93** squash `802ccad41f2806cbe66497e56d79e3f45f1945ef`; exact source HEAD `8d5fa0d2876c07f4a8c545c2f17fb5125ad9a4e0`, GitHub CI Verify & Build + Chromium/WebKit Browser Smoke SUCCESS. `getRequestReadOptions` now requires existing persisted adult opt-in cookie; a `?hideNsfw=false` URL alone cannot opt in and `?hideNsfw=true` can only tighten. Regression tests cover no cookie/opted-in/invalid query. No account/user-data migration, Redis write or main merge. Full NSFW classification and exact-SHA Vercel preview live gate still NOT VERIFIED.

- 2026-11-01 — MERGED TO PREVIEW: canonical confidence PR **#94** squash `fa300415f358a54ef325d9d632777920557ebec5`; source PR HEAD `f1b453ba4ff1e9ee90931d9e3435e19d0032fa75` GitHub Verify & Build/Browser Smoke SUCCESS. Single-provider/unmatched cluster now NO_MATCH; only actual multi-provider match produces HIGH_CONFIDENCE. No changes to canonical matching algorithm or persisted mapping; stable ID/false title-only merge work remains P0 OPEN. Vercel exact-SHA live still unverified.

- 2026-11-01 — CODE + TEST WRITTEN, NOT VERIFIED: PR **#98** https://github.com/rzqllh/Yomirra/pull/98, branch `fix/canonical-format-conflict-20261101`, HEAD `08b355d14fe1e7e11eee80d5a1b1f65def05cc18`. When both matching titles have known but conflicting formats (e.g. NOVEL/MANGA), automatic merging is rejected; if format metadata missing on one side, existing heuristic remains. Two regression tests in `src/shared/lib/__tests__/canonical-search.test.ts`. **CI RUN 41229181720 IN_PROGRESS** (Verify & Build step Unit & Integration Tests at inspection), no acceptance PASS, not merged; no database/Redis/bookmarks touched. Remaining P0: external-ID work equivalence, same-title false matches with missing author, cross-page durable identity, UNKNOWN warning on safe-mode screens and cache.

- 2026-11-01 — **OWNER LOCK CAT-15 / CODE PR #99:** one eligible source navigates directly to its exact provider detail, two or more keep a mandatory manual picker, zero disables navigation and displays unavailable. Regression also checks that the only-eligible binding drives bookmark provenance and synopsis fetch instead of a disabled primary source. Branch `fix/catalog-single-source-routing-20261101`, PR https://github.com/rzqllh/Yomirra/pull/99. Unit/browser tests and exact-head Vercel acceptance **NOT YET VERIFIED** at this checkpoint; no data migration, secrets, main or production changed.

- 2026-11-01 — CAT-15 focused follow-up: source-scoped card without canonical bindings must also block links when its sole provider is disabled by user, `isEnabled:false`, `isInstalled:false` or unavailable. Tests added for grid/compact/rank; branch `fix/catalog-disabled-single-source-20261101`. Exact-commit CI, physical iOS and deployed Preview acceptance remain NOT_RUN until evidence is recorded. No data writes or settings mutations from this patch.

- 2026-11-01 — OWNER APPROVAL / NSFW B-04 SAFE IMPLEMENTATION (CODE WRITTEN, NOT YET CI VERIFIED): Owner explicitly approved Issue #101 resolution: general-source UNKNOWN/absent rating may be presented with clear unverified warning; confirmed NSFW stays hidden while OFF; MAL OFF remains strictly `nsfw=white`. No automatic Library/History migration. On isolated branch `fix/nsfw-readonly-legacy-20261101`, removed `useNsfwPatcher()` from AppShell, replaced deprecated hook with non-mutating compatibility no-op, replaced old mutation expectation with preservation regression tests. No saved records, schema, Redis, Firebase, production, environment or credentials changed. The read-only Library/History selectors remain in `useBookmarkCollection` and `useBookmarkReading`. **CI, Browser/PWA, two-account data-safety tests NOT_RUN at this write checkpoint.** Never mark NS-02/03/05, SAFE-07 or B-04 complete based on this change. Pending follow-up: implement explicit UNKNOWN warning without unrestricted cover/Reader rendering; inspect cache and deep link; keep MAL strict. Rollback: revert isolated PR; no data restore required because no migration was executed.

- 2026-11-01 — **MERGED TO PREVIEW, CODE/AUTOMATED QA ONLY:** Issue #101 non-mutating legacy fix PR #103 squash `dcffbb90ecbaf90a3cd334af214f22e8fc7e87ba` and tri-state UNKNOWN warning/consent PR #104 squash `1ad329968ed3f500fab7f1c6e72db304e2b0fd05`; both exact-head GitHub Verify & Build plus Chromium/WebKit Browser Smoke SUCCESS. #103 stops mount-time Library/History metadata rewriting; #104 introduces SAFE/NSFW/UNKNOWN, warns before unknown Detail/Reader content effects, and masks unknown catalog covers. **NOT accepted for offline PWA, full navigation surface, two-UID, physical device, or real-user classification.** Related draft PRs #105 Home hero/spotlight cache safety, #106 Quick Search thumbnails, #107 PWA automatic cache invalidation/version rotation are not yet merged. MAL OFF remains `nsfw=white`; no migration, production or Redis mutation. Follow release/acceptance gates before marking NS-02/03/05 or SAFE-07 complete.
