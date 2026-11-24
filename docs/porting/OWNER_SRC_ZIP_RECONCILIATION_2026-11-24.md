# Owner src.zip reconciliation (2026-11-24)

Baseline: main d568dbcc0848795b3457ef5164e04a5b79f2a6b1. Owner states Keiyoushi was only the source-list reference; the supplied TypeScript adapters are their own compilation. This is not an APK extension integration.

## Inventory and decisions

The archive contains 42 TypeScript files (40 adapter directories, base.ts and index.ts). All 40 directories already correspond to Yomirra's 9 built-ins and 31 staged entries. Keep the native MangaSource contract, HttpClient, source IDs and rollout boundaries. Explicit aliases: asura-scans -> asurascans; west-manga -> westmanga; ainz-scans-id -> ainzscansid; izanami-scans -> izanamiscans. KomikIndoID remains a staged duplicate candidate, not an extra active provider. Do not replace the richer native implementations with archive versions: archive methods lack full pagination and capabilities, accept raw URLs in several adapters and some read JSON twice.

This change adds a complete directory-to-registry regression test and hardens the existing staged Ainz adapter against malformed identities, missing chapter numbers, duplicate chapters, invalid image URLs, missing parent IDs and rate-limit amplification. Normalizes author, cover and page order, preserves explicit lock information without inventing it, and does not infer content safety. Archive endpoints are unverified against live upstreams; tests are fixtures, not live evidence. Other staged engines remain unchanged. No runtime dependency or upstream extension installation.

## Rollback and acceptance

Revert the squash commit with normal Git revert if required. No DB, user-data, deployment configuration or environment mutations. No public activation; owner-only access and provider access restrictions remain intact. CI and live acceptance must be separately evidenced. 40 inventory entries does not mean 40 working sources: 27 staged engine candidates and four prototype/duplicate/access-limited entries still require appropriate live verification. Existing nine public adapters are not overwritten.
