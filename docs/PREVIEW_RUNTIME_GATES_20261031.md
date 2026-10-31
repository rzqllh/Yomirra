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
| Fresh exact-head deploy | Manual Vercel deployment returned HTTP 402 api-deployments-free-per-day | Blocked pending available quota; billing/plan unchanged |

The protected-preview HTTP helper uses a temporary share link. Browser QA reused that existing link (no new protection configuration or public link published). Deployment Protection remains enabled. No Firebase account was signed in and no save/delete/import action was invoked. Opening the test chapter may record reading activity in the isolated guest browser.

Existing immutable deployments do not inherit a newly added environment variable. A new preview must confirm signed `/api/proxy/image` URLs, valid proxy image responses and decoded visible images through the actual Reader. Keep HMAC verification, outbound/DNS safeguards, host validation and rate limits intact. Do not copy production Firebase, Redis, bot or account credentials into preview to make acceptance pass.

The live zero-numbered chapter also exposed a display fallback that converted 0 to 1; the reading action now preserves chapter zero. Image-error copy uses user-facing page numbers starting at one while report/retry indices remain zero-based. These are display changes, not chapter identity or progress migrations.

Physical iPhone/iPad Safari and installed PWA, VoiceOver, virtual keyboard, live Firebase sync/recovery, and legacy mixed-provider records remain unverified. The complete code/test SHA and each CI conclusion must be read from the current PR checks; preview b94fd13 does not include later Quick Search close fixes.
