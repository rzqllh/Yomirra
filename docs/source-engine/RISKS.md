# Source Engine V1 — Risk Register

---

## R-001: Domain Instability

**Risk:** Indonesian manga source domains change frequently (TLD changes, domain seizures, regional blocking).

**Likelihood:** HIGH — historically observed for multiple sources.

**Impact:** HIGH — hardcoded baseUrl breaks adapter, library items reference stale domain.

**Detection:** Source health check fails (`DOMAIN_CHANGED` / `SOURCE_DOWN`), user reports broken source.

**Mitigation:**
- Source identity by stable ID, not domain (D-001) — `IMPLEMENTED`
- Library items preserve `savedTitleId` and `linkedSources` — `IMPLEMENTED`
- Runtime domain resolution via `DomainResolver` (env override → cached domain → fallback mirror → bundled default) — `IMPLEMENTED` (Phase 3)
- Curated verified mirror list per source (e.g. `komikindo.ch` / `komikindo.cv`) with automatic mirror switching — `IMPLEMENTED` (Phase 3)
- Separation of frontend domain and backend API endpoints (e.g. Shinigami `api.shngm.io` vs `shinigami.asia`) — `IMPLEMENTED` (Phase 3)

**Current State:** Fully mitigated. Domain is dynamically resolved and cached. Fallback mirrors switch automatically without requiring code deployments or modifying user library identities.


---

## R-002: Upstream HTML Schema & Route Changes

**Risk:** HTML-based sources (Komikindo, Komiku) can change their URL routes or DOM structure at any time, breaking cheerio selectors or navigation routes while leaving the homepage/domain alive.

**Likelihood:** HIGH — observed in Komikindo September 2026 (`ROUTE_CHANGED`).

**Impact:** HIGH — adapter returns empty or incorrect data silently, or search route fails (404) while domain HTTP status is 200.

**Detection:**
- `PROPOSED`: Layered functional health checks (Transport vs Search vs Detail vs Chapters vs Pages vs CDN)
- **Observed Incident:** Komikindo homepage returned HTTP 200 while search route `/manga/page/{page}/` returned 404 redirect. A pure reachability check marked Komikindo "healthy" when search was 100% broken.
- `PROPOSED`: Parser and route validation (check for minimum expected fields/counts on deterministic probe queries)

**Mitigation:**
- Fixture-based parser and route regression tests (`ed6b21d`) — `PARTIALLY_IMPLEMENTED`
- Layered health probes in Phase 3 verifying functional stages rather than homepage HTTP 200 — `PHASE_3_TARGET`
- Structured machine-readable error codes (`ROUTE_CHANGED`, `PARSER_BROKEN`, `SCHEMA_CHANGED`) — `PHASE_3_TARGET`

**Current State:** Verified from real incident (`5f56ad9`). Pure HTTP 200 reachability checks are actively misleading for source health. Phase 3 health engine must test functional operations.


---

## R-003: Vercel Free-Tier Limits

**Risk:** Source adapter calls may exceed Vercel serverless function timeout (10s default, 60s max on free tier) or bandwidth limits.

**Likelihood:** MEDIUM — depends on source response times and aggregated search parallelism.

**Impact:** MEDIUM — timeout causes partial search results or failed detail loads.

**Detection:** API route returns 504 or function timeout error.

**Mitigation:**
- `HttpClient` has 10s timeout per request — `IMPLEMENTED`
- MangaDex has 15s timeout — `IMPLEMENTED`
- `PROPOSED`: Reduce timeout budget when running parallel source searches
- `PROPOSED`: Source-level timeout configuration

**Current State:** Individual request timeouts exist. Aggregated search may chain timeouts.

---

## R-004: Source Rate Limiting/Blocking

**Risk:** Sources may rate-limit or block Vercel's IP ranges.

**Likelihood:** MEDIUM — Vercel uses shared IPs. Multiple Yomirra instances share egress.

**Impact:** HIGH — entire source becomes unavailable.

**Detection:** HTTP 429, 403, or connection refused.

**Mitigation:**
- MangaDex throttle (token bucket) — `IMPLEMENTED`
- `PROPOSED`: Per-source rate limiting in HttpClient
- `PROPOSED`: Rate limit detection and backoff per source
- Redis-based caching reduces upstream requests — `IMPLEMENTED`

**Current State:** Only MangaDex has proper rate limiting. Other adapters have no throttling.

---

## R-005: User Progress Loss During Source Migration

**Risk:** When migrating a library title to a new source, chapter mapping may be incorrect, causing user to lose their reading position or be advanced to a wrong chapter.

**Likelihood:** MEDIUM — depends on chapter numbering consistency across sources.

**Impact:** CRITICAL — user trust violation. Reading progress is sacred.

**Detection:**
- `chapter-parser.ts` provides explicit `ChapterMapResult` with `exactMatch`/`nearestSafe`/`ambiguous` classification — `IMPLEMENTED`
- Dead source recovery UI shows chapter mapping result — `IMPLEMENTED`

**Mitigation:**
- Never silently advance progress — `DECISION` (from task requirements)
- `mapChapterProgress()` returns confidence-graded results — `IMPLEMENTED`
- `DeadSourceRecovery` component shows mapping details to user — `IMPLEMENTED`
- `relinkTitle()` preserves original source in `linkedSources` — `IMPLEMENTED`

**Current State:** Core mitigation exists. Needs testing with real cross-source scenarios.

---

## R-006: Canonical Dedupe False Positives

**Risk:** Title matching algorithm incorrectly merges distinct titles (e.g., "Demon King" vs "Demon King Rising").

**Likelihood:** MEDIUM — similar titles are common in manga.

**Impact:** MEDIUM — user sees wrong manga details/chapters after merge.

**Detection:**
- Confidence levels: CONFIRMED > HIGH_CONFIDENCE > AMBIGUOUS > NO_MATCH — `IMPLEMENTED`
- AMBIGUOUS results shown to user for manual confirmation — `IMPLEMENTED`

**Mitigation:**
- Heuristics never promote to CONFIRMED (only user action) — `IMPLEMENTED`
- Title + author matching improves confidence — `IMPLEMENTED`
- `PROPOSED`: Add year, chapter count, genre overlap as additional signals

**Current State:** Good foundation. Matching uses Levenshtein + Jaccard + containment. Tests exist.

---

## R-007: Cache Inconsistency

**Risk:** Redis cache serves stale data when source has updated content, or cache corruption.

**Likelihood:** LOW — cache has TTL.

**Impact:** LOW-MEDIUM — user sees outdated chapter list or detail.

**Detection:** User reports missing chapters.

**Mitigation:**
- Cache TTL (e.g., 24h for Komikindo filters) — `IMPLEMENTED`
- Cache key includes source ID — `IMPLEMENTED`
- `PROPOSED`: Cache invalidation on source health state change

**Current State:** Basic TTL caching implemented. No manual invalidation mechanism.

---

## R-008: SSRF via Dynamic Source Manifests

**Risk:** User-installed dynamic source manifests could point to internal network addresses.

**Likelihood:** LOW — requires user to install malicious manifest.

**Impact:** HIGH — SSRF could access internal services.

**Detection:** `safeFetch` blocks private IPs — `IMPLEMENTED`

**Mitigation:**
- `isSafeIp()` validates resolved IPs against RFC 1918 and other private ranges — `IMPLEMENTED`
- Redirect following is bounded (max 5) — `IMPLEMENTED`
- URL credential rejection — `IMPLEMENTED`
- Protocol validation (http/https only) — `IMPLEMENTED`
- Source manager rejects manifests that try to impersonate built-in source IDs — `IMPLEMENTED`

**Current State:** Strong mitigation. Tested.

---

## R-009: Image Hotlink Restrictions

**Risk:** Source CDNs may block direct image loading from Yomirra's domain (referer checking, token requirements).

**Likelihood:** HIGH — common practice.

**Impact:** HIGH — reader shows broken images.

**Detection:** Images fail to load in reader.

**Mitigation:**
- `PageItem.referer` field for source-specific referer — `IMPLEMENTED`
- Image proxy at `/api/proxy/image` with HMAC signature — `IMPLEMENTED`
- `MangaCover` component uses `referrerPolicy="no-referrer"` — `IMPLEMENTED`

**Current State:** Working for current sources. New sources may need proxy.

---

## R-010: KomikNesia Encrypted API Responses

**Risk:** KomikNesia wraps its API responses in an AES-256-CBC encrypted envelope (`{ status: true, encrypted: true, data: "<base64>", time: <number> }`).

**Likelihood:** HIGH — confirmed via live API probing (`VERIFIED_FROM_SOURCE`).

**Impact:** HIGH — adapter cannot read any content without decryption logic.

**Detection:** API returns `encrypted: true` with a base64 payload.

**Mitigation:**
- Decryption algorithm verified and tested using native Node.js `crypto.createDecipheriv('aes-256-cbc', ...)` — `VERIFIED_FROM_SOURCE`
- Key derivation and IV extraction implemented directly in adapter without third-party crypto dependencies — `VERIFIED_FROM_SOURCE`
- Required headers (`Referer: https://komiknesia.site/`, `X-Device-Id`, `User-Agent`) sent on all requests — `VERIFIED_FROM_SOURCE`

**Current State:** Decryption protocol completely reverse-engineered and verified. Ready for adapter implementation.

---

## R-011: Migration Failures

**Risk:** Schema migration (e.g., canonical migration V0→V1) fails mid-execution, leaving data in inconsistent state.

**Likelihood:** LOW — migration is additive, not destructive.

**Impact:** MEDIUM — some library items may lack canonical identity.

**Detection:** `canonical-migration.ts` catches errors and logs them — `IMPLEMENTED`

**Mitigation:**
- Migration is additive (preserves legacy keys) — `IMPLEMENTED`
- `schemaVersion` field on migrated items — `IMPLEMENTED`
- `PROPOSED`: Migration rollback/retry mechanism

**Current State:** Staged backfill is implemented and non-destructive.

---

## R-012: Asura Scans Locked Content / API Schema Drift

**Risk:** Asura Scans serves clean WebP CDN images with zero image scrambling (`VERIFIED_FROM_SOURCE`). However, early-access/premium chapters return `is_locked: true` and have no page array in the payload. Trying to parse pages on locked chapters or handling sudden schema changes could break the reader.

**Likelihood:** MEDIUM — early-access chapters are released regularly.

**Impact:** MEDIUM — empty reader or runtime exception if locked chapters are treated as playable.

**Detection:** Upstream chapter response has `is_locked: true` and `pages: undefined`.

**Mitigation:**
- Adapter explicitly checks `is_locked` status and flags chapters accordingly — `VERIFIED_FROM_SOURCE`
- Never bypass or attempt to crack paywalled content — `DECISION` (strictly respect content boundary)
- Reader flow filters out or displays locked indicator for unreleased chapters — `PROPOSED`

**Current State:** Verified via live API probing. Paywall boundary cleanly defined and documented.

---

## R-013: Silent Reading Progress Drift / Accidental Chapter Advancement

**Risk:** During automated source fallback, mapping algorithms might silently advance a user's reading progress to a higher chapter number (e.g., user read 57.5, and the system auto-selects chapter 58 because chapter 57.5 is missing from the target source).

**Likelihood:** MEDIUM — scanlation naming discrepancies and decimal/special chapter gaps are common.

**Impact:** CRITICAL — user trust is broken if spoilers or skipped content occur due to silent progress advancement.

**Detection:** Automated tests assert that target chapter number is never greater than lastReadNumber under automatic fallback.

**Mitigation:**
- Strict `No-Forward-Jump` invariant: `findNearestSafeChapter` strictly selects the nearest chapter $\le$ lastReadNumber.
- Non-exact chapter mappings (`PROBABLE`, `AMBIGUOUS`, `UNMAPPED`) strictly require explicit user confirmation (`CONFIRM_REQUIRED`).
- Automatic fallback (`AUTO_SAFE`) is strictly limited to exact chapter matches (`EXACT`).

**Current State:** Fully mitigated and verified in Phase 5 (`source-fallback.test.ts`).

---

## R-014: Page Position Divergence Across Scanlations

**Risk:** Different scanlations have divergent page counts, splash/credit spreads, and split orientations. Blindly copying `pageIndex` (e.g., page 18 from Source A to Source B) causes the reader to open at the wrong scene or throw index out-of-bounds.

**Likelihood:** HIGH — different scanlation teams format images differently.

**Impact:** MEDIUM — disorienting user experience on source switch.

**Detection:** Reader opens at incorrect page or fails to render.

**Mitigation:**
- Target source `pageIndex` is ALWAYS reset to 0 (start of chapter) upon source switch.
- Original `pageIndex` is preserved in `SourceMigrationSnapshot` for provenance, auditability, and rollback.

**Current State:** Fully mitigated and verified in Phase 5 (`source-fallback.test.ts`).

