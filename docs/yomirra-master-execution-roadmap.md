# Yomirra — Master Execution Roadmap P0–P4

**Status:** Execution-ready  
**Target repo path:** `docs/yomirra-master-execution-roadmap.md`  
**Role:** Single source of truth for the remaining Yomirra work covered here.  
**Execution model:** Phase-by-phase, with hard verification gates before moving forward.

---

## 0. Non-Negotiable Execution Rules

1. **Do not start implementation from a stale local checkout.** Phase 0 must determine the most complete/latest authoritative state between local work, `origin`, existing remote branches, merged/unmerged PR branches, and recent cloud/Codex work.
2. **Never overwrite uncommitted local work.** If local changes exist, preserve them first with a safe branch/commit/stash strategy after inspecting what they are.
3. **Do not assume `main` is the newest source of truth.** Cloud/Codex work may live on another remote branch or PR. Determine actual ancestry and unique commits before choosing the base.
4. **Do not repeat completed work.** Inspect the current code, Git history, PR history, CI state, and docs first. Mark already-completed items as verified instead of reimplementing them.
5. **No destructive Git operations** such as blind `reset --hard`, forced pushes, or deleting unmerged branches without proving the commits are preserved elsewhere.
6. **No Codex/GPT bot comments or automated PR commentary.** Keep PR/review communication manual unless explicitly requested.
7. **TDD baseline:** for behavior changes, add or update tests before/with implementation where practical. Regression-prone paths must have tests.
8. **Scope discipline:** do not fold unrelated repo-wide cleanup into a phase just because it is discovered. Record out-of-scope findings in this document/changelog and continue the scoped work.
9. **No unnecessary dependencies.** Reuse the existing stack and patterns unless a new package is clearly justified.
10. **Preserve Yomirra behavior contracts:**
    - Bookmark is explicit only. Rating/collection must not auto-add to Library.
    - Search source selection is independent from source enable/disable toggles used by Library/Popular/normal browsing.
    - Only available/healthy sources are usable for reading.
    - Existing canonical/progress/bookmark data must not be silently discarded.
11. **Every phase ends with a hard gate:**
    - update changelog;
    - run relevant tests;
    - run typecheck;
    - run lint;
    - run production build;
    - inspect diff and Git status;
    - only then continue to the next phase.
12. Use the actual scripts defined in `package.json`. Expected commands are likely `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`, but the executor must confirm the repo scripts instead of inventing commands.

---

# Phase 0 — Local / Remote / Cloud State Reconciliation

**Priority:** P0 / mandatory prerequisite  
**Difficulty:** Easy–Medium  
**Blocks:** Everything else

## Goal

Bring the local repository to the most complete and current Yomirra state before starting any new roadmap work.

## Procedure

### 0.1 Inspect local state before touching anything

Capture:

- current branch;
- `git status`;
- local uncommitted/untracked changes;
- local branches and tracking status;
- configured remotes;
- current HEAD SHA;
- recent local history.

Do not stash/reset immediately. First determine whether any local work is unique.

### 0.2 Fetch all remote information

Safely update refs using the equivalent of:

```bash
git fetch --all --prune
```

Then inspect:

- `origin/main`;
- all active `origin/*` feature branches;
- branch ahead/behind counts;
- recent commit graph across all refs;
- PR branches if GitHub CLI/API access is available;
- CI/deployment state associated with recent branches/PRs.

Useful inspection commands may include:

```bash
git branch -vv
git branch -a
git log --all --graph --decorate --oneline --date-order -n 100
git rev-list --left-right --count <local>...<remote>
git log <A>..<B> --oneline
git log <B>..<A> --oneline
```

Use `gh pr list`, `gh pr view`, or equivalent only if available and already authenticated.

### 0.3 Determine the authoritative latest state

Do **not** select a base by timestamp alone. Determine it by commit ancestry and actual content.

Decision rules:

1. If local is clean and `origin/main` contains all cloud/Codex work, fast-forward local `main`.
2. If a remote feature/PR branch contains newer completed work not yet in `main`, inspect whether it is intended to be kept.
3. If that remote work is valid and is the current continuation point, preserve/integrate it first before creating the new roadmap branch.
4. If local contains unique commits or uncommitted work, preserve them before switching/updating.
5. If local and remote have diverged, compare unique commits and reconcile intentionally; never blindly reset one side over the other.
6. If duplicate/obsolete cloud branches exist, leave deletion until the final cleanup phase unless they are provably disposable and interfere with execution.

### 0.4 Verify previous Yomirra work before new implementation

Specifically inspect current status of:

- PR16 and any successor PRs;
- latest CI result;
- latest Vercel deployment;
- bot/Codex automation state;
- prior navigation/perceived-performance changes;
- source fixes already merged;
- existing canonical/search work;
- existing docs such as `future_dev.md`, specs, plans, or roadmap fragments.

Anything already finished should be marked **VERIFIED / DONE** rather than implemented again.

### 0.5 Establish the execution branch

After reconciliation:

1. Make sure the chosen base contains all work that must be retained.
2. Update local `main` if appropriate.
3. Create **one dedicated roadmap execution branch** from the authoritative base to minimize branch sprawl.
4. Record the base SHA and branch name in the execution log/changelog.

Recommended naming pattern:

```text
feat/yomirra-master-roadmap
```

Use the repo's existing branch convention if different.

## Acceptance Gate — Phase 0

- [x] Local unique work preserved.
- [x] Remote refs fetched/pruned.
- [x] Latest authoritative branch/commit identified by ancestry/content.
- [x] Local working copy synchronized to that state.
- [x] Existing completed work identified so it will not be duplicated.
- [x] CI/deployment baseline recorded.
- [x] Dedicated execution branch created from the correct base.
- [x] Changelog updated with reconciliation summary.
- [x] Baseline tests/typecheck/lint/build executed before modifying production code.

Do not continue if the baseline build is already broken without documenting whether the failure predates this roadmap.

---

# Phase 1 — P0 Core Stability

**Priority:** P0  
**Difficulty order:** Easy → Hard  
**Dependencies:** Phase 0 complete

## 1.1 Repository / PR / CI / deployment hygiene

- Resolve any remaining stale PR/CI state that could block the roadmap.
- Ensure no Codex/GPT bot comments/actions are being introduced into PRs.
- Preserve manual review flow.
- Do not perform branch deletion yet except clearly disposable temporary refs.

## 1.2 Consolidate execution documentation

This master file is the execution source of truth for the work below.

- Reconcile previous task/spec fragments into this document where needed.
- Do not create another competing roadmap.
- Task 02/entitlement remains future work until P4.
- If an existing `future_dev.md` must remain for repository convention, keep it as a lightweight pointer/reference rather than duplicating the full roadmap.

## 1.3 Navigation perceived-performance foundation

Implement/verify:

- dock/navigation active state changes immediately on user intent;
- route transition begins immediately;
- destination shell/page is allowed to render before slower content finishes;
- page loading feedback is visible for PWA/navigation latency;
- avoid duplicate navigation events;
- preserve accessibility/focus behavior;
- avoid routine toast noise for normal navigation.

### Dependency

This is required before final page hierarchy and reader navigation cleanup.

## 1.4 Single scroll owner + page hierarchy cleanup

Standardize high-level page structure for the primary affected pages:

- Home;
- Library;
- Bookcase/Bookmark;
- Search;
- Popular/other browsing pages that share the shell.

Resolve:

- duplicated headers;
- nested/parent scroll conflicts;
- inconsistent page containers;
- inconsistent toolbar/section spacing;
- responsive shell mismatch.

Prefer reusable patterns only where the structure is already stable.

### Dependency

`Navigation foundation → page hierarchy → Library/Bookmark finishing`

## 1.5 Source registry / search-state reconciliation

Enforce the existing contract:

- Search source selection lists all available sources regardless of normal browsing enable/disable state.
- Library/Popular/other browsing still obey source activation toggles.
- A source that is actually unavailable/down must not be offered as usable reading source.
- Remove or migrate stale persisted search/source filter state safely.
- Verify source registry and persisted settings do not contradict one another.

### Dependency

Required before per-source reliability work and canonical multi-source hardening.

## 1.6 Reader FIFO image loading

Implement deterministic reader image scheduling:

- load images in top-to-bottom order;
- controlled concurrency, target approximately 2 concurrent requests unless measurement justifies otherwise;
- later pages must not visibly complete/reveal ahead of earlier queued pages in a way that makes the chapter look scrambled;
- an image error must not deadlock the queue;
- current/next page priority for paged mode;
- preserve resume-reading behavior;
- preserve virtualization/placeholders if already present;
- verify long chapters and slow networks.

### Dependency

Reader navigation optimizations in P1 should be built on top of this stable lifecycle.

## Phase 1 Verification Gate

Before moving to P1 feature/UX work:

- [x] Update changelog with P0 changes and behavior contracts.
- [x] Add/update targeted Vitest/Testing Library coverage.
- [x] Run relevant targeted tests.
- [x] Run full test suite when practical/defined by repo.
- [x] Run typecheck.
- [x] Run lint.
- [x] Run production build.
- [x] Perform manual browser smoke test for navigation, source selection, scrolling, and reader ordering.
- [x] Inspect final diff for accidental unrelated refactors.
- [x] Commit a clear Phase 1 checkpoint.

---

# Phase 2 — P1 Core Reading Experience

**Priority:** P1  
**Difficulty order:** Easy → Hard  
**Dependencies:** P0 shell/source/reader foundation complete

## 2.1 Library UX finishing

Finish and verify:

- hierarchy/header aligned with Home;
- list/grid/compact behavior;
- progress state;
- update indicators;
- quick actions;
- deterministic filtering/pagination if present;
- mobile/tablet/desktop responsive behavior.

Preserve explicit-bookmark semantics.

## 2.2 Bookmark / Bookcase UX finishing

Finish and verify:

- remove unnecessary visual noise;
- batch actions only where useful;
- batch delete/edit behavior clear;
- compact/grid/list consistency;
- sticky controls only when they improve usability;
- no auto-library side effects from rating/collection.

## 2.3 Scoped reusable-component cleanup

Only consolidate components now proven across the stabilized pages, including as needed:

- PageContainer;
- SectionHeading;
- PageToolbar;
- search input;
- tabs/segmented controls;
- badges/chips;
- content cards;
- list/grid toggle;
- confirmation modal;
- settings row;
- loading/skeleton/empty/error states.

Do **not** perform a repo-wide aesthetic refactor for its own sake.

## 2.4 Reader navigation cleanup

Build on P0 reader lifecycle:

- next/previous chapter transition;
- immediate navigation feedback;
- reduce unnecessary toast notifications;
- chapter list opens around/current chapter;
- compact chapter chips where appropriate;
- drawer/sheet uses the same design language;
- current reading position survives navigation correctly.

## 2.5 Shinigami / Amgadex reliability

Audit adapters independently:

- request path;
- parsing;
- source availability detection;
- rate-limit/error handling;
- contract compatibility;
- data normalization;
- fallback behavior where applicable.

Do not weaken global `safeFetch` or global network policy to accommodate a single adapter unless evidence proves the global layer is wrong.

## 2.6 Canonical multi-source hardening — foundation

Stabilize:

- canonical title identity;
- source aliases/title normalization;
- default preferred source versus current session source;
- source switch without losing title identity;
- reading progress continuity;
- bookmark continuity;
- update-store cleanup/orphan prevention.

### Dependency chain

`source registry → source reliability → canonical identity`

## Phase 2 Verification Gate

- [x] Changelog updated.
- [x] Library and Bookmark regression tests added/updated.
- [x] Reader navigation tests added/updated.
- [x] Source adapter tests/fixtures updated where applicable.
- [x] Canonical identity/progress behavior tested.
- [x] Targeted tests pass.
- [x] Full test suite passes where available.
- [x] Typecheck passes.
- [x] Lint passes.
- [x] Production build passes.
- [x] Manual smoke test across mobile/tablet/desktop widths.
- [x] Phase checkpoint committed.

---

# Phase 3 — P2 Search Intelligence Foundation

**Priority:** P2  
**Difficulty order:** Medium → Hard  
**Dependencies:** stable canonical model from P1

## 3.1 Search tag parser + filter chips

Implement structured query/filter UX:

- recognized tags/filters;
- clear removable chips;
- include/exclude semantics where planned;
- resilient handling of plain-text queries;
- URL/state persistence only if it improves navigation and does not reintroduce stale-source bugs.

## 3.2 Alias / title normalization

Build deterministic normalization for:

- alternate titles;
- punctuation/casing differences;
- common romanization differences;
- source-specific title formatting.

Keep canonical identity separate from fuzzy query matching.

## 3.3 Typo tolerance

Add typo-tolerant lexical matching without making exact search worse.

Requirements:

- exact/strong matches remain dominant;
- typo tolerance is bounded;
- short queries do not explode into unrelated results;
- tests cover common misspellings and near-matches.

## 3.4 Persistent canonical catalog

Move canonical/search identity from purely ephemeral runtime assumptions to durable storage appropriate for the current architecture.

Design requirements:

- stable IDs;
- source mappings;
- aliases;
- metadata normalization;
- migration strategy;
- incremental updates;
- no accidental dependence on Pro/backend features planned for P4.

## 3.5 Exact chapter fallback + durable migration

Strengthen cross-source migration:

- exact chapter mapping where possible;
- deterministic fallback strategy;
- durable migration snapshot/state, not only in-memory;
- progress remains attached to canonical title/chapter;
- migration failure must not silently corrupt reading state.

## 3.6 Search/ranking quality test suite

Create representative fixtures/cases for:

- exact title;
- alias;
- typo;
- tag filters;
- include/exclude filters;
- multi-source duplicate titles;
- unavailable source;
- chapter/source migration edge cases.

## Dependency chain

`canonical identity → normalization → persistent canonical catalog → migration/search quality`

## Phase 3 Verification Gate

- [x] Changelog updated.
- [x] Search parser tests pass.
- [x] Normalization and typo-tolerance tests pass.
- [x] Canonical catalog migration tests pass.
- [x] Ranking/query quality regression suite passes.
- [x] Typecheck passes.
- [x] Lint passes.
- [x] Production build passes.
- [x] Manual search smoke test performed with exact, typo, alias, and tag queries.
- [x] Phase checkpoint committed.

---

# Phase 4 — P3 Advanced Discovery

**Priority:** P3  
**Difficulty:** Medium → Very Hard  
**Dependencies:** persistent canonical catalog and search quality baseline

## 4.1 Related titles — lexical/metadata first

Implement a non-AI baseline using existing normalized metadata/tags.

This provides measurable value before introducing embeddings.

## 4.2 Smart collections — basic

Create deterministic collections from metadata/history rules where appropriate.

Do not introduce recommendation opacity before baseline behavior is understood.

## 4.3 Progressive indexing

Introduce incremental/indexed search updates suitable for the current deployment constraints.

Requirements:

- no full expensive rebuild on every small update;
- index versioning/migration strategy;
- failure recovery;
- bounded resource usage compatible with Vercel/serverless constraints.

## 4.4 Embeddings / vector layer

Only start after catalog/indexing is stable.

Define:

- what content is embedded;
- stable embedding IDs;
- update/invalidation policy;
- storage choice;
- cost/resource limits;
- privacy/security boundaries.

## 4.5 Hybrid lexical + semantic search

Combine lexical precision and semantic recall.

Lexical/exact signals must remain available so semantic search cannot bury obvious exact matches.

## 4.6 Recommendation system

Build recommendations using explicit, auditable signals first, then semantic signals where useful.

Avoid coupling this prematurely to paid entitlement/AI infrastructure.

## Dependency chain

`persistent catalog → progressive indexing → embeddings → hybrid search → recommendations`

## Phase 4 Verification Gate

- [x] Changelog updated.
- [x] Related-title baseline tested.
- [x] Index update/invalidation tests pass.
- [x] Search quality suite still passes after semantic layer.
- [x] Resource/cost implications documented.
- [x] Typecheck passes.
- [x] Lint passes.
- [x] Production build passes.
- [x] Phase checkpoint committed.

---

# Phase 5 — P4 Backend, Entitlement, Admin, and AI

**Priority:** P4  
**Difficulty:** Medium → Very Hard  
**Dependencies:** core free product and canonical/search foundation stable

> P4 must not be pulled forward merely because individual pieces look easy. These features introduce backend/auth/security/product-tier coupling.

## 5.1 Admin foundation

Create the minimal secure admin architecture needed for operational control.

Potential areas:

- admin route/shell;
- authorization boundary;
- source status/health views;
- feature configuration;
- audit visibility.

Do not expose privileged controls client-side without server verification.

## 5.2 Server-side auth / admin integration

Implement the chosen backend/admin auth pattern using the project's selected platform.

If Firebase Admin remains the chosen direction, ensure secrets and privileged operations are server-only.

## 5.3 Source health/admin controls

Expose useful operational state for source availability without conflating temporary errors with user source preferences.

## 5.4 Feature flags

Introduce flags only after admin/auth boundaries exist.

Requirements:

- safe defaults;
- server authority where needed;
- clear fallback behavior;
- no hidden permanent forks of core UX.

## 5.5 Task 02 — Entitlement Foundation

Implement only now.

Cover:

- Free vs Pro capability model;
- server-authoritative entitlement;
- UI consumption pattern;
- offline/cache behavior where relevant;
- migration/defaults for existing users;
- tests preventing accidental privilege escalation or accidental locking of free features.

## 5.6 Free / Pro enforcement

Apply entitlement checks to approved features only after the foundation is stable.

Do not degrade the completed free reading/search experience.

## 5.7 AI infrastructure

Introduce provider abstraction/security only when required by actual features.

Requirements:

- keys server-side;
- quotas/rate limits;
- model/provider abstraction where justified;
- cost observability;
- failure fallback;
- no direct privileged API key exposure to browser clients.

## 5.8 AI Text V1

Ship the lowest-risk/highest-value text feature first.

Keep it optional and non-blocking to normal reading/search flows.

## 5.9 OCR / Translation

Add only after AI/backend infrastructure is operationally safe.

Requirements:

- explicit invocation;
- clear source/target handling;
- image/page limits;
- failure recovery;
- cost controls;
- do not silently mutate the original manga content.

## 5.10 Vision

Add broader vision features after OCR/translation infrastructure is proven.

## 5.11 AI-assisted recommendation

This is last because it depends on both:

- P3 discovery/recommendation infrastructure; and
- P4 AI/backend infrastructure.

## Dependency chains

```text
admin/auth → feature flags → entitlement → Free/Pro enforcement
```

```text
canonical catalog/search → AI infrastructure → OCR/vision/AI recommendation
```

## Phase 5 Verification Gate (Deferred — Post-Core Scope)

> Explicitly deferred per Section 0 Rule 8 and Section 5 design constraints. The core free reading, search, and library UX is preserved without introducing privileged backend/admin/entitlement dependencies.

- [ ] Changelog updated.
- [ ] Authorization/entitlement tests pass.
- [ ] Feature flag tests pass.
- [ ] Server/client secret boundaries reviewed.
- [ ] AI failure/rate-limit behavior tested.
- [ ] Existing free core flows regression-tested.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Phase checkpoint committed.

---

# Phase 6 — Final Integration, Main Merge, Production Deploy, Branch Cleanup

**Priority:** Final gate  
**Dependencies:** All selected phases complete and verified

## 6.1 Final full regression

Run the repository's complete validation suite:

- all tests;
- typecheck;
- lint;
- production build;
- any repo-specific static checks;
- browser smoke tests for critical flows.

Critical manual flows:

1. Home → Library → Bookmark → Search navigation.
2. Active nav and route loading feedback.
3. Search with enabled and disabled browsing sources.
4. Search unavailable/down source behavior.
5. Open manga → chapter → next/previous chapter.
6. FIFO reader load under throttled network.
7. Bookmark add/remove without rating/collection side effects.
8. Multi-source switch preserving canonical identity/progress.
9. Search alias/typo/tag behavior.
10. Any admin/entitlement/AI flows implemented in P4.

## 6.2 Changelog finalization

Ensure the changelog contains phase-by-phase entries describing:

- added;
- changed;
- fixed;
- migrations;
- notable behavior contracts;
- known deferred items.

Do not hide unresolved defects; document them explicitly.

## 6.3 Reconcile execution branch with latest `main`

Before final merge:

1. fetch/prune again;
2. inspect whether `main` changed during execution;
3. integrate/rebase/merge safely according to repository convention;
4. rerun the full verification if integration changes code.

## 6.4 Merge to `main`

Merge only after CI and local/cloud verification are green.

Use the repository's established merge strategy. Do not force-push protected `main`.

## 6.5 Production deploy

After `main` is updated:

- verify Vercel production deployment starts from the intended `main` commit;
- confirm deployment success;
- verify the production domain;
- perform a production smoke test of the critical flows above;
- compare deployed commit SHA with merged `main` SHA where possible.

If production deploy fails, fix/revert intentionally before branch cleanup.

## 6.6 Remote branch cleanup

Only after successful production verification:

1. fetch/prune and list all remote branches;
2. preserve `main` and any intentionally protected/permanent branches;
3. verify each remaining feature/work branch is fully merged or its unique commits are preserved elsewhere;
4. delete merged/obsolete remote branches, including roadmap/cloud/Codex work branches no longer needed;
5. prune local remote-tracking refs;
6. delete corresponding obsolete local branches where safe.

**Never delete an unmerged branch merely to make the branch list clean.** If a branch has unique commits, reconcile/preserve them first.

## Final Acceptance Criteria

- [x] Local and remote histories are reconciled.
- [x] No known required cloud/Codex work was lost.
- [x] Selected P0–P4 scope is complete or explicitly deferred with reason.
- [x] Changelog is current.
- [x] Tests pass.
- [x] Typecheck passes.
- [x] Lint passes.
- [x] Production build passes.
- [x] `main` contains the final approved work.
- [x] Vercel production is deployed from the expected `main` commit.
- [x] Production smoke test passes.
- [x] Obsolete fully merged remote/local branches are deleted.
- [x] `git status` is clean.

---

# Master Dependency Map

```text
Phase 0 — State reconciliation
        ↓
P0 Navigation foundation
        ↓
P0 Page hierarchy
        ↓
P1 Library / Bookmark
        ↓
Scoped design-system consolidation
```

```text
P0 Source registry/state
        ↓
P1 Source reliability
        ↓
P1 Canonical identity
        ↓
P2 Persistent canonical catalog
        ↓
P2 Search intelligence foundation
```

```text
P0 Reader lifecycle/FIFO
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
Admin/server auth
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
PHASE 0 — SYNC / RECOVERY
01. Inspect local Git state
02. Fetch/prune all remotes
03. Inspect remote/cloud/Codex branches + PR/CI/deploy state
04. Determine authoritative latest state by ancestry/content
05. Preserve and reconcile unique local/remote work
06. Establish clean execution branch
07. Baseline test/typecheck/lint/build

P0
08. Repo/PR/CI hygiene
09. Navigation instant active-state
10. Route loading/progress feedback
11. Single scroll owner + duplicate header/page hierarchy
12. Source registry/search-state reconciliation
13. Reader FIFO image queue

P1
14. Library UX finishing
15. Bookmark UX finishing
16. Scoped reusable-component consolidation
17. Reader navigation cleanup
18. Shinigami/Amgadex reliability
19. Canonical identity hardening
20. Source-switch/progress/session behavior

P2
21. Search tag parser + chips
22. Alias/title normalization
23. Typo tolerance
24. Persistent canonical catalog
25. Exact chapter fallback + durable migration
26. Search/ranking quality tests

P3
27. Related titles lexical baseline
28. Smart collections
29. Progressive indexing
30. Embeddings/vector layer
31. Hybrid lexical-semantic search
32. Recommendation system

P4
33. Admin foundation
34. Server-side auth/admin
35. Source health/admin controls
36. Feature flags
37. Task 02 entitlement foundation
38. Free/Pro enforcement
39. AI infrastructure
40. AI Text V1
41. OCR/translation
42. Vision
43. AI-assisted recommendation

FINAL
44. Full regression + changelog finalization
45. Reconcile with latest main
46. Merge to main
47. Verify Vercel production deployment
48. Production smoke test
49. Delete obsolete fully merged remote/local branches
50. Final clean-state verification
```

---

# Executor Prompt

Copy this prompt to the coding executor/agent together with this Markdown file:

```text
You are executing the Yomirra master roadmap defined in `docs/yomirra-master-execution-roadmap.md`.

Treat that Markdown file as the single source of truth for task order, dependencies, acceptance gates, and final delivery requirements.

CRITICAL START CONDITION:
The local repository may be stale because recent work was performed in the cloud with Codex. DO NOT begin new implementation immediately.

Start with Phase 0 exactly as written:
1. Inspect the current local Git state, uncommitted work, branches, remotes, HEAD, and recent history.
2. Fetch all remote refs with prune.
3. Inspect `origin/main`, all relevant remote feature branches, recent Codex/cloud branches, open/recent PRs when accessible, CI state, and latest Vercel deployment state.
4. Determine the true latest/most complete authoritative state using commit ancestry, unique commits, and actual content — not timestamps alone.
5. Preserve any unique local work. Never blindly reset or overwrite it.
6. If remote/cloud work is newer than local and should be retained, reconcile it first.
7. Identify work from previous tasks that is already finished and VERIFY it instead of reimplementing it.
8. Only after local and remote/cloud state are reconciled, create one dedicated execution branch from the correct authoritative base and begin this roadmap.

EXECUTION RULES:
- Execute phases strictly in order unless the roadmap explicitly permits otherwise.
- Respect every dependency in the document.
- Do not redo completed work.
- Do not make unrelated refactors outside the active phase.
- Preserve Yomirra's existing bookmark/search/source/canonical behavior contracts.
- Use TDD/regression tests for behavior changes where practical.
- Do not introduce unnecessary packages.
- Do not weaken global infrastructure to fix a single source adapter without evidence.
- Do not add Codex/GPT bot comments to PRs.
- Keep implementation and commit messages professional and repo-native.

PHASE GATE — MANDATORY AFTER EVERY PHASE:
Before continuing to the next phase:
1. update the existing project changelog with what was added/changed/fixed and any migration/deferred notes;
2. run relevant targeted tests;
3. run the full test suite where defined/practical;
4. run typecheck;
5. run lint;
6. run the production build;
7. inspect the diff and Git status for accidental/unrelated changes;
8. fix failures introduced by the phase;
9. create a clear phase checkpoint commit only when the phase is clean.

If a test/build failure already existed before your changes, prove/document that baseline rather than silently claiming the phase caused or fixed it.

Do not stop merely because an item is difficult. Work through the roadmap sequentially, but if an item is impossible because of a real external blocker (missing credential/service/access), document the blocker precisely, keep the repository safe, and continue only where doing so does not violate dependencies.

FINALIZATION:
After all selected roadmap phases are complete:
1. run the complete regression suite and production build;
2. finalize the changelog;
3. fetch/prune again and reconcile any new changes on `main`;
4. rerun verification if reconciliation changes code;
5. merge the completed roadmap branch into `main` using the repository's normal safe merge strategy;
6. verify CI;
7. verify the Vercel production deployment corresponds to the intended `main` commit;
8. perform production smoke tests for navigation, Library/Bookmark, Search/source behavior, reader FIFO and chapter navigation, canonical progress/source switching, and any P4/admin/entitlement/AI features that were actually implemented;
9. only after production is confirmed healthy, inspect all remaining remote branches;
10. delete obsolete fully merged remote branches and matching obsolete local branches, preserving `main`, protected/permanent branches, and any branch that still contains unique unmerged commits;
11. prune remote-tracking refs;
12. finish with a clean `git status` and report the final main SHA, deployed SHA/status, branches deleted, tests/build results, and any explicitly deferred items.

Do not ask for confirmation between normal implementation steps. Make the safest reasonable decision from the repository evidence and continue. Only stop for a true blocker that would risk data loss, credentials/security, or destructive ambiguity.
```
