# Yomirra — PHASE 05 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: IN_PROGRESS (Help UI PR merged to preview; live /help unverified)
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

- 2026-11-01 — CODE/TEST WRITTEN, **NOT VERIFIED**: P05 UX-01/UX-02/HELP-01..03 draft PR **#88** https://github.com/rzqllh/Yomirra/pull/88, branch `feat/standalone-help-route-20261101`, SHA `d8faebb3928459f5b4ebd8ece40f81acff28ee17`. Added `src/app/(web)/help/page.tsx` (standalone, accessible FAQ, real existing action links) and `help/__tests__/page.test.tsx`; changed `src/components/chrome/header-actions.tsx` so Pusat Bantuan links `/help` and removed fake `Bahasa (Indonesia)` / `/settings#general` UI locale shortcut while retaining actual preferred chapter-language Settings. Changed only three files; zero auth/Redis/persistence changes. No preview deployment confirmed; Vercel build-rate-limit status failure. CI Typecheck/Lint/Tests/Build and live browser validation **NOT VERIFIED**. Next: inspect exact-head CI, review rendered Help page on mobile, then merge only if approved safe gates.

- 2026-11-01 — **CI FAIL resolved in branch, new CI pending**: Initial PR #88 SHA `d8faebb3` had typecheck, lint and new Help tests pass but full suite FAILED **1/1578**: historic `src/components/app/__tests__/hero-and-header.test.tsx` still expected fake `Bahasa` menu. GitHub run `41223756292` / job `124603508549`. Commit `f141cada4c1b6da72c055a45966de417b948ea51` changes assertion to require no misleading Bahasa shortcut and verifies Pusat Bantuan link exactly `/help`. New-head CI **IN_PROGRESS**, no actual Preview READY and no merge; accessibility/physical iOS still NOT_RUN.

- 2026-11-01 — AUTOMATED QA partial **PASS**: PR #88 exact `f141cada4c1b6da72c055a45966de417b948ea51` GitHub `Verify & Build` completed SUCCESS (typecheck, lint, full unit/integration and app build), Browser Smoke (Chromium and WebKit) was **IN_PROGRESS**. Vercel status failure due build quota; no live `/help` route verified on deployment. Do not mark HELP-01/02/03 PASS until browser/live tests as applicable.

- 2026-11-01 — MERGED TO PREVIEW: #88 Help route and removal of misleading Bahasa UI locale shortcut at squash `243804f7cbf9bc34440c7cc80b689f69bca4b5ca`. Source PR exact-head GitHub CI SUCCESS incl WebKit/Chromium browser smoke; no Firebase/Redis/site settings changed. No live merged-head Preview proof; HELP-01..03 not production VERIFIED.
