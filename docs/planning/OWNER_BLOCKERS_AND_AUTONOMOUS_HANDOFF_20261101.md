# Yomirra — Owner-dependent blockers and autonomous work (2026-11-01)

## Purpose and status rules
This is an evidence-limited handoff as of 2026-11-01, not a declaration that P00–P07 are complete. `IMPLEMENTED` only means committed/merged code; `CI_PASS` refers to exact-head GitHub Actions, not a physical browser, provider, Redis/Firebase or actual Preview deployment test. Refresh SHA, PR, CI, Vercel state and any owner-provided evidence before relying on this snapshot.

## Independent work completed or underway
- PR #100: lightweight `/api/health` no longer probes upstream providers on liveness calls; merged to `preview`, GitHub CI PASS.
- PR #102: source-scoped catalog cards with disabled/ineligible sole provider block invalid detail links; merged to `preview`, GitHub CI PASS.
- PR #103: disabled automatic NSFW Library/History patcher and recorded owner-approved non-destructive B-04 policy; merged to `preview`, exact-head source CI PASS.
- PR #104: tri-state content classification and gated UNKNOWN Detail/Reader/card rendering, preserving MAL strictly white-only in NSFW OFF; merged to `preview`, exact-head source CI PASS.
- PR #106: isolated Quick Search UNKNOWN-cover masking/warning; merged to `preview`, exact-head source CI PASS.
- PR #107: rotated PWA cache to v3, automatic cache eviction on NSFW ON->OFF switch while preserving user chapter downloads; merged to `preview`, exact-head source CI PASS.
- PR #110: gated Home leaderboard restricted titles and unverified artwork with explicit badge; merged to `preview`, exact-head source CI PASS.
- PR #111: capped GitHub Actions Vitest runner concurrency to `--maxWorkers=2`; merged to `preview`, exact-head source CI PASS.
- PR #105: diagnosed and eliminated root-cause infinite React re-render loop on empty candidates in `HomeHero`, isolated hero collage cache by mode, gated Spotlight unverified/restricted titles, updated tests; merged to `preview`, exact-head GitHub CI PASS (run 41300940992, Verify & Build 4m55s + Browser Smoke 10m33s) and Vercel Preview READY deployment.

## External owner/provider/device gates (only these need outside action)
| ID | Current blocker | Required next action by owner/provider | Agent-independent preparation possible |
| --- | --- | --- | --- |
| B-01 | No verified Preview-only official MAL `MAL_CLIENT_ID` | Configure the official API client ID as server-side Vercel Preview variable, not in chat/Git; authorize provider registration/terms if needed | Keep MAL 503/no-fabrication behavior, unit fixtures, test plan |
| B-02 | Physical iPhone/iPad Safari/PWA, keyboard, VoiceOver and gestures not evidenced | Provide device testing session/evidence (actual OS, screenshots, route logs); no simulated PASS | Run Playwright Chromium/WebKit and accessibility contract tests |
| B-03 | Real isolated Firebase UID A/guest/UID B, sync and account-boundary acceptance missing | Provision/approve disposable staging Firebase identities and test environment; avoid real user data | Author mock fixtures, save/reconcile/recovery tests |
| B-04 | Legacy personal Library/History may contain mixed/unknown metadata; migration is not authorized | If mutation ever becomes necessary, approve backup, dry run, reversible migration and restore plan separately | Disable mount-time patcher, preserve data, build read-only audit |
| B-06 | Exact-head runtime deploy subject to Vercel quota | Vercel returned HTTP 402 `api-deployments-free-per-day`, `retryAfter=86400`. Retry within official allowance after reset; owner decides any billing/plan change | Continue GitHub CI and source review; never bypass quota or promote Production |
| B-07 | OS/background push service-worker/device acceptance missing | Approve/request actual push permission and physical PWA test evidence | Keep honest in-app notification UX and isolated tests |
| B-08 | Content rights, external provider access, archive and proxy terms unresolved | Obtain provider-specific rights/licensing review and permission decisions before release claim or new connector activation | Read-only source/adapter rights inventory and rate-limited public checks |
| B-09 | MAL↔reader-provider work/edition equivalence unverified | Supply trusted API cross-references or approve provenance/ambiguity-resolution design, after MAL works | Preserve explicit `Cari` fallback and identity fixtures |
| B-10 | Preview Redis connection must not reuse unrestricted Production credentials | Provide Preview-scoped least-privilege Redis ACL credential or approve separate isolated store; scope env to branch Preview only | CI tests, namespace isolation, no production Redis mutation |
| B-11 | AniList API usage, quotas, caching/terms and attribution expansion not approved | Owner/legal reviews provider terms and explicit scope before expansion | Audit existing MangaDex→AniList rating fallback read-only |

## Still engineerable, not owner blockers
CAT canonical cross-page durable identity, false-match and edition guards, NSFW filter/URL/cache coverage, Reader progress/offline regression, source capability/staleness, recovery/error messages, UI a11y/layout/toasts and notification UX. These remain ongoing according to `TRACKING.md` and `ACCEPTANCE_MATRIX.md`, not DONE. Implement in small PRs with exact-SHA CI and phase handoff evidence.

## Release separation
A Preview GitHub commit is not necessarily the latest deployed Preview build. Last manually verified READY Preview artifact before this handoff was SHA `46892ecfa98fc5b62047251a1353e845dc3a9569`, URL `https://yomirra-fyhkuytat-rzqllhs-projects.vercel.app`. Later merges need their own exact-SHA deployed evidence. `main`, paid upgrades, secrets, destructive migrations, legal changes and Production promotion remain separately gated.
