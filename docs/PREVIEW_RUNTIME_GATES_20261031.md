# Preview runtime evidence — 31 October 2026

These observations distinguish deployed API behavior from fixtures and from displayed images.

| Check | Evidence | Status |
| --- | --- | --- |
| Local MangaDex search | HTTP 503, UPSTREAM_TIMEOUT | Blocked in the local environment |
| Preview b94fd13 catalog/detail | Live safe-mode API, ONE PIECE STRONG WORLD | Passed API checks |
| Preview b94fd13 chapters | Provider manga `fcb5111f-be88-4f5a-b456-22135f3eda49`; one English Oneshot chapter `5c79494d-6f40-4118-9baa-2b2142fcd9b1` | Passed API and visible chapter-list checks |
| Preview b94fd13 pages | 22 live @Home page URLs returned | Passed API check |
| Preview b94fd13 Reader | Actual chapter opened in desktop cloud browser; multiple images failed | Failed visual/image acceptance |
| Preview configuration | Metadata-only inspection: IMAGE_PROXY_SECRET was production-only; preview page URLs were unsigned/direct | Confirmed configuration gap; not proof that every image failure has this sole cause |
| Preview signing key | A separate random encrypted IMAGE_PROXY_SECRET was added for preview only, with upsert disabled | Prepared for future preview builds; production value never read/copied/rotated |
| Manual deployment | Vercel returned HTTP 402 api-deployments-free-per-day | Failed attempt; billing/plan unchanged |
| Automatic exact-head preview 4649da1 | Deployment dpl_4wwUp5Sb8zjaF3CaA5e2Km1ohhVD reached READY | Available; supersedes the earlier preview blocker for this commit |
| Preview 4649da1 MangaDex | Detail, one English Oneshot, 22 signed proxy page URLs; actual chapter opened from its list; first five visible Reader images decoded with nonzero natural dimensions | Passed live sample through displayed images; not a claim that every provider/work/page has been tested |

The protected-preview HTTP helper uses a temporary share link. Browser QA reused that existing link (no new protection configuration or public link published). Deployment Protection remains enabled. No Firebase account was signed in and no save/delete/import action was invoked. Opening the test chapter may record reading activity in the isolated guest browser.

Existing immutable deployments do not inherit a newly added environment variable. The automatic 4649da1 preview confirmed signed `/api/proxy/image` URLs and decoded visible images through the actual Reader. Keep HMAC verification, outbound/DNS safeguards, host validation and rate limits intact. Do not copy production Firebase, Redis, bot or account credentials into preview to make acceptance pass.

The live zero-numbered chapter also exposed a display fallback that converted 0 to 1; the reading action now preserves chapter zero. Image-error copy uses user-facing page numbers starting at one while report/retry indices remain zero-based. These are display changes, not chapter identity or progress migrations.

Physical iPhone/iPad Safari and installed PWA, VoiceOver, virtual keyboard, live Firebase sync/recovery, and legacy mixed-provider records remain unverified. The complete code/test SHA and each CI conclusion must be read from the current PR checks; preview b94fd13 does not include later Quick Search close fixes.

Exact-head CI 4649da1 passed 228 files/1,554 tests, TypeScript, build and lint (503 warnings, zero errors). Browser CI passed after one WebKit cold-catalog retry and skipped the BrowserStack credential gate. Its logs exposed a real Cari hydration mismatch when the shell warmed the registry before route hydration. Cari now uses the existing mounted guard for source candidates; a server-empty/client-warm hydration regression and browser page-error assertion cover that case. Cold-catalog readiness uses the same 15-second budget as the other routes. This follow-up needs its own final-head CI/preview checks.

Additional local actual-route Chromium checks passed at 430x932, 932x430, 1180x820, 768x1024 and 1024x768 with touch, dark mode and reduced motion. These cover filter pattern, Quick Search bounds/centering and overflow on Jelajah, Cari, Library and Settings using source fixtures. They do not establish physical-device acceptance.

Preview 23eabd6 repeated the successful live MangaDex detail/chapter/image sample. Live Jelajah then exposed a separate render-loop blocker: native filter sorts (`followedCount`, `latestUploadedChapter`) disagreed with the generic persisted `popular` value. The fallback updated local sort while the store-sync effect restored the old one. Fallback now updates both values, and native non-catalog sorts are forwarded to search rather than silently returning popular data. Fixtures now include native sort IDs and assert a `createdAt` request and absence of page errors. The follow-up requires its own CI and deployed verification; 23eabd6 is not release-ready.
