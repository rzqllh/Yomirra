# Yomirra — PHASE 00 HANDOFF (Baseline & Plan)
Updated: 2026-10-31 Asia/Jakarta
Status: IN_PROGRESS — baseline and all 12 planning files authored/verified; PR review/merge pending
Branch: `docs/yomirra-master-planning-20261031`
Base: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`
Owner authorization: staged execution, documentation first, write handoff after each completed step. No production promotion, destructive migration, Redis mutation, billing, security-policy change or branch deletion without separate review/approval.

## Evidence already checked (read-only)
- GitHub `preview` HEAD: `02cc664be8c66664ffe9628fcaa68523322f3ce0`; `main`: `d27d1e1622f9001f53065ca2856ae873ee225a15`.
- `docs/planning/` did not exist at baseline. Existing historical source-of-truth: `docs/GRILL_FINAL_LEDGER.md` (Q1–Q175), `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/IDENTITY.md`, `docs/READING_DATA.md`, `docs/TESTING.md`, `docs/PREVIEW_BLOCKERS_AND_RUNBOOK.md`.
- GitHub PR #79 is draft `preview -> main`; neither `main` nor production was changed.
- Vercel last returned READY Preview deployment for `e61bef0df6c897f065d5e76a2294ba90a5ed8f7f`, **not** the exact `preview` HEAD. Deployment gate remains unverified.
- Vercel project env listing returned `REDIS_URL` scoped to **production** only; a `gitBranch=preview` query returned no branch-scoped env. Preview Redis connectivity and effective inherited settings require runtime verification; do not copy production secrets/instance.
- Existing Redis integration: `src/server/lib/cache/redis.ts` (`ioredis`), `redis-cache.ts`, Redis search catalog, source health, configuration, admin audit and rate-limit. Redis is **already implemented**, not a proposed new dependency.
- `src/app/api/metadata/rating-batch/route.ts` already calls AniList as rating fallback after MangaDex; broader AniList metadata/mapping is **not** implemented. Review terms/rate limits before expansion.
- Vercel aggregated runtime errors show Komikindo HTTP 403 on filter endpoint and some detail 403; this does not prove Redis is failing. Full logs outside Hobby retention were not available; a 30-minute Redis-query log returned no matching entries, not proof of healthy Redis.
- Read-only repository audit found `withCache()` uses logical TTL but a fixed 7-day Redis retention and defaults to stale-on-error; `semantic-catalog.ts` indexes by source-specific key; `canonical-search.ts` clusters results in memory; `/api/health` triggers active provider probes.
- Existing unit/test fixtures are **not** proof of live source, Redis, PWA or Firebase acceptance.
- Latest owner decisions: NSFW display OFF by default; confirmed NSFW hidden; unknown classification visible with honest warning; `/help` distinct route; canonical work cards with counted bindings; multi-source card requires explicit source picker; healthy last-used source first; Continue Reading first for users with valid history; all requirements planned, implemented in phases.

## Immediate handoff instructions
1. Finish `MASTER_PLAN.md`, `PHASE_PLAN.md`, `TRACKING.md`, `ACCEPTANCE_MATRIX.md`, `PHASE_01_HANDOFF.md` through `PHASE_07_HANDOFF.md` on this branch.
2. Verify that IDs, blockers and decision labels match across documents, then create a PR against `preview` (not `main`).
3. Record completed doc commits/PR/QA evidence here; update the Phase 00 status only after the documentation set is verified. Do not mark engineering phases complete merely because their plan is written.
4. Before code changes, reconcile current heads/checks and work on scoped feature PRs; finish gate checks and log each phase's real change SHA and observed tests.
5. All destructive data migration, production, billing or security changes require explicit owner approval and rollback plan.

## Checkpoint log
- 2026-10-31 — READ-ONLY: repository/old plan/Redis/Vercel source audit completed. Base `02cc664`.
- 2026-10-31 — WRITE: created `docs/yomirra-master-planning-20261031` from verified `preview` SHA. Planning documentation is the only authorized write at this checkpoint.

## Current blockers / unverified gates
`B-01` MAL_CLIENT_ID Preview config and live ranking; `B-02` physical iOS/iPad Safari/PWA; `B-03` isolated Firebase/2 UID sync; `B-04` legacy classification; `B-05` Reader data correctness; `B-06` exact-SHA Vercel deployment/quota; `B-07` background notifications; `B-08` broader provider integrations/content rights; `B-09` MAL-to-provider verified mapping; `B-10` isolated Preview Redis connection; `B-11` AniList licensing/terms.
All statuses require fresh evidence before closure. No user data was changed.

- 2026-10-31 — WRITE: MASTER_PLAN.md committed at e990262a4e2fe203d5af7ace010a41f5d3241197; full project contract, new UX/CX decisions, current Redis/AniList baseline, data safety and release boundaries documented. PHASE_PLAN, TRACKING, ACCEPTANCE and future handoffs still pending.

- 2026-10-31 — WRITE: PHASE_PLAN.md committed at b89883abb7dd626bb859f64c778239d8b35cd410; P00–P07 scope/dependencies/entry/exit/rollback/gates documented. Phase planning is not phase implementation. TRACKING, ACCEPTANCE, P01–P07 handoffs pending.

- 2026-10-31 — WRITE: TRACKING.md committed at 0b8d9bcdfd5ea6bcf3c423ff94ae8674fc6e0b4c; requirement groups, B-01..B-11 blocker register, current Preview env and operational risks recorded. ACCEPTANCE_MATRIX and P01–P07 handoffs pending.

- 2026-10-31 — WRITE: ACCEPTANCE_MATRIX.md committed at 6167312547bc7d0aa15b6d79f0a272a62c260660; full per-ID test steps/expected/evidence compiled, **all NOT_RUN** for planning branch. Next: create P01–P07 handoffs, verify links and open docs PR.

- 2026-10-31 — WRITE: initialized P01..P07 handoffs in seven sequential commits: P01 `3cdd3b7`, P02 `3453ec9`, P03 `3b435c0`, P04 `5d7fe9b`, P05 `18bfe67`, P06 `720328c`, P07 `7e670b2`. All phase work marked NOT_STARTED; no application code written.
- 2026-10-31 — READ-ONLY QA: Git tree has **12 Markdown files** under docs/planning (4 main + 8 handoffs; 13 entries including directory); compare `preview...docs/yomirra-master-planning-20261031` shows **12 added Markdown files, no application code**, ahead 16, behind 0 at the review snapshot. Acceptance matrix enumerates **111 IDs**, every phase-plan ID has acceptance coverage. RISK-01..08 are risk IDs, not acceptance cases. All cases NOT_RUN. TRACKING audit status reconciled in commit `c3739f9`.
- NEXT: open PR docs-only to `preview`, verify latest diff/CI and do not promote production; update P00 with PR URL, checks and final merge SHA only when observed. Phase 01 may start with safe read-only reproduction/isolated tests on new branch after docs gate.

- 2026-10-31 — PR: documentation-only **draft PR #85** opened against `preview`: https://github.com/rzqllh/Yomirra/pull/85 ; PR head at opening `129b37766306c373a132e247624490c707ed0953`. PR review/CI still requires current-head verification; no merge or app deploy claimed.

- 2026-10-31 — QA: checked all 12 planning Markdown files against Git repository tree; **0 broken relative links**. PR #85 has 12 files changed, 1008 added lines, no code/config changes, GitHub mergeable TRUE at inspection. HEAD before this log `4870b51d`.
- 2026-10-31 — BLOCKED: PR #85 GitHub combined status contains **Vercel failure** with target `https://vercel.com/rzqllhs-projects?upgradeToPro=build-rate-limit`; GitHub CI run `41222327959` was `in_progress` at inspection. This is **not** a docs-content failure; no billing change, quota bypass, deployment or production merge attempted. Before updating PASS, recheck exact latest PR head and CI result.

- 2026-11-01 — READ-ONLY release-gate review: Verified project PR #85 documentation-only still draft and no merge; exact head before this record `3b4cafe`. GitHub CI on prior head was running; Vercel status failure is build-rate-limit, not evidence of failed doc content. Keep all feature PR merges scoped to Preview; no production promotion. Rule/protection endpoint was 403 to GitHub App; **cannot assert branch protection config**. Source PRs #86 (catalog), #87 (error disclosure), #88 (Help), #89 (iOS filter), #90 (Home) are isolated. No environment changes, data migrations, billing or branch deletion.

- 2026-11-01 — OWNER SCOPE CLARIFICATION: `preview` is the pre-`main` review branch. GitHub `main` remains Production branch; Vercel last Production deployment inspected used `main`. **No production merge** is authorized by moving Preview forward. Source code and infrastructure topology should be production-like, but using unrestricted production Redis credentials in untrusted Preview PR builds is NOT safe.
- 2026-11-01 — CI: PR #86, #87, #88, #89 have exact-head full GitHub Actions SUCCESS (Verify & Build and Browser Smoke). PR #90 also full SUCCESS. These mark only CI PASS, not exact-SHA Vercel Preview live/physical iPhone acceptance. Those feature PRs are ready-for-review; no merge in this checkpoint.
- 2026-11-01 — REDIS PARITY PREPARATION: draft PR **#91** https://github.com/rzqllh/Yomirra/pull/91 created from `preview@02cc664` to protect Redis Preview with stable per-branch key namespaces and namespace-scoped admin scans. Production key names unchanged, no Redis/Vercel env mutated. Initial PR #91 CI typecheck FAIL (map index/namespace callback), fixed in `47e14e5`; new-head CI pending. See P03 handoff. ENV-01 still BLOCKED pending restricted Preview credentials and exact-SHA deployment.

- 2026-11-01 — SAFE PREVIEW MERGE BATCH: GitHub PRs **#86**, **#87**, **#88**, **#90**, **#89** each merged by squash after **exact source PR head** GitHub Actions SUCCESS including Verify & Build plus browser-smoke jobs, with target `preview` only. Merge SHAs in chronological order: #86 `21b05dbf9f95700cafd3b0de1ce67611028576dd`; #87 `6fa1e4b929656c9084a64018d7a34ca17665ede6`; #88 `243804f7cbf9bc34440c7cc80b689f69bca4b5ca`; #90 `0e85aa20e89ef9f10b8643bf7e6370782c555539`; #89 `2f0bf18aef4b1567c9610faf0a2e53c12c0850c8`. Verified `preview` HEAD `2f0bf18a`; `main`/production not touched. **No exact merged-head Vercel READY deployment observed**; external quota/build-rate-limit remains B-06, so UI release and physical iOS acceptance are NOT VERIFIED.
- 2026-11-01 — REVIEW STATE: PR #85 docs still unmerged at this checkpoint; source code updates are on `preview` independent of the docs PR. PR #91 Redis isolation remains draft, SHA `47e14e5` with GitHub Verify & Build SUCCESS; browser smoke still in progress. Shared production Redis credentials are NOT enabled for Preview.
