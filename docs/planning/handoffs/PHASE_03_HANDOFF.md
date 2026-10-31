# Yomirra — PHASE 03 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: IN_PROGRESS (scoped provider-error UX fix drafted; phase acceptance not verified)
Document branch: `docs/yomirra-master-planning-20261031`
Planning base: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`

## Goal
Redis, Navigation, Filter Drawer & Source Reliability

## Requirement IDs
`ENV-01; CACHE-01..CACHE-05; HEALTH-02..04; PROVIDER-04; PR-01..04; PF-01..06; FL-01..05; SEC-02`

## Entry prerequisites
P01 content-policy scope; external permission to configure isolated Preview Redis; physical iOS tester for final filter acceptance.

## Verified current baseline (read-only)
Yomirra already has ioredis, withCache, source health store, redis-backed limiter, React Query and Serwist. Vercel environment inventory reports REDIS_URL only for Production; Preview has no confirmed configured Redis. Last READY Preview SHA is e61bef0, behind preview@02cc664. withCache has logical TTL plus fixed 7-day Redis retention; admin Redis uses KEYS; /api/health performs live shallow probes; four provider-error banners observed on screenshot.

## Planned tasks (NOT DONE)
1. [ ] Verify Preview Redis effective env and live readiness without reading secrets; do not copy production credentials or create Preview env without owner's security approval.
2. [ ] Inventory disposable vs operational Redis namespaces, set allowlisted bounded invalidation and SCAN-based telemetry; preserve site settings/custom source overrides/audit.
3. [ ] Measure cache hit/miss and request budget before editing TTL; specify per-type stale and unsafe-content invalidation. Account for Redis lazyConnect cold start.
4. [ ] Implement or validate request coalescing only after detecting stampede; keep throttled provider retries and 403/429 distinctions.
5. [ ] Audit React Query cache-first Back/Forward/scroll and Serwist metadata/image; avoid full skeleton when cached results exist.
6. [ ] Fix Vaul filter drawer header/body/footer, safe area/visualViewport, draft Apply/Cancel/Reset; test Safari physical 52/92% snaps.
7. [ ] Separate lightweight app liveness from source health probes; keep source health timestamp/last-known capability per stage.

## Evidence to collect
Current: PLANNED, runtime Redis availability UNKNOWN; a 30-minute log query found no Redis lines but not evidence of connection. Required: Vercel exact target/SHA, test fixtures, before/after p95, iOS screenshots, trace provider request count.

## Open blockers
B-10 Preview Redis, B-02 physical iOS, B-06 exact deployment, live provider 403/429 restrictions.

## Safety and rollback
Never run KEYS/FLUSHALL/purge production. Restrict rollback to approved disposable cache namespaces and code revert; keep operational Redis state intact.

## Required next action if work is interrupted
First run read-only Redis readiness/namespace and source-health audits; request isolated Preview env approval only if config remains absent. Then targeted filter performance PRs.

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

- 2026-11-01 — CODE/TEST WRITTEN, **NOT VERIFIED**: Independent Phase 03/04 requirement `PR-02` for Cari multi-provider failures: draft PR **#87** https://github.com/rzqllh/Yomirra/pull/87, commit `7675289d0dd0af6d2f6cc6da805dee80ea84bcc8`, branch `fix/search-partial-error-summary-20261101` based on `preview@02cc664`. Three files only: `src/components/search/search-results.tsx` now shows one disclosure instead of a banner per failed provider; new `src/components/search/source-error-summary.tsx` uses accessible native `details/summary` and friendly messages; regression test covers four errors, one, empty and raw error redaction. No provider network flow, auth, Redis or saved data changed. **CI/Browser smoke: PENDING** at PR creation; not PASS. Vercel still has build rate-limit blocker. Next: check PR #87 exact SHA TypeScript/lint/tests/build/browser and fix failures; merge only after review and safe gate.

- 2026-11-01 — DEPLOYMENT EVIDENCE: Vercel listing returned deployment **READY** for **exact PR #87** SHA `7675289d0dd0af6d2f6cc6da805dee80ea84bcc8`, Preview URL https://yomirra-brql7l6n6-rzqllhs-projects.vercel.app, branch `fix/search-partial-error-summary-20261101`, deployment target `null` (Preview). This proves the deployment exists at the intended SHA, **not** that Safari/UX acceptance or CI has passed. PR #87 remains draft; GitHub CI Verify & Build was IN_PROGRESS at observation. No main/production deployment.

- 2026-11-01 — **CI FAIL resolved in branch, re-verification pending**: Initial PR #87 SHA `7675289` passed typecheck/lint and had Vercel READY but GitHub full unit/integration step FAILED **1/1580** (`search-page-revamp.test.tsx` expected old banner `Komikindo gagal dimuat`). Exact log from run `41223584507` (job `124602993062`). Corrected integration test now opens the new disclosure and inspects detail, in `4fa98606ab88130d4033808d0399bdeaea0b8e28`. New SHA GitHub CI **IN_PROGRESS** and Vercel status **failure/quota** at last check; old READY preview URL does not verify this new SHA. No merge.
- 2026-11-01 — CODE/TEST WRITTEN, **NOT VERIFIED**: Independent iOS Filter P0 scoped PR **#89** https://github.com/rzqllh/Yomirra/pull/89, branch `fix/ios-filter-drawer-visual-viewport-20261101`, commit `1188f7ba5140ab54e1118427aa1ed76441efccb5`. Fixes `FilterDrawerShell` fixed-bottom alignment by computing offset from layout bottom to actual visible `VisualViewport`; responds to viewport resize + scroll including keyboard pan; retains Vaul 52/92% snaps, body scroll and safe-area padding. New pure helper and 4 geometry tests. **Physical iPhone Safari keyboard/PWA and interaction gate remains BLOCKED B-02**, never mark FL-01/02/04 PASS on pure math fixtures. Current CI PENDING; Vercel build rate-limit failure. No production and no user data changed.

- 2026-11-01 — AUTOMATED QA partial **PASS**: PR #89 (`1188f7ba`) GitHub `Verify & Build` job SUCCESS (typecheck, lint, unit/integration, app build); its `Browser Smoke` job was IN_PROGRESS at observation. Physical iOS/PWA acceptance remains BLOCKED. PR #87 `4fa9860` unit/build rerun was IN_PROGRESS; previous 1/1580 failure fixed only in code, not yet confirmed by exact-head CI. Vercel 402 prevents claiming exact-head deployment.

- 2026-11-01 — READ-ONLY ENV AUDIT: Vercel project `yomirra` currently lists `REDIS_URL` as **sensitive, Production-only**. This same Redis service may be reused for production-like Preview runtime, but its *unrestricted production credential must not be attached to every Preview/PR build*. A Redis keyPrefix protects against accidental collisions only, not malicious/unreviewed code with the same Redis password.
- 2026-11-01 — CODE + TEST CHECKPOINT: draft PR **#91** https://github.com/rzqllh/Yomirra/pull/91 (branch `fix/preview-redis-isolation-20261101`, HEAD `47e14e5990c260ebb3fd7a3269642eff9e45e2c2`). Adds `src/server/lib/cache/redis-key-scope.ts` and 4 tests, Preview key prefix per stable branch-hash (production unprefixed), patches `src/server/lib/cache/redis.ts`, admin Redis SCAN (bounded and namespace filtered), and custom-source SCAN/deletion to logical keys with tests. Initial SHA `3200d06` CI TypeScript FAIL due `.map(physicalToLogicalRedisKey)` second index accidentally binding namespace string; corrected to `.map((key) => physicalToLogicalRedisKey(key))` in SHA `47e14e5`. Exact-head CI: PENDING at checkpoint. No merge or Preview deployment.
- 2026-11-01 — BLOCKER B-10 RESOLUTION PLAN: (1) merge/review scoped Redis key isolation only after exact CI PASS; (2) verify Vercel Preview deployed SHA matches implementation; (3) ensure `VERCEL_ENV=preview` and `VERCEL_GIT_COMMIT_REF=preview` at runtime (nonsecret facts only); (4) provision a restricted Preview Redis ACL credential for the **same backend service** where supported, or physically isolated instance if ACL unavailable; (5) add `REDIS_URL` to **Preview branch only** in Vercel, not all feature/PR deployments, without revealing secret; (6) verify cache hit and isolated disposable test key, custom source and site-config namespaces, Preview 200, no data change in Production; (7) never run FLUSHALL, wildcard purges, share unrestricted production password, or claim Preview parity before an observed READY deployment. If external Redis provider cannot provide restricted credentials, owner approval needed to choose separate Redis instance vs unsafe shared access (unsafe not recommended).

- 2026-11-01 — MERGED TO PREVIEW: #87 error summary at `6fa1e4b929656c9084a64018d7a34ca17665ede6`; #89 mobile filter drawer visual-viewport alignment at `2f0bf18aef4b1567c9610faf0a2e53c12c0850c8`; both source PR heads GitHub CI PASS including browser smoke. Exact merged-head Preview deployment NOT READY/NOT VERIFIED; physical iPhone Safari/PWA acceptance still BLOCKED B-02. New Redis namespace PR #91 CI Verify & Build SUCCESS at `47e14e5` with browser smoke pending; no environment/secret mutations.

- 2026-11-01 — MERGED TO PREVIEW: PR #91 `fix(redis): scope Preview keys by branch and constrain admin scans`, squash `10130580a1c934f2056786bc95a691e83858e870`, source head `47e14e5` full GitHub CI SUCCESS incl Browser Smoke. `REDIS_URL` still PRODUCTION-ONLY in Vercel inventory; no secret copied or live redis checks performed, ENV-01/B-10 still BLOCKED. Preview is pre-main review branch but must use restricted credentials or independent service, never production unrestricted URL for PR builds.

- 2026-11-01 — CODE/TEST WRITTEN, **NOT VERIFIED**: draft PR #95 https://github.com/rzqllh/Yomirra/pull/95, HEAD `995e81982ea2730d4252cd1c2bfb012b42a528ea`, branch `fix/bounded-redis-stale-cache-20261101`. `withCache()` now proposes physical retention = active TTL plus min(active TTL, 1h) stale grace; only bounded expired data can fall back after upstream failure; `allowStaleOnError:false` persists only active TTL. Updated test to remove blanket 7-day assumption; added tests for grace, week-old legacy entries and signed URLs. No Redis deletion or config change; PR source SHA CI PENDING, live impact requires exact-head QA. Also audit request coalescing and cold-start readiness later (CACHE-04).
