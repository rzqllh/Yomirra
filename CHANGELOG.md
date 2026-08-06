# Changelog

All notable changes to Yomirra are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and released versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Update checker and persisted update records.
- Updates Page and unread navigation badge.
- Automatic update-check preferences and per-manga mute preference.
- Collections management and custom reading statuses.
- Local Library filters by collection and status.
- Local Backup & Restore with schema V2 supporting updates and collections.
- Source health endpoint and diagnostics.
- GitHub Actions CI workflow.
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

- Settings page now includes update and collection management.
- Manga detail view now includes reading status, collections, and mute actions.
- Local Backup now includes updates and collections (V2).
- Search cancellation only targets browser-to-Next API, not upstream adapters.
- Search requests are executed per source so unsupported filters are omitted without excluding that source.
- Filter chips and selected icon actions now use shared UI primitives.
- Search pagination avoids re-querying a source after it reports that no next page is available.
- Search and Library filter presentation are more consistent.

### Fixed

- Stale scan errors are cleared after a successful update scan.
- Unordered chapter arrays are handled safely during latest chapter detection.
- Scan cooldown persists correctly across app reloads.
- Partial source failure during global scan does not remove successful updates.
- Collection deletion now correctly clears corresponding memberships.
- BottomDock unread badge hydration mismatch prevented.
- Offline reader fallback no longer loops when a cached image is missing.
- Offline image URLs bypass Next.js image optimization where required.
- Blob URLs are revoked during reader teardown and chapter changes.
- Partial download-deletion failures preserve failed items while removing successful items.
- Filter chip semantics no longer infer accessibility state from visual variants.

### Known Follow-ups

These are development notes, not shipped fixes:

- Real-device PWA and offline behavior verification.
- Hosted source-health verification.
- Propagate AbortSignal through the full upstream request stack.
- GitHub Actions run verification after branch push.
- Accessibility follow-ups for Library genre include/exclude states.

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
