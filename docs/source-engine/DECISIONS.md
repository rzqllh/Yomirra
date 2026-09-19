# Source Engine V1 — Architecture Decision Records

---

## D-001: Source Identity by Stable ID, Not Domain

**Decision:** Each source is identified by a stable string ID (e.g. `shinigami`, `komiku`) rather than its frontend domain.

**Reason:** Frontend domains change frequently for Indonesian manga sites. Library items, reading progress, and user data must survive domain changes.

**Alternatives considered:**
- Domain-based identity — rejected because domain changes would invalidate user library entries.
- UUID-based identity — rejected as unnecessarily opaque for internal-only sources.

**Evidence:**
- Existing repo already uses stable IDs (`VERIFIED_FROM_REPO`: source-registry.ts, adapters/index.ts).
- Shinigami domain has already changed historically (shinigami.asia → c.shinigami.asia) (`INFERRED`).

**Consequences:** Domain resolution must be a separate runtime concern. Source health checks must use resolved domains.

**Status:** ACTIVE — already implemented in current architecture.

---

## D-002: Adapters Compiled with Yomirra, Not Dynamic Plugins

**Decision:** Source adapters are compiled TypeScript modules shipped with Yomirra, not remotely loaded plugins.

**Reason:** Security (no arbitrary remote code execution), reliability (no runtime fetch failures for adapter code), and V1 simplicity.

**Alternatives considered:**
- Remote plugin system — rejected for V1 due to SSRF risk and complexity.
- Dynamic manifest adapters — exists as Option B for JSON-compatible sources (preserved).

**Evidence:**
- Current architecture already follows this pattern (`VERIFIED_FROM_REPO`).
- Dynamic manifest system exists but is limited to JSON-compatible sources (`VERIFIED_FROM_REPO`).

**Consequences:** Adding a new source requires a code change and deployment. This is acceptable for V1.

**Status:** ACTIVE

---

## D-003: Preserve Existing MangaSource Interface During V1

**Decision:** The existing `MangaSource` interface in `source-types.ts` will be extended, not replaced.

**Reason:**
- 4 working adapters (Shinigami, Komikindo, MangaDex, Komiku) depend on it.
- API routes use it.
- Dynamic source adapter uses it.
- Breaking the interface would break deployed behavior.

**Alternatives considered:**
- New `SourceAdapterV1` interface from scratch — rejected because migration risk is too high for a deployed application.
- Parallel interface with adapter wrapper — possible future approach after V1 stabilizes.

**Evidence:**
- `MangaSource` interface used in `source-manager.ts`, API routes, adapter index (`VERIFIED_FROM_REPO`).
- 58 test files / 298 tests depend on current architecture (`VERIFIED_FROM_REPO`).

**Consequences:** New capabilities (like `multiLanguage`, `auth`, `related`) will be added as optional fields/methods. Existing adapters don't need to implement them.

**Status:** ACTIVE

---

## D-004: Library Item Canonical Identity (Phase 1 Already Implemented)

**Decision:** Library items have a `SavedTitleId` (canonical identity) with `linkedSources[]` for cross-source binding.

**Reason:** Enables source fallback without losing library data.

**Alternatives considered:**
- Source-locked library items only — this was the original V0 approach. Still the key format (`sourceId::mangaId`) but now with canonical overlay.

**Evidence:**
- `LibraryItem.id` (SavedTitleId), `schemaVersion: 2`, `primarySourceId`, `linkedSources[]` already exist (`VERIFIED_FROM_REPO`).
- `SourceRef` type with `matchConfidence` levels: `CONFIRMED`, `HIGH_CONFIDENCE`, `AMBIGUOUS`, `NO_MATCH` (`VERIFIED_FROM_REPO`).
- `relinkTitle()` action exists for switching primary source (`VERIFIED_FROM_REPO`).
- `resolveBySourceRef()` for cross-source lookup (`VERIFIED_FROM_REPO`).
- `canonical-migration.ts` handles staged backfill (`VERIFIED_FROM_REPO`).

**Consequences:** New sources automatically benefit from the existing canonical identity system. Title matching via `title-matcher.ts` is already operational.

**Status:** ACTIVE — Phase 1 identity is deployed.

---

## D-005: Vercel Runtime — No VPS Dependency

**Decision:** Source Engine V1 must run entirely on Vercel's serverless/edge runtime.

**Reason:** Yomirra is deployed on Vercel. No VPS budget or infrastructure is available.

**Alternatives considered:**
- Dedicated VPS for source proxying — rejected due to cost and operational burden.
- Cloudflare Workers — not evaluated for V1.

**Evidence:**
- Vercel deployment config exists (`.vercel/` directory) (`VERIFIED_FROM_REPO`).
- Redis via Upstash (serverless-compatible) (`VERIFIED_FROM_REPO`).

**Consequences:**
- Serverless execution boundary: no persistent background workers or perpetual daemon processes.
- Request-triggered health checks are allowed (lazy validation on access).
- Lightweight scheduled Vercel Cron checks are allowed (e.g. periodic ping to detect domain drift), free-tier aware and bounded.
- Aggressive polling is strictly prohibited to avoid invocation exhaustion, function timeouts, and upstream IP bans.
- Image proxying must be lightweight or avoided where sources allow direct CDN loading.

**Status:** ACTIVE

---

## D-006: SSRF Protection via safeFetch

**Decision:** All outbound HTTP requests from adapters go through `safeFetch()` which validates resolved IPs against private ranges.

**Reason:** Prevents SSRF attacks if adapters receive user-controlled URLs.

**Evidence:**
- `outbound-policy.ts` implements `isSafeIp()` and `safeFetch()` (`VERIFIED_FROM_REPO`).
- `HttpClient` base class uses `safeFetch` (`VERIFIED_FROM_REPO`).
- Tests exist for outbound policy (`VERIFIED_FROM_REPO`).

**Consequences:** New adapters MUST use `HttpClient` or `safeFetch`. Direct `fetch()` calls bypass security.

**Status:** ACTIVE

**Note:** MangaDex adapter uses direct `fetch()` instead of `safeFetch` — see D-006-NOTE below.

### D-006-NOTE: MangaDex Uses Direct fetch()

**Observation:** `mdFetch()` in the MangaDex adapter calls `fetch()` directly, not `safeFetch()`.

**Impact:** Low risk because MangaDex API URL is hardcoded (`https://api.mangadex.org`) and not user-controlled. However, this is an inconsistency with the security policy.

**Evidence:** `VERIFIED_FROM_REPO` — mangadex/index.ts line 78.

**Recommended Action:** Evaluate migrating `mdFetch` to use `safeFetch` for consistency, but do not block on this for V1.

---

## D-007: Reading Progress Tied to sourceId::mangaId::chapterId

**Decision (current state):** History entries are keyed by `${sourceId}::${mangaId}::${chapterId}`.

**Reason:** This was the V0 design. It works but makes source migration lossy.

**Evidence:**
- `HistoryItem` stores `sourceId`, `mangaId`, `chapterId` as primary keys (`VERIFIED_FROM_REPO`).
- `savedTitleId` and `chapterNumber` are optional denormalized fields (`VERIFIED_FROM_REPO`).
- `resolveSavedTitleId()` can recover canonical identity (`VERIFIED_FROM_REPO`).
- `chapter-parser.ts` provides `mapChapterProgress()` for cross-source chapter mapping (`VERIFIED_FROM_REPO`).

**Consequences for V1:**
- Progress is recoverable during source migration via `savedTitleId` + `chapterNumber`.
- Exact page position within a chapter may not map across sources.
- The `mapChapterProgress` function handles: exact match, nearest safe candidate, ambiguous cases (`VERIFIED_FROM_REPO`).

**Status:** ACTIVE — V0 key format preserved with V1 recovery overlay.

---

## D-008: MangaDex Unified Source with Language Filter

**Decision:** MangaDex remains a single unified source (`mangadex`) with an ID/EN language preference filter, rather than being split into separate `mangadex-id` and `mangadex-en` adapters.

**Reason:** Preserves existing user libraries, prevents UI catalog clutter, and aligns with MangaDex's native multi-language feed capabilities.

**Status:** ACTIVE

---

## D-009: Search Scope & Canonical Deduplication

**Decision:**
1. **Global Search:** Executes across selected sources in parallel (`selected sources → parallel search → normalize → canonical dedupe`). Equivalent cross-source titles are deduplicated canonically using `title-matcher.ts` so users see unified title cards with source availability indicators.
2. **Library Search:** Strictly scoped to the user's local saved library items. Alternate-source discovery is an explicit, separate recovery action.

**Reason:** Eliminates multi-source clutter in global search while keeping library search instant and deterministic.

**Status:** ACTIVE

---

## D-010: Source Fallback & Reading Progress Discipline

**Decision:**
1. When an active source becomes unavailable, automatic fallback to a high-confidence or previously confirmed alternate source is permitted, accompanied by an explicit in-app notification.
2. If chapter mapping or title match is ambiguous, Yomirra must prompt the user for confirmation.
3. **Sacred Reading Progress:** The engine must NEVER silently advance reading progress. If mapping certainty cannot be established, halt and ask the user.

**Reason:** User trust in reading progress and history accuracy is non-negotiable.

**Status:** ACTIVE

---

## D-011: New Source Implementation Priority

**Decision:** New sources will be implemented and shipped in the following sequence:
1. `Komiku II` (`01.komiku.asia/api/v2`): Direct REST JSON API, no encryption, fast time-to-market.
2. `Asura Scans` (`api.asurascans.com/api`): Direct REST JSON API, direct WebP CDN, explicit `is_locked` paywall handling.
3. `KomikNesia` (`api-be.komiknesia.my.id/api`): Native AES-256-CBC decrypt transform, embedded chapters list.

**Status:** ACTIVE
