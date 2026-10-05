# Yomirra — Master Execution Roadmap P0–P4

**Status:** Implemented baseline reconciled on 2026-10-05; remaining manual/release gates listed below
**Target repo path:** `docs/yomirra-master-execution-roadmap.md`  
**Role:** Single source of truth for the remaining Yomirra work covered by this roadmap.  
**Execution model:** Reconcile the newest Git/cloud state first, then execute strictly phase-by-phase with a mandatory verification gate after every phase.

## Current Reconciliation — 2026-10-05

- Local `main` and `origin/main` were reconciled at `0b69980`; no unique patch remained on the inspected backup/feature branches.
- Production deployment was Ready at the same commit when audited. Public homepage and source registry responded, while functional source health still reported upstream/configuration degradation.
- Admin Dashboard, Source Engine, Telegram Ops, runtime source merger, and public reader work described below are present in the current tree. Historical unchecked boxes are acceptance records, not evidence that implementation is absent.
- Automated release gates are tracked from the current baseline of 187 Vitest files and 1,197 tests. Browser interaction, authenticated Admin flows, real-device PWA/iOS behavior, and production credentials remain explicit manual gates.
- Release publication is not implied by this document: commit, tag, push, deployment, and destructive branch cleanup require separate authorization.

---

## 0. Non-Negotiable Execution Rules

1. **Do not start from a stale local checkout.** Recent work has been performed in cloud/Codex, including an Admin Dashboard revamp that may still be on a remote branch/PR when execution starts.
2. **The current Admin Dashboard revamp is an upstream workstream, not a task to reimplement.** First locate its latest branch/commit/PR and reconcile it into the authoritative base. Verify it; do not duplicate its UI work.
3. **Never overwrite unique local work.** Inspect before stash/reset/switching branches. No blind `reset --hard`, force-push, or destructive cleanup.
4. **Do not assume `main` is newest.** Determine the authoritative state using ancestry, unique commits, actual code content, PR state, and deployment state—not timestamps alone.
5. **Do not repeat completed work.** Mark existing implementation as `VERIFIED/DONE` after inspection and tests.
6. **One master roadmap.** This file is the execution source of truth. Existing detailed plans may remain as historical/reference documents, but conflicting instructions are reconciled into this file.
7. **TDD/regression baseline.** Add/update tests for behavior changes where practical; high-risk source, reader, auth, search, migration, and entitlement paths require regression coverage.
8. **No unrelated repo-wide refactors.** Record out-of-scope findings separately.
9. **No unnecessary packages.** Reuse Next.js 16, React 19, TypeScript, Zustand, Vitest/Testing Library, existing Redis/server utilities, and current UI primitives unless evidence requires otherwise.
10. **No Codex/GPT bot comments or automated PR commentary.** Keep review/PR communication manual unless explicitly requested.
11. **Do not blindly paste plan snippets.** File paths, signatures, line numbers, and example code in prior plans are intent/specification; reconcile them with the actual latest types and architecture before implementation.
12. **Admin secrets must never be hardcoded into the browser bundle.** Any development fallback/default passkey visible in client code must be removed or replaced with a server-only/local-development-safe mechanism before production verification.
13. **Preserve product contracts:**
    - Bookmark is explicit only; rating/collection must not auto-add to Library.
    - User source toggles govern Library/Popular/normal browsing.
    - Search ignores the user's ordinary browsing toggle and may list all runtime-available sources.
    - **Admin kill-switch is authoritative globally:** an admin-disabled source is not usable publicly, including Search/Reader, while internal admin diagnostics may explicitly bypass the kill-switch.
    - Unavailable/down sources must not be offered as active reading sources.
    - Canonical identity, progress, bookmarks, and update state must not be silently discarded.
    - Built-in adapters must be preserved unless a separate explicit migration/removal decision exists.
14. **Redis/runtime configuration must fail safe.** Redis outage, cold start, latency spike, malformed runtime state, or Standby must not crash public SSR. Fall back immediately to the hardcoded built-in registry where appropriate.
15. **Every phase has a hard gate:** update changelog → targeted tests → full relevant tests → typecheck → lint → production build → manual smoke checks → diff/status review → clean checkpoint commit.
16. Confirm actual commands from `package.json`; do not invent scripts. Expected equivalents are `pnpm vitest run`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

---

# Phase 0 — Local / Remote / Cloud / Admin-Revamp Reconciliation

**Priority:** P0 / mandatory prerequisite  
**Difficulty:** Easy–Medium  
**Blocks:** Everything else

## Goal

Make the local repository match the newest safe Yomirra state, including the Admin Dashboard revamp currently being developed in cloud/Codex, before any new roadmap work begins.

## 0.1 Inspect local state before touching anything

Capture:

- current branch and HEAD SHA;
- `git status` including untracked files;
- local branches/tracking status;
- configured remotes;
- recent local history;
- local unique commits/uncommitted changes.

Do not stash/reset first. Determine whether the local state contains unique work.

## 0.2 Fetch and inspect all remote/cloud state

Run the safe equivalent of:

```bash
git fetch --all --prune
```

Inspect:

- `origin/main`;
- active remote feature branches;
- cloud/Codex branches;
- open/recent PRs when GitHub access is available;
- CI status;
- current Vercel production deployment;
- ahead/behind counts and unique commits.

Useful inspection commands may include:

```bash
git branch -vv
git branch -a
git log --all --graph --decorate --oneline --date-order -n 150
git rev-list --left-right --count <A>...<B>
git log <A>..<B> --oneline
git log <B>..<A> --oneline
```

## 0.3 Locate the current Admin Dashboard revamp

The latest known revamp touches the Admin portal UI around:

- `admin-layout.tsx`;
- Overview;
- Sources;
- Search;
- Reports;
- Site;
- Telemetry;
- core source modal;
- custom source modal;
- admin portal tests.

Do not assume these exact paths are unchanged. Identify the real current branch/commit by Git evidence.

Required actions:

1. Locate the branch/PR/commit containing the latest Admin revamp.
2. Compare it with local and `origin/main`.
3. Preserve any unique commits.
4. If the Admin revamp is complete and valid, reconcile it into the authoritative base before Phase 1.
5. If it is already merged, verify rather than reimplement.
6. If it is incomplete but contains required unique work, preserve it and finish/reconcile only what is necessary to establish a coherent handoff; do not silently discard it.

## 0.4 Security handoff check for Admin

Before treating the Admin revamp as production-ready, inspect authentication behavior and client bundles.

Mandatory requirement:

- no production/default admin passkey, secret, token, or equivalent privileged credential may be embedded in a Client Component or browser bundle;
- development-only convenience must be gated safely and remain server/local-only;
- admin APIs remain server-authorized regardless of UI state.

This is a **P0 production blocker**.

## 0.5 Determine authoritative latest state

Decision rules:

1. If `origin/main` contains all required local/cloud/Admin work, fast-forward local safely.
2. If a remote feature/PR branch contains newer valid work not in `main`, inspect and reconcile it first.
3. If local has unique commits/uncommitted work, preserve before switching/updating.
4. If histories diverge, compare unique commits and reconcile intentionally.
5. Leave branch deletion for the final phase.

## 0.6 Verify previous work instead of repeating it

Inspect the actual status of:

- PR16 and successors;
- navigation/perceived-performance work;
- previous source fixes;
- canonical/search work;
- `future_dev.md` and prior specs/plans;
- Admin APIs/services used by the new UI;
- `admin-source-service`;
- `custom-source-service`;
- source health/probe flow;
- any existing runtime-source merger/wiring already produced by another worker.

Mark completed items `VERIFIED/DONE`.

## 0.7 Establish roadmap execution branch

After reconciliation:

1. ensure the base contains all work that must be retained;
2. synchronize local `main` if appropriate;
3. create one dedicated roadmap branch from the authoritative base;
4. record branch name + base SHA in changelog/execution notes.

Recommended naming:

```text
feat/yomirra-master-roadmap
```

## Phase 0 Acceptance Gate

- [ ] Unique local work preserved.
- [ ] Remote refs fetched/pruned.
- [ ] Latest Admin revamp branch/commit found and reconciled or verified merged.
- [ ] No privileged admin credential is shipped in the client bundle.
- [ ] Authoritative base selected by ancestry/content.
- [ ] Existing completed roadmap work identified to avoid duplication.
- [ ] CI/deployment baseline recorded.
- [ ] Dedicated roadmap branch created.
- [ ] Changelog updated with reconciliation summary.
- [ ] Baseline targeted/full tests as appropriate pass or pre-existing failures are documented.
- [ ] Typecheck passes or baseline failure documented.
- [ ] Lint passes or baseline failure documented.
- [ ] Production build passes or baseline failure documented.
- [ ] Clean checkpoint commit created.

---

# Phase 1 — P0 Admin Runtime Source Overrides & Public Frontend Wiring

**Priority:** P0  
**Difficulty:** Medium  
**Dependencies:** Phase 0 complete; current Admin revamp and existing admin source/custom-source services reconciled  
**Origin:** Incorporates `docs/superpowers/plans/2026-09-30-connect-admin-sources-to-frontend.md`

## Goal

Connect the Admin source configuration to public runtime behavior without making Redis a public availability dependency.

The hardcoded `sourceRegistry` remains the safe baseline. Runtime core overrides and custom sources are layered on top at request/runtime time.

## Architecture Contract

```text
client-safe sourceRegistry
        ↓
server-only runtime-sources merger
        ├── core overrides from Redis
        └── custom sources from Redis
        ↓
public API / SSR feeds / source resolution
```

Redis failure path:

```text
Redis unavailable / cold / timeout / malformed runtime state
        ↓
catch + log
        ↓
hardcoded built-in sourceRegistry
        ↓
public app continues rendering
```

Admin kill-switch path:

```text
admin override isEnabled=false
        ↓
public source resolution rejects SOURCE_DISABLED
        ↓
Home/Popular/Search/Reader cannot use source

admin health probe
        ↓
explicit allowDisabled=true
        ↓
probe may still diagnose disabled source
```

## 1.1 Runtime Source Merger Service

Expected files, adjusted to actual repo layout if necessary:

- Create: `src/server/lib/sources/runtime-sources.ts`
- Test: `src/server/lib/sources/__tests__/runtime-sources.test.ts`

Expected public server interfaces:

```ts
getRuntimeSources(): Promise<SourceMetadata[]>
getRuntimeSource(id: string): Promise<SourceMetadata | null>
isSourceEnabledServer(id: string): Promise<boolean>
```

Consumes:

- client-safe hardcoded `sourceRegistry`;
- `getCoreSourceOverrides()`;
- `getCustomSources()`.

Required behavior/tests:

- baseline registry returned when runtime config is empty;
- `isEnabled` core override applied;
- active-domain override applied to effective server metadata;
- custom Redis sources merged and marked dynamic using the actual current schema;
- one Redis dependency failing must not necessarily destroy valid data from the other if they are independently recoverable;
- total/unhandled runtime failure falls back to built-in registry;
- normalization handles source IDs consistently;
- malformed runtime entries cannot crash SSR;
- `source-registry.ts` remains client-safe and imports no Redis/server module.

TDD gate:

```bash
pnpm vitest run src/server/lib/sources/__tests__/runtime-sources.test.ts
```

Write/confirm failing tests before implementing missing behavior.

## 1.2 SourceManager Admin Kill-Switch Enforcement

Expected files:

- Modify current source manager implementation.
- Add a focused override/kill-switch test file.

Required contract:

```ts
sourceManager.getSource(
  id,
  manifestUrl?,
  options?: { allowDisabled?: boolean }
)
```

Behavior:

- core source with admin `isEnabled=false` rejects public resolution with structured/recognizable `SOURCE_DISABLED` semantics;
- `allowDisabled: true` bypasses only this runtime kill-switch for internal diagnostics;
- Redis read failure is fail-open to the hardcoded built-in behavior, not a public outage;
- the kill-switch exception itself must not be swallowed by the Redis fallback catch;
- preserve existing source resolution/caching semantics unless evidence requires change.

Prefer a typed/domain error if the existing error architecture supports it. Do not force a string-only error contract if the latest repo has a better established error type.

## 1.3 Public API Wiring

Update public source metadata API to consume `getRuntimeSources()` rather than a raw static registry helper.

Requirements:

- preserve existing rate limit/security behavior;
- endpoint is runtime/dynamic where required;
- response exposes effective source metadata without leaking admin-only secrets/config internals;
- admin-disabled sources may be represented as disabled metadata if that matches current public API contract, but clients must not treat them as usable.

## 1.4 Home SSR Wiring

Update Home server-side source selection to start from runtime sources.

Required filtering semantics:

```text
Admin runtime enabled
AND installed/usable
AND not unavailable
AND not user-disabled for browsing
```

User-disabled-source cookie parsing must fail safely. Invalid cookie data must not crash SSR.

## 1.5 Popular SSR Wiring

Use runtime sources instead of raw `sourceRegistry`.

Popular follows browsing toggles/availability contracts, not Search independence rules.

## 1.6 Admin Health Probe Bypass

Internal Admin diagnostics must use the explicit bypass:

```ts
{ allowDisabled: true }
```

This bypass must be narrowly scoped to authorized admin/internal diagnostic paths.

## 1.7 Search Contract Reconciliation

Because Phase 1 changes the server authority of source state, explicitly verify this distinction:

- **admin-disabled:** unavailable publicly everywhere until re-enabled;
- **user-disabled browsing toggle:** hidden from Library/Popular/home browsing, but still available to Search if runtime/admin availability permits;
- **runtime unavailable/down:** not usable for active reading;
- **custom source:** follows its actual runtime/admin availability and capability metadata.

Do not accidentally make `/api/sources` user-preference-aware if it is intended to represent global runtime availability.

## 1.8 Runtime Plan Regression Tests

At minimum cover:

- no overrides/custom sources;
- disabled core override;
- active domain override;
- custom source merge;
- Redis timeout/offline fallback;
- source-manager public rejection;
- admin diagnostic bypass;
- API behavior;
- Home/Popular runtime filtering where test architecture permits;
- Search does not conflate user browsing toggle with admin kill-switch.

## Phase 1 Acceptance Gate

- [ ] Runtime merger implemented/verified.
- [ ] Built-in adapters remain intact.
- [ ] `sourceRegistry` remains client-safe.
- [ ] SourceManager kill-switch works.
- [ ] Admin probe bypass is explicit and authorized.
- [ ] Public `/api/sources` uses runtime metadata.
- [ ] Home and Popular SSR use runtime metadata.
- [ ] Search/admin/user-toggle semantics remain distinct.
- [ ] Redis failure cannot take public SSR down.
- [ ] Changelog updated.
- [ ] Targeted source/API tests pass.
- [ ] Full relevant Vitest suite passes.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Manual smoke test covers admin disable → public effect → admin probe → re-enable.
- [ ] Diff/status checked for unrelated changes.
- [ ] Clean checkpoint commit created.

Suggested task-level commits may be used if they fit repo convention, but the phase gate above is mandatory regardless of commit granularity.

---

# Phase 2 — P0 Core Stability

**Priority:** P0  
**Difficulty:** Easy → Hard  
**Dependencies:** Phase 1 complete

## 2.1 Repository / PR / CI hygiene

- Resolve stale PR/CI state that blocks roadmap execution.
- Preserve manual review flow.
- Do not delete active branches yet.

## 2.2 Navigation perceived-performance foundation

Implement/verify:

- dock/navigation active state changes immediately on intent;
- route transition starts immediately;
- destination shell may render before slow content finishes;
- visible PWA/page loading feedback;
- no duplicate navigation events;
- accessibility/focus preserved;
- routine navigation does not generate noisy toasts.

## 2.3 Single scroll owner + page hierarchy cleanup

Standardize primary shells for:

- Home;
- Library;
- Bookcase/Bookmark;
- Search;
- Popular and related browsing pages.

Resolve:

- duplicated headers;
- nested/parent scroll conflicts;
- inconsistent containers/toolbars/section spacing;
- responsive shell mismatch.

## 2.4 Source Registry / Search-State Reconciliation

Build on Phase 1 runtime authority.

- Search source selection lists every runtime/admin-available source even when the user's ordinary browsing toggle is OFF.
- Library/Popular/Home obey user browsing toggles.
- Admin kill-switch wins globally.
- Runtime unavailable source cannot be selected for reading.
- Migrate/remove stale persisted source/search state safely.
- Ensure custom runtime sources participate according to capabilities.

## 2.5 Reader FIFO Image Loading

Implement deterministic top-to-bottom reader scheduling:

- controlled concurrency, target ~2 unless measurement justifies otherwise;
- later pages do not visibly reveal ahead of earlier queued pages in confusing order;
- image failure does not deadlock queue;
- current/next page priority in paged mode;
- resume-reading preserved;
- existing virtualization/placeholders preserved or improved;
- verify long chapters/slow network.

## Phase 2 Acceptance Gate

- [ ] Changelog updated.
- [ ] Navigation/page/source/reader regression tests updated.
- [ ] Targeted tests pass.
- [ ] Full relevant suite passes.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Browser smoke test: navigation, source settings, Search independence, scroll ownership, FIFO reader.
- [ ] Diff/status clean and scoped.
- [ ] Clean checkpoint commit created.

---

# Phase 3 — P1 Core Reading Experience

**Priority:** P1  
**Difficulty:** Easy → Hard  
**Dependencies:** P0 runtime/source/shell/reader foundations complete

## 3.1 Library UX finishing

- Home-aligned hierarchy/header;
- list/grid/compact behavior;
- progress/update indicators;
- quick actions;
- deterministic filtering/pagination;
- mobile/tablet/desktop behavior;
- explicit-bookmark semantics preserved.

## 3.2 Bookmark / Bookcase UX finishing

- reduce visual noise;
- clear batch delete/edit behavior;
- consistent compact/grid/list modes;
- sticky controls only when useful;
- rating/collection never auto-adds to Library.

## 3.3 Scoped reusable-component consolidation

Consolidate only components proven by stabilized pages:

- PageContainer;
- SectionHeading;
- PageToolbar;
- Search Input;
- tabs/segmented controls;
- badge/chip;
- content cards;
- list/grid toggle;
- confirmation modal;
- settings row;
- loading/skeleton/empty/error states.

No aesthetic repo-wide rewrite.

## 3.4 Reader navigation cleanup

- next/previous chapter transition;
- immediate feedback;
- remove unnecessary toast noise;
- chapter list centers/opens around current chapter;
- compact chapter chips where appropriate;
- drawer/sheet language matches product;
- reading position survives navigation.

## 3.5 Shinigami / Amgadex reliability

Audit adapters independently:

- request path;
- parsing;
- runtime availability detection;
- rate limit/error handling;
- contract compatibility;
- normalization;
- fallback behavior.

Do not weaken global `safeFetch` for one adapter without evidence.

## 3.6 Canonical multi-source hardening — foundation

Stabilize:

- canonical title identity;
- source aliases/title normalization;
- default preferred source vs current session source;
- source switch without identity loss;
- reading progress continuity;
- bookmark continuity;
- update-store orphan cleanup.

Dependency:

```text
runtime source authority → source reliability → canonical identity
```

## Phase 3 Acceptance Gate

- [ ] Changelog updated.
- [ ] Library/Bookmark tests updated.
- [ ] Reader navigation tests updated.
- [ ] Adapter tests/fixtures updated.
- [ ] Canonical/progress behavior tested.
- [ ] Targeted/full relevant tests pass.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Responsive smoke test completed.
- [ ] Clean checkpoint commit created.

---

# Phase 4 — P2 Search Intelligence Foundation

**Priority:** P2  
**Difficulty:** Medium → Hard  
**Dependencies:** stable canonical model from P1

## 4.1 Search tag parser + filter chips

- structured recognized tags/filters;
- removable chips;
- include/exclude semantics;
- plain-text resilience;
- persist URL/state only if it does not reintroduce stale-source bugs.

## 4.2 Alias / title normalization

Normalize:

- alternate titles;
- punctuation/casing;
- common romanization differences;
- source-specific formatting.

Canonical identity remains separate from fuzzy matching.

## 4.3 Typo tolerance

- exact/strong matches stay dominant;
- bounded fuzzy matching;
- short queries do not explode into unrelated results;
- regression tests for misspellings/near matches.

## 4.4 Persistent canonical catalog

Introduce durable catalog/storage appropriate to current architecture:

- stable IDs;
- source mappings;
- aliases;
- normalized metadata;
- migration strategy;
- incremental updates;
- no accidental dependency on paid/P4 features.

## 4.5 Exact chapter fallback + durable migration

- exact mapping where possible;
- deterministic fallback;
- durable migration state/snapshot;
- progress remains attached to canonical title/chapter;
- failures do not silently corrupt reading state.

## 4.6 Search/ranking quality suite

Fixtures/cases:

- exact title;
- alias;
- typo;
- tag/include/exclude;
- duplicated multi-source title;
- admin-disabled source;
- unavailable source;
- user-disabled browsing source still searchable where allowed;
- custom runtime source;
- chapter/source migration edges.

## Phase 4 Acceptance Gate

- [ ] Changelog updated.
- [ ] Parser/normalization/typo tests pass.
- [ ] Canonical catalog migration tests pass.
- [ ] Ranking quality suite passes.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Manual exact/alias/typo/tag/source-state search smoke test passes.
- [ ] Clean checkpoint commit created.

---

# Phase 5 — P3 Advanced Discovery

**Priority:** P3  
**Difficulty:** Medium → Very Hard  
**Dependencies:** persistent canonical catalog + search-quality baseline

## 5.1 Related titles — lexical/metadata first

Implement deterministic non-AI baseline first.

## 5.2 Smart collections — basic

Use explainable metadata/history rules before semantic recommendation.

## 5.3 Progressive indexing

- incremental updates;
- index version/migrations;
- recovery path;
- bounded serverless resource usage.

## 5.4 Embeddings / vector layer

Only after catalog/indexing stability.

Define:

- embedded content;
- stable IDs;
- invalidation/update policy;
- storage;
- cost/resource limits;
- privacy/security boundaries.

## 5.5 Hybrid lexical + semantic search

Semantic recall must not bury obvious exact lexical matches.

## 5.6 Recommendation system

Start with auditable signals and add semantic signals only where they improve measured quality.

Dependency:

```text
persistent catalog → progressive indexing → embeddings → hybrid search → recommendations
```

## Phase 5 Acceptance Gate

- [ ] Changelog updated.
- [ ] Related-title baseline tested.
- [ ] Index invalidation/update tests pass.
- [ ] Search quality suite remains green.
- [ ] Cost/resource impact documented.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Clean checkpoint commit created.

---

# Phase 6 — P4 Backend, Entitlement, Admin Hardening, and AI

**Priority:** P4  
**Difficulty:** Medium → Very Hard  
**Dependencies:** core free product + canonical/search foundation stable

> The Admin portal itself is no longer treated as a future greenfield foundation. Its current implementation/revamp is reconciled in Phase 0 and connected to runtime source behavior in Phase 1. P4 contains deeper auth/product/backend evolution rather than rebuilding the Admin UI.

## 6.1 Admin auth/security hardening

Reassess the temporary/current admin authorization model after the core product is stable.

Requirements:

- privileged verification is server-authoritative;
- no browser-embedded secret;
- session/token handling appropriate to deployment;
- auditability for sensitive mutations;
- rate limiting/CSRF/request validation as applicable;
- preserve existing admin UI instead of rebuilding it unnecessarily.

## 6.2 Feature flags

Introduce only with safe defaults and clear server authority where required.

## 6.3 Task 02 — Entitlement Foundation

- Free vs Pro capability model;
- server-authoritative entitlement;
- UI consumption pattern;
- offline/cache semantics where relevant;
- existing-user migration/defaults;
- tests against privilege escalation and accidental free-feature locking.

## 6.4 Free / Pro enforcement

Apply only to approved features after entitlement foundation is stable. Do not degrade completed free reader/search flows.

## 6.5 AI infrastructure

- server-side keys;
- quotas/rate limits;
- cost observability;
- provider/model abstraction only where justified;
- resilient failure path;
- no browser exposure of privileged keys.

## 6.6 AI Text V1

Ship the lowest-risk/high-value optional text feature first.

## 6.7 OCR / Translation

- explicit invocation;
- input/page limits;
- source/target clarity;
- failure recovery;
- cost controls;
- no silent mutation of original content.

## 6.8 Vision

Add broader vision features only after OCR/translation infrastructure proves stable.

## 6.9 AI-assisted recommendation

Last because it depends on both P3 recommendation infrastructure and P4 secure AI infrastructure.

Dependency chains:

```text
secure admin/backend authority → feature flags → entitlement → Free/Pro enforcement
```

```text
canonical/search foundation + secure AI backend → AI Text → OCR/Translation → Vision → AI-assisted recommendation
```

## Phase 6 Acceptance Gate

- [ ] Changelog updated.
- [ ] Admin auth/security tests pass.
- [ ] Feature flag/entitlement tests pass.
- [ ] Server/client secret boundary reviewed.
- [ ] AI failure/rate-limit behavior tested.
- [ ] Free core flows regression-tested.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Clean checkpoint commit created.

---

# Phase 7 — Final Integration, Merge Main, Production Deploy, Branch Cleanup

**Priority:** Final gate  
**Dependencies:** All selected P0–P4 phases complete or explicitly deferred without violating dependencies

## 7.1 Final full regression

Run complete repository validation:

- all tests;
- typecheck;
- lint;
- production build;
- repo-specific static checks;
- critical browser smoke tests.

Critical manual flows:

1. Admin login/auth boundary and dashboard load.
2. Admin source disable → public source unavailable.
3. Admin health probe can diagnose disabled source.
4. Admin re-enable → public availability restored.
5. Redis unavailable simulation/fallback → public app still works from built-ins.
6. Home → Library → Bookmark → Search navigation.
7. Active nav + route loading feedback.
8. User browsing-disabled source remains searchable if admin/runtime available.
9. Admin-disabled/down source is not readable/search-usable.
10. Manga → chapter → next/previous chapter.
11. FIFO reader under throttled network.
12. Bookmark add/remove without rating/collection side effects.
13. Multi-source switch preserves canonical identity/progress.
14. Search exact/alias/typo/tag behavior.
15. Any entitlement/AI features actually implemented.

## 7.2 Changelog finalization

Ensure phase-by-phase entries cover:

- Added;
- Changed;
- Fixed;
- Security;
- migrations;
- runtime/admin behavior;
- deferred items and known issues.

## 7.3 Reconcile roadmap branch with latest `main`

Before final merge:

1. fetch/prune again;
2. inspect whether `main` moved during execution;
3. reconcile safely using repo convention;
4. rerun full validation if integration changed code.

## 7.4 Merge to `main`

Only after local and CI verification are green. Do not force-push protected `main`.

## 7.5 Production deploy

- verify Vercel production is built from intended final `main` SHA;
- confirm deployment succeeds;
- verify production domain;
- run production smoke suite;
- compare deployed SHA with merged `main` SHA where possible.

If deployment fails, fix/revert intentionally before cleanup.

## 7.6 Remote + local branch cleanup

Only after production is confirmed healthy:

1. fetch/prune and enumerate remote branches;
2. preserve `main` and protected/permanent branches;
3. inspect every remaining work branch for unique commits;
4. delete only fully merged/obsolete remote branches;
5. delete corresponding obsolete local branches;
6. prune stale remote-tracking refs;
7. preserve/reconcile any branch containing unique unmerged work.

Never delete an unmerged branch merely to make the branch list clean.

## Final Acceptance Criteria

- [ ] Authoritative initial SHA recorded.
- [ ] Admin revamp preserved and integrated.
- [ ] Runtime source wiring works with Redis fallback.
- [ ] No client-bundled privileged admin credential.
- [ ] Required P0–P4 scope complete or explicitly deferred with exact reason.
- [ ] Changelog current.
- [ ] Tests pass.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] `main` contains final approved work.
- [ ] Vercel production is deployed from expected `main` SHA.
- [ ] Production smoke tests pass.
- [ ] Obsolete fully merged branches deleted.
- [ ] Unique/unmerged branches preserved.
- [ ] Final `git status` clean.

---

# Master Dependency Map

```text
CURRENT CLOUD/CODEX ADMIN REVAMP
        ↓
Phase 0 reconcile + verify + remove client-side secret risk
        ↓
P0 Runtime Source Merger
        ↓
P0 SourceManager Admin Kill-Switch
        ↓
P0 Public API + Home/Popular SSR wiring
        ↓
P0 Search/user-toggle/admin-toggle reconciliation
        ↓
P1 Source reliability
        ↓
P1 Canonical identity
        ↓
P2 Persistent canonical catalog
        ↓
P2/P3 Search intelligence
```

```text
P0 Navigation foundation
        ↓
P0 Page hierarchy
        ↓
P1 Library / Bookmark
        ↓
Scoped design-system consolidation
```

```text
P0 Reader FIFO lifecycle
        ↓
P1 Reader navigation
        ↓
P2 Durable chapter/source migration
```

```text
Persistent canonical catalog
        ↓
Progressive indexing
        ↓
Embeddings
        ↓
Hybrid search
        ↓
Recommendations
```

```text
Admin auth/security hardening
        ↓
Feature flags
        ↓
Task 02 entitlement
        ↓
Free/Pro enforcement
```

```text
Canonical/search infrastructure + secure backend
        ↓
AI infrastructure
        ↓
AI Text
        ↓
OCR/Translation
        ↓
Vision
        ↓
AI-assisted recommendation
```

---

# Execution Order Summary

```text
PHASE 0 — SYNC / ADMIN HANDOFF / RECOVERY [P0]
01. Inspect local Git state
02. Fetch/prune all remotes
03. Inspect remote/cloud/Codex branches + PR/CI/Vercel
04. Locate latest Admin Dashboard revamp
05. Preserve/reconcile Admin revamp and any unique local/remote work
06. Remove/block any client-bundled privileged admin credential
07. Determine authoritative latest state by ancestry/content
08. Create dedicated roadmap branch
09. Baseline tests + typecheck + lint + production build

PHASE 1 — ADMIN RUNTIME SOURCE WIRING [P0]
10. Runtime source merger service + tests
11. SourceManager admin kill-switch + diagnostic bypass
12. Public /api/sources runtime wiring
13. Home SSR runtime wiring
14. Popular SSR runtime wiring
15. Search/admin/user-toggle contract regression coverage
16. Phase validation + changelog + checkpoint

PHASE 2 — CORE STABILITY [P0]
17. Repo/PR/CI hygiene
18. Navigation instant active-state
19. Route loading/progress feedback
20. Single scroll owner + duplicate header/page hierarchy
21. Source registry/search-state reconciliation on runtime authority
22. Reader FIFO image queue
23. Phase validation + changelog + checkpoint

PHASE 3 — CORE READING [P1]
24. Library UX finishing
25. Bookmark UX finishing
26. Scoped reusable-component consolidation
27. Reader navigation cleanup
28. Shinigami/Amgadex reliability
29. Canonical identity hardening
30. Source-switch/progress/session behavior
31. Phase validation + changelog + checkpoint

PHASE 4 — SEARCH FOUNDATION [P2]
32. Search tag parser + chips
33. Alias/title normalization
34. Typo tolerance
35. Persistent canonical catalog
36. Exact chapter fallback + durable migration
37. Search/ranking quality suite
38. Phase validation + changelog + checkpoint

PHASE 5 — ADVANCED DISCOVERY [P3]
39. Related titles lexical baseline
40. Smart collections
41. Progressive indexing
42. Embeddings/vector layer
43. Hybrid lexical-semantic search
44. Recommendation system
45. Phase validation + changelog + checkpoint

PHASE 6 — BACKEND / ENTITLEMENT / AI [P4]
46. Admin auth/security hardening
47. Feature flags
48. Task 02 entitlement foundation
49. Free/Pro enforcement
50. AI infrastructure
51. AI Text V1
52. OCR/translation
53. Vision
54. AI-assisted recommendation
55. Phase validation + changelog + checkpoint

FINAL
56. Complete regression + final changelog
57. Fetch/reconcile latest main again
58. Merge roadmap branch to main
59. Verify CI
60. Verify Vercel production deployment SHA
61. Production smoke tests
62. Inspect all remaining branches for unique commits
63. Delete obsolete fully merged remote branches
64. Delete corresponding obsolete local branches
65. Prune refs + final clean-state verification
```

---

# Executor Prompt

Copy this prompt to the coding executor together with this Markdown file:

```text
Execute `docs/yomirra-master-execution-roadmap.md` as the single source of truth for the remaining Yomirra roadmap.

IMPORTANT CONTEXT:
Recent Yomirra development was performed in cloud/Codex. The local checkout may be stale. In addition, an Admin Dashboard revamp is being completed in another Codex/cloud workstream. That Admin revamp is upstream work: do not recreate it from scratch. Locate its actual latest Git branch/commit/PR and reconcile it first.

Do not begin new production implementation until Phase 0 is complete.

PHASE 0 — MANDATORY START:
1. Inspect current local branch, HEAD, git status, untracked files, local branches, remotes, and recent history.
2. Fetch all remotes with prune.
3. Inspect origin/main, relevant remote feature branches, recent Codex/cloud branches, PR state where accessible, CI, and latest Vercel deployment.
4. Locate the latest Admin Dashboard revamp and compare it against local and main using commit ancestry, unique commits, and actual content. Do not choose based on timestamps alone.
5. Preserve every unique local or remote commit. Never blindly reset, force-push, or overwrite work.
6. Reconcile the completed/latest valid Admin revamp into the authoritative base before executing the new runtime-source plan. If it is already merged, verify it instead of reimplementing it.
7. Inspect the Admin auth boundary before production work. No privileged/default admin passkey, token, or secret may be embedded in a Client Component/browser bundle. Remove or safely replace any such fallback while preserving server authorization.
8. Inspect previous Yomirra work and mark already-completed roadmap items VERIFIED/DONE instead of repeating them.
9. Once the authoritative state is reconciled, create one dedicated roadmap execution branch from that base.
10. Run baseline relevant tests, typecheck, lint, and production build before new production changes. Document any failure proven to predate this roadmap.

NEXT, EXECUTE PHASE 1 BEFORE THE OTHER SOURCE/SEARCH TASKS:
Implement the Runtime Source Overrides & Public Frontend Wiring defined in the roadmap:
- create/verify a server-only runtime source merger that overlays Redis core overrides and custom sources onto the hardcoded client-safe sourceRegistry;
- maintain immediate fallback to the built-in sourceRegistry when Redis is cold/offline/slow/malformed;
- enforce the admin source kill-switch in SourceManager for public resolution;
- allow only authorized internal admin diagnostics to bypass the kill-switch via an explicit allowDisabled option;
- wire GET /api/sources to effective runtime metadata;
- wire Home and Popular SSR source selection to runtime metadata;
- keep source-registry.ts client-safe and preserve all built-in adapters;
- preserve the distinction between admin kill-switch and user browsing toggles: Search ignores ordinary user browsing disable state, but an admin-disabled or genuinely unavailable source is not publicly usable;
- reconcile exact code against the current repo/types rather than blindly pasting stale snippets from an older plan.

GLOBAL EXECUTION RULES:
- Execute all remaining phases strictly in roadmap order and respect dependency chains.
- Do not redo completed work.
- Do not introduce unrelated refactors.
- Preserve explicit bookmark semantics and canonical/progress data.
- Do not weaken global safeFetch/network/security policy to fix one source without evidence.
- Use TDD/regression coverage where practical and mandatory on high-risk behavior.
- Do not add unnecessary dependencies.
- Do not add Codex/GPT bot comments to PRs.

MANDATORY PHASE GATE — AFTER EVERY PHASE:
1. update CHANGELOG.md (or the repository's canonical changelog) with added/changed/fixed/security/migration/deferred notes for that phase;
2. run targeted tests;
3. run the full relevant test suite where defined/practical;
4. run typecheck;
5. run lint;
6. run the production build;
7. manually smoke-test the critical behavior changed in that phase;
8. inspect git diff/status for accidental unrelated changes;
9. fix regressions introduced by the phase;
10. create a clean checkpoint commit;
11. only then continue to the next phase.

Do not stop for routine implementation decisions. Make the safest decision supported by repository evidence. Stop only for a genuine blocker involving data-loss risk, unavailable credentials/access, security ambiguity, or another destructive uncertainty.

FINALIZATION — ONLY AFTER ALL SELECTED P0–P4 PHASES PASS:
1. Run complete regression tests, typecheck, lint, production build, and final changelog review.
2. Fetch/prune again and inspect whether main changed during execution.
3. Safely reconcile the roadmap branch with latest main and rerun validation if code changed.
4. Merge the completed roadmap branch into main using the repository's normal safe merge strategy. Do not force-push protected main.
5. Verify CI is green.
6. Verify Vercel production deployed the intended final main SHA.
7. Perform production smoke tests, including:
   - Admin access/security boundary;
   - Admin source disable/re-enable;
   - Admin diagnostic probe on a disabled source;
   - Redis runtime fallback;
   - Home/Popular runtime source behavior;
   - Search independence from user browsing toggles while respecting admin kill-switch/unavailable state;
   - navigation/loading behavior;
   - Library/Bookmark;
   - reader FIFO + chapter navigation;
   - canonical source switching/progress;
   - search exact/alias/typo/tag behavior;
   - any entitlement/AI features actually implemented.
8. Only after production is healthy, inspect every remaining remote branch for unique commits.
9. Delete only obsolete fully merged remote branches and corresponding obsolete local branches.
10. Preserve main, protected/permanent branches, and any branch with unique unmerged commits; reconcile unique work before deletion.
11. Prune stale remote-tracking refs.
12. Finish with clean git status.

FINAL REPORT MUST INCLUDE:
- authoritative starting SHA selected in Phase 0;
- Admin revamp SHA/PR/branch that was reconciled or verified;
- final main SHA;
- deployed production SHA/status;
- phases completed;
- test/typecheck/lint/build results by phase;
- production smoke-test result;
- remote/local branches deleted;
- any deferred item and exact reason;
- confirmation that no privileged admin credential is exposed in the client bundle.
```
