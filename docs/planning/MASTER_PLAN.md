# Yomirra — MASTER PLAN
Version: 1.0-planning | Date: 2026-10-31 (Asia/Jakarta)
Status: CONTRACT APPROVED FOR STAGED EXECUTION; implementation, tests and release are **not automatically verified**
Target: `rzqllh/Yomirra`, baseline `preview@02cc664be8c66664ffe9628fcaa68523322f3ce0`
Owner: product owner | Engineering: phase assignee (TBD) | QA: independent verifier (TBD)

> Scope: **ALL Yomirra project plans**, not only the newest UX requests. This document is the consolidated execution index. Historic Q1–Q175 in [GRILL_FINAL_LEDGER](../GRILL_FINAL_LEDGER.md) remain applicable unless explicitly superseded below. Technical detail references in `docs/ARCHITECTURE.md`, `docs/IDENTITY.md`, `docs/READING_DATA.md`, `docs/DESIGN.md`, `docs/TESTING.md`, `docs/PREVIEW_BLOCKERS_AND_RUNBOOK.md`, `docs/YOMIRRA_FULL_PARITY_EXECUTION.md` remain evidence/requirements, not automatic PASS declarations. A conflict must be added to TRACKING as OPEN and resolved before editing behavior.

## 1. Product vision, users and experience

Yomirra is an iOS-first, responsive, local-first PWA for discovering, tracking and reading comics from curated providers. The core experience is **find a work → choose a working source → read → resume without losing progress**, not a collection of provider search-result duplicates. Guest browsing and reading remain first class; accounts add optional synchronization. Manga/manhwa/manhua are grouped under the user-facing term **komik**. Favor honest, fast, uncluttered Indonesian copy, clearly bounded motion, accessible controls, real offline feedback and explicit error recovery.

### Nonnegotiable priorities
1. Data correctness before animations: no false work merges, phantom completion, wrong-chapter navigation, cross-user leakage or destructive background migration.
2. Safety before freshness: confirmed adult-only sources/titles remain hidden when `Tampilkan NSFW` is OFF, including cached detail/Reader; `UNKNOWN` titles visibly warn and are not falsely labeled safe.
3. Source independence: a 403/429/timeout in one provider does not erase healthy results, mislabel the provider as healthy or silently bypass upstream rate limits.
4. Client continuity: cached content first when valid, local-first reading progress, stable Back/Forward history/scroll, actionable fallback.
5. Evidence before release: exact SHA, PR, CI, browser, live integrations, physical device, rights and security gates.

## 2. Contract authority and implementation permissions

- **LOCKED (owner-approved):** all specifically enumerated decisions below, plus Q1–Q175 as amended by current owner messages.
- **PROPOSED:** implementation details, initial TTLs, matching thresholds and performance budgets require validation; not invented owner decisions.
- **OPEN/BLOCKED:** provider licensing, live credentials, physical device tests, canonical migration, automatic MAL identity equivalence, exact live Redis/Preview validation.
- Current instruction authorizes staged work, **documentation first and handoffs after every completed step**. Plan-only commits to an isolated docs branch are safe; production promotion, paid upgrades, external account registration/terms, legal-policy changes, deletion of branches or user data, security-policy/secret changes and irreversible migration require separate explicit approval.
- Use small scoped PRs; no force push; do not treat CI green as deployed/live/verified. Preview must not trigger unintended production. No dependency or architectural migration merely for novelty.
- Skills referenced by owner (anti-slop, impeccable, hallmark, ui-ux-pro-max, taste, Superpowers, Xyeena Rig) are **advisory** unless actually installed. One orchestration governor only: Xyeena-inspired evidence → scope → craft → commit → verify; Superpowers methods may inform testing but must not run as a parallel authority.

## 3. Product information architecture / routing

| User-facing destination | Existing/target route | Invariants |
| --- | --- | --- |
| Beranda | `/` | Valid history: Continue Reading first; otherwise discovery-first. Failure cannot remove the entire Home shell or global Quick Search. |
| Jelajah | `/library` | Provider-scoped browsing with its own active source/filter/page; do not pretend single-source results have multiple provider bindings. |
| Cari | `/search` | Independent chosen provider set; aggregate equivalent works into one card when identity confidence is sufficient. Explicit zero-source state valid. |
| Populer | existing route `/popular` | Provider-neutral ranking copy; MAL popularity attributed to MAL; no fabricated combined rank. Canonical aggregation when merging trustworthy. |
| Library (saved) | `/bookmark` | Local-first saved titles/collections, reading status/history; source provenance preserved. |
| Detail | `/manga/[sourceId]/[mangaId]` | Source-specific detail accessed after source selection; retain existing URLs and history compatibility. |
| Reader | existing `/manga/[sourceId]/[mangaId]/read/[chapterId]` | Distinct Back to Detail and Home, resume, progress/dots/zoom and safe content boundary. |
| Settings | `/settings` | Only functioning settings; clarify preferred chapter languages vs unsupported UI locale. |
| Pusat Bantuan | **new** `/help` | Genuine standalone page and route, not `/settings#about`. |
| Downloads / Updates / Account / Admin | existing routes | Their existing security, persistence and accessibility contracts remain; audit rather than replace. |

Quick Search follows the active eligible source in Jelajah; full Cari has its own provider choices. Do not add an unrequested second source picker inside Quick Search. Responsive tablet, mobile browser UI, installed PWA and desktop must preserve navigation semantics.

## 4. Work identity, deduplication and source selection (CAT-01–CAT-15)

### Canonical domain
- **Work**: durable, stable canonical ID for the underlying edition/work where equivalence has been verified.
- **ProviderBinding**: `{sourceId, mangaId, language, edition, health, chapters}`, linked to a Work without discarding original source identifiers.
- **PersonalSavedTitle / ReadingCursor / Milestone / Downloads**: user-owned and retain exact provider + chapter provenance; never equate chapter numbers across providers without verified mapping.
- Catalog cards show **one work and N available eligible sources**, counted by *unique provider bindings* with valid source visibility, not by raw duplicate rows. When match confidence is uncertain, keep separate cards; false merging is worse than a temporary duplicate.
- Use trusted external IDs (MAL/eligible AniList etc. only with rights/terms verification), original/alternative titles, author, work type/edition, year and supporting evidence. Similarity alone is insufficient for automatic binding. Record match provenance, confidence, versions and override/review state. Existing `clusterCanonicalResults()` is a starting point, **not** proof of stable cross-page identity.
- All aggregate surfaces (Cari, genuinely aggregated feeds) obey canonical dedupe. A deliberately source-scoped Jelajah page shows the selected provider's items without inventing cross-provider availability; a work may show verified cross-links when known.
- **Source-choice cardinality (owner locked 2026-11-01):** exactly one eligible provider binding opens its exact `sourceId/mangaId` detail directly without a picker; two or more eligible bindings **must** open a source picker, never silently choose. In that picker, the last-used source is pinned first **only when recently healthy**; other sources follow observed health, and unknown health must never be labeled healthy. With zero eligible bindings, keep the work card identifiable but block invalid navigation and show `Tidak Tersedia` plus an explicit recovery path where supported. Count only unique eligible bindings after visibility/policy filtering. Never infer working chapter access from a healthy listing probe.
- A work with a known previously selected source that degrades must show a clear alternative choice, not silently relocate the reader or transfer milestones. No auto-migration without reversible evidence.
- Canonical identity lives in durable authoritative storage appropriate for mappings; Redis search indexes are acceleration only. Review reuse of existing saved-title identity layer before introducing schema/tables. Do not choose Supabase/Firebase schema changes until separately approved.

### Completion
- `CAT-01..CAT-15` cover single-card dedupe, false merge rejection, picker, unique source counts, health ordering, last-used preference, zero/one/multiple source routing, source URL fidelity, safety, cache, persistence and fallback. Tests need cross-page, cross-session and different-adaptation fixtures.

## 5. Content classification contract (NS/SAFE)

- Settings label **`Tampilkan NSFW`**, default **OFF**; persisted implementation can keep internal `hideNsfw=true` if UI polarity is correctly inverted. Existing user overrides persist unless an explicit migration is approved. Toggle semantics tested after refresh, login/logout and offline.
- Classification: `SAFE`, `NSFW`, `UNKNOWN`; include provenance/confidence/checkedAt. Confirmed NSFW source and confirmed NSFW content excluded when toggle OFF (Home, Jelajah, Cari, Populer, recommendations, Quick Search, filter tag/options, detail, Reader, bookmarks, downloads presentation and cache display). Unknown **may appear with explicit `Rating belum terverifikasi` warning**. Never label missing metadata as safe.
- Unknown source != known adult-only source. A mixed provider needs per-work classification; generic tags such as Yaoi/Yuri/Gore cannot be blanket-equated to NSFW without reliable rating classification. Adult-specific filter terms must not leak through stale selected query state while OFF.
- Switching from ON→OFF immediately refilters **browser query results, PWA/service-worker cached metadata, covers, recommendations, mounted detail/Reader and saved-item lists**; no destructive deletion of personal data. Direct APIs must enforce effective preference consistently; URL parameters must not silently override user intent.
- **OWNER-RESOLVED 2026-11-01 (Issue #101):** general-provider `UNKNOWN` or missing rating may appear **only with an explicit `Rating belum terverifikasi` warning** and without exposing unreviewed cover/Reader images before acknowledgement; confirmed restricted titles/sources remain hidden while NSFW OFF. MAL popularity remains **strict `nsfw=white`** while OFF: `gray/black/unknown` are never treated as safe. Retire automatic legacy Library/History NSFW patching; render-time source gates must not write or delete saved user data. Any actual migration still needs isolated backup/restore and separate approval. Implementation/acceptance of all surfaces is staged, not presumed complete.
- Never claim the default OFF setting guarantees zero adult content from misclassified/unknown upstream sources. Provide classification correction/reporting path.

## 6. Metadata, popularity and third-party boundaries (META)

- Existing MAL ranking endpoint `/api/metadata/mal/popular` uses MAL v2 `bypopularity`, requires server-only `MAL_CLIENT_ID` on Preview; absence is `503 MAL_NOT_CONFIGURED`, not “0 popular works”. Keep MAL ranks/snapshot/member counts sourced and attributed.
- Existing `/api/metadata/rating-batch` tries MangaDex first and **already uses AniList GraphQL rating fallback**. Do not duplicate this integration. Expose rating provenance and avoid presenting normalized scores as numerically equivalent without a source label.
- Broader AniList metadata, `idMal` mapping or ranking fallback is **CONDITIONAL** until AniList rate limits, terms, competing-tracker restrictions, privacy, and caching permissions are verified. Redis reduces traffic but does not waive licensing. MAL unavailable/absent: provider metadata remains usable; unknown stays unknown with warning.
- Verified MAL–provider mapping uses trusted IDs and edition/language evidence; ambiguous entries go to explicit Cari/source selection. Never fabricate reading availability, chapter identity or rank. Separate MAL popular from AniList popular by source label if later authorized.
- Content rights, takedown/report process, source adapter licensing and publication policy remain release gates. No proxying around upstream access controls, provider anti-bot walls, premium or DRM restrictions.

## 7. Redis, browser cache and health (CACHE/ENV/DATA/SEC)

### What already exists — do not reinstall
- `ioredis` with `REDIS_URL` at `src/server/lib/cache/redis.ts`.
- `withCache()` in `redis-cache.ts`: SEARCH logical 1h, DISCOVERY 30m, DETAIL 24h, CHAPTERS 30m, PAGES default 7d; Redis entries have fixed 7-day retention and optional stale fallback. Review per-domain stale policy; short-lived signed MangaDex page URLs already have a 300s exception.
- `semantic-catalog.ts` Redis record index, source health snapshots, custom providers and overrides, site config, audit log, domain state, admin tools, and Redis-backed limiter. These are **not all disposable cache keys**.
- Browser TanStack Query and Serwist/PWA caches, reading buffer and explicit downloads are distinct cache/storage layers. Cache-first Back navigation is a client concern as well as a server concern.
- Vercel config review: `REDIS_URL` was listed with target `production`, no Preview-scoped entry observed as of the audit. **B-10**: verify effective Preview Redis runtime (without exposing values), create isolated Preview config only with separate owner security/secret approval; never reuse live production Redis database or credentials.
- Admin redis telemetry currently scans `yomirra:*` while source cache uses `source:*` and ratings `rating:*`; reported key total can be incomplete. `admin-redis-service.ts` uses `KEYS` despite a separate SCAN helper existing in custom-source service.
- Redis unavailable: public reader may degrade with rate-limited provider fallback, but privileged writes must remain fail-closed. Do not return a false PASS or claim in-memory source state durable. Verify site maintenance/disable override fallback behavior.
- Protect durable operational namespaces (`yomirra:site:`, `yomirra:sources:custom:`, overrides, admin audit etc.) from wildcard cache flush. Require scoped cache purge and explicit confirmation for destructive Redis operations.
- Redis cache key must include environment, schema/policy version, provider adapter fingerprint, query/filter, content mode, language and user/UID when personal; never share auth tokens, private history or credential-bearing responses.
- `/api/health` currently probes all enabled providers synchronously on request; separate liveness/readiness from scheduled deep provider probe; avoid a health monitor itself becoming a traffic amplifier.
- No blind global cache purge or overlong stale fallback. Implement request coalescing with bounded concurrency if tests establish a cache stampede; validate 403/429 Retry-After, quotas and backoff.
- Initial TTL table is a hypothesis for benchmarking, not a locked number: search 5–15m; detail 6–24h; popularity 30–60m; health 1–5m; chapters 10–30m; short-lived 403/empty 1–2m; signed page URL up to actual expiration. Preserve explicit offline downloads.
- Measure Redis hit/miss, p95 end-to-end latency, function invocations, request count per provider, error rate, stale served, key count across namespaces, eviction, memory pressure, client cache hits and offline availability. Record before/after on the exact tested SHA.

## 8. Reader, user state and sync (RD/DATA)

- Separate `lastReadCursor` (chapter + page + time, including rereads), `highestVerifiedMilestone` and `completedChapter` evidence. Opening, skipping or scrubber drag alone never completes a chapter; failed image cannot produce completion.
- Rereading chapter N must not downgrade milestone M>N. Explicit manual reset must not be mistaken for a sync conflict. Chapter identity verified before any cross-source continuity.
- Existing progress slider near bottom with draggable page dots, Back to Detail + Back to Home, contextual panels, double-tap-to-zoom setting, pinch behavior, RTL/long-strip and keyboard/VoiceOver support must be regression tested rather than recreated.
- Local-first durability, delayed cloud writes, offline retry, per-UID isolation, guest/account merge preview, conflict/tombstone precedence, versioned backup and downloadable content verification follow `docs/READING_DATA.md`. Historical 512 detailed-record retention plus per-work summaries still applies; no arbitrary age purge.
- Notification: only real events, deduped toasts, chapter update subscription preferences, four distinct eligible chapter completions trigger a one-time bookmark invitation; no nag on existing bookmarked work. Do not claim OS background push supported without verification.
- No migrations or bulk NSFW reclassification of existing history without backup, isolated tests, reversible plan and user approval. Sync from UID A to UID B is a P0 reject condition.

## 9. UX/CX implementation contract (UX/HOME/FL/PF/PR/DS)

### Screen hierarchy and behavior
- Home: with eligible local history → Continue Reading primary, personalized updates next, discovery below; new user → discovery primary. User can reach a valid next chapter or last cursor in minimal steps; do not recommend a chapter as available without checking.
- Search: distinguish no query, no source selected, loading, no results, partial results, all providers down, offline cached result, restricted results and recoverable provider error. Collapse repeated provider banners into one status with expandable details and per-source retry.
- Filter sheet: fixed header/body scroll/fixed footer, real iOS browser safe area and virtual keyboard; `Terapkan` commits draft, `Batal` discards draft, `Reset` resets draft (not immediately applied); desktop panel retains similar semantics. Cover 52%/92% Vaul snaps.
- Navigation: Back returns prior route/filter/scroll; explicit Home always lands `/`; detail backward destination unambiguous; cached data renders without waiting for API when valid, stale content labeled and refreshed as needed. Do not disable legitimate source-config invalidation.
- Bookmark: one-tap save (idempotent); status and collections as secondary action; no accidental unsave via reminder. Clear sync vs local save confirmation.
- Reader: controls discoverable but quiet; no hidden crucial action; progressive disclosure, large touch targets, no loss of gesture priority; resume and interruption recovery.
- PWA/downloads: show what is *actually* stored, page coverage/size, quota and missing pages; do not imply a downloaded chapter is fully offline when some pages failed.
- Settings: no unfinished gimmick like unsupported “Bahasa UI” or false help hash; real preferred chapter language setting remains with honest label. `/help` includes FAQ, source failures, account/sync, offline, Reader controls, NSFW warning and route-specific recovery.
- Notifications and microcopy: event-based, cooldown, neutral, actionable, not spammy. Provider outages do not flood 4 duplicate danger banners.

### Design quality
- Use semantic radius/spacing/border/shadow/elevation/type/motion tokens consistently; preserve brand art direction with functional-page-first layout. Reuse existing Phosphor icon family; do not install overlapping design governors or new dependencies by default.
- Audit light/dark, iPhone small/large, iPad portrait/landscape/Split View, desktop, reduced motion, dynamic type, 200% zoom, VoiceOver and keyboard. iOS Safari toolbar/visualViewport/safe-area tests are physical-device gate.
- Match real state and accessible copy; no “Sehat” badges based only on static metadata or non-deep probe.

## 10. Other existing product capabilities kept in scope

Existing import/export, CBZ/archive, download queue, Smart Collections, account/guest merge, updates, source management, mirrors, AI search/ranking (optional and privacy-bounded), admin controls, telemetry, legal/takedown and third-party integrations must be reconciled against current tests and historical Q1–Q175; they are **not** assumed complete or authorized for silent rewrite. See [PHASE_PLAN](PHASE_PLAN.md) Phase 02/04/06/07 and [TRACKING](TRACKING.md) with explicit deferred/integration gates.

## 11. Delivery & acceptance

- The 8 phases are defined in [PHASE_PLAN.md](PHASE_PLAN.md); IDs map to evidence in [ACCEPTANCE_MATRIX.md](ACCEPTANCE_MATRIX.md) and status in [TRACKING.md](TRACKING.md). Each `handoffs/PHASE_XX_HANDOFF.md` is append-only for actual execution history; correct errors with a dated correction, not retroactive PASS.
- A requirement can be `PLANNED`, `IN_PROGRESS`, `IMPLEMENTED`, `BLOCKED`, `VERIFIED`, or `DEFERRED`. Only independent tests on the exact SHA can grant VERIFIED. No synthetic green tests.
- Release gates: A contract, B code/unit/typecheck/lint/build, C browser/a11y/security, D exact-SHA Preview live, E iOS PWA + isolated Firebase/UID + content rights, F owner production approval and rollback.
- Each change batch records: branch, PR, exact SHA, changed files, tests executed+results, live runtime result, failing cases, blocker/owner, rollback and next action. Commit handoff at each meaningful stage; no “will do” as completed.
- `main` and production untouched until separate release approval. Vercel quota HTTP 402 is a BLOCKED deployment gate, not license to evade quota or upgrade billing.
- Known open gates B-01–B-11 tracked in `TRACKING.md`: MAL config, physical devices, Firebase, legacy data, Reader, deploy quota/exact SHA, background push, third-party integration/legal, MAL mapping, isolated Preview Redis, AniList terms. Blockers are evaluated from fresh evidence, not inherited forever from old reports.

## 12. Definition of done

**Feature done:** acceptance case passes on exact commit with evidence, accessible/mobile UX reviewed, content guard/data invariant preserved, docs/handoff updated and rollback feasible.
**Phase done:** all mandatory phase IDs VERIFIED or owner-accepted explicit deferrals, dependent gates passed, PR merged to intended safe target, no hidden failures, handoff signed.
**Release done:** exact `main` SHA deployed to production by approved action, all mandatory live gates passed, owner approves release, rollback and operational alerts tested, content/legal/privacy claims truthful. Documentation-only progress never counts as release.
