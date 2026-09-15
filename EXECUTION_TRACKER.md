# EXECUTION_TRACKER.md — Yomirra Engineering Execution Tracker

> **Tracks:** `MASTER_PLAN.md` v1.0
> **Baseline:** `audit_report_2.md`
> **Last Updated:** 2026-09-15
> **Current Phase:** Phase 3 (Open — remediation required)
> **Overall Status:** `IN_PROGRESS`

---

# Status Legend

| Status             | Meaning                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `NOT_STARTED`      | Eligible work has not begun                                             |
| `IN_PROGRESS`      | Active implementation                                                   |
| `BLOCKED`          | Dependency or decision gate not satisfied                               |
| `BASELINE_PRESENT` | Pre-existing behavior exists but has not passed new acceptance criteria |
| `DONE`             | Implemented and verified                                                |
| `DEFERRED`         | Explicitly postponed with rationale                                     |

---

# Phase 0 — Security & Correctness Gate

**Status:** `CLOSED`
**Branch:** `phase/0-security-correctness`

## W0.1 — Dynamic Source Identity Isolation

* [x] Reserve built-in source IDs `[DONE]`
* [x] Reject Dynamic Source use under built-in identity `[DONE]`
* [x] Enforce expected identity vs `manifest.id` `[DONE]`
* [x] Add explicit built-in/dynamic runtime classification `[DONE]`

## W0.2 — Outbound Request Security Policy

* [x] Create reusable outbound URL security layer `[DONE]`
* [x] Restrict supported protocols `[DONE]`
* [x] Reject URL credentials `[DONE]`
* [x] Block private/loopback/link-local/metadata ranges `[DONE]`
* [x] Validate IPv6 ranges `[DONE]`
* [x] Validate DNS resolution `[DONE]`
* [x] Revalidate redirect destinations `[DONE]`
* [x] Add bounded redirects and timeout/abort `[DONE]`

## W0.3 — Dynamic Source Cache Isolation

* [x] Define trusted `manifestFingerprint` contract `[DONE]`
* [x] Separate Dynamic Source namespace from built-in namespace `[DONE]`
* [x] Verify raw `manifestUrl` alone is not cache identity `[DONE]`
* [x] Regression-test namespace collision `[DONE]`

## W0.4 — Image Proxy Hardening

* [x] Apply outbound security policy after HMAC verification `[DONE]`
* [x] Validate redirects `[DONE]`
* [x] Add timeout/size safeguards `[DONE]`
* [x] Validate expected image response `[DONE]`

## W0.5 — Authentication Lifecycle Isolation

* [x] Classify persisted stores as user/device/session scoped `[DONE]`
* [x] Capture preferences listener unsubscribe `[DONE]`
* [x] Prevent stale async callback after UID change `[DONE]`
* [x] Clear/replace confirmed user-scoped state on logout `[DONE]`
* [x] Preserve device-scoped preferences/downloads appropriately `[DONE]`
* [x] Test User A → User B isolation `[DONE]`

## W0.6 — NSFW Fail-Closed

* [x] Replace ambiguous array state with LOADING / KNOWN / ERROR state `[DONE]`
* [x] Persist last-known-good classification `[DONE]`
* [x] Fail closed when Hide NSFW is enabled and classification unavailable `[DONE]`
* [x] Memoize derived Set where appropriate `[DONE]`

## W0.7 — Firestore History Query

* [x] Replace full scan with scoped query `[DONE]`
* [x] Verify unrelated history remains untouched `[DONE]`
* [x] Document/create index if required `[DONE]`

## W0.8 — Service Worker Cache Contract

* [x] Determine which source GET routes are safe/useful to runtime-cache `[DONE]`
* [x] Remove stale `/api/manga` matcher `[DONE]`
* [x] Add explicit safe matcher/allowlist `[DONE]`
* [x] Verify auth/dynamic/private routes are not cached accidentally `[DONE]`

## W0.9 — Security Regression Suite

* [x] built-in source override test `[DONE]`
* [x] manifest ID mismatch test `[DONE]`
* [x] private IPv4 test `[DONE]`
* [x] loopback test `[DONE]`
* [x] link-local test `[DONE]`
* [x] IPv6 private/local test `[DONE]`
* [x] redirect-to-private test `[DONE]`
* [x] unsupported protocol test `[DONE]`
* [x] cache collision test `[DONE]`
* [x] Image Proxy unsafe destination test `[DONE]`
* [x] auth listener teardown test `[DONE]`
* [x] User A → User B test `[DONE]`
* [x] NSFW fail-closed test `[DONE]`
* [x] scoped Firestore delete test `[DONE]`
* [x] Service Worker matcher test `[DONE]`

## Phase 0 Exit Gate

* [x] No open Phase 0 P0/P1
* [x] Security regression suite passes
* [x] `pnpm typecheck` passes
* [x] `pnpm test --run` passes
* [x] `pnpm build` passes

---

# Phase 1 — Source Resilience & Identity Foundation

**Implementation:** `DONE`
**Formal Status:** `CLOSED`
**Branch:** `phase/1-source-resilience-identity`
**Blocked by:** None (Phase 0 Closed)

## W1.0 — Identity Architecture Decision

* [x] Define durable saved-title identity `[DONE]`
* [x] Define SourceRef identity `[DONE]`
* [x] Define Library relationship `[DONE]`
* [x] Define History relationship `[DONE]`
* [x] Define Collections relationship `[DONE]`
* [x] Define Updates relationship `[DONE]`
* [x] Define Downloads relationship `[DONE]`
* [x] Define Firestore/localStorage representation `[DONE]`
* [x] Define legacy key migration `[DONE]`
* [x] Define rollback strategy `[DONE]`

## W1.1 — Title Normalization

* [x] Unicode normalization `[DONE]`
* [x] whitespace/punctuation normalization `[DONE]`
* [x] alternate-title support `[DONE]`
* [x] author/language/provider matching signals where available `[DONE]`
* [x] unit tests `[DONE]`

## W1.2 — Matching Confidence

* [x] `EXACT_CONFIRMED` `[DONE]`
* [x] `HIGH_CONFIDENCE` `[DONE]`
* [x] `AMBIGUOUS` `[DONE]`
* [x] `NO_MATCH` `[DONE]`
* [x] require confirmation for ambiguity `[DONE]`

## W1.3 — Source References

* [x] primary source representation `[DONE]`
* [x] alternate sources `[DONE]`
* [x] availability state `[DONE]`
* [x] legacy references `[DONE]`
* [x] provenance/confidence `[DONE]`

## W1.4 — Chapter Mapping

* [x] chapter-number mapping `[DONE]`
* [x] volume handling `[DONE]`
* [x] title/special handling `[DONE]`
* [x] ambiguity handling `[DONE]`

## W1.5 — Relink / Migration Flow

* [x] dead source recovery entry point `[DONE]`
* [x] search alternate sources `[DONE]`
* [x] confidence display `[DONE]`
* [x] user confirmation `[DONE]`
* [x] progress preservation `[DONE]`
* [x] unmatched history preservation `[DONE]`

## W1.6 — Persisted-State Migration

* [x] schema version increment `[DONE]`
* [x] idempotent migration `[DONE]`
* [x] legacy fixtures `[DONE]`
* [x] duplicate-prevention tests `[DONE]`
* [x] Firestore compatibility (`libraryV2` isolation) `[DONE]`
* [x] backup compatibility (V3 backup schema + V2 migration) `[DONE]`

## W1.7 — Dead Source Recovery

* [x] cached metadata retained `[DONE]`
* [x] source status shown `[DONE]`
* [x] retry `[DONE]`
* [x] Find Alternate Source `[DONE]`
* [x] relink `[DONE]`
* [x] offline chapters remain usable `[DONE]`

## Phase 1 Exit Gate

* [x] Identity ADR complete (`docs/IDENTITY.md`)
* [x] durable identity separated from current source
* [x] legacy IDs remain readable
* [x] matching confidence deterministic
* [x] ambiguous matches require confirmation
* [x] relink works (`relinkTitle`)
* [x] progress preservation works where safely mappable (`mapChapterProgress`)
* [x] migration idempotent
* [x] backup compatibility verified (V3 export, V2 import)
* [x] typecheck/tests pass (`pnpm typecheck` 0 errors, 45 test files / 222 tests pass)

---

# Phase 2 — Personal Library UX

**Status:** `CLOSED`
**Formal Closure:** 2026-09-15 (after test-gate remediation)
**Branch:** `phase/2-personal-library`
**Blocked by:** None (Phase 1 Closed)

## W2.1 — Information Architecture

* [x] Define canonical `/library` structure `[DONE]`
* [x] remove Library/Bookmark conceptual duplication `[DONE]`

## W2.2 — Route Compatibility

* [x] legacy `/bookmark` compatibility `[DONE]`
* [x] update navigation `[DONE]`

## W2.3 — Saved Titles

* [x] search/sort/filter `[DONE]`
* [x] collection membership `[DONE]`
* [x] recovery state `[DONE]`
* [x] unread/update state `[DONE]`

## W2.4 — Continue Reading

* [x] last-read chapter `[DONE]`
* [x] progress `[DONE]`
* [x] one-tap resume `[DONE]`
* [x] offline state `[DONE]`

## W2.5 — History

* [x] title/chapter/time/progress presentation `[DONE]`
* [x] source provenance `[DONE]`

## W2.6 — Collections

* [x] collection references durable title identity `[DONE]`

## W2.7 — Updates

* [x] updates group by durable title identity `[DONE]`
* [x] retain source provenance `[DONE]`

## W2.8 — Source Availability UX

* [x] AVAILABLE `[DONE]`
* [x] UNAVAILABLE `[DONE]`
* [x] UNKNOWN `[DONE]`
* [x] RECOVERY_REQUIRED `[DONE]`
* [x] no fabricated latency/uptime `[DONE]`

## W2.9 — Responsive UX

* [x] mobile hierarchy `[DONE]`
* [x] desktop density `[DONE]`
* [x] accessibility smoke `[DONE]`

## Phase 2 Exit Gate

* [x] mobile/desktop verified `[DONE]`
* [x] typecheck/tests/build pass `[DONE]`

### Test-Gate Remediation (2026-09-15)

Initial closure was invalidated: 4 test files / 8 tests failing. Root causes and fixes:

* [x] `bottom-dock.test.tsx` — Stale assertion checked for `Bookmark` nav item removed in Phase 2. Updated to Phase 2 contract: Beranda, Library, Cari, Pengaturan. `[DONE]`
* [x] `bookmark-page.test.tsx` — Obsolete UI tests for old Bookmark page. Replaced with redirect-contract tests asserting `redirect('/library?tab=riwayat')`. `[DONE]`
* [x] `search-integration.test.tsx` — Mock missing `dynamicSourceRegistry.get()`. ShelfCard calls `.get()` added in Phase 2. Added `get: vi.fn()` to mock. `[DONE]`
* [x] `search-page-revamp.test.tsx` — Same stale mock. Added `get: vi.fn()` to mock. `[DONE]`

Final verified gate: `pnpm typecheck` 0 errors, `pnpm test --run` 229/229 passed (46 files), `pnpm build` pass.

---

# Phase 3 — Reader Excellence

**Implementation:** `DONE`
**Formal Status:** `NOT_CLOSED`
**Branch:** `phase/3-reader-excellence`
**Blocked by:** None (Phase 0 + Phase 1 Closed — MASTER_PLAN declared dependencies satisfied)

## W3.1 — Reader Dead Logic Cleanup

* [x] resolve/remove empty IntersectionObserver `[DONE]`
* [x] resolve unfinished divider/stream logic `[DONE]`

## W3.2 — Source-Aware Reporting

* [x] remove hardcoded Shinigami reporting `[DONE]`
* [x] source-aware/generic reporting contract `[DONE]`

## W3.3 — Image Failure Recovery

* [x] loading/error states `[DONE]`
* [x] bounded retry `[DONE]`
* [x] final failure state `[DONE]`

## W3.4 — Progress Reliability

* [x] navigation persistence `[BASELINE_PRESENT]`
* [x] reload resume `[BASELINE_PRESENT]`
* [x] backgrounding behavior `[DONE]`
* [x] offline/online transition `[DONE]`
* [x] source-relink integration `[DONE]`

## W3.5 — Offline Reader Reliability

* [x] downloaded chapter regression test `[DONE]`
* [x] partial-cache state `[DONE]`
* [x] offline cache miss state `[DONE]`

## W3.6 — Desktop Double Spread

* [x] evaluate `[DONE]`
* [x] IMPLEMENT / DEFER / REJECT `[DEFER]`

## W3.7 — Keyboard Navigation

* [x] paged reader `[DONE]`
* [x] vertical reader `[DONE]`

## W3.8 — Seamless Multi-Chapter Decision

* [x] prototype if justified `[DONE]`
* [x] memory/profile evidence `[DONE]`
* [x] IMPLEMENT / DEFER / REJECT `[DEFER]`

## W3.9 — Tap Zones Decision

* [x] evaluate user value `[DONE]`
* [x] IMPLEMENT / DEFER / REJECT `[DEFER]`

## W3.10 — Fullscreen Decision

* [x] evaluate `[DONE]`
* [x] IMPLEMENT / DEFER / REJECT `[DEFER]`

## W3.11 — Virtualizer Profiling

* [ ] measure 1200px estimate behavior `[UNVERIFIED]`
* [ ] reproduce or reject A2-P01 inference `[UNVERIFIED]`

## Phase 3 Exit Gate

* [x] reliability work complete
* [x] source-aware reporting
* [x] image failure handling
* [x] progress/offline regressions green
* [x] keyboard baseline working
* [x] all enhancement decision gates resolved
* [x] implemented enhancements covered by tests
* [x] no major Reader regression
* [x] typecheck/tests/build pass

### Test-Gate Remediation (2026-09-15)

* [ ] W3.11 Profiling `[UNVERIFIED]` — Cannot perform real runtime profiling against expired certs without modifying production code. Phase 3 remains open per constraint.

---

# Phase 4 — Discovery & Search Excellence

**Status:** `BLOCKED`
**Branch:** `phase/4-discovery-search`
**Blocked by:** Phase 1

## W4.1 — Capability-Aware Filters

* [ ] model source filter capabilities `[BLOCKED]`
* [ ] stop blindly sending unsupported filters `[BLOCKED]`
* [ ] unsupported-capability UX `[BLOCKED]`

## W4.2 — Cross-Source Grouping

* [ ] integrate Phase 1 matcher `[BLOCKED]`
* [ ] preserve ambiguous works separately `[BLOCKED]`

## W4.3 — Ranking

* [ ] deterministic ranking contract `[BLOCKED]`
* [ ] source-neutral behavior `[BLOCKED]`

## W4.4 — Partial Failure

* [ ] successful sources remain usable `[BASELINE_PRESENT]`
* [ ] failed-source state `[BLOCKED]`
* [ ] targeted retry `[BLOCKED]`

## W4.5 — Source / Language Visibility

* [ ] source context `[BLOCKED]`
* [ ] language context where available `[BLOCKED]`

## W4.6 — Discovery Feeds

* [ ] source attribution `[BLOCKED]`
* [ ] graceful partial failure `[BLOCKED]`

## W4.7 — Search UX

* [ ] loading state `[BLOCKED]`
* [ ] empty state `[BLOCKED]`
* [ ] partial error state `[BLOCKED]`
* [ ] filter clarity `[BLOCKED]`

## W4.8 — NSFW Integration

* [ ] apply Phase 0 classification contract `[BLOCKED]`

## Phase 4 Exit Gate

* [ ] capability-aware filters
* [ ] safe cross-source grouping
* [ ] partial failures graceful
* [ ] deterministic ranking
* [ ] source/language context visible
* [ ] typecheck/tests/build pass

---

# Phase 5 — Source Platform & Observability

**Status:** `BLOCKED`
**Branch:** `phase/5-source-platform`
**Blocked by:** Phase 0 + stable Phase 1 identity

## W5.1 — Runtime Dynamic Source Identity

* [ ] define install/import → validate → trusted identity lifecycle `[BLOCKED]`
* [ ] remove arbitrary raw manifest URL as ordinary runtime identity `[BLOCKED]`

## W5.2 — Manifest Governance

* [ ] source ID `[BLOCKED]`
* [ ] version `[BLOCKED]`
* [ ] capabilities `[BLOCKED]`
* [ ] endpoint policy `[BLOCKED]`
* [ ] origin policy `[BLOCKED]`
* [ ] classification/update metadata `[BLOCKED]`

## W5.3 — Source Lifecycle

* [ ] install `[BLOCKED]`
* [ ] validation `[BLOCKED]`
* [ ] enable/disable `[BLOCKED]`
* [ ] update `[BLOCKED]`
* [ ] incompatible-version handling `[BLOCKED]`
* [ ] uninstall `[BLOCKED]`
* [ ] cache cleanup `[BLOCKED]`
* [ ] last-known-good fallback `[BLOCKED]`

## W5.4 — SDK / DSL Decision

* [ ] evaluate manifest sufficiency `[BLOCKED]`
* [ ] document decision `[BLOCKED]`
* [ ] no executable-code expansion `[BLOCKED]`

## W5.5 — Real Health

* [ ] remove hardcoded health values `[BLOCKED]`
* [ ] real status `[BLOCKED]`
* [ ] real latency `[BLOCKED]`
* [ ] checked-at timestamp `[BLOCKED]`
* [ ] historical health only if actually measured `[BLOCKED]`

## W5.6 — Structured Logging

* [ ] source logs `[BLOCKED]`
* [ ] cache logs `[BLOCKED]`
* [ ] auth/sync logs `[BLOCKED]`
* [ ] proxy/security logs `[BLOCKED]`

## W5.7 — Alerting

* [ ] source outage/recovery alerting `[BLOCKED]`
* [ ] Telegram optional integration `[BLOCKED]`

## W5.8 — Redis / Rate-Limit Degradation Policy

* [ ] classify endpoint failure policy `[BLOCKED]`
* [ ] decide FAIL_OPEN / FAIL_CLOSED / LOCAL_FALLBACK per risk `[BLOCKED]`
* [ ] test degradation `[BLOCKED]`

## W5.9 — Firebase Degradation Visibility

* [ ] sync outage state `[BLOCKED]`
* [ ] local reading unaffected `[BLOCKED]`

## W5.10 — Marketing Routing Decision

* [ ] product decision remains undecided `[BLOCKED]`

## Phase 5 Exit Gate

* [ ] trusted Dynamic Source identity
* [ ] safe source lifecycle
* [ ] SDK/DSL decision documented
* [ ] no fake telemetry
* [ ] real health operational
* [ ] logging structured
* [ ] degradation policies explicit/tested
* [ ] typecheck/tests/build pass

---

# Phase 6 — Quality, Reliability & Data Safety

**Status:** `BLOCKED`
**Branch:** `phase/6-quality-reliability`
**Blocked by:** Phases 0–5 functional scope

## W6.1 — Unit Coverage

* [ ] Download Engine tests `[BLOCKED]`
* [ ] Firebase sync tests `[BLOCKED]`
* [ ] Dynamic Source tests `[BLOCKED]`
* [ ] identity/matcher tests `[BLOCKED]`
* [ ] migration tests `[BLOCKED]`
* [ ] backup/restore tests `[BLOCKED]`

## W6.2 — Integration Coverage

* [ ] API source resolution `[BLOCKED]`
* [ ] cache integration `[BLOCKED]`
* [ ] sync/store integration `[BLOCKED]`
* [ ] source relink integration `[BLOCKED]`

## W6.3 — Security Regression

* [ ] Phase 0 suite permanent in CI `[BLOCKED]`

## W6.4 — Critical E2E

* [ ] Home → Search → Manga → Reader `[BLOCKED]`
* [ ] Save → reload → Library `[BLOCKED]`
* [ ] progress → reload → resume `[BLOCKED]`
* [ ] download → offline → read `[BLOCKED]`
* [ ] User A → logout → User B `[BLOCKED]`
* [ ] mobile vertical reader `[BLOCKED]`
* [ ] desktop paged reader `[BLOCKED]`
* [ ] partial source outage `[BLOCKED]`
* [ ] dead source → relink `[BLOCKED]`
* [ ] backup → restore `[BLOCKED]`

## W6.5 — Schema Governance

* [ ] persisted schema version policy implemented where needed `[BLOCKED]`
* [ ] legacy fixtures `[BLOCKED]`
* [ ] rollback/recovery tests `[BLOCKED]`

## W6.6 — Backup / Restore

* [ ] pre-apply validation `[BLOCKED]`
* [ ] legacy support `[BLOCKED]`
* [ ] malformed/future version rejection `[BLOCKED]`
* [ ] no partial destructive restore `[BLOCKED]`

## W6.7 — Failure Engineering

* [ ] Firebase unavailable `[BLOCKED]`
* [ ] Redis unavailable using Phase 5 policy `[BLOCKED]`
* [ ] one source unavailable `[BLOCKED]`
* [ ] all sources unavailable `[BLOCKED]`
* [ ] image host unavailable `[BLOCKED]`
* [ ] quota exhausted `[BLOCKED]`
* [ ] stale/corrupt SW `[BLOCKED]`
* [ ] interrupted download `[BLOCKED]`
* [ ] auth expiration `[BLOCKED]`

## W6.8 — Risk-First Type Debt

* [ ] Dynamic Source contracts `[BLOCKED]`
* [ ] security/migrations `[BLOCKED]`
* [ ] sync `[BLOCKED]`
* [ ] filters/adapters `[BLOCKED]`

## W6.9 — Repository Hygiene

* [ ] remove verified unused dependencies `[BLOCKED]`
* [ ] clarify workspace tooling `[BLOCKED]`
* [ ] remove stale config/code `[BLOCKED]`

## Phase 6 Exit Gate

* [ ] 10 critical E2E flows
* [ ] sync/download/Dynamic Source coverage
* [ ] migrations tested
* [ ] backup integrity tested
* [ ] dependency failures defined/tested
* [ ] no release-blocking flaky tests
* [ ] typecheck/tests/build/E2E pass

---

# Phase 7 — Performance, Accessibility & Compatibility

**Status:** `BLOCKED`
**Branch:** `phase/7-performance-accessibility`
**Blocked by:** Phase 6

## W7.1 — Performance Baseline

* [ ] Home `[BLOCKED]`
* [ ] Search `[BLOCKED]`
* [ ] Library `[BLOCKED]`
* [ ] Manga detail `[BLOCKED]`
* [ ] vertical Reader `[BLOCKED]`
* [ ] paged Reader `[BLOCKED]`
* [ ] offline Reader `[BLOCKED]`

## W7.2 — Core Web Vitals

Targets:

* [ ] LCP ≤ 2.5s p75 `[BLOCKED]`
* [ ] INP ≤ 200ms p75 `[BLOCKED]`
* [ ] CLS ≤ 0.10 `[BLOCKED]`

## W7.3 — Reader Profiling

* [ ] virtualizer corrections `[BLOCKED]`
* [ ] image decode `[BLOCKED]`
* [ ] prefetch concurrency `[BLOCKED]`
* [ ] long-chapter memory `[BLOCKED]`
* [ ] zoom `[BLOCKED]`
* [ ] offline pages `[BLOCKED]`
* [ ] resolve A2-P01 with evidence `[BLOCKED]`

## W7.4 — Large Data

* [ ] 1,000 Library items `[BLOCKED]`
* [ ] 1,000 History items `[BLOCKED]`
* [ ] many Collections `[BLOCKED]`
* [ ] long chapter `[BLOCKED]`
* [ ] multi-source search `[BLOCKED]`

## W7.5 — Bundle Analysis

* [ ] heavy-module code splitting `[BLOCKED]`
* [ ] hydration/bundle regression review `[BLOCKED]`

## W7.6 — Accessibility

* [ ] keyboard `[BLOCKED]`
* [ ] focus `[BLOCKED]`
* [ ] semantics `[BLOCKED]`
* [ ] dialogs/drawers `[BLOCKED]`
* [ ] screen-reader labels `[BLOCKED]`
* [ ] contrast `[BLOCKED]`
* [ ] status/error announcements `[BLOCKED]`
* [ ] reduced motion `[BLOCKED]`
* [ ] browser zoom `[BLOCKED]`
* [ ] WCAG 2.2 AA target-size requirements `[BLOCKED]`
* [ ] primary touch controls target 44×44 CSS px where practical `[BLOCKED]`

## W7.7 — Compatibility

* [ ] Chromium desktop `[BLOCKED]`
* [ ] Chromium Android `[BLOCKED]`
* [ ] Firefox desktop `[BLOCKED]`
* [ ] Safari/iOS PWA limitations documented `[BLOCKED]`

## Phase 7 Exit Gate

* [ ] baseline recorded
* [ ] performance targets pass or exception explicitly approved
* [ ] long Reader memory bounded
* [ ] large Library responsive
* [ ] accessibility blockers resolved
* [ ] browser support documented
* [ ] typecheck/tests/build/E2E pass

---

# Phase 8 — Production / Enterprise Readiness

**Status:** `BLOCKED`
**Branch:** `phase/8-enterprise-readiness`
**Blocked by:** Phase 7

## W8.1 — CI/CD

* [ ] lockfile install gate `[BLOCKED]`
* [ ] lint `[BLOCKED]`
* [ ] typecheck `[BLOCKED]`
* [ ] unit/integration `[BLOCKED]`
* [ ] security regression `[BLOCKED]`
* [ ] build `[BLOCKED]`
* [ ] critical E2E `[BLOCKED]`
* [ ] merge/deploy policy `[BLOCKED]`

## W8.2 — Dependency Governance

* [ ] lockfile policy `[BLOCKED]`
* [ ] update cadence `[BLOCKED]`
* [ ] major upgrade procedure `[BLOCKED]`
* [ ] vulnerability process `[BLOCKED]`

## W8.3 — Secrets / Environment

* [ ] `.env.example` review `[BLOCKED]`
* [ ] production env validation `[BLOCKED]`
* [ ] secret rotation `[BLOCKED]`
* [ ] compromised secret process `[BLOCKED]`
* [ ] archive/git secret hygiene `[BLOCKED]`

## W8.4 — Security Operations

* [ ] SSRF regression governance `[BLOCKED]`
* [ ] auth isolation governance `[BLOCKED]`
* [ ] Dynamic Source trust governance `[BLOCKED]`
* [ ] rate-limit policy `[BLOCKED]`
* [ ] security headers `[BLOCKED]`
* [ ] disclosure process / SECURITY.md `[BLOCKED]`

## W8.5 — Release Engineering

* [ ] semantic versioning policy `[BLOCKED]`
* [ ] CHANGELOG process `[BASELINE_PRESENT]`
* [ ] deployment checklist `[BLOCKED]`
* [ ] post-deploy smoke `[BLOCKED]`
* [ ] rollback drill `[BLOCKED]`
* [ ] migration sequence `[BLOCKED]`
* [ ] SW/cache release behavior `[BLOCKED]`

## W8.6 — Observability

* [ ] application failure visibility `[BLOCKED]`
* [ ] source outage visibility `[BLOCKED]`
* [ ] Redis degradation visibility `[BLOCKED]`
* [ ] Firebase sync degradation visibility `[BLOCKED]`
* [ ] release health `[BLOCKED]`

## W8.7 — Incident Readiness

* [ ] security incident runbook `[BLOCKED]`
* [ ] bad deploy runbook `[BLOCKED]`
* [ ] Firebase runbook `[BLOCKED]`
* [ ] Redis runbook `[BLOCKED]`
* [ ] source outage runbook `[BLOCKED]`
* [ ] SW failure runbook `[BLOCKED]`
* [ ] leaked secret runbook `[BLOCKED]`
* [ ] compromised Dynamic Source runbook `[BLOCKED]`

## W8.8 — Emergency Controls

* [ ] disable one source `[BLOCKED]`
* [ ] disable Dynamic Sources globally `[BLOCKED]`
* [ ] targeted cache purge `[BLOCKED]`
* [ ] block manifest/version `[BLOCKED]`
* [ ] secret rotation `[BLOCKED]`
* [ ] deployment rollback `[BLOCKED]`

## W8.9 — Canonical Documentation

Already completed from planning/doc-sync work:

* [x] `GEMINI.md` store inventory corrected from 7 → 12 `[DONE]`
* [x] `docs/SCHEMA.md` incorrect vertical-only `readingMode` claim corrected `[DONE]`

Still required:

* [ ] full `docs/SCHEMA.md` reconciliation `[BLOCKED]`
* [ ] Architecture docs current `[BASELINE_PRESENT]`
* [ ] security model documented `[BLOCKED]`
* [x] Phase 1 identity model documented `[DONE]`
* [ ] sync documentation current `[BLOCKED]`
* [ ] PWA/offline documentation current `[BLOCKED]`
* [ ] testing docs current `[BASELINE_PRESENT]`
* [ ] deployment docs `[BLOCKED]`
* [ ] disaster recovery docs `[BLOCKED]`
* [ ] contributor docs current `[BASELINE_PRESENT]`

## W8.10 — Final Readiness Review

* [ ] clean checkout `[BLOCKED]`
* [ ] production-equivalent validation `[BLOCKED]`
* [ ] all Enterprise-Ready gates reviewed `[BLOCKED]`

---

# Enterprise-Ready Gate

## Security

* [ ] no known open P0/P1
* [ ] SSRF regression-tested
* [ ] Dynamic Source isolation proven
* [ ] sessions isolated
* [ ] no fake telemetry
* [ ] secret process active

## Data Safety

* [ ] migrations governed/tested
* [ ] backup/restore tested
* [ ] rollback/recovery defined

## Reliability

* [ ] critical E2E green
* [ ] source outages degrade gracefully
* [ ] offline reading regression-tested
* [ ] sync outage preserves local state
* [ ] emergency controls operational

## Quality

* [ ] release gates green
* [ ] no blocking flaky tests
* [ ] reproducible install

## Performance

* [ ] performance targets measured
* [ ] Reader profiled
* [ ] large Library profiled
* [ ] no known unbounded memory issue

## Accessibility

* [ ] primary flows meet agreed WCAG 2.2 AA baseline
* [ ] keyboard/focus/reduced-motion tested

## Operations

* [ ] truthful monitoring
* [ ] alerts actionable
* [ ] rollback tested
* [ ] runbooks exist

## Documentation

* [ ] canonical docs match implementation
* [ ] architecture decisions traceable
* [ ] change-control respected

**Enterprise Status:** `NOT_ENTERPRISE_READY`

---

# Validation Log

Never delete previous entries.

| Date       | Branch                          | Phase    | Evidence                                     | Result           |
| ---------- | ------------------------------- | -------- | -------------------------------------------- | ---------------- |
| 2026-09-13 | baseline                        | Audit 2  | typecheck + 175/175 tests + production build | BASELINE_PRESENT |
| 2026-09-13 | plan/yomirra-enterprise-roadmap | Planning | Master Plan / Tracker established            | DONE             |
| 2026-09-13 | plan/yomirra-enterprise-roadmap | Docs     | GEMINI store inventory 7→12                  | DONE             |
| 2026-09-13 | plan/yomirra-enterprise-roadmap | Docs     | SCHEMA readingMode correction                | DONE             |
| 2026-09-13 | phase/0-security-correctness    | Phase 0  | Security audit, typecheck, tests, build      | PHASE_0_CLOSED   |
| 2026-09-13 | phase/1-source-resilience-identity | Phase 1 | Independent closure audit, 222 tests, build  | PHASE_1_CLOSED   |
| 2026-09-15 | phase/2-ux-excellence              | Phase 2 | Test-gate remediation, 229 tests, build      | PHASE_2_CLOSED   |

---

# Implementation Notes

| Date       | Phase   | Workstream | Note                                              |
| ---------- | ------- | ---------- | ------------------------------------------------- |
| 2026-09-13 | Phase 0 | Security   | Resolved W0.4, W0.5, W0.6 blockers in closure     |
| 2026-09-13 | Phase 1 | Identity   | Source resilience and identity tracking complete  |
| 2026-09-15 | Phase 2 | UX         | Addressed test-gate remediation, layout stabilization |
| 2026-09-15 | Phase 3 | Reader     | Reporting/progress merged, W3.11 profiling blocked |

---

# Amendments

| ID | Date | Evidence | Affected Phase(s) | Status        |
| -- | ---- | -------- | ----------------- | ------------- |
| —  | —    | —        | —                 | No amendments |

---

# Hotfixes

| Branch | Date | Issue | Reconciled To |
| ------ | ---- | ----- | ------------- |
| —      | —    | —     | —             |

---

*Tracker aligned to MASTER_PLAN.md v1.0.*
