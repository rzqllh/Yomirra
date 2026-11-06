# Final stabilization

## Release status

**BLOCKED** on 6 November 2026. Baseline `main` is `1a889db70d6cc09e8ccf28b607e5b24130b9f843`. PR #145 is merged. Vercel links that SHA to production deployment `dpl_9sVxqcKGx7sqprbQZeu6tF4buent`. The apex, canonical domain and immutable deployment hosts returned HTTP 402 `DEPLOYMENT_DISABLED` despite the deployment reporting Ready.

Authenticated Vercel team metadata reported Hobby fair-use soft block `FAIR_USE_LIMITS_EXCEEDED` on `fastOriginTransfer`. It began 5 November at 23:56:17 WIB. Vercel lists 5 December at 23:56:17 WIB as the scheduled unpause, which still requires verification. Both custom domains are verified. Route and team usage breakdowns were unavailable at the current observability tier. The traffic responsible for the overage remains unknown. [Vercel transfer documentation](https://vercel.com/docs/manage-cdn-usage)

The previous production smoke recorded a separate Redis 503 and successful related-search and rating-batch samples. Current Redis, Firebase and source health cannot be inferred from the hosting response. Production stops here pending provider recovery. The owner can inspect the team Usage breakdown and ask Vercel about restoration on the existing plan. Billing changes, manual redeploy and manual rollback require separate approval.

## Work in progress

- Branch `codex/final-stabilization` starts from the verified main baseline. The readiness suite reproduced repeated PINGs, immediate retries after failure and an unconfigured Redis reported as ready. All 15 health tests passed after introducing dependency-free liveness, readiness backoff and a distinct unconfigured state. This bounds health probe traffic per instance. It does not diagnose the live Redis outage.
- Draft PR #143 uses `preview@e308d1dfa70ae4bd8127a4592d80a476d7f38131`. The virtual merge found a bottom dock conflict. The integration audit identified menu style drift and dormant Q138 replay, atomicity and UID-isolation defects. Keep Q138 inactive and preserve the existing app write path during integration.
- Next actions are to reconcile preview on the feature branch, reproduce transfer amplification locally, validate against isolated Redis and run the independent audit after integration. Production requires healthy public routing, exact-SHA evidence and low-volume smoke before release can be verified.
