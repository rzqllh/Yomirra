# Yomirra — PHASE 00 HANDOFF (Baseline & Plan)
Updated: 2026-10-31 Asia/Jakarta
Status: IN_PROGRESS — baseline read-only reconciled; planning artifacts in progress
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
