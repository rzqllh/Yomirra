# Production stabilization

Updated 2026-11-05 WIB. Worktree branch `codex/production-stabilization` starts from `afb174fff77f001613be5d60d181e75e76de274c`.

## Production baseline

Vercel production deployment `dpl_4N63SyaPDRJPTuNRQq1Jfkdigjq5` was Ready at the baseline SHA. The canonical host is `www.yomirra.web.id`. `GET /api/health` returned 503 with Redis down and no source snapshots. Both `POST /api/search/related` and `POST /api/metadata/rating-batch` returned 503 on valid samples. The runtime log sample contained repeated Asura requests and source-health timeouts. The current Redis failure mode was not established.

One Shinigami title and chapter returned HTTP 200 on detail, chapter-list and page API requests in 0.46–0.50 s. SSR detail and Reader returned 200 in 0.41–0.46 s. These spot samples do not establish tail latency. Chromium at 360 px loaded the production Reader and reproduced a CSP report-only unsafe-eval warning.

## Work in progress

- P0.1 commit `1890d65` fixes Reader SSR discarding a successful pages result during chapter loading. Six test files passed, 19 tests.
- P0.2 bounds public request admission in memory, preserves Redis-backed security admission, and limits concurrent source work. Global search coalesces partial results briefly instead of refetching all sources on every request.
- Next verify repeat source failures and recovery, then remove the Redis gate from safe public fallback paths.
- PR #143 was open and draft during the baseline audit. Production release remains gated on full checks and production health.
