# Yomirra — PHASE 06 HANDOFF
Updated: 2026-10-31 Asia/Jakarta
Phase status: IN_PROGRESS (read-only official AniList terms/rate-limit audit; broader metadata integration blocked)
Document branch: `docs/yomirra-master-planning-20261031`
Planning base: `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`

## Goal
MAL, Existing AniList Fallback, Connectors, Rights & Operations

## Requirement IDs
`META-01..03; MAL-01..04; INTEG-01..04; SEC-03; HEALTH-01`

## Entry prerequisites
P01 identity/source policy, approved API terms and provider-specific accounts; may audit adapters read-only earlier.

## Verified current baseline (read-only)
MAL official popular endpoint exists with `bypopularity`; preview lacks verified MAL_CLIENT_ID and currently emits MAL_NOT_CONFIGURED. Rating endpoint already queries MangaDex then AniList GraphQL with normalized title validation. Broad AniList metadata/mapping is NOT in place and is conditional on terms. Existing source adapters and integrations must be exercised with isolated fixtures.

## Planned tasks (NOT DONE)
1. [ ] Review official MAL/AniList API terms, usage scope, request limits, cache retention and source attribution before expanding API use.
2. [ ] Owner provisions MAL preview server-only Client ID through approved Vercel config, not Git or chat; never reuse credentials across apps.
3. [ ] Exercise real MAL ranking and safe policy including conflict between global UNKNOWN warning vs strict white-only MAL rule; record owner decision before code change.
4. [ ] Audit existing MangaDex→AniList score fallback and display rating source/provenance; preserve distinct score semantics.
5. [ ] Verify trusted work ID crosswalk for unambiguous matches only; fallback to Cari for ambiguous/unmapped titles.
6. [ ] Test permitted source integrations from search through chapter image using a finite rate-limited sample; document 403/429 cases honestly.
7. [ ] Test admin audit durability, custom source overrides, proxy signing and third-party service/archive claims; obtain rights/privacy signoff.

## Evidence to collect
Current: BLOCKED for MAL live, broad mapping and AniList permission; existing code is not proof. Required: verified terms/date, masked live config, 200 ranking trace, fixture match/mismatch, provider samples and legal approval.

## Open blockers
B-01 MAL preview credential, B-08 integrations/rights, B-09 mapping, B-11 AniList terms, B-10 Redis Preview config.

## Safety and rollback
Turn off optional source integration if unsafe/noncompliant; do not bypass rate limits or run scraper evasion; core reading remains functional.

## Required next action if work is interrupted
Begin with official terms/usage audit and isolated fixtures. Request owner action only for external registration, secrets and legal approval.

## Changes / tests / artifacts
- Code changes: **NONE** in this phase at planning creation.
- PRs implementing this phase: **NONE created under this planning checkpoint**.
- Tests executed during this phase: **NONE**; all tests in `../ACCEPTANCE_MATRIX.md` remain `NOT_RUN`.
- User-data, Redis records, deployment and environment configuration mutated: **NO**.
- Plan is in `../MASTER_PLAN.md` and `../PHASE_PLAN.md`; completion tracked in `../TRACKING.md`.

## Append-only execution log
- 2026-10-31 — DOCUMENTATION: phase scope, prerequisites, blockers, acceptance and continuation instruction drafted. This entry is **not a claim of implemented features or passed tests**.

### Handoff update template (append after *each* meaningful completed step)
```
YYYY-MM-DD HH:mm +07:00 | requirement IDs | branch | PR | exact SHA
CHANGE: actual files/behavior modified (or READ-ONLY evidence)
VERIFY: command/device/environment, actual outcome, evidence link; NOT_RUN cases
RISK/DECISION: approval, rollback, follow-up dependency
STATUS: PLANNED / IN_PROGRESS / IMPLEMENTED / VERIFIED / BLOCKED
NEXT: one concrete safe continuation step
```

- 2026-11-01 — READ-ONLY TERMS AUDIT: Official current AniList API terms, https://docs.anilist.co/guide/terms-of-use, explicitly prohibit using API as backup/storage or for mass collection and within competing non-complementary anime/manga list/tracker services; restriction extends to media data. Official rate-limit docs at https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/rate-limiting identify degraded **30 req/min** temporary cap and 429/Retry-After semantics (subject to change). Yomirra already uses AniList GraphQL as rating fallback at `src/app/api/metadata/rating-batch/route.ts`; this existing usage must be reviewed for terms compliance, not merely planned expansion. **Do not expand metadata/ranking or build a mass AniList mirror** until permitted-use decision/authorization. MAL absent/unmapped remains provider metadata with provenance/UNKNOWN warning planned, not fabricated AniList rank. No external API request made in this audit; no legal determination rendered. B-11 remains BLOCKED.
