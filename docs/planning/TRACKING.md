# Yomirra — TRACKING (Requirements, Evidence, Blockers)
Updated: 2026-10-31 Asia/Jakarta | Planning baseline: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`
Document branch: `docs/yomirra-master-planning-20261031`
PR for this documentation packet: TBD until created. No production authorization.

## Status language / change control

Requirement status: `PLANNED` (contract ready, not implemented/verified), `IN_PROGRESS`, `IMPLEMENTED` (code landed; acceptance still pending), `VERIFIED` (all mandatory evidence PASS for exact SHA), `BLOCKED` (external dependency), `DEFERRED` (explicit owner signoff only). Do not equate existing code or an old test with VERIFIED.

Test status: `NOT_RUN`, `PASS`, `FAIL`, `BLOCKED`. Write `evidence=(commit SHA, workflow URL, screenshots, logs, device/date, fixtures)`, not “looks good”. Owner field `ENG:TBD` means phase engineer unassigned; `PRODUCT:owner` is final decision authority; `QA:TBD` independent verifier. Default all acceptance tests **NOT_RUN on this planning branch**.

Documentation changes and code changes require scoped PR/checks; when starting work update this table and phase handoff together. Do not delete closed/aged historical issues without verifying their modern equivalents.

## Phase 00 baseline / document tracking

| ID | Requirement / existing evidence | Phase | Priority | Owner | Status | Evidence / next step |
| --- | --- | --- | --- | --- | --- | --- |
| PLAN-01 | Reconcile preview/main/PR/deploy heads, historic Q1–Q175 | P00 | P0 | ENG:TBD | IN_PROGRESS | GitHub preview `02cc664`; main `d27d1e1`; PR #79 draft; refresh before implementation |
| PLAN-02 | Consolidate all plans in `MASTER_PLAN.md` | P00 | P0 | ENG:TBD | IMPLEMENTED | Created on planning branch; verify document completeness and link with exact SHA |
| PLAN-03 | Eight-phase `PHASE_PLAN.md` with gates | P00 | P0 | ENG:TBD | IMPLEMENTED | Created on planning branch; check scope/exit criteria |
| PLAN-04 | This `TRACKING.md`, acceptance matrix, P00–P07 handoffs | P00 | P0 | ENG:TBD | IMPLEMENTED | All 12 Markdown documents exist in docs-only branch; 111 acceptance IDs, phase/acceptance crosscheck passed; PR review pending |
| PLAN-05 | Documents reviewed, PR checked and safely merged to `preview` | P00 | P0 | ENG:TBD | IMPLEMENTED | Docs-only #85 squash `fdfd481`, 12 Markdown diff and zero broken relative links. Latest exact doc CI was pending at merge; docs not production release |

## Canonical catalog, metadata and source choice

| IDs | Specific scope / existing code | Phase | Priority | Owner | Status | Evidence / next |
| --- | --- | --- | --- | --- | --- | --- |
| CAT-01..02 | One canonical card per verified work; NO false merge | P01 | P0 | ENG:TBD | IN_PROGRESS | #86 duplicate binding `21b05db`, #94 confidence `fa30041` merged CI PASS; draft #98 format conflict guard CI pending; durable cross-page identity/false-match review incomplete |
| CAT-03..04 | Multi-source picker; source health ordering | P01 | P0 | ENG:TBD | IN_PROGRESS | Existing manual picker; PR #86 (`e4ea15f`) sorts by observed request health, tests **not run**; deep source health still pending |
| CAT-05..07 | Clear unhealthy/unknown provider statuses; exact chosen source route; NSFW eligible count | P01 | P0 | ENG:TBD | PLANNED | Provider chooser and content guard tests |
| CAT-08..10 | Cross-page/cache/session stability, UID-local progress, no work-ID breakage | P01/P02 | P0 | ENG:TBD | PLANNED | Existing source `canonical:{title}` and Redis `source:{id}:{mangaId}` split |
| CAT-11 | Healthy last-used source first when 2+ sources, manual picker | P01 | P0 | ENG:TBD | IMPLEMENTED | PR #86 merged Preview `21b05db`; full GitHub CI PASS; exact-SHA Preview deployment/physical QA NOT_RUN |
| CAT-15 | 1 eligible source → exact detail; 2+ → picker; 0 → block invalid navigation | P01 | P0 | ENG:TBD | IN_PROGRESS | Owner locked 2026-11-01; scoped routing regression branch `fix/catalog-single-source-routing-20261101`; GitHub CI/Preview live acceptance NOT_RUN |
| CAT-12..14 | Verified cross-DB IDs; Redis is not authoritative identity; stable mapping across restarts | P01/P06 | P0 | ENG:TBD | PLANNED | B-09, B-11; assess saved-title schema before migrations |
| META-01 | Metadata provenance and UNKNOWN warning after source lookup | P01/P06 | P0 | ENG:TBD | PLANNED | Existing providers and MAL; no full AniList metadata fallback |
| META-02 | Conditional broadened AniList use *after* terms/rate review | P06 | P1 | PRODUCT:owner | BLOCKED | B-11; existing AniList rating fallback already exists |
| META-03 | Rating provenance/attribution MangaDex vs AniList/MAL | P06 | P1 | ENG:TBD | PLANNED | `/api/metadata/rating-batch` existing |

## Content trust / Reader / user data

| IDs | Scope / evidence starting point | Phase | Priority | Owner | Status | Evidence / next |
| --- | --- | --- | --- | --- | --- | --- |
| NS-01..02 | `Tampilkan NSFW` default OFF; confirmed restricted source/title excluded | P01 | P0 | ENG:TBD | IMPLEMENTED | NS-01 UI PR #92 merged `75153e7`; NS-02 excluded across Home Hero (#105), Leaderboard (#110), Catalog (#104), and Quick Search (#106). Preview source CI PASS. |
| NS-03..04 | UNKNOWN shown with explicit warning; filter/tag and stored URL guard | P01 | P0 | ENG:TBD | IMPLEMENTED | PR #103 `dcffbb90`, #104 `1ad32996`, #106 `dffb0c5`, #110 `4d14d26` merged to Preview. Explicit warning badges and cover masking applied. Exact-head CI PASS. MAL stays strict white-only. |
| NS-05..07 | ON→OFF cache/personal views reclassified, persistence, reporting | P01 | P0 | ENG:TBD | IMPLEMENTED | PR #105 (Hero mode-scoped cache) and PR #107 (PWA v3 automatic cache eviction on NSFW OFF) merged to Preview. Non-destructive B-04 policy preserved. |
| SAFE-07 | PWA/cache/direct reader/display source isolation | P01/P03 | P0 | ENG:TBD | IMPLEMENTED | PR #107 rotated PWA cache to v3 with selective eviction of automatic caches, preserving explicit offline chapter downloads. Exact-head CI PASS. |
| RD-01..03 | Open/re-read/failure do not incorrectly complete or regress milestones | P02 | P0 | ENG:TBD | PLANNED | `READING_DATA.md`, B-05 |
| RD-04..06 | Offline/reload/UID/chapter-source exactness, gesture controls | P02 | P0 | ENG:TBD | PLANNED | B-02/B-03; earlier fixtures exist |
| DATA-01..03 | Local-first, tombstones, merge conflicts, safe guest transition | P02 | P0 | ENG:TBD | PLANNED | Existing implementation requires live isolated acceptance |
| DATA-04..07 | Backup schema, 512-detail summaries, non-destructive migration, protected Redis operational data | P02/P03 | P0 | ENG:TBD | PLANNED | Legacy safeguards, staging rollback evidence |
| OFF-01..03 | Download coverage, failure/quota, accurate offline claims | P02 | P1 | ENG:TBD | PLANNED | PWA Cache Storage and chapter downloads |
| BOOK-01..03 | One-tap save, status, synced vs local feedback | P04 | P1 | ENG:TBD | PLANNED | Existing bookmark UI audit |

## Runtime, browser, provider reliability

| IDs | Scope / existing code | Phase | Priority | Owner | Status | Evidence / next |
| --- | --- | --- | --- | --- | --- | --- |
| ENV-01 | Production-like Preview Redis with protected operational namespace and branch-restricted credentials | P03 | P0 | PRODUCT:owner / ENG:TBD | BLOCKED | PR #91 merged `10130580`, full CI PASS; Preview still lacks restricted Redis credential, branch-specific env and deployed SHA/live verification B-10 |
| CACHE-01..03 | TTL/stale, cache-key scopes, safe flush, observability, graceful degradation | P03 | P1 | ENG:TBD | IN_PROGRESS | #95 bounded stale TTL/grace merged `c0b2364` and #91 namespace `10130580` source CI PASS; live Redis/hit rate and remaining observability pending |
| CACHE-04..05 | Cold-start Redis readiness, all namespace statistics, performance evidence | P03 | P1 | ENG:TBD | PLANNED | `lazyConnect`; no live hit rate proven |
| SEC-01 | NSFW effective preference consistent, no accidental query override | P01/P03 | P0 | ENG:TBD | IMPLEMENTED | PR #93 squash `802ccad`; exact source head full GitHub CI PASS. Runtime + cross-surface safety acceptance still NOT_RUN |
| SEC-02 | Cache/privacy/env isolation, no public secrets or cross-user responses | P03 | P0 | ENG:TBD | PLANNED | Use exact UID/NSFW/language/policy scope |
| SEC-03 | Source rights, access boundaries, security/legal factual audit | P06/P07 | P0 | PRODUCT:owner | BLOCKED | B-08/B-11; public claim gate |
| HEALTH-01 | Capability-specific source health, checkedAt+confidence | P01/P06 | P0 | ENG:TBD | PLANNED | Existing shallow/deep probes |
| HEALTH-02..03 | Fresh status, provider recovery and cooldown | P03 | P1 | ENG:TBD | PLANNED | Retain `/api/sources/health` functional probes and evidence; physical/provider live checks outstanding |
| HEALTH-04 | `/api/health` liveness never triggers upstream source probes | P03 | P1 | ENG:TBD | IN_PROGRESS | Scoped PR `fix/health-liveness-no-provider-probes-20261101`; snapshots optional/recent, Redis diagnostics retained; exact-head CI/live trace required |
| PROVIDER-04 | Request budget, 403/429 differentiation, bounded retries | P03 | P1 | ENG:TBD | PLANNED | Vercel aggregated Komikindo filter 403 |
| PR-01..04 | Partial failure isolation, accurate error, retry, healthy results retained | P03/P04 | P1 | ENG:TBD | IN_PROGRESS | PR #87 (`7675289d0`) combines partial-provider banners; exact SHA Vercel READY, CI and browser UX not yet verified; scoped retry remains open |
| PF-01..06 | Cache-first Back, scroll restoration, request savings and trace | P03 | P1 | ENG:TBD | PLANNED | React Query existing; baseline not measured |
| FL-01..05 | iOS safe filter footer, draft apply/cancel/reset and accessibility | P03/P05 | P0 | ENG:TBD | IN_PROGRESS | PR #89 (`1188f7b`) changes VisualViewport bottom offset + 4 math tests; current CI and physical Safari NOT_RUN/PENDING; P0 remains incomplete |

## Experience, design and integration

| IDs | Scope / evidence | Phase | Priority | Owner | Status | Evidence / next |
| --- | --- | --- | --- | --- | --- | --- |
| HOME-01..03 | Continue Reading > discovery with history, first-time home, no all-null Home | P04 | P1 | ENG:TBD | IN_PROGRESS | PR #90 (`a25e195`) reorders Home shelf/hero with DOM-order tests; CI & real UX PENDING; HOME-03 not changed |
| UX-01..04 | Real `/help`, remove fake controls, routing and states | P04/P05 | P1 | ENG:TBD | IN_PROGRESS | PR #88 (`d8faebb3`) adds Help and removes fake language shortcut; CI/rendering not yet verified |
| NOTIF-01..04 | Honest toasts, 4 verified chapters bookmark prompt, updates, OS push not fabricated | P04 | P1 | ENG:TBD | IN_PROGRESS | #96 bookmark prompt state merged `ffa2e4d`, source CI PASS; physical Reader, notifications OS push B-07 still NOT_RUN |
| PWA-01 | Accurate offline status and no claim beyond cached pages | P04 | P1 | ENG:TBD | PLANNED | Existing reading buffer supports partial cache |
| DS-01..03 | Semantic tokens, accessibility, visual regression | P05 | P2 | ENG:TBD | PLANNED | iPhone screenshot modal/borders inconsistency |
| HELP-01..03 | Dedicated `/help`, accessible support/recovery content | P05 | P1 | ENG:TBD | IMPLEMENTED | PR #88 merged Preview `243804f`; full GitHub CI PASS, live Preview not verified |
| MAL-01..04 | Official MAL live ranking, safe classification, mapping via trusted IDs | P06 | P1 | PRODUCT:owner / ENG:TBD | BLOCKED | B-01/B-09, `MAL_CLIENT_ID` |
| INTEG-01..04 | External sources, archives, source admin, rights, optional AI | P06 | P1 | PRODUCT:owner / ENG:TBD | PLANNED | Existing adapters/features; broad live gates unknown |
| REL-01..07 | All scoped P0 gates, Browser/CI/Safari/Firebase/security/prod signoff | P07 | P0 | QA:TBD / PRODUCT:owner | BLOCKED | B-01..B-11 as release-applicable |

## Baseline operational evidence / provenance

- GitHub `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`, `main@d27d1e1622f9001f53065ca2856ae873ee225a15`; open PR #79 `preview→main` draft. Recheck current metadata before claiming current.
- Vercel last returned READY preview `e61bef0df6c897f065d5e76a2294ba90a5ed8f7f`, **not** head `02cc664`; newest HEAD deployment unverified. Check quota and exact SHA.
- Vercel project env list: `REDIS_URL` target `production` (no `preview` target observed), Preview Redis unverified. Do not retrieve or disclose its value.
- Vercel error grouping: Komikindo filters HTTP 403 (19 aggregated occurrences) and manga detail 403 (2) at the time of audit; group spans multiple dates/deployments. Cause/provider entitlement unresolved. No Redis failure proven.
- Existing Redis features: cache/provider index, site/custom-source/override/audit/limiter; protect operational state. Existing AniList rating fallback is **not** a newly installed integration.
- Some old doc files report historic test totals and READY deployments; these are historical only and not copied as current evidence.
- No code written, tests run, live devices used, Firebase changed, Redis keys deleted, Vercel config changed or production deployed by this documentation effort.

## Blocking register and resolution

| ID | Severity / current condition | Action required | Approver/owner | Acceptance evidence | Status |
| --- | --- | --- | --- | --- | --- |
| B-01 | Official MAL ranking missing Preview `MAL_CLIENT_ID` | Owner registers/configures server-only Preview key; retest `/api/metadata/mal/popular` and UI with real data | PRODUCT | 200 real ranked works + safe/error fixture | BLOCKED |
| B-02 | No physical Safari/iPad/PWA acceptance | Real device test incl keyboard, viewport, Reader, VoiceOver | QA/device owner | device/OS/SHA/video/screenshot & expected/actual | BLOCKED |
| B-03 | No isolated real Firebase two-UID verification | disposable staging setup, auth/sync/offline/guest cross-UID | PRODUCT/QA | UID A/B fixture and isolated session logs | BLOCKED |
| B-04 | Old mixed-provider NSFW data uncertain | Legacy mount-time patcher disabled in isolated PR; read-only export/audit and reversible migration proposal if needed | PRODUCT for any user-data write | before/after samples and 2 UID staging, no loss; PR tests do not prove live migration safety | BLOCKED |
| B-05 | Reader milestone/retention offline edge cases not accepted | reproduce Q52/Q63, failed image, reread, cross-source IDs | QA | exact SHA and targeted+live tests | BLOCKED |
| B-06 | Preview exact-head deployment / 402 quota history | verify latest Vercel READY SHA and retry only official quota window | ENG/PRODUCT for paid upgrade | same SHA READY on Preview, no production | BLOCKED |
| B-07 | OS/background push not demonstrated | keep in-app toasts; opt-in permission and native/PWA proof if in release | PRODUCT/QA | device notification e2e | BLOCKED |
| B-08 | Rights/provider connectors/admin logs external claims unverified | isolate fixtures, rights review, no rate-limit bypass | PRODUCT/QA | provider/rights/operational evidence | BLOCKED |
| B-09 | Verified MAL↔source automatic mapping not available | trusted cross-ref/edition mapping with ambiguous fallback | ENG/PRODUCT | matched/unmatched/ambiguous fixtures | BLOCKED |
| B-10 | Preview Redis env target missing from listing | isolate Preview store, verify ping/hit rate without secrets or cross-env writes | PRODUCT approval for env security | status `redis:ok`, safe namespace and cache HIT on preview | BLOCKED |
| B-11 | Existing AniList rating fallback permissions unclear | audit official terms + current usage and rate limits before expansion | PRODUCT/legal | documented allowed-use decision | BLOCKED |

## Risks and mitigations
- **RISK-01 false canonical merge:** never merge ambiguous works; keep provider IDs; manual override/review.
- **RISK-02 unsafe stale/private content:** apply per-user policy at render/API, version cache keys; no stale restriction bypass.
- **RISK-03 Redis key purge:** operational keys are durable; use explicit bounded allowlist and no wildcard delete without review.
- **RISK-04 preview/production Redis sharing:** isolate environments and credentials; no copy of production data.
- **RISK-05 provider reliability and terms:** 403/429 treated as upstream limitation, never circumvent.
- **RISK-06 accidental deploy:** use branch/PR, exact SHA, retain `main`; do not merge to production without owner release approval.
- **RISK-07 migration/sync:** backup, reversible transform, per-UID isolation, regression proof.
- **RISK-08 incomplete docs/history:** checkpoint each stage; status and evidence stored in handoffs.

## Next checkpoint
Complete ACCEPTANCE_MATRIX and PHASE_01..07 handoffs; run document cross-reference audit; open docs PR against `preview`. After docs approval, plan P01 implementation in small scoped PRs. No P01 tests or code changes can be marked PASS from this document.
