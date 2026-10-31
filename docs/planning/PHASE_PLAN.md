# Yomirra — PHASE PLAN (P00–P07)
Version 1.0-planning | Updated: 2026-10-31 Asia/Jakarta
Baseline: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`
Execution target: safe feature PRs into `preview`; `main`/production require independent owner authorization.

## Global operating rules
- Before every phase: refresh branch/PR/CI/Preview SHA, reconcile issue and evidence. Never carry a historical “PASS” as a current PASS.
- Write exact decisions, scope, risk, approvals, files, PR, tests, blockers and next steps in its `handoffs/PHASE_XX_HANDOFF.md` immediately after a meaningful deliverable. Complete documentation before beginning code.
- Phase labels are *planning ownership*, not promises that an entire area is untouched. Reuse existing code/tests where possible; avoid rewriting good implementations. Favor 1 requirement cluster per PR, test then integrate.
- A dependency can be independently developed with fixtures, but cannot be called released until its upstream identity/security/data contract is stable. `B-01..B-11` are tracked in `TRACKING.md`.
- Safe previews only; no production merge, forced deploy, billing, env secrets, privilege changes or destructive mutation without separate approval.

## Workstream/dependency map

```text
P00 baseline, docs and permissions
 ├── P01 canonical identity + NSFW/source policy ────────┐
 │    ├── P02 Reader data, sync and migration design ────┤
 │    ├── P03 cache/navigation/filter/source recovery ───┤
 │    └── P04 core UX/Home/search/bookmarks/notifications┤
 ├── P05 design system/help/a11y (parallel after shared contracts)
 └── P06 external metadata/MAL/AniList rights + integrations
                       └─────────────────────────────────┤
                                                         P07 verification/release
```

Cross-cutting: legal/source rights, privacy, test fixtures, monitoring and handoff updates.

## Phase 00 — Baseline & planning hardening

**Goals:** verified repo state, contract reconciliation and durable planning packet.
**Include:** SHA/branch/PR79, CI and last Vercel deployment metadata; env variable *names/targets only*; existing Redis/React Query/PWA/Firebase, AniList rating, MAL and provider errors. Read Q1–Q175 ledger, identity, reading, architectural and UX docs. Create exactly `MASTER_PLAN.md`, `PHASE_PLAN.md`, `TRACKING.md`, `ACCEPTANCE_MATRIX.md` and `handoffs/PHASE_00..07_HANDOFF.md`.
**Deliverables:** document PR into `preview`, explicit decision/conflict list, traceable IDs and current gates, Phase 00 handoff.
**Exit:** all 12 files exist on branch and can be read; internal ID/phase links reconcile; head SHA and document-only diff verified; PR opened; owner release/production safety respected.
**Do not claim:** physical Safari, live Firebase, real Redis hit rate, MAL configuration, provider fixes. Initial phase status PLANNED/IN_PROGRESS until evidence attached.
**Rollback:** close PR or revert documentation commit; do not mutate other branches.
**Gate:** acceptance documentation only, no deployment requirement for text-only PR.

## Phase 01 — Canonical catalog, verified provider identity & content policy

**Requirement IDs:** CAT-01..CAT-14; NS-01..NS-07; SAFE-07; META-01, CAT-12/13; HEALTH-01; SEC-01.
**Depends on:** P00; existing saved-title/provenance contracts and sample corpus.
**Implementation sequence:**
1. Audit existing canonical-search, semantic-catalog, sourceBinding, title-matcher and saved-title identity; reproduce duplicate screenshot with fixture and live sample.
2. Write match-confidence rules (verified ID, alternate title, creator, edition, year, no false merge). Document distinct work/edition/provider/chapter identity; stable mapping storage with rollback, not Redis-only keys.
3. Unit and fixture tests for false-merge, duplicate across pages, source count and source unavailable; expose canonical card for aggregated modes only.
4. Implement explicit source picker; last-used *healthy* source first; health unknown cannot claim healthy; detail uses exact `sourceId/mangaId`. Do not silently auto-select multi-source.
5. Implement content classification tri-state and source eligibility, ON/OFF default polarity, UNKNOWN warning, cache/API/Reader/Library/Download privacy; preserve old user data. Resolve MAL-specific strict behavior via documented decision before coding.
6. Audit persisted sources, filters, mixed-provider saved data, and reversibility of any proposed migration.
**Exit criteria:** CAT-01..14 + NS-01..07 + SAFE-07 passed (unit/browser; physical tests remain P07); no false merge or NSFW confirmed leakage; no user data migration unless approved and reversible.
**Rollback:** feature-flag/off-path fallbacks or scoped revert, retain legacy IDs and bookmarks.
**Blocked by:** B-04 legacy evidence, B-09 mapping for *automatic* external ID binding (explicit source selection can proceed).

## Phase 02 — Reader data integrity & local-first persistence

**Requirement IDs:** RD-01..RD-06, DATA-01..DATA-07, OFF-01..OFF-03; existing Q52/Q63 and `READING_DATA.md`.
**Depends on:** P01 binding/chapter invariant for cross-source flows. Scoped Reader regressions can start with current IDs.
**Include:** last cursor vs highest milestone; reread/skip/failed image/completion; chapter mapping and recovery; reader page slider/dots/zoom/RTL; backup versioning, partial restore, guest merge, tombstones, offline mutation retry, storage quota, download page integrity, duplicate identifiers; two UID isolation.
**Exit:** deterministic fixtures + automated suite pass exact SHA; backup and reversible migration proof; test with disposable Firebase accounts and physical PWA before production. Missing external accounts → explicit BLOCKED, not PASS.
**Rollback:** isolated schema version / tested restoration, scoped revert; no destructive overwrites or account-state merge.
**Blocked by:** B-02, B-03, B-05, B-04, approved staging access.

## Phase 03 — Navigation, cache correctness, provider recovery and filter layout

**Requirement IDs:** PF-01..PF-06, FL-01..FL-05, PR-01..PR-04, CACHE-01..CACHE-05, ENV-01, HEALTH-02..HEALTH-04, PROVIDER-04, SEC-02.
**Depends on:** P01 content-policy/cache schema. Can audit infra in parallel.
**Include:** verify existing Redis readiness and prod-vs-preview isolation; server cache TTL/stale policy; request coalescing if proven; namespace-safe flush, `KEYS` vs bounded `SCAN`, Redis telemetry; browser React Query Back/Forward and scroll restoration; PWA cache policy; filter drawer visible footer on physical iOS; status messaging; source 403/429 retry/backoff. Split `/api/health` liveness from scheduled source probes to avoid unnecessary upstream calls.
**Exit:** measured baseline and before/after evidence, correct cache segmentation, no cross-user/NSFW leakage, fallback bounded, 44px targets and nonclipped footer. Real Preview Redis proof mandatory before claiming remote cache performance.
**Rollback:** retain stable code paths, restore previous bounded policy via PR, no wildcard destructive Redis purge.
**Blocked by:** B-10 isolated Preview Redis; B-02 physical iOS; provider 403 external constraints.

## Phase 04 — Core UX/CX, Home, discovery, notifications

**Requirement IDs:** HOME-01..HOME-03; UX-01..UX-04; PR-01..PR-04; NOTIF-01..NOTIF-04; BOOK-01..BOOK-03; PWA-01.
**Depends on:** P01 canonical identity, P02 milestones, P03 navigation/error states.
**Include:** Continue Reading first for history, discovery-first new users, action hierarchy, no-loading and partial-provider results, source picker entry from cards, accurate CTA, search states, one-tap bookmarks, updates, cool-down notifications, 4 verified chapter completion suggestion, genuine offline confidence.
**Exit:** representative guest/history/source-failure/offline flows pass browser and fixture tests; no spam toast, no false synced/saved assertions, no disabled provider auto-selected.
**Rollback:** scoped view reversion without deleting user state.
**Blocked by:** Reader completion evidence, B-07 for OS/background push claims.

## Phase 05 — Design system, a11y, Settings & Help

**Requirement IDs:** DS-01..DS-03, UX-01/02/03, FL-04/05, HELP-01..HELP-03.
**Depends on:** P03 drawer/navigation contracts; can run primitive audit in parallel.
**Include:** inventory existing Phosphor/icons, radius and border role tokens, semantic spacing/elevation/motion, contrast and focus; remove deceptive `Bahasa` UI choice but preserve real chapter language; replace fake `/settings#about` navigation with real `/help` FAQ/troubleshooting; functional empty/loading/error states. Avoid duplicate design engines/dependencies.
**Exit:** full responsive visual captures across mobile/tablet/desktop/light/dark, keyboard/VoiceOver/reduced motion, real tab/browser chrome safe areas, navigable help. No color-only feedback.
**Rollback:** scoped token/component revert; test for reused primitive regressions.
**Blocked by:** B-02 physical VoiceOver/Safari.

## Phase 06 — MAL, existing AniList fallback, integrations, operations & rights

**Requirement IDs:** META-01..META-03, MAL-01..MAL-04, INTEG-01..INTEG-04, HEALTH-01..03, SEC-03.
**Depends on:** P01 canonical identity/content policy and licensing verification. Independent adapter fixture tests allowed.
**Include:** configure and test official MAL with user-provided Preview-only `MAL_CLIENT_ID` (no secret shown/committed); preserve distinct MAL popularity rank and unknown NSFW behavior decision; review *existing* MangaDex→AniList rating fallback, request quotas/terms before expanding AniList; verified MAL↔provider mappings; live supported providers, admin Redis operational durability, signed proxy, external service/archive connectors, data provenance and attribution, content-rights review.
**Exit:** real authenticated/anonymous integration results with exact SHA and fixtures; no unverifiable metadata mapping, false availability or unauthorized API usage; legal signoff for public claims. If missing credentials or provider denied → BLOCKED.
**Rollback:** disable optional metadata channel while keeping core reader operational; do not bypass rate limits/security.
**Blocked by:** B-01, B-08, B-09, B-11, live provider policies.

## Phase 07 — Cross-feature regression, independent QA & release readiness

**Requirement IDs:** REL-01..REL-07 and *all* production-critical acceptance cases.
**Depends on:** P00–06 exit gates or explicitly owner-approved noncritical deferrals.
**Include:** combine CI exact-head typecheck/lint/test/build + Playwright; visual regression, Safari/iPad PWA, offline/online, back navigation, guest and two Firebase UIDs, source failures, content safety, chapter completion, Redis outage and quotas, audit logging, rights/privacy, deployment SHA/aliases, rollback drill.
**Exit:** independent QA evidence, all P0 PASS, zero hidden B-blockers for promoted scope, release checklist completed, owner approves production; then separate intentional promotion only. If deployment quota HTTP 402, obey provider limit, **no billing upgrade/circumvention**.
**Rollback:** documented last-known-good, data backup and non-destructive restore, owner-approved revert policy.
**Blocked by:** B-01..B-11 as relevant to release claims.

## Release gates and tracking conventions

| Gate | Proof required | Can be marked PASS by |
| --- | --- | --- |
| A contract | owner decisions + document review/IDs | owner/reviewer |
| B engineering | linked PR, exact SHA, typecheck, lint, focused + full tests, build | CI + verifier |
| C browser/a11y | Playwright and visual evidence, security review | browser tester |
| D Preview | Vercel READY **for identical SHA**, live endpoints and no accidental prod target | deployment verifier |
| E external | physical Safari/PWA, disposable Firebase A/B, MAL/Redis/providers, legal | designated external tester/owner |
| F production | independent release decision, rollback, alerting, owner approval | owner only |

Tests are statuses `PASS | FAIL | NOT_RUN | BLOCKED`. A change is `IMPLEMENTED` after code merged to intended safe target; `VERIFIED` only when all mandatory acceptance evidence exists. Handoffs must record specific remaining blockers rather than a blanket “all green”.

## Phase handoff contents (mandatory)
1. Head/base SHA, date and exact phase objective.
2. Changes actually made (file paths, branch, PR/commit/deployment).
3. Tests actually run (command, environment, output/evidence) and explicit NOT_RUN items.
4. Decision deltas, risks, approvals, migration/rollback implications.
5. Blockers with owner and reproduction/next steps.
6. Safe continuation instruction for new chat/model/quota interruption; no assumed hidden prior context.
7. Timestamped checkpoint log after every accepted deliverable.

[Tracking](TRACKING.md) · [Acceptance matrix](ACCEPTANCE_MATRIX.md) · [Phase 00 handoff](handoffs/PHASE_00_HANDOFF.md)
