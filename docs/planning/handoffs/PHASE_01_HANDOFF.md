# Yomirra — PHASE 01 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: NOT_STARTED (planning file created; no implementation/QA performed in this phase)
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
