You are performing a second, evidence-based engineering audit of the Yomirra repository.

Do not implement or modify production code during this task.

Your output must be written to:

`audit_report_2.md`

The purpose of this audit is NOT to repeat the previous audit. It must independently verify the repository, reconcile the findings from the first audit, investigate several new architectural/security/product concerns, and produce a reliable baseline for the next development phase.

## Context

Project identity:

* Project: Yomirra
* Current production/deployed version
* Next-generation successor exists separately as Kioku, but Kioku is OUT OF SCOPE
* Yomirra is a Next.js manga reader / PWA with multiple manga sources, offline support, Firebase sync, search, reader modes, dynamic sources, and related features
* Target direction: evolve Yomirra toward a production-grade, world-class manga reader comparable in capability and UX maturity to established readers such as MangaDex, while preserving Yomirra's own architecture and product identity

A previous audit already exists:

`audit_report.md`

Do NOT assume its findings are still true or already solved.

Read it, then verify every material finding against the current repository.

---

# 1. Audit Method

Use evidence only from:

* repository files
* git history/status
* package manifests / lockfiles
* source code
* tests
* terminal commands
* configuration
* documentation
* actual runtime/build/test results when reasonably runnable

Do not infer implementation from filenames or documentation alone.

Use these classifications consistently:

* **Verified** — directly confirmed from code/runtime/files
* **Inference** — strongly suggested but not fully proven
* **Unknown** — cannot be verified
* **Proposal** — recommendation only

Never present an inference as a verified bug.

For every claimed bug, security issue, architectural flaw, or major enhancement opportunity, include concrete evidence such as:

* file path
* relevant function/module
* line range when practical
* execution/data flow
* reproduction condition
* command/test result when relevant

Avoid speculative security claims.

If a potential vulnerability cannot actually be reached from untrusted input, explicitly say so.

---

# 2. Reconcile `audit_report.md`

Read the entire first audit.

Create a reconciliation table containing every meaningful previous finding.

Use statuses:

* `CONFIRMED_OPEN`
* `RESOLVED`
* `PARTIALLY_RESOLVED`
* `INCORRECT`
* `SUPERSEDED`
* `UNVERIFIED`

For each item include:

| Previous ID | Previous Claim | Current Status | Evidence | Notes |

Specifically verify at minimum:

* B01 NSFW fail-open behavior
* B02 production console logging
* B03 Firestore history full scan
* B04 Firebase preferences listener lifecycle/leak
* B05 flaky search integration test
* B06 hardcoded source health stats
* B07 raw console usage in rate limiting
* B08 source-specific NSFW filtering behavior
* E01 `any` usage
* E02 rate-limit fail-open behavior
* E03 documentation drift
* E04 Firestore query design
* E05 missing test coverage
* E06 repeated Set construction
* E07 structured logger consistency
* E08 `ext/index.min.json`
* E09 possibly unused dependencies
* E10 `pnpm-workspace.yaml`

Do not assume E08 or any other item is resolved merely because the previous report says so. Verify current git/filesystem state.

---

# 3. Security & Trust Boundary Audit

Perform a focused audit of all server-controlled network access.

Trace every path involving:

* dynamic sources
* `manifestUrl`
* source installation
* source lookup/resolution
* source manifests
* source endpoint URLs
* image proxy
* proxy URL signing
* redirects
* server-side `fetch`
* user-controlled URLs
* source IDs
* Redis/cache keys

Explicitly determine whether Yomirra is vulnerable to or protected against:

### SSRF

Check whether untrusted users can cause the server to request:

* arbitrary HTTP/HTTPS URLs
* localhost
* `127.0.0.1`
* `::1`
* RFC1918 ranges
* link-local addresses
* cloud metadata endpoints
* internal services

Inspect redirect behavior too.

Do NOT mark SSRF as confirmed unless a complete reachable input → server fetch path exists.

### Dynamic source isolation

Verify:

* whether client-provided `manifestUrl` is trusted directly
* whether manifest ID must match requested source ID
* whether dynamic sources can impersonate built-in source IDs
* whether source origin/domain restrictions exist
* whether installed sources have trusted server-side identity
* whether manifests are re-fetched arbitrarily or resolved from trusted state

### Cache poisoning / namespace collision

Inspect all cache keys involving:

* `sourceId`
* manifest identity
* dynamic sources
* built-in sources
* search/popular/latest/detail/chapter routes

Determine whether two different source definitions can share the same cache namespace.

### Image proxy

Verify:

* HMAC implementation
* signature comparison
* URL validation
* host restrictions
* internal/private network access
* redirects
* cache behavior
* whether a malicious/dynamic source can cause the server to sign an unsafe image URL

Classify each result as:

* Confirmed vulnerability
* Defense present
* Partial defense
* Not reachable
* Unknown

---

# 4. Source Architecture Audit

Map the real source architecture.

Document:

* built-in source adapters
* dynamic source adapter
* registry
* source manager
* capabilities
* source preferences
* health system
* cache layer
* proxy requirements
* source installation/update flow

Answer:

1. What constitutes source identity?
2. Can multiple adapters represent the same manga?
3. Does source identity leak into user-facing domain models?
4. Can a manga switch sources without losing library/history/progress?
5. What happens if a source disappears?
6. Is source fallback supported?
7. Are capabilities explicitly modeled?
8. Are unsupported filters handled correctly?
9. Is there a reliable distinction between built-in and dynamic sources?

---

# 5. Canonical Domain Model Audit

Do not assume the previous roadmap is correct.

Inspect actual types and persistence models for:

* manga identity
* chapter identity
* library
* history
* reading progress
* bookmarks
* collections
* updates
* downloads

Determine whether identity is currently based on:

* source ID
* manga ID
* normalized title
* URL
* another scheme

Inspect deduplication logic carefully.

Test/reason about cases such as:

* alternate titles
* translated titles
* official vs scanlation titles
* punctuation differences
* same title from multiple sources
* duplicate titles for genuinely different works
* source migration

Determine whether a canonical title/chapter model is actually necessary.

If yes, explain the concrete user problems it would solve.

Do NOT propose a database/schema migration until current behavior is fully mapped.

---

# 6. Reader Engineering Audit

Treat the reader as a major product subsystem, not just a feature checklist.

Inspect:

* vertical reader
* paged reader
* LTR
* RTL
* virtualization
* image measurement
* image preloading
* decoding
* chapter prefetch
* scroll tracking
* progress persistence
* offline chapters
* gesture handling
* keyboard support
* wake lock
* chapter navigation
* error handling
* retries
* loading states
* image layout shift
* memory pressure
* next-chapter behavior

Explicitly investigate any dead or incomplete reader logic such as:

* observers with empty callbacks
* comments describing behavior that does not occur
* unused hooks
* incomplete seamless chapter loading

Do not recommend rewriting the reader unless evidence shows the architecture is fundamentally unsuitable.

Identify:

* what is already strong
* correctness problems
* performance risks
* UX gaps
* accessibility gaps
* missing reader modes/features

Separate:

`Required for reliability`

from:

`World-class enhancement`

---

# 7. UI/UX Product Audit

Audit the actual UI architecture and screenshots/assets where available.

Evaluate:

* information hierarchy
* navigation
* mobile ergonomics
* desktop density
* home page
* search
* manga detail
* library
* bookmarks
* source management
* updates
* downloads
* settings
* reader chrome
* empty/error/loading states

Do NOT judge only based on visual taste.

Evaluate against concrete UX goals:

* find manga quickly
* continue reading quickly
* identify new chapters
* understand reading progress
* understand source/language
* switch sources if needed
* manage library efficiently
* recover from source failures
* read comfortably on mobile and desktop

Use MangaDex or other mature readers only as capability/reference benchmarks.

Do not recommend cloning another product's visual design.

Identify Yomirra's strongest unique product positioning from the existing implementation.

---

# 8. Performance Audit

Inspect likely performance bottlenecks in:

* home feeds
* search
* library
* reader
* images
* dynamic imports
* bundle size
* React rendering
* Zustand subscriptions
* TanStack Query
* Firestore listeners
* Redis caching
* service worker
* offline cache
* large JSON assets

Look for:

* unnecessary rerenders
* duplicated requests
* N+1 requests
* excessive Firestore reads
* unbounded memory structures
* large client bundles
* repeated transformations
* expensive selectors
* cache-key problems
* unnecessary hydration

Do not report micro-optimizations unless they have meaningful impact.

---

# 9. State Management Audit

The previous report says there are approximately 12 stores.

Verify the actual number.

For every Zustand store document:

* responsibility
* persisted or volatile
* sync behavior
* overlap with other stores
* whether it should remain independent

Look specifically for:

* duplicated state
* cross-store coupling
* server state stored in Zustand that should belong in TanStack Query
* persistence conflicts
* auth-dependent state leaks
* excessive store fragmentation

Do NOT recommend merging stores merely to reduce the number.

---

# 10. Firebase & Sync Audit

Trace:

* authentication lifecycle
* initial sync
* realtime listeners
* cleanup
* user switch
* logout
* online/offline transitions
* conflict resolution
* write batching
* deletion
* history
* library
* preferences

Explicitly verify the previous listener-leak finding.

Check whether stale listeners can affect another authentication session.

Check Firestore query/index behavior.

Identify actual free-tier/cost risks based on access patterns.

---

# 11. PWA / Offline Audit

Verify:

* Serwist configuration
* service worker registration
* update lifecycle
* stale SW behavior
* chapter cache
* offline downloads
* storage limits
* eviction
* cache versioning
* cleanup
* offline navigation
* installability
* manifest
* icons/screenshots

Identify failure modes during deploy/version updates.

---

# 12. Testing Audit

Run the relevant existing test suite.

Record exact result.

Investigate failures rather than merely reporting them.

Assess coverage by subsystem, not raw test count.

Explicitly determine the current coverage status for:

* reader
* search
* library
* history
* downloads
* Firebase sync
* dynamic sources
* source registry
* API routes
* image proxy/security
* backup/restore
* PWA/offline behavior

Determine whether Yomirra currently has:

* unit tests
* integration tests
* browser E2E tests
* PWA/offline E2E tests

Recommend the smallest critical E2E suite necessary before major architecture changes.

Candidate critical paths:

1. Home → Search → Manga → Reader
2. Save manga → reload → library persists
3. Reader progress → reload/resume
4. Download chapter → offline read
5. Login → cloud sync → logout
6. Mobile vertical reader
7. Desktop paged reader
8. source failure degradation

Do not recommend tests solely to inflate coverage numbers.

---

# 13. Dependency / Tooling Audit

Verify:

* Next.js version
* React version
* pnpm version
* lockfile
* actual latest/stable version claims
* unused dependencies
* workspace configuration
* package manager configuration

Do not describe a major-version package-manager upgrade as "cosmetic".

Determine whether `pnpm-workspace.yaml` has a real purpose.

Do not upgrade dependencies during this audit.

---

# 14. Documentation Audit

Verify whether documentation matches reality.

Inspect at minimum:

* README
* GEMINI.md
* architecture docs
* design docs
* schema docs
* component docs
* testing docs
* source authoring docs

Separate documentation into:

* canonical project documentation
* contributor documentation
* temporary/agent artifacts

Do not treat documentation drift as equivalent in severity to runtime defects.

---

# 15. Roadmap Reassessment

Do NOT assume the current roadmap order remains correct.

The old roadmap reportedly contains:

1. Monitoring
2. Canonical Model
3. Source DSL
4. Landing Page

Evaluate whether this sequence still makes sense based on the actual current system.

Compare at least these candidate priorities:

* security/stabilization
* canonical identity
* source fallback/resolution
* reader improvements
* discovery/library UX
* source DSL/platform
* monitoring/alerting
* public landing page

Explain dependencies between them.

Monitoring may run in parallel if appropriate.

Do not propose rebuilding features that are already architecturally sound.

---

# 16. Severity Rules

Use:

### P0 — Critical

Security/privacy/data corruption/auth isolation issue that should block feature work.

### P1 — High

Reliability, architecture, correctness, major UX, or production issue with significant impact.

### P2 — Medium

Important tech debt, test gap, maintainability issue, or meaningful enhancement.

### P3 — Low

Cleanup, cosmetic engineering issue, documentation drift, minor optimization.

Do not classify:

* `console.log`
* small memoization opportunities
* documentation drift
* isolated `any` usage

above genuine security/correctness issues.

---

# 17. Required `audit_report_2.md` Structure

Produce exactly these major sections:

# Yomirra — Audit Report 2

## 1. Executive Verdict

Short, evidence-based assessment of current maturity.

Include:

* current engineering health
* current product maturity
* strongest subsystem
* weakest subsystem
* largest verified risk
* whether major feature development should continue immediately

## 2. Audit 1 Reconciliation

Full status table for previous findings.

## 3. Current Architecture Map

Concise architecture/data-flow map.

## 4. Verified Security Findings

Only verified/reproducible findings.

## 5. Source System Findings

## 6. Domain Model & Identity Findings

## 7. Reader Findings

Separate:

* strengths
* reliability gaps
* world-class enhancement opportunities

## 8. UI/UX Findings

## 9. State & Sync Findings

## 10. Performance Findings

## 11. PWA / Offline Findings

## 12. Testing Findings

Include exact test/build/typecheck results.

## 13. Documentation & Repository Hygiene

## 14. New Findings

Use IDs:

* `A2-Bxx` for bugs
* `A2-Sxx` for security
* `A2-Axx` for architecture
* `A2-Uxx` for UX
* `A2-Pxx` for performance
* `A2-Txx` for testing
* `A2-Dxx` for documentation/tooling

Each finding must contain:

| ID | Severity | Verification | Location | Finding | Impact | Recommended Direction |

## 15. False Positives / Rejected Concerns

Important.

Document investigated concerns that turned out NOT to be valid.

Examples:

* suspected SSRF but input unreachable
* suspected listener leak but cleanup exists
* suspected dependency unused but dynamically imported

This prevents future agents from repeatedly rediscovering disproven concerns.

## 16. Recommended Target Architecture

Only propose changes justified by the audit.

Separate:

* preserve
* refactor
* replace
* introduce

## 17. Revised Roadmap

Create phases with:

* objective
* concrete scope
* prerequisite
* acceptance criteria
* what is explicitly out of scope

Do not simply copy the existing roadmap.

## 18. Immediate Next Actions

Maximum 10 actions.

Order strictly by engineering/product impact.

## 19. Final Go / No-Go

Choose exactly one:

* `GO — feature development can continue`
* `CONDITIONAL GO — fix listed blockers first`
* `NO-GO — stabilization required before feature work`

Explain why.

---

# 18. Important Constraints

Do not:

* modify application code
* fix findings during the audit
* create speculative architecture disguised as fact
* assume previous findings are resolved
* inflate severity
* recommend complete rewrites without evidence
* judge product quality purely from docs
* treat lint/type cleanup as product architecture
* introduce paid infrastructure without clear necessity
* copy MangaDex architecture blindly

You may update only:

`audit_report_2.md`

At the end, report:

1. files inspected
2. commands executed
3. tests/build/typecheck results
4. areas not fully verifiable
5. final audit confidence: High / Medium / Low

The report must be sufficiently precise that another engineer can continue implementation without needing to repeat this audit.
