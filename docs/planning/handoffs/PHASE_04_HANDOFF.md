# Yomirra — PHASE 04 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: NOT_STARTED (planning file created; no implementation/QA performed in this phase)
Document branch: `docs/yomirra-master-planning-20261031`
Planning base: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`

## Goal
Home, Search UX, Library, Toasts & Customer Experience

## Requirement IDs
`HOME-01..03; UX-01..04; NOTIF-01..04; BOOK-01..03; PWA-01; PR-01..04`

## Entry prerequisites
P01 stable canonical/source choice, P02 verified chapter events, P03 navigation/partial provider state.

## Verified current baseline (read-only)
Earlier preview contains Quick Search, Home feed persistence under provider errors, Reader toast and bookmark recommendation implementations. Current live screenshot still shows multiple provider-error banners. Owner locked Continue Reading first for valid history and discovery first for new users.

## Planned tasks (NOT DONE)
1. [ ] Audit Home for new guest, returning reader, history without valid source, restricted work, all-provider error and offline states.
2. [ ] Make Continue Reading primary for eligible history; actual chapter/cursor and source availability must be verified, not inferred.
3. [ ] Ensure full Cari and Quick Search maintain independent provider scopes; expose no-query/no-source/empty/partial/total-failure states.
4. [ ] Consolidate provider errors into one actionable summary with optional expanded per-provider details and bounded retry.
5. [ ] Audit one-tap bookmark save, collections and reading-status affordances; distinct cloud pending vs local saved feedback.
6. [ ] Verify notification dedupe/cooldown, four distinct verified chapter completion invitation once and no nag on already-bookmarked title.
7. [ ] Verify offline page-count coverage and accurate claim on partial downloads. Scope OS push separately and do not prompt automatically.

## Evidence to collect
Current: PLANNED/NOT_RUN; earlier tests exist but not accepted on current exact SHA. Required: guest vs returning home screenshot, complete journeys, partial-provider fixture, toast/Reader event tests.

## Open blockers
P01 identity, P02 completion, B-07 background notifications if OS push is in release scope.

## Safety and rollback
Revert scoped UI routes/events only, keep bookmark/history/sync state. No unapproved push subscription migration.

## Required next action if work is interrupted
After P01-P03 prerequisites, establish home journeys and error-state before screenshots; implement smallest no-gimmick UI delta and verify.

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
