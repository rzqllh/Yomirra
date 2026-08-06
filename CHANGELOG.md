# Changelog

All notable changes to Yomirra are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and released versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Multi-source Search Page aligned with the Library layout.
- Independent source selection directly from Search.
- Per-source filter capability discovery and source-specific search payloads.
- Dynamic Komikindo filter discovery with Redis caching.
- Safe filter pruning when the active source set changes.
- Focused unit and integration coverage for source filters, pruning, page reset, and multi-source search.
- Batch selection and deletion support in Download Manager.
- Canonical `FilterChip` component with explicit `aria-pressed` state.
- Public project documentation and source-integration guide.

### Changed

- Search requests are executed per source so unsupported filters are omitted without excluding that source.
- Filter chips and selected icon actions now use shared UI primitives.
- Search pagination avoids re-querying a source after it reports that no next page is available.
- Search and Library filter presentation are more consistent.

### Fixed

- Offline reader fallback no longer loops when a cached image is missing.
- Offline image URLs bypass Next.js image optimization where required.
- Blob URLs are revoked during reader teardown and chapter changes.
- Partial download-deletion failures preserve failed items while removing successful items.
- Filter chip semantics no longer infer accessibility state from visual variants.

### Known Follow-ups

These are development notes, not shipped fixes:

- Complete device-level PWA and offline verification.
- Forward abort signals through the full search request stack.
- Verify source behavior in hosted preview environments.
- Improve the accessibility representation of Library genre include/exclude states.

## [0.1.0] - 2026-06-10

### Added

- Initial App Router page structure.
- Source adapter architecture with Shinigami as the first implementation.
- Manga detail, chapter listing, and reader flows.
- Vertical and paged reader modes.
- Zustand stores for reader preferences, library, and history.
- Firebase authentication and synchronization foundations.
- Signed image proxy for remote images.
- Typecheck, lint, test, and build scripts.
- Security headers and environment validation.

### Changed

- Migrated the codebase toward domain-oriented modules.
- Consolidated icons around Phosphor Icons.
- Replaced broad untyped API handling with stricter TypeScript contracts.

[Unreleased]: https://github.com/rzqllh/Yomirra/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rzqllh/Yomirra/releases/tag/v0.1.0
