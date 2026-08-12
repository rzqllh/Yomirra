# Yomirra Documentation

Public documentation for Yomirra lives in this directory. It is intended for contributors, maintainers, and anyone who wants to understand the project's verified architecture and contracts without reading the entire codebase first.

## Start Here

- [Architecture](ARCHITECTURE.md) — runtime layers, feature/controller boundaries, source flow, caching, offline behavior, and state ownership.
- [Components](COMPONENTS.md) — canonical reusable UI seams and feature-component conventions.
- [Design](DESIGN.md) — design tokens, responsive layout rules, typography, motion, and overlay families.
- [Stack](STACK.md) — framework, package choices, and technology-specific constraints.
- [Testing](TESTING.md) — automated checks, risk-based test guidance, and browser verification.
- [Adding a Source](ADDING_A_SOURCE.md) — built-in and dynamic source integration rules.
- [Schema](SCHEMA.md) — shared persisted-data and backup schema notes.
- [Contributing](../CONTRIBUTING.md) — contribution workflow and verification requirements.
- [Security](../SECURITY.md) — vulnerability reporting and security expectations.
- [Changelog](../CHANGELOG.md) — notable user-facing and architectural changes.

## Sources of Truth

Documentation must follow the repository, not the other way around. For rapidly changing implementation details, use these sources in this order:

1. Current implementation and tests.
2. `package.json` for package versions and scripts.
3. `src/app/(web)/globals.css` for design tokens.
4. Public documentation in `docs/` and the repository root.

If a public document disagrees with current verified code, update the document instead of preserving a stale contract.

## Documentation Principles

- Describe behavior that exists in the repository.
- Mark experimental, source-dependent, and unresolved behavior explicitly.
- Do not turn a structural refactor into a claim of identical runtime behavior without verification.
- Do not present unit tests as proof of browser, PWA, service-worker, or device behavior.
- Keep source-specific scraping details in the relevant adapter or source guide.
- Prefer stable architectural boundaries over file-size or line-count targets.
- Update documentation in the same pull request when a public contract changes.
- Never include credentials, private URLs, cookies, tokens, or secret headers.

## Current UI Architecture at a Glance

The reusable UI layer is intentionally compositional:

- `PageHeader` owns the shared responsive section/destination header contract.
- `FilterDrawerShell` and `FilterSection` own Vaul-based filter presentation while Search and Library keep their own filter state and business logic.
- `MangaCover`, `ReadingProgress`, and `MangaGrid` provide low-level shared manga presentation primitives.
- Manga card archetypes remain separate (`ShelfCard`, `HistoryCard`, `EditorialCard`, `LeaderboardRow`) and compose lower-level primitives instead of using one mega card component.
- `ReaderPanelShell` is reader-specific and uses Motion; it is intentionally separate from Vaul filter drawers.
- Complex Library, Bookmark, and Search routes use thin App Router entrypoints that delegate to feature views and controller hooks.

See [Components](COMPONENTS.md) and [Architecture](ARCHITECTURE.md) for the detailed rules.
