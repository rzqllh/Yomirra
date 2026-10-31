# Yomirra — PHASE 01 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: IN_PROGRESS (read-only root-cause audit started; no implementation/QA executed)
Document branch: `docs/yomirra-master-planning-20261031`
Planning base: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`

## Goal
Canonical Catalog, Content Classification & Source Choice

## Requirement IDs
`CAT-01..CAT-14; NS-01..NS-07; SAFE-07; META-01; SEC-01; HEALTH-01`

## Entry prerequisites
P00 documentation review; read existing IDENTITY.md, canonical-search, semantic-catalog, title-matcher, source selectors, content-access, PWA caching.

## Verified current baseline (read-only)
Existing `clusterCanonicalResults()` merges per search response, not durable across pages; Redis semantic-catalog records use source-specific keys. Existing source chooser and canonical migration already exist; audit/reuse rather than rebuild. `hideNsfw:true` is stored by default; current UI uses opposite display label. MAL strict `white` classification conflicts with global UNKNOWN-with-warning contract.

## Planned tasks (NOT DONE)
1. [ ] Reproduce five-provider duplicate search and ambiguous-title false-merge on real/fixture data; record before screenshot and route.
2. [ ] Define stable canonical work-vs-edition-vs-provider-vs-chapter identity and provenance; review schema/backup compatibility and obtain owner approval before any migration.
3. [ ] Introduce verified merge confidence; do not assume one high-confidence cluster means identity verified; test alias/author/edition/year counterexamples.
4. [ ] Render one work card on aggregated surfaces and explicit source picker; pin healthy last-used binding first; detail uses exact provider ref. Jelajah remains source scoped.
5. [ ] Implement 3-state content classification with user-visible UNKNOWN warning, OFF default and API/cache/Reader/Library safety; leave legacy data untouched until approved.
6. [ ] Run acceptance CAT-01..14, NS-01..07, SAFE-07 in focused unit/Playwright; add results with exact SHA.

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
