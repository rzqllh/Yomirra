# Source Engine V1 — Implementation Plan

---

## Phase 0: Audit & Research (COMPLETE)

**Objective:** Map existing architecture, research target sources, identify gaps, establish tracking.

**Affected Modules:** None (documentation only).

**Dependencies:** None.

**Migration Impact:** None.

**Exit Criteria:**
- [x] Repository audit complete
- [x] Existing adapters documented (4/4: Shinigami, Komikindo, MangaDex, Komiku)
- [x] Existing canonical identity system documented
- [x] Existing health, title-matching, chapter-mapping systems documented
- [x] Tracking docs created (README, STATUS, PLAN, DECISIONS, RISKS, SOURCE_RESEARCH)
- [x] Test baseline recorded (58 files, 298 tests, all passing)
- [x] New source research probed (Komiku II, KomikNesia, Asura Scans)
- [x] Product decisions resolved (see Resolved Product Decisions below)

**Rollback:** N/A — documentation only.

---

## Phase 1: Contract Extension & Source Infrastructure (CURRENT)

**Objective:** Extend `MangaSource` interface with optional V1 capabilities without breaking existing adapters. Strengthen `HttpClient` with per-source config.

**Affected Modules:**
- `src/shared/sources/source-types.ts` — extend interface
- `src/shared/sources/source-capabilities.ts` — add optional capabilities
- `src/server/lib/sources/adapters/base/http-client.ts` — add source-scoped config
- `src/shared/sources/source-registry.ts` — add new source metadata entries
- `src/server/lib/sources/source-manager.ts` — adapt for new sources
- `src/server/lib/security/outbound-policy.ts` — review for new source hosts

**Dependencies:** Phase 0 complete, product decisions resolved.

**Migration Impact:** None — all changes additive. Existing adapters continue to work unchanged.

**Tests Required:**
- Contract extension does not break existing adapter type compliance
- New capability fields default safely
- HttpClient config changes don't affect existing adapter behavior
- Typecheck passes
- All 298 existing tests pass

**Exit Criteria:**
- Extended interface compiles
- All existing tests pass
- New source metadata entries in registry
- No behavioral change to deployed app

**Rollback:** Revert extension additions. Zero risk.

---

## Phase 2: New Source Adapters

**Objective:** Implement adapters for Komiku II, Asura Scans, KomikNesia one at a time. Each adapter is independently shippable.

**Affected Modules:**
- `src/server/lib/sources/adapters/komiku-ii/` — NEW
- `src/server/lib/sources/adapters/asurascans/` — NEW
- `src/server/lib/sources/adapters/komiknesia/` — NEW
- `src/server/lib/sources/adapters/index.ts` — register new sources
- `src/shared/sources/source-registry.ts` — add metadata

**Dependencies:** Phase 1 complete. Source research complete for each source.

**Migration Impact:** None — new sources are additive. Users gain new sources but no existing data is affected.

**Sub-phases (in priority order per D-011):**

### 2A: Komiku II Adapter
- Implement verified JSON API adapter
- Add fixtures and normalization tests
- Register source

### 2B: Asura Scans Adapter
- Implement verified JSON API adapter
- Handle `is_locked` without bypass
- Add fixtures and normalization tests
- Register source

### 2C: KomikNesia Adapter
- Implement verified encrypted JSON API adapter
- Implement verified AES-256-CBC response transform using native Node crypto
- Add crypto/decryption fixtures and normalization tests
- Register source

**Tests Required (per adapter):**
- Normalizer unit tests with fixtures
- Capability advertisement matches implementation
- Error handling (timeout, malformed response, empty results)
- Integration with source manager

**Exit Criteria (per adapter):**
- Adapter satisfies `MangaSource` interface
- Fixture-based tests pass
- Typecheck passes
- Browser-tested: search → detail → chapters → reader flow

**Rollback:** Remove adapter registration. Zero risk to existing sources.

---

## Phase 3: Domain Resolution & Health (DONE)

**Objective:** Implement runtime domain resolution so adapters don't hardcode `baseUrl`. Implement server-side functional source health tracking across layers with normalized error codes.

**Affected Modules:**
- `src/server/lib/sources/domain-resolver.ts` — D-001 runtime domain resolution with fallback mirrors and cache
- `src/server/lib/sources/error.ts` — machine-readable `SourceErrorCode` and `SourceError`
- `src/server/lib/sources/health/` — functional health probe runner, health store, and transition events
- `src/server/lib/sources/source-manager.ts` — runtime domain resolution binding without identity mutation
- `src/app/api/sources/search/route.ts` — search error isolation with normalized `errorCode`
- `src/server/lib/sources/adapters/komikindo/index.ts` & `shinigami/index.ts` — configurable base URLs

**Dependencies:** Phase 1 complete. Phase 2 (7 active sources) complete.

**Migration Impact:** ZERO — adapter defaults preserved as fallback. Source identities, library keys, and reading progress completely unaffected.

**Tests Verified (31 new tests, 466 total tests passing across 69 test files):**
- Domain resolution order (sourceId → env → cache → fallback mirrors → default)
- Fallback mirror switching on domain failure (`komikindo.ch` → `komikindo.cv`)
- Domain state does NOT alter source identity or reading progress
- Machine-readable error normalization (`RATE_LIMITED`, `UPSTREAM_BLOCKED`, `ROUTE_CHANGED`, `PARSER_BROKEN`, `SCHEMA_CHANGED`, `UPSTREAM_TIMEOUT`, `SOURCE_DOWN`, `DECRYPT_FAILURE`)
- Consecutive failure counting & recovery transition (`SOURCE_RECOVERED`)
- Multi-source search failure isolation (failed source returns error metadata without breaking other sources)
- Live bounded smoke probes verified 100% HEALTHY across all 7 active sources

**Exit Criteria:**
- [x] Domain is resolved at runtime with fallback mirrors
- [x] Functional health check detects parser, route, decrypt, and domain errors
- [x] Search error isolation verified with normalized error codes
- [x] Operational events (`SourceHealthSnapshot`, `SourceHealthTransition`) ready for future Telegram Ops consumption
- [x] All 69 test files (466 tests) passing cleanly


---

## Phase 4: Enhanced Search & Capabilities

**Objective:** Implement capabilities model. Enhance multi-source search with error isolation, canonical deduplication, and per-source failure reporting.

**Affected Modules:**
- `src/shared/sources/source-capabilities.ts` — expanded capability model
- `src/app/api/sources/search/route.ts` — multi-source search with isolation & canonical dedupe
- `src/shared/hooks/` — search catalog hooks
- `src/server/lib/sources/source-manager.ts` — capability-aware source selection

**Dependencies:** Phase 1 complete. At least 2 new adapters from Phase 2 to test multi-source.

**Migration Impact:** LOW — additive error metadata in search responses.

**Tests Required:**
- One source failing does not invalidate others
- Capability check prevents calling unsupported methods
- Search results include per-source error metadata
- Canonical deduplication clusters equivalent titles accurately

**Exit Criteria:**
- Aggregated search survives individual source failures
- Capability model prevents invalid calls
- Canonical dedupe verified

**Rollback:** Revert to current all-or-nothing search behavior.

---

## Phase 5: Versioning & Observability

**Objective:** Add contract/adapter versioning. Improve source error classification.

**Affected Modules:**
- `src/shared/sources/source-types.ts` — versioning fields
- `src/server/lib/sources/adapters/` — adapter version metadata
- Error types/classification

**Dependencies:** Phase 1-4 substantially complete.

**Migration Impact:** None — additive metadata.

**Exit Criteria:**
- Contract version exposed
- Adapter version exposed per source
- Error types distinguish SourceUnavailable, RateLimited, ParserBroken, DomainChanged, AuthRequired

**Rollback:** Trivial — metadata removal.

---

## Resolved Product Decisions

### D-008: MangaDex Language Handling
- **Decision:** MangaDex remains one unified source (`mangadex`) with ID/EN language preference filter, not split into `mangadex-id` and `mangadex-en`.
- **Reason:** Simplifies user experience and library management, prevents catalog fragmentation, consistent with current adapter design.

### D-009: Search Scope & Canonical Deduplication
- **Global Search:** Selected sources → parallel search → normalize → canonical dedupe. Multi-source search queries active sources in parallel and clusters matching results using `title-matcher.ts`.
- **Library Search:** Scoped to the user's local library items. Alternate-source discovery for library items is kept as a separate, explicit action.

### D-010: Source Fallback & Reading Progress Discipline
- **High-Confidence / Confirmed Fallback:** May auto-switch source with clear in-app notification when a source becomes unavailable.
- **Ambiguous Mapping:** Any ambiguous title or chapter mapping strictly requires user confirmation before switching.
- **Progress Protection:** Never silently advance reading progress under any circumstances. If the chapter mapping is uncertain, halt and prompt the user.

### D-011: New Source Implementation Priority
1. **Komiku II:** Direct REST JSON API, clean schema, zero encryption overhead.
2. **Asura Scans:** Direct REST JSON API, clean WebP CDN images, explicit `is_locked` paywall handling.
3. **KomikNesia:** Native AES-256-CBC decrypt transform, embedded chapters list in detail payload.
