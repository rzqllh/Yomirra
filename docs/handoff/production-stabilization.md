# Production stabilization

Updated 2026-11-05 WIB. Worktree branch `codex/production-stabilization` starts from `afb174fff77f001613be5d60d181e75e76de274c`.

## Production baseline

Vercel production deployment `dpl_4N63SyaPDRJPTuNRQq1Jfkdigjq5` was Ready at the baseline SHA. The canonical host is `www.yomirra.web.id`. `GET /api/health` returned 503 with Redis down and no source snapshots. Both `POST /api/search/related` and `POST /api/metadata/rating-batch` returned 503 on valid samples. Vercel logs showed the Redis quota circuit rejecting rating admission, repeated Asura requests, and source-health timeouts. Separate health failures logged an unwritable ioredis stream with the offline queue disabled. Other routes logged successful connections. Provider quota and connection health still require verification.

One Shinigami title and chapter returned HTTP 200 on detail, chapter-list and page API requests in 0.46–0.50 s. SSR detail and Reader returned 200 in 0.41–0.46 s. These spot samples do not establish tail latency. Chromium at 360 px loaded the production Reader and reproduced a CSP report-only unsafe-eval warning.

## P0 changes

- `1890d65` reuses a successful Reader pages result during chapter loading. 19 focused tests passed.
- `5b91d76` bounds public admission and concurrent source requests per instance. Security admission remains Redis-backed and fail-closed. Partial global search results briefly share a local cache. 42 focused tests passed.
- `d9b0e51` moves Komikindo, KomikNesia and WestManga into Maintenance after live catalog checks. Komikindo and WestManga returned upstream 403 on both pages. KomikNesia page 1 repeatedly failed schema validation at `contents.data[3].sinopsis`, while page 2 returned 40 items. A newer successful functional probe restores default selection. 75 focused tests passed.
- `1d40ea2` lets public related search and rating batch return empty or partial results during Redis outages. New paid embeddings still require secure admission. 15 focused tests passed.
- `c97294e` adds per-source cooldowns, a single recovery probe and temporary 404 caching. Invalid Asura slugs return 404 before contacting upstream. 56 focused tests passed.

- `98491da` reconciles newer Redis recovery snapshots across instances. Three focused tests passed.
- `a013e9d` limits the image proxy to 16 concurrent streams per instance and releases slots on cancellation. The saturation regression passed.
- `bd046b86` shares search filter requests with the drawer and skips Maintenance sources in default filter fanout. `ff456b65` adds a deduplication regression.
- `29178ca1` waits for Redis readiness before issuing a bounded PING. Concurrent checks share the probe and failed checks still return 503. The focused health, readiness and public fallback suite passed all 31 tests.

## P1 and P2 changes

- `37b71bc`, `c515fd5`, `d4215fd` share dock geometry, improve light-theme surface contrast, and add glass with an opaque fallback.
- `4d6664f`, `0004d08` prioritize the first visible Reader page, recover loading after a jump, and restore browser zoom. 70 focused tests passed.
- `39271cb`, `d2613ff`, `381424a` reorganize detail and chapter browsing, move partial catalog notices down, and add cover fallback. MangaDex metadata succeeded on production. Exact CDN URLs failed TLS verification in this environment, so the reported asset 403 could not be independently confirmed.
- `6bd969c` disables Zod code generation in browser-loaded schemas. Chromium traced the baseline report-only violation to the Zod probe in chunk `2682-2c99103e36d13eb2.js`. CSP enforcement has a separate gate in `docs/TESTING.md`.
- `8591427`, `bd9ccca`, `6b8056e`, `2b5bc76` update onboarding, keep a persistent horizontal dock indicator, hide scrollbar chrome, and clarify chapter states.
- `331e7ce9` adds shell regressions at 320/360/1440 px and updates README, changelog, and architecture docs.

## Verification

- GitHub Actions run [42003934274](https://github.com/rzqllh/Yomirra/actions/runs/42003934274) passed typecheck, lint, build and all 1,761 tests across 253 files at `ff456b65`. Local lint reported 503 warnings and zero errors.
- The built local app passed all eight Chromium/WebKit cases, covering 320 px light, 360 px dark, horizontal dock history navigation, desktop onboarding and keyboard scroll. Chromium also opened the live Shinigami sample in the local build at 360 px, loaded two signed proxy images with `high` then `low` fetch priority, and reported no eval violation across four smoke pages under CSP Report-Only.
- With local Redis deliberately pointed to a closed loopback port, health returned 503. Related search and rating batch returned 200 with empty data in 0.11 s and 0.66 s TTFB. The protected [Vercel preview](https://vercel.com/rzqllhs-projects/yomirra/HprFVfDV66y5TduwwakciumtT4ef) at `bd046b86` returned 200 for both routes in 0.89 s and 2.18 s TTFB. That preview reported Redis as unconfigured.

## Release gates

- [Draft PR #145](https://github.com/rzqllh/Yomirra/pull/145) targets `main`. PR #143 remains separate and was still open and draft at 16:24 WIB.
- Production still served the baseline at 16:39 WIB. Health returned HTTP 503 with Redis down and empty source snapshots in 0.43 s TTFB. Confirm provider quota and connectivity, then verify the readiness fix in a Redis-configured environment. Validate authenticated flows, source recovery and production latency before closing the release. Public admission and stream limits apply per instance.
- Verify Firebase login, offline/PWA flows on a physical Apple device, and CSP reports on a built deployment before switching to enforcement.
