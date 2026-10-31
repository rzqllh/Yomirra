# Yomirra — PHASE 04 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: IN_PROGRESS (scoped Home hierarchy fix merged to preview; live runtime unverified)
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

- 2026-11-01 — CODE/TEST WRITTEN **NOT VERIFIED**: Draft PR **#90** https://github.com/rzqllh/Yomirra/pull/90 (branch `feat/home-continue-reading-first-20261101`, exact SHA `a25e1958dc7796fdae0f331f03eb7a7a7b9c4e83`) changes `src/components/home/home-feed-client.tsx` to place existing Continue Reading shelf BEFORE HomeHero when eligible history exists, while guest without history keeps Hero first; test in `src/components/app/__tests__/home-feed-client.test.tsx` asserts DOM order and guest flow. This is owner-locked HOME-01/HOME-02. No Reader, history storage, bookmark, API, Redis or auth changes. CI PENDING; no merge/deploy claimed. Next: verify exact SHA CI + browser; if PASS review for Preview, then physical UX.

- 2026-11-01 — MERGED TO PREVIEW: #90 Home Continue Reading-first for returning users at squash commit `0e85aa20e89ef9f10b8643bf7e6370782c555539`, source PR exact-head GitHub CI SUCCESS including browser smoke. First-time guest remains discovery-first. **Live Preview URL for merged SHA not confirmed**; independent Home/customer flow acceptance NOT_RUN. No data changes.

- 2026-11-01 — CODE/TEST WRITTEN, **NOT VERIFIED**: draft PR #96 https://github.com/rzqllh/Yomirra/pull/96, HEAD `44513d38c582689d8b301d8ff6bdfbecdc0dde57`. The optional four-distinct-verified-chapter bookmark invitation previously used sessionStorage only; its counter/one-time flag now proposes localStorage (scoped via existing account/source/work key), with legacy sessionStorage read and denied-storage fallback. Reader milestone/completion is unchanged. Tests: 4 completions across sessions, one-time, migration, identity, errors; CI PENDING; no merge/live test or user data migration. Scope NOTIF-02 only.
