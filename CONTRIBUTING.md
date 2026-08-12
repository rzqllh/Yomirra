# Contributing to Yomirra

Thanks for helping improve Yomirra.

The project favors small, reversible, independently verifiable changes. A pull request should solve one coherent problem. Avoid broad “while I was here” rewrites that mix UI redesign, state migration, source work, and unrelated cleanup.

## Before You Start

1. Search existing issues and pull requests.
2. Open an issue for broad behavior changes, new architecture, or a new public contract.
3. Read the relevant public docs:
   - [README](README.md)
   - [Architecture](docs/ARCHITECTURE.md)
   - [Components](docs/COMPONENTS.md) for UI work
   - [Testing](docs/TESTING.md) for verification expectations
   - [Adding a Source](docs/ADDING_A_SOURCE.md) for source work
4. Branch from the latest `main`.

Suggested branch names:

```text
feat/source-example
fix/search-pagination
docs/public-documentation
refactor/filter-components
```

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

PowerShell:

```powershell
Copy-Item .env.example .env
pnpm dev
```

## Scope and Change Discipline

- Keep each pull request focused.
- Do not rewrite unrelated files.
- Avoid formatting or line-ending churn.
- Preserve established behavior unless the pull request explicitly changes it.
- Separate structural refactors from visual/behavior changes when practical.
- Separate browser/PWA claims from unit-test evidence.
- Prefer the smallest abstraction that removes a proven duplicated responsibility.

A lower line count is not, by itself, an architecture goal. Do not split or merge components solely to satisfy an arbitrary file-size target.

## TypeScript and Boundaries

- Use existing domain types and contracts.
- Avoid `any` and unsafe casts unless the boundary cannot be expressed more safely and the reason is documented.
- Validate external data at API/source boundaries.
- Normalize source-specific responses before returning them to shared/client code.
- Never import `src/server/` source adapters directly into client components.

## UI Architecture

Check [docs/COMPONENTS.md](docs/COMPONENTS.md) before creating a new reusable UI implementation.

### Reuse canonical primitives

Current examples include:

- `PageHeader`
- `SearchInput`
- `FilterChip`
- `FilterDrawerShell` / `FilterSection`
- `MangaCover`
- `ReadingProgress`
- `MangaGrid`
- `ReaderPanelShell`

Do not rebuild their established infrastructure locally unless the feature has a genuinely different contract.

### Keep feature boundaries meaningful

Complex client routes generally follow:

```text
App Router entrypoint
→ feature page view
→ feature components + controller hook(s)
```

Library, Bookmark, and Search use this pattern today. New code should follow the responsibility, not copy file names mechanically.

For example, Bookmark has separate Reading and Collection domains; it should not be forced into Library's component shape simply for symmetry.

### Avoid mega components

Do not turn distinct manga card archetypes into one `MangaCard` with an ever-growing list of unrelated variants. `ShelfCard`, `HistoryCard`, `EditorialCard`, and `LeaderboardRow` intentionally remain separate while sharing lower-level primitives.

Likewise, do not create a universal drawer abstraction. Search/Library filters use Vaul through `FilterDrawerShell`; Reader panels use Motion through `ReaderPanelShell` because their responsive and interaction contracts differ.

### Styling and accessibility

- Use established semantic design tokens instead of new raw hex/RGB values.
- Shared components own their internal visual identity; caller `className` should primarily handle external layout.
- Use native semantic controls and explicit state such as `aria-pressed`.
- Give icon-only controls accessible labels.
- Verify keyboard/dismiss behavior for overlays and dialogs.

## State and Data Fetching

- Use Zustand for established persistent/client state.
- Use TanStack Query for remote request state.
- Query keys must include values that change the response.
- Do not destroy user filter state because a capability request is incomplete or failed.
- Keep transient/draft UI state local when it exists only before an explicit Apply action.
- Persistent store or backup-schema changes must include backward-compatibility/migration coverage.

Controller hooks are allowed to coordinate multiple established stores and queries when that is the natural feature boundary. Do not decompose a controller into many hooks solely to make it shorter.

## Source Adapters

- Implement the complete established source contract.
- Return normalized Yomirra types.
- Respect upstream terms, rate limits, and content rules.
- Do not commit private credentials or bypass mechanisms that depend on secrets.
- Add focused tests for normalization, pagination, filters, and important failures.
- Keep live-source availability claims separate from deterministic adapter tests.

## Required Verification

For a broad refactor or release-sensitive change, run:

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
git diff --check
```

Report lint results precisely when warnings remain, for example:

```text
PASS — 0 errors, 413 warnings
```

Do not describe a refactor as “100% zero behavior change” based only on automated checks. For structural refactors, use wording such as:

> Structural refactor completed with no intentional behavior changes; automated checks and documented smoke-test scenarios passed.

### Browser verification

UI changes that affect responsive layout, navigation, drawers/dialogs, loading states, or state retention should include targeted browser smoke tests at relevant mobile and desktop viewports.

Examples:

- search/filter/pagination flows;
- browser-back state retention;
- Bookmark selection and undo flows;
- mobile fixed-header spacing;
- Reader panel open/close/backdrop/Escape/scroll behavior;
- loading → loaded layout transitions.

PWA/offline claims require real browser/device verification when the behavior depends on Service Worker or Cache Storage.

## Tests Changed by a Refactor

When an existing test fails during a structural change, determine which case applies:

1. the implementation regressed — fix implementation;
2. the public contract intentionally changed — update implementation, test, and documentation;
3. the test assertion was stale — update the test only after verifying the runtime contract.

Do not weaken tests merely to make the suite green after an accidental behavior change.

## Commit Messages

Use clear Conventional Commit-style messages:

```text
feat(search): add per-source filter payloads
fix(reader): prevent offline fallback loop
refactor(ui): extract filter drawer shell
docs(architecture): document controller boundaries
test(downloads): cover partial deletion failure
```

## Pull Requests

A good pull request includes:

- the problem being solved;
- the chosen implementation and architecture boundary;
- files/behavior intentionally left unchanged;
- automated verification;
- browser/device verification where relevant;
- screenshots for meaningful visual changes;
- known limitations or follow-ups.

Do not include:

- local AI configuration;
- worktrees or scratch files;
- generated reports that do not belong in source control;
- `.env` files;
- private source credentials.

Use the repository pull request template when available.

## Documentation Changes

Update public documentation when a change affects:

- setup or environment variables;
- public routes or behavior;
- canonical component contracts;
- feature/controller architecture;
- source adapter contracts;
- design tokens or layout rules;
- deployment/runtime requirements;
- testing expectations;
- security assumptions.

Add notable user-facing or architectural changes to `CHANGELOG.md` under `Unreleased`.

Public docs should describe verified repository behavior. If documentation and code disagree, treat current verified code/configuration as the source of truth and correct the docs in the same change.

## Licensing and Third-Party Content

By contributing, you agree that your contribution is licensed under Apache License 2.0.

Do not submit copyrighted content, credentials, private API material, or source code that you do not have permission to distribute.
