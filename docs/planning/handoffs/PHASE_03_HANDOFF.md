# Yomirra — PHASE 03 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: NOT_STARTED (planning file created; no implementation/QA performed in this phase)
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
