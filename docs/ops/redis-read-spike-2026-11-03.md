# Yomirra Redis GET spike — 2026-11-03 (investigation / mitigations)

## Evidence (not a final traffic-attribution RCA)

- Upstash usage screenshot, time zone UTC+07: GET approximately 915K by 2026-11-04 06:27; INCR 509, CLIENT 224, EXPIRE 135, AUTH 113, INFO 89. The read-throughput chart peaked around 13–14 commands/second, with almost all operations reads.
- The elevated GET rate began approximately 2026-11-03 05:16 WIB (2026-11-02 22:16 UTC), *before* source health PR #128 was deployed to production (2026-11-03 13:44 WIB). PR #128 cannot be the initial trigger.
- Vercel archived error-group summaries show repeated reader/detail requests from a small set of visitor identities before that deployment, but historical raw request logs are no longer retained under the Hobby plan. IP, User-Agent, request-path volumes and definitive cause remain **unknown**.
- Reference source commit preceding onset: `f914691eda` (2026-11-02 17:07 WIB). It already used uncapped per-request Redis GET lookups in the public cache, domain resolver and source-override retrieval. The architecture could amplify repeated page requests into many Redis commands even with a high hit rate.
- Redis production has `REDIS_URL`; Vercel Preview does not. Preview showing `unconfigured` is expected with current environment targets and is separate from the production quota exhaustion.
- PR #142 already introduced a quota-aware circuit breaker; this change does not undo it.

## Containment in this change

1. Deduplicate public `withCache` reads within a serverless isolate for at most ten seconds (and never past the original cache expiry), with a 256-entry / 8 MiB bound and a 128 KiB per-entry limit; late timed-out flights must not populate it.
2. Deduplicate both Redis hits and misses for source-domain resolution within an isolate for at most ten seconds; local writes invalidate the near value.
3. Use React request-scoped `cache()` for public source-override lookups during server rendering; admin mutation and durable reads retain their existing fail-closed behavior.

These mitigations reduce GET amplification; they **do not** prove or eliminate a bot, crawler, synthetic monitoring loop or client refetch source. They do not add broad CDN caching because pages depend on per-request content preferences.

## Before release

- Review CI: types, lint, unit tests, build, and production-read safety.
- Confirm operations tests: source admin override changes, domain switch, NSFW modes, Reader signed URLs, cache TTL, Redis unavailable and half-open probe.
- Measure upstream `GET` requests per endpoint plus user-agent, referrer and IP bucket (privacy-safe) on a short, bounded sampling window. Investigate visitors behind long-lived SSR traffic; do not log full Redis keys or secrets.
- Re-check Upstash command throughput after deployment against the 500K/month command budget. Do not infer a fix from page HTTP 200 alone.
- This PR is a scoped mitigation, not proof of complete incident resolution or authorization to upgrade billing.
