# Production stabilization

Updated 2026-11-05 WIB. Worktree branch `codex/production-stabilization` starts from `afb174fff77f001613be5d60d181e75e76de274c`.

## Production baseline

Vercel production deployment `dpl_4N63SyaPDRJPTuNRQq1Jfkdigjq5` was Ready at the baseline SHA. The canonical host is `www.yomirra.web.id`. `GET /api/health` returned 503 with Redis down and no source snapshots. Both `POST /api/search/related` and `POST /api/metadata/rating-batch` returned 503 on valid samples. The runtime log sample contained repeated Asura requests and source-health timeouts. The current Redis failure mode was not established.

One Shinigami title and chapter returned HTTP 200 on detail, chapter-list and page API requests in 0.46–0.50 s. SSR detail and Reader returned 200 in 0.41–0.46 s. These spot samples do not establish tail latency. Chromium at 360 px loaded the production Reader and reproduced a CSP report-only unsafe-eval warning.

## P0 changes

- `1890d65` reuses a successful Reader pages result during chapter loading. 19 focused tests passed.
- `5b91d76` bounds public admission and concurrent source requests per instance. Security admission remains Redis-backed and fail-closed. Partial global search results briefly share a local cache. 42 focused tests passed.
- `d9b0e51` moves Komikindo, KomikNesia and WestManga into Maintenance after live catalog checks. Komikindo and WestManga returned upstream 403 on both pages. KomikNesia page 1 repeatedly failed schema validation at `contents.data[3].sinopsis`, while page 2 returned 40 items. A newer successful functional probe restores default selection. 75 focused tests passed.
- `1d40ea2` lets public related search and rating batch return empty or partial results during Redis outages. New paid embeddings still require secure admission. 15 focused tests passed.
- `c97294e` adds per-source cooldowns, a single recovery probe and temporary 404 caching. Invalid Asura slugs return 404 before contacting upstream. 56 focused tests passed.

## Remaining gates

- Production Redis is down at the baseline. Source recovery through the deployed health pipeline and production latency under load are unverified. The request budget is per instance.
- PR #143 was open and draft at audit time. Keep it separate.
- Next run dock and Reader browser checks, followed by full typecheck, lint, tests, production build and smoke.
