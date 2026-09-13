# MASTER_PLAN.md — Yomirra Engineering Master Plan

> **Version:** 1.0
> **Created:** 2026-09-13
> **Authority:** Long-lived architectural and execution contract for Yomirra
> **Baseline:** `audit_report_2.md` (2026-09-13) — current accepted engineering baseline
> **Status:** APPROVED / LOCKED

---

## Document Authority & Change-Control Policy

### Authority Hierarchy

```text
1. User's explicit request in the current conversation
2. MASTER_PLAN.md
3. audit_report_2.md
4. Canonical project documentation (docs/*.md, GEMINI.md)
5. AUDIT_REPORT.md — historical context only
```

`AUDIT_REPORT.md` remains preserved for historical traceability but is formally superseded as the active engineering baseline.

A repository-wide audit must not be repeated unless substantial implementation or architectural changes invalidate `audit_report_2.md`.

---

### Change-Control Model

#### Normal Implementation

Each phase gets its own branch:

```text
phase/0-security-correctness
phase/1-source-resilience
phase/2-personal-library
phase/3-reader-excellence
phase/4-discovery-search
phase/5-source-platform
phase/6-quality-reliability
phase/7-performance-accessibility
phase/8-enterprise-readiness
```

A phase branch may start only when all dependencies declared by that phase are satisfied.

Execution is sequential by default.

Parallel execution is permitted only where the dependency graph in this document explicitly allows it.

Phase 0 remains a hard security gate for all feature development.

---

#### New Scope Discovered Later

Do NOT silently rewrite `MASTER_PLAN.md`.

Create:

```text
amendment/MP-XXX-short-description
```

The amendment must document:

* new verified evidence;
* why the existing plan is insufficient;
* affected phases;
* compatibility and migration impact;
* security impact;
* infrastructure/cost impact;
* whether the change is a blocker or enhancement;
* proposed plan delta;
* rollback strategy.

Only merge an amendment after explicit approval.

No standalone amendment template file is required.

The actual amendment document may be created when needed, for example:

```text
MP-001.md
```

inside its amendment branch.

---

#### Small Implementation Findings

Normal bugs, refactors, implementation details, or additional tests that do not alter architecture or phase scope do NOT require a Master Plan amendment.

Track them in `EXECUTION_TRACKER.md` under the relevant phase.

---

#### Emergency Production Issue

Use:

```text
hotfix/<issue>
```

After the emergency fix is complete, reconcile it into the relevant phase and `EXECUTION_TRACKER.md`.

---

### Branch Execution Rules

Before implementation, agents must read:

```text
MASTER_PLAN.md
EXECUTION_TRACKER.md
audit_report_2.md
```

plus relevant canonical project documentation.

Agents may refine implementation tactics inside an approved phase.

Agents may NOT silently:

* reorder phases;
* expand architecture beyond approved scope;
* replace core technologies;
* introduce paid infrastructure;
* introduce a new database;
* rewrite major subsystems;
* change persistence semantics;
* replace the application's `/` routing model;
* introduce executable Dynamic Source code.

Any such change requires an approved amendment.

---

# Core Product Direction

Yomirra is a mobile-first, local-first, offline-capable, multi-source manga/webtoon reader.

The product should allow users to:

1. discover manga across multiple sources;
2. maintain durable personal reading state independent of source availability;
3. recover when a manga source disappears;
4. preserve reading progress when changing sources where mapping is possible;
5. read in vertical, paged LTR, and paged RTL modes;
6. download and read chapters offline;
7. synchronize supported user state safely across devices;
8. understand source availability honestly;
9. recover gracefully from source, network, storage, and sync failures.

MangaDex and other mature readers may be used as capability references.

They are not visual templates to clone.

---

## Locked Architectural Assets

The following existing foundations should be preserved and evolved unless new verified evidence proves they cannot support the target architecture.

| Asset                                   | Current Direction                          |
| --------------------------------------- | ------------------------------------------ |
| Next.js App Router                      | Preserve                                   |
| React                                   | Preserve                                   |
| Tailwind v4 CSS-first design foundation | Preserve                                   |
| Zustand                                 | Preserve for appropriate client/user state |
| TanStack Query                          | Preserve for remote/server state           |
| Firebase Auth + Firestore sync          | Preserve unless amendment proves otherwise |
| Redis caching                           | Preserve unless amendment proves otherwise |
| Local-first behavior                    | Core product principle                     |
| PWA + Serwist                           | Preserve                                   |
| Virtualized continuous reader           | Preserve and refine                        |
| Paged reader LTR/RTL                    | Preserve and refine                        |
| Multi-source adapter architecture       | Preserve and harden                        |
| Offline Cache API download engine       | Preserve and strengthen                    |
| Existing design-system tokens           | Preserve                                   |
| Existing motion system                  | Preserve                                   |

Do NOT propose a rewrite merely because a subsystem could theoretically be redesigned.

Reader and Offline Download Engine are explicitly considered strong baseline assets.

---

# Constraints

| Constraint                          | Policy                                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Free-tier-first                     | Prefer free infrastructure where it satisfies requirements                                                              |
| No new database by default          | Preserve current local-first/Firebase/Redis architecture unless an amendment proves another persistence layer necessary |
| No heavy Docker requirement         | Local development remains lightweight                                                                                   |
| PWA-first                           | No native Android/iOS requirement                                                                                       |
| No billing/monetization             | Out of scope                                                                                                            |
| No arbitrary dynamic code execution | Dynamic Sources remain declarative                                                                                      |
| Secure client/server boundaries     | Non-negotiable                                                                                                          |
| Backward compatibility              | Existing Library/History/Collections/Downloads must not be silently destroyed                                           |
| Privacy of private sources          | Private source configuration must never be exposed to public git                                                        |

A future database is not permanently forbidden.

If concrete persistence, integrity, scale, or operational evidence proves one necessary, it must be introduced through an approved Master Plan amendment including migration, rollback, cost, and compatibility analysis.

---

# Definition of “Enterprise-Ready”

Enterprise-ready means engineering maturity.

It does NOT mean enterprise monetization.

It includes:

* security;
* reliability;
* data safety;
* maintainability;
* observability;
* accessibility;
* measured performance;
* automated testing;
* CI/CD gates;
* release safety;
* dependency governance;
* incident response;
* deployment and rollback procedures;
* accurate canonical documentation.

---

# Cross-Cutting Architecture Decisions

## State Ownership Model

| Domain                                                   | Owner          | Persistence         | Cloud Sync              |
| -------------------------------------------------------- | -------------- | ------------------- | ----------------------- |
| Source data: popular/latest/search/detail/chapters/pages | TanStack Query | Query cache         | No                      |
| Library                                                  | Zustand        | localStorage        | Firestore               |
| History                                                  | Zustand        | localStorage        | Firestore               |
| Collections                                              | Zustand        | localStorage        | Current baseline: local |
| Reader preferences                                       | Zustand        | localStorage        | No                      |
| App/device settings                                      | Zustand        | localStorage        | As currently supported  |
| Source preferences                                       | Zustand        | localStorage/cookie | Firestore               |
| Update tracking                                          | Zustand        | localStorage        | Current baseline: local |
| Download queue/status                                    | Zustand        | localStorage        | No                      |
| Downloaded chapter binaries                              | Cache API      | Browser storage     | No                      |
| Search filters                                           | Zustand        | Volatile            | No                      |
| Library filters                                          | Zustand        | Volatile            | No                      |
| Route state                                              | Zustand        | Volatile            | No                      |
| Session statistics                                       | Zustand        | Volatile            | No                      |

### Rule

Do not duplicate ordinary server state into persisted Zustand when TanStack Query already owns it.

New stores require a clear state-ownership reason.

---

## User-Scoped vs Device-Scoped State

Every persisted store must eventually be classified as one of:

```text
USER_SCOPED
DEVICE_SCOPED
SESSION_OR_VOLATILE
```

Authentication changes must only clear or replace state that is actually user-scoped.

Device preferences and downloaded offline data must not be deleted merely because a user logs out unless their ownership semantics explicitly require it.

---

# Schema Evolution Policy

All persisted state must evolve through explicit versioning.

This includes:

* localStorage;
* Firestore;
* Cache API metadata;
* backup files.

Rules:

* schema changes must have explicit versions;
* migrations must be deterministic;
* migrations must be idempotent where practical;
* existing data must remain recoverable;
* failed migrations must preserve original data;
* destructive silent migration is forbidden;
* backup/restore must understand supported historical versions;
* migration tests must use real legacy fixtures.

Current identifiers such as:

```text
sourceId::mangaId
sourceId::mangaId::chapterId
```

are legacy compatibility inputs.

They are NOT permanently locked as Yomirra's future canonical identity representation.

---

# Security Boundary Map

```text
┌─────────────────────────────────────────────────┐
│ BROWSER — UNTRUSTED                              │
│                                                  │
│ React UI                                         │
│ Zustand/localStorage                             │
│ Firebase client SDK                              │
│ Service Worker / Cache API                       │
│ Dynamic Source user configuration                │
├──────────────── TRUST BOUNDARY ──────────────────┤
│ NEXT.JS SERVER                                   │
│                                                  │
│ API routes                                       │
│ Rate limiting                                    │
│ Source Manager                                   │
│ Outbound Request Policy / SSRF Guard             │
│ Image Proxy                                      │
├──────────────── TRUST BOUNDARY ──────────────────┤
│ EXTERNAL — UNTRUSTED                             │
│                                                  │
│ Manga providers                                  │
│ Dynamic Source manifests                         │
│ Dynamic Source endpoints                         │
│ Image hosts                                      │
├──────────────── MANAGED SERVICES ────────────────┤
│ Redis                                            │
│ Firebase / Firestore                             │
│ Vercel                                           │
└─────────────────────────────────────────────────┘
```

Untrusted inputs include:

* `sourceId`;
* `mangaId`;
* `chapterId`;
* `manifestUrl`;
* pagination;
* search query;
* filters;
* image proxy `url`;
* Dynamic Source manifests;
* upstream response payloads.

---

# Error Taxonomy

Canonical categories:

| Code                   | Meaning                                            |
| ---------------------- | -------------------------------------------------- |
| `SOURCE_UNAVAILABLE`   | Source cannot currently serve the request          |
| `SOURCE_RATE_LIMITED`  | Upstream source rejected request due to rate limit |
| `SOURCE_MALFORMED`     | Source response failed normalization/validation    |
| `NETWORK_UNAVAILABLE`  | Network connectivity unavailable                   |
| `AUTH_REQUIRED`        | User authentication required                       |
| `AUTH_SESSION_CHANGED` | Authentication context changed during an operation |
| `STORAGE_QUOTA`        | Browser storage capacity exceeded                  |
| `OFFLINE_MISS`         | Requested offline content is unavailable           |
| `SYNC_FAILED`          | Cloud synchronization failed                       |
| `VALIDATION_FAILED`    | Input failed schema validation                     |
| `SECURITY_REJECTED`    | Request violates trust/security policy             |
| `NOT_FOUND`            | Requested entity does not exist                    |
| `INTERNAL_ERROR`       | Unexpected internal failure                        |

Do not expose raw stack traces, secrets, or unnecessary upstream response bodies to clients.

---

# Phase 0 — Security & Correctness Gate

**Branch:** `phase/0-security-correctness`

## Objective

Close verified security, session-isolation, privacy, and correctness defects before feature expansion.

Phase 0 is a hard blocker.

---

## Current Evidence

| Finding                                                | Severity                 |
| ------------------------------------------------------ | ------------------------ |
| A2-S01 — Dynamic Source outbound SSRF path             | P0                       |
| A2-S02 — Built-in source impersonation/cache poisoning | P0                       |
| A2-S03 — Image Proxy unsafe outbound path              | P1                       |
| A2-S04 — auth/session cross-contamination              | P1                       |
| B01 — NSFW filter fail-open                            | High correctness/privacy |
| B03/E04 — Firestore history full scan                  | Medium                   |
| A2-B02 — dead Service Worker matcher                   | Medium                   |

---

## W0.1 — Dynamic Source Identity Isolation

Requirements:

* Built-in source IDs are reserved.
* Dynamic manifests cannot execute under a built-in source identity.
* `manifest.id` must match the expected Dynamic Source identity.
* Built-in and Dynamic Sources must have explicit runtime classification.
* Invalid/mismatched source identity returns `SECURITY_REJECTED`.

---

## W0.2 — Outbound Request Security Policy

Introduce a reusable server-side outbound request policy.

It must validate before outbound requests:

* allowed protocols;
* malformed URL input;
* embedded URL credentials;
* localhost;
* IPv4 loopback;
* IPv6 loopback;
* RFC1918/private IPv4;
* link-local;
* unsafe IPv6 ranges;
* cloud/internal metadata destinations.

Requirements:

* DNS resolution validation;
* redirect destination revalidation;
* bounded redirect count;
* request timeout/abort;
* safe typed failures.

No security implementation should depend solely on hostname string checks.

---

## W0.3 — Dynamic Source Cache Isolation

Dynamic cache namespace must be cryptographically/stably tied to trusted validated Dynamic Source identity.

Concept:

```text
source:dynamic:${manifestFingerprint}:${sourceId}:${operation}:${params}
```

`manifestFingerprint` must be derived from validated Dynamic Source identity/version/content or another trusted stable descriptor.

It must NOT depend solely on raw `manifestUrl`.

Built-in namespace remains distinct:

```text
source:${sourceId}:${operation}:${params}
```

Dynamic Sources must never write into built-in cache namespaces.

---

## W0.4 — Image Proxy Hardening

Image proxy flow:

1. verify signed request;
2. validate target URL using outbound security policy;
3. validate redirects;
4. enforce timeout/size protections;
5. validate expected media response;
6. stream response.

A valid HMAC signature does not make an outbound destination safe.

---

## W0.5 — Authentication Lifecycle Isolation

Classify persisted state as:

```text
USER_SCOPED
DEVICE_SCOPED
SESSION_OR_VOLATILE
```

Verified current user-scoped candidates include:

* `library-store`;
* `history-store`;
* `collection-store`;
* `source-preferences-store`;
* `update-store`.

Logout or UID change must:

* unsubscribe previous Firestore listeners;
* prevent stale async callbacks from mutating new session state;
* clear or replace confirmed user-scoped state;
* preserve device-scoped preferences/downloads unless explicitly user-owned.

Do not indiscriminately clear every Zustand store.

---

## W0.6 — NSFW Fail-Closed

Replace ambiguous NSFW data state with explicit states:

```text
LOADING
KNOWN
UNKNOWN_OR_ERROR
```

When Hide NSFW is enabled:

1. use current verified classification when available;
2. otherwise use last-known-good classification;
3. unknown classification must not silently become safe.

`[]` must not mean both “no NSFW sources exist” and “request failed”.

Memoize derived Set values where appropriate.

---

## W0.7 — Firestore History Query

Replace collection-wide deletion scans with a server-filtered query using the necessary fields.

Verify:

* correct manga history deleted;
* unrelated history untouched;
* query/index requirements documented;
* read amplification removed.

---

## W0.8 — Service Worker Cache Contract

The audit only proved that `/api/manga` is a dead matcher.

Phase 0 must determine which source metadata routes are actually safe and useful to runtime-cache.

Replace the dead matcher with an explicit allowlist/matcher covering only appropriate public GET metadata.

Do NOT blanket-cache all `/api/sources/*` routes.

Review:

* authentication;
* Dynamic Source identity;
* response volatility;
* privacy;
* cache invalidation;
* offline value.

---

## W0.9 — Security Regression Suite

Required coverage:

* built-in source override;
* mismatched `manifest.id`;
* private IPv4;
* loopback;
* link-local;
* unsafe IPv6;
* redirect-to-private;
* unsupported protocol;
* cache namespace collision;
* image proxy unsafe destination;
* auth listener teardown;
* User A → User B isolation;
* NSFW unknown/error state;
* scoped Firestore deletion;
* Service Worker matcher behavior.

---

## Data / Migration Impact

No core user-domain migration is expected.

Dynamic cache namespace changes may invalidate old cache entries.

Old Dynamic Source cache entries may expire naturally or be purged safely.

---

## UX Impact

Expected visible changes:

* unknown NSFW classification may hide content conservatively;
* session changes clean user-specific state correctly;
* unsafe Dynamic Sources may be rejected.

---

## Phase 0 Acceptance Criteria

* [ ] Built-in source impersonation impossible
* [ ] Dynamic Source identity validated
* [ ] Built-in and Dynamic Source caches cannot collide
* [ ] Unsafe outbound destinations blocked
* [ ] Redirect targets revalidated
* [ ] Image proxy uses outbound security policy
* [ ] Auth listeners fully cleaned on UID change/logout
* [ ] User A state cannot contaminate User B session
* [ ] NSFW cannot fail open
* [ ] Firestore history deletion scoped
* [ ] SW cache matcher intentionally defined
* [ ] Security regression suite passes
* [ ] `pnpm typecheck` passes
* [ ] `pnpm test --run` passes
* [ ] `pnpm build` passes
* [ ] No Phase 0 P0/P1 remains open

---

## Exit Gate

Phase 1 cannot begin until the Phase 0 Acceptance Criteria are verified.

---

## Explicitly Out of Scope

* Reader feature expansion
* Personal Library redesign
* Search redesign
* Dynamic Source SDK/DSL expansion
* cosmetic UI polish

---

## Rollback / Recovery

Security controls must never be rolled back into a known-vulnerable state.

If a Phase 0 change causes production regression:

1. disable Dynamic Sources or the affected capability;
2. revert to the last known secure implementation;
3. preserve built-in source isolation;
4. keep unsafe outbound behavior blocked;
5. restore functionality only after correcting the regression.

Obsolete cache keys may expire naturally or be purged.

---

# Phase 1 — Source Resilience & Identity Foundation

**Branch:** `phase/1-source-resilience`

**Dependency:** Phase 0

## Objective

Separate durable user reading identity from the availability of one manga source.

---

## Current Evidence

Current Library and History identities are source-centric.

Cross-source deduplication and migration do not currently exist.

When a source disappears, saved data remains but becomes operationally dead.

---

## W1.0 — Identity Architecture Decision

Before modifying persisted user state, define and document:

* stable saved-title identity;
* source-reference identity;
* Library relationship;
* History relationship;
* Collections relationship;
* Updates relationship;
* Download relationship;
* Firestore representation;
* localStorage representation;
* backup representation;
* legacy-key migration;
* rollback strategy.

Existing:

```text
sourceId::mangaId
sourceId::mangaId::chapterId
```

must remain readable and migratable.

They are compatibility inputs, not permanently locked canonical identities.

---

## W1.1 — Title Normalization

Develop deterministic title normalization based on available metadata.

Potential signals include:

* Unicode normalization;
* case;
* punctuation;
* whitespace;
* aliases/alternate titles;
* author overlap;
* language;
* provider metadata.

Do not rely only on raw normalized title equality.

---

## W1.2 — Matching Confidence

Matcher must produce explicit confidence states such as:

```text
EXACT_CONFIRMED
HIGH_CONFIDENCE
AMBIGUOUS
NO_MATCH
```

Ambiguous matches require user confirmation.

A matcher must never silently merge uncertain works.

---

## W1.3 — Source References

A durable saved title should support:

* primary source reference;
* alternate source references;
* source availability state;
* legacy references;
* match provenance/confidence.

Exact persisted field names are decided by W1.0.

Do not begin by assuming `alternateSourceLinks` is necessarily the final schema.

---

## W1.4 — Chapter Mapping

Progress migration may use available information such as:

* normalized chapter number;
* volume;
* chapter title;
* special/extra classification.

Ambiguous progress must never silently jump.

---

## W1.5 — Relink / Migrate Flow

When a source becomes unusable:

* preserve existing saved title;
* search alternate enabled sources;
* show candidate matches;
* show confidence;
* require user confirmation when not exact;
* map reading progress where safe;
* retain unmatched historical records.

---

## W1.6 — Persisted-State Migration

Requirements:

* explicit version increment;
* idempotent migration;
* legacy fixture tests;
* no duplicate titles after repeated migration;
* existing Firestore data remains recoverable;
* backup/restore compatibility;
* rollback/recovery path.

---

## W1.7 — Dead Source Recovery

Unavailable title must remain inspectable.

Provide:

* cached metadata;
* source status;
* retry;
* Find Alternate Source;
* relink;
* offline chapter access where available.

Transient source outage must never automatically destroy or migrate data.

---

## Data / Migration Impact

Phase 1 may change persisted identity semantics.

Any representation must be chosen only after W1.0.

No heavy relational database is introduced by default.

A database may only be introduced through an approved amendment with evidence.

---

## Testing Strategy

Required:

* normalization tests;
* matching-confidence tests;
* false-positive tests;
* chapter mapping tests;
* migration tests;
* repeated migration/idempotency tests;
* legacy fixture tests;
* backup compatibility tests;
* source-relink integration tests.

---

## Acceptance Criteria

* [ ] Identity ADR completed
* [ ] Durable title identity separated from current source
* [ ] Legacy keys remain readable/migratable
* [ ] Matching confidence deterministic
* [ ] Ambiguous matches require confirmation
* [ ] Dead source recovery available
* [ ] Relink preserves safe progress
* [ ] Collections remain intact
* [ ] Migration idempotent
* [ ] Backup/restore compatible
* [ ] typecheck/tests/build pass

---

## Exit Gate

Phase 2 may start after the durable title/source relationship and migration contract are stable.

Phase 4 may also begin after this contract is stable.

---

# Phase 2 — Personal Library UX

**Branch:** `phase/2-personal-library`

**Dependency:** Phase 1

## Objective

Create one coherent personal reading hub based on Phase 1 identity.

---

## Canonical Information Architecture

`/library` becomes the canonical personal hub.

Legacy `/bookmark` remains compatible through redirect/alias during migration.

Library owns:

* Saved;
* Continue Reading;
* History;
* Collections;
* Updates;
* source recovery.

---

## W2.1 — Information Architecture

Eliminate duplicated Library vs Bookmark mental models.

---

## W2.2 — Route Compatibility

* preserve old URLs;
* redirect legacy `/bookmark`;
* update navigation consistently.

---

## W2.3 — Saved Titles

Support:

* search;
* sort;
* status;
* collections;
* source recovery;
* unread/new chapter signals.

---

## W2.4 — Continue Reading

Show:

* last-read chapter;
* progress;
* resume action;
* offline availability;
* basic source availability/recovery state.

---

## W2.5 — History

Represent:

* title;
* chapter;
* timestamp;
* progress;
* source provenance.

---

## W2.6 — Collections

Collections should reference durable saved-title identity rather than one provider-specific manga identity.

---

## W2.7 — Updates

Updates should group around durable title identity while retaining source provenance.

---

## W2.8 — Source Availability UX

Before Phase 5 telemetry exists, supported states are limited to trustworthy runtime knowledge:

```text
AVAILABLE
UNAVAILABLE
UNKNOWN
RECOVERY_REQUIRED
```

Do not display invented:

* latency;
* uptime;
* “slow” status;
* last checked time.

Those belong to Phase 5 after real telemetry exists.

---

## W2.9 — Responsive UX

Mobile:

* thumb-friendly actions;
* clear information hierarchy;
* compact cards.

Desktop:

* increased information density;
* keyboard efficiency;
* responsive filters/layout.

---

## Testing Strategy

* route compatibility;
* Library state rendering;
* Continue Reading;
* History;
* Collections;
* source unavailable state;
* relink entry points;
* responsive smoke tests;
* accessibility smoke.

---

## Acceptance Criteria

* [ ] one canonical personal hub
* [ ] `/bookmark` remains compatible
* [ ] no duplicated Library/Bookmark concept
* [ ] Continue Reading usable
* [ ] collections use durable title identity
* [ ] unavailable source recoverable
* [ ] no fabricated health status
* [ ] mobile/desktop flows verified
* [ ] typecheck/tests/build pass

---

# Phase 3 — Reader Excellence

**Branch:** `phase/3-reader-excellence`

**Dependencies:** Phase 0 + Phase 1

## Objective

Strengthen the existing Reader without replacing its proven architecture.

---

## Preserve

* vertical virtualization;
* paged reader;
* LTR/RTL;
* gesture architecture;
* offline image architecture.

---

## Reliability Requirements

### W3.1 — Dead Logic Cleanup

Resolve:

* empty `IntersectionObserver`;
* unfinished stream divider logic;
* obsolete/dead reader code.

---

### W3.2 — Source-Aware Reporting

Remove hardcoded Shinigami Discord behavior.

Reporting must be:

* source-aware when source supports it;
* otherwise Yomirra-generic.

---

### W3.3 — Image Failure Recovery

Per-image behavior:

* loading;
* retry;
* bounded retry/backoff;
* final error state.

---

### W3.4 — Progress Reliability

Verify:

* navigation;
* reload;
* app background;
* offline/online;
* source relink.

---

### W3.5 — Offline Reader Reliability

Verify:

* fully downloaded chapter;
* partially downloaded state;
* cache miss;
* unavailable upstream.

---

## World-Class Enhancement Decision Gates

### W3.6 — Desktop Double Spread

Evaluate and, if justified, implement:

* LTR;
* RTL;
* odd pages;
* wide pages;
* chapter boundaries.

---

### W3.7 — Keyboard Navigation

Expected:

* arrow navigation for paged mode;
* useful vertical-reader keyboard controls;
* Escape for overlays/fullscreen.

---

### W3.8 — Seamless Multi-Chapter Reading

Do not automatically ship.

Prototype and evaluate:

* memory;
* URL semantics;
* progress;
* accessibility;
* navigation;
* low-end device behavior.

Outcome must be explicitly:

```text
IMPLEMENTED
DEFERRED
REJECTED
```

---

### W3.9 — Tap Zones

Decision gate.

Implement only if justified by UX evidence.

---

### W3.10 — Fullscreen

Decision gate based on actual reader UX benefit and browser support.

---

### W3.11 — Reader Performance Investigation

Measure existing fixed virtualizer estimate before changing it.

`A2-P01` remains an inference until measurable user-visible impact is reproduced.

---

## Acceptance Criteria

* [ ] reader dead logic removed/resolved
* [ ] source-aware reporting
* [ ] reliable image retry/error handling
* [ ] progress persistence verified
* [ ] offline regression tests pass
* [ ] keyboard navigation baseline works
* [ ] every enhancement decision gate has explicit evidence-backed outcome
* [ ] any shipped enhancement has regression coverage
* [ ] no measurable major Reader regression
* [ ] typecheck/tests/build pass

No arbitrary requirement exists to ship an enhancement merely to declare Phase 3 complete.

---

# Phase 4 — Discovery & Search Excellence

**Branch:** `phase/4-discovery-search`

**Dependency:** Phase 1

## Objective

Turn parallel source discovery into a coherent multi-source experience.

---

## W4.1 — Capability-Aware Filters

Model source filtering capabilities.

Do not send unsupported filters blindly.

Users should be able to understand when a selected source cannot satisfy a filter.

---

## W4.2 — Cross-Source Grouping

Use Phase 1 identity/matching contracts.

Do not hard merge ambiguous works.

---

## W4.3 — Ranking

Ranking should be deterministic and source-neutral.

Potential signals:

* title relevance;
* alias match;
* language preference;
* enabled-source preference;
* availability.

Source speed alone must not determine relevance.

---

## W4.4 — Partial Failure

A failing provider must not break the entire search.

Expose:

* successful source results;
* failed source state;
* targeted retry.

---

## W4.5 — Source / Language Visibility

Show meaningful source and language context where available.

---

## W4.6 — Discovery Feeds

Popular/latest must:

* retain source attribution;
* degrade gracefully;
* remain useful when one provider is unavailable.

---

## W4.7 — Search UX

Improve:

* loading;
* empty;
* partial failure;
* active filters;
* result grouping.

Search history is NOT a required roadmap item.

It may be added later only through evidence-backed product scope.

---

## W4.8 — NSFW Policy

Apply Phase 0 classification semantics consistently to search/discovery.

---

## Acceptance Criteria

* [ ] unsupported filters not silently sent
* [ ] capability-aware UI
* [ ] partial provider outage does not break search
* [ ] source/language context visible
* [ ] grouping uses Phase 1 identity safely
* [ ] ambiguous works remain distinguishable
* [ ] deterministic ranking
* [ ] typecheck/tests/build pass

---

# Phase 5 — Source Platform & Observability

**Branch:** `phase/5-source-platform`

**Dependencies:** Phase 0 + stable Phase 1 identity

Full integration follows Phases 2–4.

Observability work may start earlier if operationally useful.

---

## Objective

Turn Dynamic Sources into a hardened extension platform and replace fake source health with real operational evidence.

---

## W5.1 — Runtime Dynamic Source Identity

Normal runtime operation should stop depending on arbitrary raw `manifestUrl`.

Preferred lifecycle:

```text
install/import
→ validate
→ derive trusted source identity/fingerprint
→ runtime source usage
```

Exact persistence mechanism is decided here.

A new database still requires amendment approval.

---

## W5.2 — Manifest Governance

Manifest contract should define:

* source ID;
* version;
* capabilities;
* endpoints;
* allowed origins;
* proxy requirements;
* classification metadata;
* update metadata.

---

## W5.3 — Source Lifecycle

Support safe:

* install;
* validate;
* enable;
* disable;
* update;
* incompatible version handling;
* uninstall;
* cache cleanup;
* last-known-good fallback.

---

## W5.4 — SDK / DSL Decision

A DSL is not automatically required.

First evaluate whether the manifest model can safely satisfy real source requirements.

If a DSL is justified, it remains declarative:

* no `eval`;
* no arbitrary JavaScript;
* no filesystem;
* no environment/secret access;
* constrained network access.

---

## W5.5 — Real Health Monitoring

Replace hardcoded health values with real measurements.

Allowed display data only when measured:

* status;
* latency;
* checked-at timestamp;
* recent failure.

Never fabricate uptime.

Historical uptime is only shown once actual historical samples exist.

---

## W5.6 — Structured Logging

Standardize relevant server logs.

Log categories may include:

* source;
* cache;
* authentication;
* sync;
* proxy;
* security.

Do not log secrets or unnecessary personal reading history.

---

## W5.7 — Alerting

Free-tier-compatible Telegram alerting may cover:

* repeated source outage;
* recovery;
* significant degradation;
* platform degradation.

Alert on meaningful state transitions, not every failed request.

---

## W5.8 — Redis / Rate-Limit Degradation Policy

Audit E02 must be solved through explicit design, not merely documented.

Determine per endpoint whether Redis/rate-limiter failure should:

```text
FAIL_OPEN
FAIL_CLOSED
DEGRADE_WITH_LOCAL_FALLBACK
```

based on abuse/security impact and availability requirements.

---

## W5.9 — Firebase / Sync Degradation Visibility

Expose meaningful sync failure state without breaking local-first reading.

---

## W5.10 — Marketing / Landing Decision

Remains undecided.

Possible future options:

```text
/ stays app home + /about
dedicated marketing domain
/ marketing + /app application
```

No option is preselected.

Changing root routing materially requires an amendment/product decision.

---

## Acceptance Criteria

* [ ] trusted runtime Dynamic Source identity exists
* [ ] raw arbitrary manifest URL is not normal runtime identity
* [ ] source lifecycle safe
* [ ] SDK/DSL decision documented
* [ ] hardcoded fake health removed
* [ ] health UI derives from real measurements
* [ ] logging structured
* [ ] alerting operational if configured
* [ ] Redis/rate-limit failure policy explicit and tested
* [ ] Firebase degradation behavior visible
* [ ] typecheck/tests/build pass

---

# Phase 6 — Quality, Reliability & Data Safety

**Branch:** `phase/6-quality-reliability`

**Dependency:** Functional Phases 0–5

## Objective

Protect critical application behavior through deterministic automated tests, migrations, backups, and defined failure handling.

---

## W6.1 — Unit Coverage Expansion

Prioritize currently weak/high-risk areas:

* Download Engine;
* Firebase sync;
* Dynamic Sources;
* identity/linker;
* migration utilities;
* backup/restore.

---

## W6.2 — Integration Coverage

Cover:

* API source resolution;
* cache behavior;
* sync/store interaction;
* source relinking;
* user switching.

---

## W6.3 — Security Regression Tests

Phase 0 regression suite becomes permanent CI coverage.

---

## W6.4 — Critical Browser E2E

Required critical paths:

1. Home → Search → Manga → Reader
2. Save → reload → Library
3. progress → reload → resume
4. Download → offline → read
5. User A → logout → User B
6. mobile vertical reader
7. desktop paged reader
8. partial source outage
9. dead source → alternate source recovery
10. backup → restore

---

## W6.5 — Persisted Schema Versioning

All persisted schemas receive explicit migration governance.

Do not invent migrations merely for consistency if a store never needs schema evolution.

---

## W6.6 — Backup / Restore

Backup processing must:

* validate before applying;
* preserve old supported formats;
* reject unsupported future versions safely;
* reject malformed data;
* avoid partial destructive restore.

---

## W6.7 — Failure Engineering

Required failure contracts:

| Failure                      | Required Direction                          |
| ---------------------------- | ------------------------------------------- |
| Firebase unavailable         | Local reading continues; sync pauses safely |
| Redis unavailable            | Follow Phase 5 degradation policy           |
| One source unavailable       | Other sources remain usable                 |
| All sources unavailable      | Cached/offline reading remains accessible   |
| Image host unavailable       | Bounded retry + error state                 |
| Storage quota exhausted      | Downloads pause safely; no data corruption  |
| Service Worker stale/corrupt | Recovery/update path exists                 |
| Download interrupted         | resumable/recoverable state                 |
| Auth expired                 | local state preserved; re-auth supported    |

---

## W6.8 — Risk-First Type Debt

Do NOT run a blind zero-`any` campaign.

Prioritize type debt affecting:

* security;
* Dynamic Source contracts;
* sync;
* migrations;
* filters;
* adapter normalization.

---

## W6.9 — Repository Hygiene

Resolve verified low-risk debt where appropriate:

* unused dependencies;
* ambiguous workspace config;
* stale code/config.

---

## Acceptance Criteria

* [ ] Download Engine tests
* [ ] Firebase sync tests
* [ ] Dynamic Source tests
* [ ] migration tests
* [ ] backup/restore tests
* [ ] 10 critical E2E flows
* [ ] failure contracts implemented/tested
* [ ] no release-blocking flaky tests
* [ ] typecheck/tests/build/E2E pass

---

# Phase 7 — Performance, Accessibility & Compatibility

**Branch:** `phase/7-performance-accessibility`

**Dependency:** Phase 6

## Objective

Measure and enforce real performance, accessibility, and browser compatibility.

---

## W7.1 — Performance Baseline

Measure representative:

* Home;
* Search;
* Library;
* Manga detail;
* vertical reader;
* paged reader;
* offline reader.

---

## W7.2 — Core Web Vitals Targets

Measured at p75 where representative field data is available:

| Metric | Good Threshold |
| ------ | -------------: |
| LCP    |        ≤ 2.5 s |
| INP    |       ≤ 200 ms |
| CLS    |         ≤ 0.10 |

These are baseline quality thresholds.

Yomirra may later adopt stricter internal stretch targets, but those must be labeled as project targets rather than Web Vitals standards.

---

## W7.3 — Reader Profiling

Measure before refactoring:

* virtualizer measurement correction;
* image decode;
* prefetch concurrency;
* memory growth;
* zoom;
* long chapters;
* offline chapters.

Only then resolve `A2-P01`.

---

## W7.4 — Large Data Profiling

Test:

* 1,000 Library items;
* 1,000 History entries;
* many Collections;
* long chapters;
* concurrent source search.

---

## W7.5 — Bundle / Runtime Analysis

Verify:

* heavy dependencies remain code-split where appropriate;
* hydration is reasonable;
* no new major bundle regressions.

---

## W7.6 — Accessibility

Target WCAG 2.2 AA where applicable.

Required review:

* keyboard;
* focus;
* semantics;
* dialogs/drawers;
* labels;
* contrast;
* error/status announcements;
* reduced motion;
* zoom;
* Reader controls.

WCAG 2.2 AA target-size requirements are mandatory.

Yomirra's design target for primary mobile touch controls is:

```text
44 × 44 CSS px where practical
```

This is a Yomirra UX target, not a claim that WCAG AA universally requires 44×44.

---

## W7.7 — Browser / Device Compatibility

Primary:

* Chromium desktop;
* Chromium Android.

Secondary/best-effort:

* Firefox desktop;
* Safari/iOS PWA;
* other relevant modern browsers.

Platform limitations must be documented honestly.

Do not promise universal feature parity where browser/platform restrictions make it impossible.

---

## Acceptance Criteria

* [ ] performance baseline recorded
* [ ] CWV thresholds met or explicit evidence-backed exception approved
* [ ] Reader memory behavior bounded
* [ ] large Library responsive
* [ ] no critical/serious accessibility blocker in core flows
* [ ] keyboard/focus verified
* [ ] reduced motion verified
* [ ] browser matrix documented
* [ ] typecheck/tests/build/E2E pass

---

# Phase 8 — Production / Enterprise Readiness

**Branch:** `phase/8-enterprise-readiness`

**Dependency:** Phase 7

## Objective

Establish final release, CI/CD, security operations, observability, incident response, dependency governance, and canonical documentation.

---

## W8.1 — CI/CD Quality Gates

Required release checks:

```text
lockfile install
lint
typecheck
unit/integration tests
security regression tests
build
critical E2E
```

Define which checks block:

* PR merge;
* staging deploy;
* production deploy.

---

## W8.2 — Dependency Governance

Define:

* lockfile policy;
* upgrade cadence;
* major upgrade process;
* vulnerability response;
* unused dependency cleanup.

Do not combine unrelated major dependency upgrades with architecture migration.

---

## W8.3 — Secrets & Environment

Requirements:

* `.env.example` contains placeholders only;
* production env validation;
* secret rotation procedure;
* compromised-secret procedure;
* no local/preview credentials committed;
* no secrets in distributable archives.

---

## W8.4 — Security Operations

Maintain:

* SSRF regression coverage;
* auth isolation;
* source trust model;
* rate-limit policy;
* security headers;
* vulnerability disclosure process;
* current `SECURITY.md`.

No known P0/P1 security issue may ship.

---

## W8.5 — Release Engineering

Define:

* semantic versioning policy;
* CHANGELOG process;
* production checklist;
* smoke tests;
* rollback;
* data migration sequencing;
* Service Worker/cache release behavior.

---

## W8.6 — Observability

Production operations should answer:

* Is Yomirra failing?
* Which source is failing?
* Is Redis degraded?
* Is Firebase sync degraded?
* Did the current release increase failures?

Prefer free-tier tooling where sufficient.

Any paid service requires explicit justification/amendment where material.

---

## W8.7 — Incident Readiness

Define severity classes and procedures for:

* security incident;
* data corruption;
* bad deploy;
* Firebase outage;
* Redis outage;
* source outage;
* broken Service Worker;
* leaked secret;
* compromised Dynamic Source.

---

## W8.8 — Emergency Controls

Provide operational ability to:

* disable a source;
* disable Dynamic Sources globally;
* purge affected source cache;
* reject a bad manifest/version;
* rotate compromised secrets;
* roll back deployment.

---

## W8.9 — Canonical Documentation

Documentation must cover:

| Topic                      | Canonical Documentation                    |
| -------------------------- | ------------------------------------------ |
| Architecture               | `docs/ARCHITECTURE.md`                     |
| Security model             | `SECURITY.md` / security architecture docs |
| Source system              | source documentation                       |
| Identity model             | Phase 1 canonical documentation            |
| State/schema               | `docs/SCHEMA.md`                           |
| Sync                       | sync documentation                         |
| PWA/offline                | PWA documentation                          |
| Testing                    | `docs/TESTING.md`                          |
| Deployment                 | deployment documentation                   |
| Recovery                   | disaster-recovery documentation            |
| Contribution               | `CONTRIBUTING.md`                          |
| Agent/project instructions | `GEMINI.md`                                |

Documentation filenames may evolve.

The requirement is canonical coverage and correctness, not creation of unnecessary files.

---

## W8.10 — Final Readiness Review

Run release candidate from a clean checkout using production-equivalent configuration where practical.

---

# Enterprise-Ready Definition

Yomirra may be declared:

```text
ENTERPRISE_READY
```

only when all required gates below are satisfied.

## Security

* [ ] all known P0/P1 closed
* [ ] SSRF regression-tested
* [ ] Dynamic Sources cannot impersonate built-ins
* [ ] Dynamic Source cache isolation proven
* [ ] sessions isolated
* [ ] secret process documented
* [ ] no fabricated telemetry

## Data Safety

* [ ] persisted schemas governed
* [ ] migrations tested
* [ ] backup/restore tested
* [ ] failure recovery documented

## Reliability

* [ ] critical E2E green
* [ ] source outages degrade gracefully
* [ ] offline reading regression-tested
* [ ] sync outage does not destroy local data
* [ ] emergency controls operational

## Quality

* [ ] lint/typecheck/tests/build release gates pass
* [ ] no release-blocking flaky tests
* [ ] reproducible install enforced

## Performance

* [ ] agreed performance targets measured
* [ ] long chapter profiled
* [ ] large Library profiled
* [ ] no known unbounded memory behavior

## Accessibility

* [ ] primary flows meet WCAG 2.2 AA baseline
* [ ] keyboard/focus/reduced-motion tested

## Operations

* [ ] truthful health monitoring
* [ ] actionable alerts
* [ ] rollback tested
* [ ] incident runbooks exist

## Documentation

* [ ] canonical docs match implementation
* [ ] architecture decisions traceable
* [ ] Master Plan change-control respected

A successful build, zero TypeScript errors, or 100% unit-test pass alone is NOT sufficient.

---

# Audit Finding Traceability

| Finding                          | Phase                                      |
| -------------------------------- | ------------------------------------------ |
| A2-S01 SSRF                      | 0                                          |
| A2-S02 cache poisoning           | 0                                          |
| A2-S03 proxy outbound path       | 0                                          |
| A2-S04 auth contamination        | 0                                          |
| B01 NSFW fail-open               | 0                                          |
| B03/E04 history scan             | 0                                          |
| A2-B02 SW matcher                | 0                                          |
| A2-U01 Library/Bookmark taxonomy | 2                                          |
| A2-B03 dead Reader observer      | 3                                          |
| A2-B04 hardcoded report          | 3                                          |
| B08 unsupported filters          | 4                                          |
| B06 fake health                  | 5                                          |
| B07/E07 logging                  | 5/8                                        |
| E02 rate-limit fail-open         | 5                                          |
| E01 type debt                    | 6                                          |
| E05 test gaps                    | 6                                          |
| E06 NSFW Set allocation          | 0/opportunistic                            |
| E09 unused dependency            | 6/8                                        |
| E10 workspace ambiguity          | 6/8                                        |
| A2-P01 virtualizer estimate      | 7                                          |
| E03 documentation drift          | partially resolved; final reconciliation 8 |

---

# Dependency Graph

```text
Phase 0 — Security
    ↓
Phase 1 — Identity / Resilience
    ├──────────────────────┐
    ↓                      ↓
Phase 2 — Library      Phase 4 — Discovery
    │                      │
    └──────┐    ┌──────────┘
           ↓    ↓
      Phase 3 — Reader
           │
           └──────┬─────────────┐
                  ↓             │
        Phase 5 — Source Platform
                  ↓
        Phase 6 — Reliability
                  ↓
        Phase 7 — Perf / A11y
                  ↓
        Phase 8 — Enterprise
```

Phase 3 may start after Phase 0 + Phase 1.

Phase 4 may start after Phase 1.

Phase 2, 3, and 4 may therefore overlap only when their declared dependencies are satisfied.

Phase 5 full integration waits for the relevant preceding product architecture, although isolated observability work may occur earlier.

---

# Agent Execution Protocol

Before coding:

1. read `MASTER_PLAN.md`;
2. read `EXECUTION_TRACKER.md`;
3. read `audit_report_2.md`;
4. read relevant canonical docs;
5. verify current branch;
6. verify working tree;
7. select one active workstream;
8. inspect relevant evidence;
9. implement;
10. validate;
11. update tracker with evidence.

Agents may NOT use an implementation task as an excuse to redesign the roadmap.

---

# Completion Policy

A phase is DONE only when:

* required workstreams are complete or explicitly deferred with approved rationale;
* acceptance criteria are proven;
* regression tests exist where required;
* validation evidence is recorded;
* relevant docs are synchronized;
* phase exit gate is satisfied.

“Code exists” does not mean a phase is complete.

---

# Post-Enterprise Backlog

Examples of non-critical future product scope:

* marketing/landing page;
* social/public lists;
* recommendation engine;
* AI recommendations/search;
* native application;
* broader i18n;
* manga panel detection;
* annotations/comments;
* advanced analytics;
* additional collection/board features.

These are not part of the Enterprise-Ready critical path unless a future approved amendment changes that decision.

---

# Plan Freeze

`MASTER_PLAN.md` v1.0 is locked after approval.

Direct edits without amendment are limited to:

* typo fixes;
* formatting;
* broken links/anchors;
* non-semantic clarification.

Material architecture, scope, dependency, persistence, or roadmap changes require an approved amendment.

---

*End of MASTER_PLAN.md v1.0*
