# Contributing to Yomirra

Thanks for helping improve Yomirra.

The project favors small, reversible, independently verifiable changes. A pull request should solve one coherent problem. A giant “while I was here” refactor is still a giant refactor, however politely it is described.

## Before You Start

1. Search existing issues and pull requests.
2. Open an issue for broad behavior changes, new architecture, or a new public contract.
3. Read:
   - [README.md](README.md)
   - [Architecture overview](docs/ARCHITECTURE.md)
   - [Adding a source](docs/ADDING_A_SOURCE.md), when relevant
4. Fork the repository and branch from the latest `main`.

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

## Development Rules

### Scope

- Keep each pull request focused.
- Do not rewrite unrelated files.
- Avoid formatting or line-ending churn.
- Preserve verified behavior unless the pull request explicitly changes it.
- Separate browser/PWA claims from unit-test evidence.

### TypeScript

- Use the existing domain types.
- Avoid `any` and unsafe casts.
- Validate external data at boundaries.
- Normalize source-specific responses before returning them to shared code.

### UI

- Reuse existing primitives and feature components.
- Shared components own their visual identity.
- Caller `className` values should primarily handle external layout.
- Use native semantic elements and accessible state such as `aria-pressed`.
- Verify keyboard behavior for interactive controls.

### State and Data Fetching

- Use Zustand for established persistent client state.
- Use TanStack Query for server data and request state.
- Query keys must include every value that changes the response.
- Do not destroy user filter state based on incomplete or failed capability requests.

### Source Adapters

- Implement the complete `MangaSource` contract.
- Return normalized Yomirra types.
- Respect remote terms, rate limits, and content rules.
- Do not commit private credentials or bypass mechanisms that require secrets.
- Add focused tests for normalization, pagination, filters, and failures.

## Required Checks

Run the checks relevant to your change:

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
git diff --check
```

The full test suite is the preferred gate. When an unrelated baseline failure exists, document it precisely and show that focused tests introduce no regression.

## Commit Messages

Use clear Conventional Commit-style messages:

```text
feat(search): add per-source filter payloads
fix(reader): prevent offline fallback loop
docs(sources): document adapter contract
test(downloads): cover partial deletion failure
```

## Pull Requests

A good pull request includes:

- The problem being solved.
- The chosen implementation.
- Files and behavior intentionally left unchanged.
- Automated verification.
- Browser or device verification where relevant.
- Screenshots for visual changes.
- Known limitations or follow-ups.

Do not include:

- Local AI configuration.
- Worktrees.
- Generated test or lint reports.
- `.env` files.
- Private source credentials.
- Unrelated checkpoint or scratch files.

Use the repository pull request template.

## Documentation Changes

Update public documentation when a change affects:

- Setup or environment variables.
- Public routes or behavior.
- Source adapter contracts.
- Deployment requirements.
- User-facing features.
- Security assumptions.

Add notable user-facing changes to `CHANGELOG.md` under `Unreleased`.

## Licensing and Third-Party Content

By contributing, you agree that your contribution is licensed under Apache License 2.0.

Do not submit copyrighted content, credentials, private API material, or source code that you do not have permission to distribute.
