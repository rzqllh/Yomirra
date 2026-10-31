# Yomirra — preview blockers and runbook

Updated: 31 October 2026 (Asia/Jakarta). Owner authorized consolidation into `preview`, Reader controls, notifications, home Quick Search positioning and MAL popularity. Production promotion, destructive data operations and billing/security changes are not authorized by this request.

Current verification must be read from the final PR checks and Vercel commit metadata. Earlier investigation snapshots in `PREVIEW_RUNTIME_GATES_20261031.md` are historical; a prior PASS or deployment-quota failure is not the current status automatically.

## Consolidation verification snapshot

31 October 2026, tested commit `df909b9d74d8fde0829847e5b8e7999545d51923` (tree `90354c135257083b1a6e84dd3ea5f347251a2870`):

| Check | Result / boundary |
| --- | --- |
| Reconciled local suite | PASSED: 231 files, 1,568 tests; TypeScript passed. |
| GitHub CI Verify & Build | PASSED on this commit, run `41204515290`, job `124546757769`. Browser job was still running at this snapshot; inspect final PR #83 checks for its result and any subsequent head. |
| Vercel feature deployment | READY, preview target (`null`), deployment `dpl_4UoQakJUZLLV3P2Gd8Xb9HJgGJUh`, exact commit confirmed. This is pre-merge evidence; final preview branch SHA/deployment must be verified separately. |
| Beranda Quick Search | PASSED live desktop sample: visible-viewport centered dialog, 16px input, Escape closes. Mobile/tablet and visual-keyboard simulation are in the browser suite; physical acceptance remains B-02. |
| MangaDex detail → chapter → Reader | PASSED live sample: `fcb5111f-be88-4f5a-b456-22135f3eda49`, English chapter `5c79494d-6f40-4118-9baa-2b2142fcd9b1`, 22 pages. First five visible images decoded with nonzero natural dimensions. This does not prove every page/provider/title. |
| Reader controls | PASSED live sample: bottom slider has 44px input height and 22 dots; ArrowRight selects page 2 and scrolls content; detail action reaches the exact manga detail. Double-tap setting can be selected. Behavior/persistence are additionally covered by focused units; real touch/pinch remains B-02. |
| Toast | PASSED live sample: resume-reading toast appears in the Reader. Four-distinct-completion recommendation and idempotent Save action pass focused units; real four-chapter reading acceptance is not claimed from this one-chapter sample. |
| MAL endpoint / UI | BLOCKED on B-01: real preview endpoint returns HTTP 503 `MAL_NOT_CONFIGURED`, private/no-store; Populer MAL displays configuration status. Official API request, normalization and opt-out safety pass fixtures; live ranking has not been verified. |

The final merge is tracked in https://github.com/rzqllh/Yomirra/pull/83. A later visual adjustment keeps page dots readable at narrow widths using non-scaling SVG strokes; it does not change page-navigation semantics. Do not substitute this snapshot for exact-head checks on the final preview commit.

## Open blockers / acceptance gates

| ID | Status and evidence | How to resolve | Who / release boundary |
| --- | --- | --- | --- |
| B-01 MAL live ranking | Integration uses the official MAL v2 manga ranking API with `ranking_type=bypopularity`. Live data requires `MAL_CLIENT_ID`; missing configuration returns `MAL_NOT_CONFIGURED`, not fabricated ranking or empty-provider success. | Follow the configuration steps below; validate real results, safe classification and provider failure recovery. | Owner supplies app registration/configuration; agent can retest. Does not prevent reviewing other preview features. |
| B-02 Physical iOS/iPadOS | Browser automation is not physical Safari, installed PWA, VoiceOver or a real virtual keyboard. | Run the device checklist below on a physical iPhone and iPad in Safari and installed PWA. Record OS/device, viewport, commit and actual results. | Owner/device tester; production acceptance gate. |
| B-03 Live Firebase and UID boundaries | Preview has not been accepted against a real isolated Firebase test account/project. Browser online is not backend health. | Configure an isolated staging Firebase project and approved preview domains; test sign-in on mobile, offline reads, reconnect, sync failures, UID A → guest → UID B, reload and backup/restore using disposable fixtures. Never copy production credentials/data as a shortcut. | Owner provides staging access/configuration; agent can test the authorized account. Production gate. |
| B-04 Legacy content classification | Old mixed-provider saved/history records may lack reliable content-rating evidence. New payloads retain rating, but no bulk reclassification/migration was performed. | Export backup first; audit old records read-only in an isolated profile. Verify default safe mode across Library, history, recommendations, detail and Reader. Propose a reversible migration only if needed; obtain approval before changing user records. | Agent audit + owner approval for data mutation. Production gate. |
| B-05 Reader/persistence risk register | R-01, R-10, R-11, R-13–R-19 in the earlier audit are historical findings, not a claim they all remain broken. Preview already contains prior Reader safety work; this batch does not rewrite milestone/retention semantics. | Reproduce opening a far-ahead chapter, reread, failed-image completion, explicit next, source identity mismatch, refresh/offline, per-title preferences and shortcut history. Verify cursor vs highest verified milestone separately. Run relevant current tests and physical-device scenarios; attach exact SHA. Keep any correctness repair in a separately scoped review. | Agent + device tester; production gate. |
| B-06 Deployment quota | Earlier Vercel attempts were rate limited; later automatic builds succeeded. Availability must be checked for the final `preview` SHA. | Inspect current deployment/status; if rate limited, honor retry timing and retry the same reviewed SHA when quota permits. Do not upgrade billing, bypass protection, switch production branch or promote another build to hide this blocker. | Agent retries within authorization; owner decides any paid-plan/security change. |
| B-07 Background/OS notifications | This batch covers in-app toasts and bookmark suggestion. Existing chapter-update UI/polling is preserved. OS/background push delivery is not claimed. | Test foreground chapter updates with a disposable followed title. If OS push is required, scope subscription/backend support and iOS PWA eligibility first; request permission only through a user action. | Product decision / device tester; no automatic permission request. |
| B-08 Broader integrations and claims | Prior audit did not establish complete runtime evidence for Komga/Kavita/Suwayomi, archive reading, admin-log durability or telemetry/privacy claims. | Use isolated fixtures: connect each supported service, read a real chapter/image, test offline/error recovery and archive corruption/large files; check log survival and actual emitted telemetry against Settings and product policy. Do not mark PASS from documentation alone. | Separate verification scope; do not infer these features were fixed by this UI batch. |

## Enable official MAL popularity

1. Owner opens https://myanimelist.net/apiconfig and registers/uses the app under MAL's terms. Account registration or accepting terms is a human action.
2. In Vercel → the **yomirra** project → Settings → Environment Variables, add encrypted **MAL_CLIENT_ID** to **Preview** using that app's Client ID. Do not use `NEXT_PUBLIC_`, publish it in Git, paste it in chat, or copy another app's key. Reading public ranking does not require a user's MAL list OAuth token or Client Secret.
3. Redeploy the current `preview` commit. Existing immutable deployments do not inherit new environment variables.
4. Open `/api/metadata/mal/popular`: configured success is HTTP 200 with real `malId`, original rank, members, snapshot time and retained classification. Missing configuration is HTTP 503 `MAL_NOT_CONFIGURED`; upstream failure is HTTP 503 `MAL_UNAVAILABLE`.
5. Open **Populer → Populer MAL**. Check popularity rather than score ranking; original rank gaps after filtering must remain. Search-for-reading action opens **Cari**, preserving its independent source choices. It must not manufacture provider identity, matching chapters or reading availability.
6. With default safe mode, only MAL `nsfw=white` is accepted. Missing/gray/black classification is hidden; opting out immediately removes cached restricted metadata/cover elements. Cache scopes are separate, bounded to one hour, with snapshot attribution and no stale-on-error ranking substitution.
7. Simulate timeout/auth rejection/rate limit, then restore configuration and verify recovery. Record live evidence separately from fixture tests.

Primary contract checked on 31 October 2026: https://myanimelist.net/apiconfig/references/api/v2 — official embedded OpenAPI defines `/manga/ranking`, `bypopularity`, header `X-MAL-CLIENT-ID`, ranking positions and `nsfw` white/gray/black. No unofficial API or additional dependency was added.

## Device acceptance checklist

- iPhone small/large and iPad portrait/landscape/Split View; Safari and installed PWA.
- Reader: both **Kembali ke detail komik** and **Kembali ke Beranda** land at their named destinations, even after several chapters.
- Progress below: dots equal chapter page count; drag, tap and keyboard select a real page; RTL, one-page chapters and refreshed page counts work. Scrubbing must not itself grant verified completion.
- Double-tap toggle: off/on effect, per-title/global scope and reload persistence. Pinch zoom remains available. Older backups without the field still import with the existing default behavior.
- Recommendation: opening/skipping alone does not count; more than three distinct eligible chapter completions trigger once per work/provider/account/session. Rereads do not increase the count; already-saved titles do not nag; the Save action cannot remove an already-added bookmark.
- Toasts: visible below safe top chrome; action and 44px close target work; multiple notifications stack/dismiss normally; app theme and reduced motion respected. Cloud-write failure must not say cloud sync succeeded.
- Beranda Quick Search: real visual viewport centered horizontally/vertically, including keyboard offset/resize, safe areas and iPad input zoom; focus restored after close. It follows Jelajah source while Cari remains independent.
- All states: loading, empty, provider error, disabled/restricted source, offline and recovery; contrast, zoom/dynamic text, VoiceOver and touch targets.

## Integration / rollback

- Consolidate the complete tested feature ancestry into `preview`; keep `main` and production deployment unchanged.
- Verify GitHub `preview` SHA equals Vercel deployment SHA and target is preview. Do not advertise an older deployment as latest.
- Changes reuse existing dependencies. Native page range input supplies touch and keyboard behavior; one dot per page is rendered, with source/chapter-scoped transient navigation.
- Reader preferences add an optional double-tap flag; old storage keys/routes/API identities remain. Backup v1–v3 compatibility is covered by the existing suite plus the additive optional preference.
- Recommendation evidence is session-only and account/source-scoped. It is separate from durable milestones and is not synced to Firebase.
- If a new regression appears, first disable/revert only this reviewed change in a new commit. Do not force-push, delete reading data, rewrite Firebase schema or roll back unrelated work. Ask before any destructive recovery.
