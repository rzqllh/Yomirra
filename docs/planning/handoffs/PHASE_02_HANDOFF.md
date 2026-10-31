# Yomirra — PHASE 02 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: NOT_STARTED (planning file created; no implementation/QA performed in this phase)
Document branch: `docs/yomirra-master-planning-20261031`
Planning base: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`

## Goal
Reader Integrity, Local-first Data & Offline

## Requirement IDs
`RD-01..RD-06; DATA-01..DATA-07; OFF-01..OFF-03`

## Entry prerequisites
P01 source/chapter identity invariant. Independent reader fixture audit may proceed while P01 is built.

## Verified current baseline (read-only)
Existing Reader slider/dots, zoom settings and chapter milestones are implemented; docs/READING_DATA.md defines 512-detail retention plus work summaries and local-first cloud retry. Existing canonical migration is present and currently not an approved destructive rewrite. Physical iOS/Firebase acceptance remains open.

## Planned tasks (NOT DONE)
1. [ ] Run existing Reader tests and isolate exact cursor-vs-milestone behavior for read/open/reread/skip/failed image.
2. [ ] Audit chapter number/id/order and cross-source progress; prohibit inferred chapter equivalence.
3. [ ] Verify per-title zoom, page dots, RTL, safe controls and Back Detail/Home gestures with keyboard.
4. [ ] Audit offline data writes, Firebase UID ownership, queue, tombstones, guest merge preview and partial failure restore.
5. [ ] Verify backup import version compatibility and download coverage; preserve explicit user downloads.
6. [ ] Only after isolated proof, design optional reversible migration and request owner permission before changing stored records.

## Evidence to collect
Current: PLANNED/NOT_RUN for this phase. Required: exact SHA CI plus disposable Firebase A/B, actual iOS device, backup before/after snapshots and user-data isolation traces.

## Open blockers
B-02 physical iOS, B-03 isolated Firebase A/B, B-04 legacy data, B-05 Reader edge cases.

## Safety and rollback
No destructive merge/delete without owner; backup + reversible schema version, preserve local state on cloud failure.

## Required next action if work is interrupted
Use docs/READING_DATA.md and src/shared/lib/chapter-completion, milestone-comparator, src/shared/store/history-store; write regression fixtures before altering data flow.

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
