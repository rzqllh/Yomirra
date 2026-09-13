# EXECUTION_TRACKER.md — Yomirra Engineering Execution Tracker

> **Tracks:** `MASTER_PLAN.md` v1.0  
> **Last Updated:** 2026-09-13  
> **Current Phase:** Phase 0  
> **Overall Status:** BLOCKED BY SECURITY GATE

---

## Status Legend

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No work begun |
| `IN_PROGRESS` | Active development |
| `BLOCKED` | Waiting on dependency or decision |
| `DONE` | Completed and verified |
| `DEFERRED` | Intentionally postponed with rationale |
| `BASELINE_PRESENT` | Pre-existing functionality — not yet validated against phase acceptance criteria |

---

## Phase 0 — Security & Correctness Gate

**Status:** NOT_STARTED  
**Branch:** `phase/0-security-correctness`  
**Ref:** MASTER_PLAN.md § Phase 0

### W0.1 — SSRF + Cache Isolation

- [ ] Create SSRF guard (`src/server/lib/security/ssrf.ts`) — validates outbound URLs, blocks private/loopback/link-local/metadata IPs `[NOT_STARTED]`
- [ ] Protect built-in source IDs — reject `manifestUrl` when `sourceId` matches built-in adapter `[NOT_STARTED]`
- [ ] Enforce `manifest.id === sourceId` for dynamic sources `[NOT_STARTED]`
- [ ] Isolate dynamic source cache keys — `source:dynamic:${hash}:${sourceId}:...` prefix `[NOT_STARTED]`

### W0.2 — Image Proxy Hardening

- [ ] Apply SSRF guard to `/api/proxy/image/route.ts` target URL `[NOT_STARTED]`
- [ ] Validate resolved IP is public internet `[NOT_STARTED]`
- [ ] Validate `Content-Type` starts with `image/` `[NOT_STARTED]`

### W0.3 — Auth Lifecycle

- [ ] Capture `unsubPreferences` in `use-sync.ts` useEffect cleanup `[NOT_STARTED]`
- [ ] Clear ALL user-scoped stores on `logout()` in `use-auth.ts` `[NOT_STARTED]`
- [ ] NSFW fail-closed: cache IDs in localStorage, default-deny on API failure `[NOT_STARTED]`
- [ ] Memoize NSFW Set with `useMemo` (E06 — trivial fix) `[NOT_STARTED]`

### W0.4 — Firestore + SW Correctness

- [ ] Add compound query to `deleteMangaHistory` in `sync-utils.ts` `[NOT_STARTED]`
- [ ] Create Firestore composite index if required `[NOT_STARTED]`
- [ ] Update SW cache matcher from `/api/manga` to `/api/sources/` in `sw.ts` `[NOT_STARTED]`

### W0.5 — Security Regression Tests

- [ ] `ssrf.test.ts` — all blocked IP ranges `[NOT_STARTED]`
- [ ] `cache-isolation.test.ts` — dynamic vs built-in key separation `[NOT_STARTED]`
- [ ] `source-manager.test.ts` — built-in ID rejection with manifestUrl `[NOT_STARTED]`
- [ ] `use-auth-teardown.test.ts` — all stores cleared on logout `[NOT_STARTED]`
- [ ] `use-nsfw-failclosed.test.ts` — fail-closed behavior `[NOT_STARTED]`
- [ ] Image proxy SSRF rejection cases `[NOT_STARTED]`

### Phase 0 Exit Gate

- [ ] All acceptance criteria met
- [ ] Security regression test suite passes
- [ ] No P0/P1 security findings remain open
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test --run` passes
- [ ] `pnpm build` succeeds

---

## Phase 1 — Source Resilience & Identity Foundation

**Status:** NOT_STARTED  
**Branch:** `phase/1-source-resilience`  
**Ref:** MASTER_PLAN.md § Phase 1  
**Blocked by:** Phase 0 exit gate

### W1.1 — Title Normalizer

- [ ] Create `src/shared/lib/title-normalizer.ts` `[NOT_STARTED]`
- [ ] Normalize: lowercase, strip punctuation, normalize whitespace `[NOT_STARTED]`
- [ ] Confidence scoring: exact, high, medium, low `[NOT_STARTED]`
- [ ] Unit tests for normalizer `[NOT_STARTED]`

### W1.2 — Store Schema Extension

- [ ] Extend `library-store` with `alternateSourceLinks` field `[NOT_STARTED]`
- [ ] localStorage migration function (backward compatible) `[NOT_STARTED]`
- [ ] Firestore document schema extension (non-breaking) `[NOT_STARTED]`
- [ ] Backup schema v4 `[NOT_STARTED]`
- [ ] Restore from v3 backward compatibility `[NOT_STARTED]`

### W1.3 — Source Link UI + Migration Flow

- [ ] "Source unavailable" state on library items `[NOT_STARTED]`
- [ ] "Find alternate source" action `[NOT_STARTED]`
- [ ] Cross-source search using normalized title `[NOT_STARTED]`
- [ ] Match results with confidence indicator `[NOT_STARTED]`
- [ ] User confirm/reject for source linking `[NOT_STARTED]`
- [ ] Chapter progress mapping by chapter number `[NOT_STARTED]`

### W1.4 — Dead Source Recovery

- [ ] Library items with unavailable source show status indicator `[NOT_STARTED]`
- [ ] Manual search and relink flow `[NOT_STARTED]`
- [ ] Offline chapters accessible regardless of source status `[BASELINE_PRESENT]`

### Phase 1 Exit Gate

- [ ] Title normalizer with tested confidence scoring
- [ ] Library items show source availability status
- [ ] User can relink manga to alternate source
- [ ] Reading progress transfers by chapter number
- [ ] Schema migration backward compatible
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test --run` passes

---

## Phase 2 — Personal Library UX

**Status:** NOT_STARTED  
**Branch:** `phase/2-personal-library`  
**Ref:** MASTER_PLAN.md § Phase 2  
**Blocked by:** Phase 1 exit gate

### W2.1 — Information Architecture & Routes

- [ ] Unified `/library` with tabs: Saved, History, Collections, Updates `[NOT_STARTED]`
- [ ] `/bookmark` → `/library` redirect `[NOT_STARTED]`
- [ ] Navigation update in `nav.ts` `[NOT_STARTED]`

### W2.2 — Source Status Integration

- [ ] Source availability indicator on library items `[NOT_STARTED]`
- [ ] "Relink" action for unavailable sources `[NOT_STARTED]`

### W2.3 — Continue Reading

- [ ] Continue Reading section from history-store `[NOT_STARTED]`
- [ ] Last-read chapter with progress display `[NOT_STARTED]`
- [ ] One-tap resume to reader `[NOT_STARTED]`

### W2.4 — Update Indicators

- [ ] Unread/new chapter badges on library items `[NOT_STARTED]`
- [ ] Visual hierarchy: unread count, last read, latest available `[NOT_STARTED]`

### W2.5 — Responsive Layout

- [ ] Mobile compact cards, horizontal scroll rails `[NOT_STARTED]`
- [ ] Desktop denser grid `[NOT_STARTED]`
- [ ] Existing card archetypes reused `[NOT_STARTED]`

### Phase 2 Exit Gate

- [ ] Unified `/library` route
- [ ] `/bookmark` redirects correctly
- [ ] Source status visible
- [ ] Continue Reading functional
- [ ] Update indicators visible
- [ ] Mobile and desktop layouts verified
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test --run` passes

---

## Phase 3 — Reader Excellence

**Status:** NOT_STARTED  
**Branch:** `phase/3-reader-excellence`  
**Ref:** MASTER_PLAN.md § Phase 3  
**Blocked by:** Phase 0 + Phase 1 exit gates

### W3.1 — Reliability Fixes

- [ ] Remove dead IntersectionObserver (A2-B03) `[NOT_STARTED]`
- [ ] Source-aware chapter reporting (A2-B04) `[NOT_STARTED]`
- [ ] Image retry with exponential backoff `[NOT_STARTED]`
- [ ] Progress persistence verification `[BASELINE_PRESENT]`
- [ ] Offline reading verification `[BASELINE_PRESENT]`

### W3.2 — Multi-chapter Prototype (Decision Gate)

- [ ] Build prototype `[NOT_STARTED]`
- [ ] Memory profiling `[NOT_STARTED]`
- [ ] Decision: implement or defer `[NOT_STARTED]`

### W3.3 — Desktop Spread

- [ ] Double-page spread in paged reader `[NOT_STARTED]`
- [ ] LTR/RTL page ordering `[NOT_STARTED]`
- [ ] Single-page fallback `[NOT_STARTED]`

### W3.4 — Input Methods

- [ ] Keyboard navigation in paged reader `[NOT_STARTED]`
- [ ] Keyboard navigation in vertical reader `[NOT_STARTED]`
- [ ] Configurable tap zones (decision gate) `[NOT_STARTED]`

### W3.5 — Fullscreen + Polish

- [ ] Fullscreen toggle via Fullscreen API `[NOT_STARTED]`
- [ ] Auto-hide toolbar in fullscreen `[NOT_STARTED]`

### Phase 3 Exit Gate

- [ ] Dead observer removed
- [ ] Source-aware reporting
- [ ] Image retry functional
- [ ] Keyboard navigation works
- [ ] At least one world-class enhancement shipped
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test --run` passes

---

## Phase 4 — Discovery & Search Excellence

**Status:** NOT_STARTED  
**Branch:** `phase/4-discovery-search`  
**Ref:** MASTER_PLAN.md § Phase 4  
**Blocked by:** Phase 1 exit gate

### W4.1 — Duplicate Grouping

- [ ] Cross-source result grouping using title normalizer `[NOT_STARTED]`
- [ ] "Also available on" source badges `[NOT_STARTED]`

### W4.2 — Capability-Aware Filters

- [ ] Model filter capabilities per source `[NOT_STARTED]`
- [ ] Dynamic filter drawer reflecting source capabilities `[NOT_STARTED]`
- [ ] "Not supported by [source]" indicator `[NOT_STARTED]`

### W4.3 — Partial Failure Handling

- [ ] Show successful source results when others fail `[BASELINE_PRESENT]`
- [ ] Per-source error indicator `[NOT_STARTED]`
- [ ] Per-source retry button `[NOT_STARTED]`

### W4.4 — Source/Language Visibility

- [ ] Source badge on result cards `[NOT_STARTED]`
- [ ] Language indicator `[NOT_STARTED]`

### W4.5 — Feed & Search UX

- [ ] Multi-source popular/latest feeds `[BASELINE_PRESENT]`
- [ ] Search history (localStorage) `[NOT_STARTED]`
- [ ] Loading/empty/error states per source `[NOT_STARTED]`

### Phase 4 Exit Gate

- [ ] Duplicate grouping functional
- [ ] Capability-aware filters
- [ ] Partial failure graceful
- [ ] Source visibility on results
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test --run` passes

---

## Phase 5 — Source Platform & Observability

**Status:** NOT_STARTED  
**Branch:** `phase/5-source-platform`  
**Ref:** MASTER_PLAN.md § Phase 5  
**Blocked by:** Phases 0-4 exit gates

### W5.1 — Dynamic Source Hardening

- [ ] Trust model documentation `[NOT_STARTED]`
- [ ] Manifest validation hardening (strict URL validation) `[NOT_STARTED]`
- [ ] Source versioning/update mechanism `[NOT_STARTED]`
- [ ] Source failure states `[NOT_STARTED]`

### W5.2 — SDK/DSL Decision

- [ ] Evaluate manifest vs DSL `[NOT_STARTED]`
- [ ] Document decision `[NOT_STARTED]`

### W5.3 — Health Monitoring

- [ ] Real health check loop `[NOT_STARTED]`
- [ ] Replace hardcoded healthStats (B06) `[NOT_STARTED]`
- [ ] No fabricated data `[NOT_STARTED]`

### W5.4 — Logging & Alerting

- [ ] Structured logger migration (B07, E07) `[NOT_STARTED]`
- [ ] Telegram alerting `[NOT_STARTED]`
- [ ] Redis/Firebase degradation logging `[NOT_STARTED]`
- [ ] Rate-limit fail-open documented (E02) `[NOT_STARTED]`

### Phase 5 Exit Gate

- [ ] Real health monitoring operational
- [ ] Fabricated stats eliminated
- [ ] Structured logging consistent
- [ ] Trust model documented
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test --run` passes

---

## Phase 6 — Quality, Reliability & Data Safety

**Status:** NOT_STARTED  
**Branch:** `phase/6-quality-reliability`  
**Ref:** MASTER_PLAN.md § Phase 6  
**Blocked by:** Phases 0-5 exit gates

### W6.1 — Unit Test Expansion

- [ ] Download engine tests `[NOT_STARTED]`
- [ ] Firebase sync logic tests `[NOT_STARTED]`
- [ ] Dynamic source adapter tests `[NOT_STARTED]`
- [ ] Backup/restore migration tests `[NOT_STARTED]`

### W6.2 — Integration Tests

- [ ] API route integration tests `[NOT_STARTED]`
- [ ] Cross-store flow tests `[NOT_STARTED]`
- [ ] Source migration flow tests `[NOT_STARTED]`

### W6.3 — E2E Test Suite (Playwright)

- [ ] Path 1: Home → Search → Manga → Reader `[NOT_STARTED]`
- [ ] Path 2: Save → reload → Library persistence `[NOT_STARTED]`
- [ ] Path 3: Reader progress → reload → resume `[NOT_STARTED]`
- [ ] Path 4: Download → offline → read `[NOT_STARTED]`
- [ ] Path 5: Login → sync → logout → isolation `[NOT_STARTED]`
- [ ] Path 6: Vertical mobile reader `[NOT_STARTED]`
- [ ] Path 7: Desktop paged reader `[NOT_STARTED]`
- [ ] Path 8: Partial source outage `[NOT_STARTED]`
- [ ] Path 9: Alternate-source recovery `[NOT_STARTED]`
- [ ] Path 10: Backup/restore flow `[NOT_STARTED]`

### W6.4 — Data Safety

- [ ] localStorage schema versioning `[NOT_STARTED]`
- [ ] Firestore migration compatibility `[NOT_STARTED]`
- [ ] Backup/restore integrity (corrupt/partial/old files) `[NOT_STARTED]`
- [ ] Failed migration rollback `[NOT_STARTED]`
- [ ] SW update lifecycle documented `[NOT_STARTED]`

### W6.5 — Failure Engineering

- [ ] Firebase unavailable behavior defined `[NOT_STARTED]`
- [ ] Redis unavailable behavior defined `[NOT_STARTED]`
- [ ] Individual source unavailable behavior defined `[NOT_STARTED]`
- [ ] All sources unavailable behavior defined `[NOT_STARTED]`
- [ ] Image host unavailable behavior defined `[NOT_STARTED]`
- [ ] Storage quota exhausted behavior defined `[NOT_STARTED]`
- [ ] SW stale/corrupt behavior defined `[NOT_STARTED]`
- [ ] Network interruption during download behavior defined `[NOT_STARTED]`
- [ ] Auth session expiration behavior defined `[NOT_STARTED]`

### Phase 6 Exit Gate

- [ ] Testing pyramid established
- [ ] 10 critical E2E paths automated
- [ ] Data safety guarantees verified
- [ ] Failure behavior defined and tested
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test --run` passes (expanded)
- [ ] E2E suite passes

---

## Phase 7 — Performance, Accessibility & Compatibility

**Status:** NOT_STARTED  
**Branch:** `phase/7-performance-accessibility`  
**Ref:** MASTER_PLAN.md § Phase 7  
**Blocked by:** Phases 0-6 exit gates

### W7.1 — Performance Profiling & Budgets

- [ ] Core Web Vitals baseline measurement `[NOT_STARTED]`
- [ ] Reader performance profiling `[NOT_STARTED]`
- [ ] Bundle analysis `[NOT_STARTED]`
- [ ] Large library performance testing `[NOT_STARTED]`
- [ ] Performance budgets verified `[NOT_STARTED]`

### W7.2 — Accessibility Audit & Fixes

- [ ] Keyboard navigation audit `[NOT_STARTED]`
- [ ] Focus management audit `[NOT_STARTED]`
- [ ] Touch target audit `[NOT_STARTED]`
- [ ] Screen reader audit `[NOT_STARTED]`
- [ ] Contrast ratio audit (dark + light) `[NOT_STARTED]`
- [ ] Reduced motion audit `[NOT_STARTED]`
- [ ] Zoom behavior verification `[NOT_STARTED]`
- [ ] axe-core audit clean `[NOT_STARTED]`

### W7.3 — Compatibility Testing & Documentation

- [ ] Chromium desktop verified `[NOT_STARTED]`
- [ ] Chromium Android verified `[NOT_STARTED]`
- [ ] Safari/iOS PWA tested, limitations documented `[NOT_STARTED]`
- [ ] Firefox desktop verified `[NOT_STARTED]`
- [ ] Browser support policy documented `[NOT_STARTED]`

### Phase 7 Exit Gate

- [ ] Performance budgets met (measured)
- [ ] WCAG 2.2 AA baseline met
- [ ] Browser compatibility documented
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test --run` passes

---

## Phase 8 — Enterprise / Production Readiness Gate

**Status:** NOT_STARTED  
**Branch:** `phase/8-enterprise-readiness`  
**Ref:** MASTER_PLAN.md § Phase 8  
**Blocked by:** Phases 0-7 exit gates

### W8.1 — CI/CD Pipeline

- [ ] GitHub Actions: lint, typecheck, tests, build on PR `[NOT_STARTED]`
- [ ] E2E on merge to main `[NOT_STARTED]`
- [ ] Quality gate enforcement `[NOT_STARTED]`

### W8.2 — Security Operations

- [ ] Secret management documented `[NOT_STARTED]`
- [ ] `pnpm audit` in CI `[NOT_STARTED]`
- [ ] Dependency vulnerability process documented `[NOT_STARTED]`
- [ ] Security headers verified `[NOT_STARTED]`
- [ ] SECURITY.md updated `[NOT_STARTED]`

### W8.3 — Observability

- [ ] Error reporting operational `[NOT_STARTED]`
- [ ] Source outage detection active `[NOT_STARTED]`
- [ ] API failure logging active `[NOT_STARTED]`

### W8.4 — Release Engineering

- [ ] Semantic versioning active `[NOT_STARTED]`
- [ ] CHANGELOG maintained `[BASELINE_PRESENT]`
- [ ] Deployment rollback tested `[NOT_STARTED]`
- [ ] SW release behavior documented `[NOT_STARTED]`

### W8.5 — Incident Readiness

- [ ] Severity categories defined `[NOT_STARTED]`
- [ ] Emergency procedures documented `[NOT_STARTED]`
- [ ] Incident process documented `[NOT_STARTED]`

### W8.6 — Documentation

- [ ] `docs/ARCHITECTURE.md` current `[BASELINE_PRESENT]`
- [ ] `docs/SECURITY_MODEL.md` created `[NOT_STARTED]`
- [ ] `docs/IDENTITY.md` created (Phase 1 output) `[NOT_STARTED]`
- [ ] `docs/SCHEMA.md` updated (all 12 stores) `[NOT_STARTED]`
- [ ] `docs/SYNC.md` created `[NOT_STARTED]`
- [ ] `docs/PWA.md` created `[NOT_STARTED]`
- [ ] `docs/TESTING.md` updated `[BASELINE_PRESENT]`
- [ ] `docs/DEPLOYMENT.md` created `[NOT_STARTED]`
- [ ] `docs/DISASTER_RECOVERY.md` created `[NOT_STARTED]`
- [ ] `CONTRIBUTING.md` updated `[BASELINE_PRESENT]`
- [ ] `GEMINI.md` updated (7→12 stores, etc.) `[NOT_STARTED]`
- [ ] Remove unused `@radix-ui/react-separator` (A2-D01) `[NOT_STARTED]`
- [ ] Annotate `pnpm-workspace.yaml` purpose (E10) `[NOT_STARTED]`

### Phase 8 Exit Gate — Enterprise-Ready Declaration

All items from MASTER_PLAN.md § Definition of Enterprise-Ready:

**Security:**
- [ ] All P0/P1 Audit 2 findings closed + regression-tested
- [ ] SSRF guard operational
- [ ] Dynamic source cache isolation proven
- [ ] Auth session isolation verified
- [ ] No fabricated health data
- [ ] Dynamic sources within trust boundaries
- [ ] Secret management follows process
- [ ] Dependency vulnerability process active

**Reliability:**
- [ ] Source failures degrade gracefully
- [ ] User state survives migrations
- [ ] Backup/restore integrity verified
- [ ] Offline reading regression-tested
- [ ] Dependency failure behavior defined and tested

**Testing:**
- [ ] Security regression tests in CI
- [ ] 10 critical E2E paths automated
- [ ] Coverage includes download engine, sync, dynamic sources
- [ ] All tests pass in CI

**Quality Gates:**
- [ ] CI enforces lint, typecheck, tests, security tests, build
- [ ] E2E on deploy pipeline
- [ ] Merge requires passing checks

**Performance:**
- [ ] Core Web Vitals within budget (measured)
- [ ] Reader performance profiled

**Accessibility:**
- [ ] WCAG 2.2 AA baseline met
- [ ] Keyboard navigation functional
- [ ] Reduced motion respected

**Operations:**
- [ ] Production observability operational
- [ ] Deployment rollback documented and tested
- [ ] Incident procedures defined

**Documentation:**
- [ ] Canonical documentation matches implementation
- [ ] All required documentation topics covered

---

## Implementation Notes

_This section is for runtime notes discovered during implementation. Add entries as needed._

| Date | Phase | Note |
|---|---|---|
| — | — | No implementation has begun yet |

---

## Amendments

_Track approved amendments to MASTER_PLAN.md here._

| Amendment ID | Date | Description | Affected Phases | Status |
|---|---|---|---|---|
| — | — | No amendments yet | — | — |

---

## Hotfixes

_Track emergency production fixes here._

| Branch | Date | Issue | Reconciled to Phase |
|---|---|---|---|
| — | — | No hotfixes yet | — |

---

*Tracker initialized from MASTER_PLAN.md v1.0 on 2026-09-13.*
