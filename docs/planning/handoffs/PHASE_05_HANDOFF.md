# Yomirra — PHASE 05 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: NOT_STARTED (planning file created; no implementation/QA performed in this phase)
Document branch: `docs/yomirra-master-planning-20261031`
Planning base: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`

## Goal
Design System, Accessibility, Settings & Standalone Help

## Requirement IDs
`DS-01..03; UX-01..03; FL-04/05; HELP-01..03`

## Entry prerequisites
P03 drawer/navigational semantics and P04 functional copy; component audit can start independently.

## Verified current baseline (read-only)
Existing app uses Phosphor icons, semantic radius tokens and reusable UI primitives, but some components hardcode borders/radii; user screenshot shows filter button clipped by Safari chrome. Settings gear currently links help to `/settings#about`, and a `Bahasa` shortcut to `/settings#general` without a true UI language system.

## Planned tasks (NOT DONE)
1. [ ] Create visual primitive inventory and choose semantic component roles; retain current brand and Phosphor family.
2. [ ] Replace hardcoded inconsistent borders/radii/motion with existing tokens where purposeful; do not flatten all components indiscriminately.
3. [ ] Provide real `/help` route with functional FAQ on provider failures, source choice, Reader, downloads/offline, NSFW UNKNOWN, sync and recovery.
4. [ ] Remove or correct misleading `Bahasa` shortcut while preserving actual preferred chapter-language setting.
5. [ ] Verify keyboard/tab order, focus restoration, VoiceOver, 200% text, contrast, reduced motion, 44px targets and action semantics.
6. [ ] Run visual regression on iPhone/iPad/desktop, light/dark/loading/error/sheet, including Safari keyboard and PWA safe areas.

## Evidence to collect
Current: PLANNED/NOT_RUN; screenshots flag visual problems but are not verified post-fix. Required: measured component inventory, before/after captures, accessibility scanner + manual device results, route check.

## Open blockers
B-02 real iPhone/iPad/VoiceOver; functional dependencies P03-P04.

## Safety and rollback
Scoped style/token revert; preserve actual user settings and routes. Do not ship help with fake/inert troubleshooting links.

## Required next action if work is interrupted
Once P03 filter behavior is fixed, implement `/help` in a feature PR and remove fake Settings hash links; audit primitives screen by screen.

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
