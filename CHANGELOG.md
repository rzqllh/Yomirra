# Changelog

All notable changes to Yomirra are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and released versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Built-in Komiku source adapter (`komiku.org`) supporting popular, latest, multi-source search, detail, chapters, and reader pages with signed proxy URLs where required.
- MangaDex HTTP 429 hardening with bounded `Retry-After` parsing and capped retry delay.
- Update checker, persisted update records, Updates Page, unread navigation badge, automatic update-check preferences, and per-manga mute preference.
- Collections management, custom reading statuses, and Library filters based on collections/statuses.
- Local Backup & Restore schema V2 with backward compatibility for supported older backups.
- Source health endpoint with normalized public diagnostics.
- Batch selection and deletion support in Download Manager.
- Multi-source Search with independent source selection, per-source filter capability discovery, source-specific payloads, partial-failure handling, and safe filter pruning.
- Canonical `PageHeader` for responsive section/destination headers.
- Canonical filter presentation through `FilterDrawerShell` and `FilterSection` for Library and Search.
- Canonical `FilterChip` with explicit selection/ARIA state.
- Canonical `MangaCover` for cover loading/error/fallback behavior.
- Canonical `ReadingProgress` for semantic reading-progress rendering.
- Canonical `MangaGrid` and shared `MANGA_GRID_CLASS` for responsive manga grids.
- Reader-specific `ReaderPanelShell` for shared chapter/settings panel infrastructure while preserving distinct reader business logic.
- Feature/controller decomposition for Library, Bookmark, and Search routes, moving complex client orchestration out of large App Router page files.
- Expanded loading skeleton coverage and page-specific loading states.
- Public architecture, component, design, stack, testing, contribution, and source-integration documentation.
- GitHub Actions CI workflow.

### Changed

- Library now composes dedicated toolbar, reading-status rail, collection rail, results view, and `useLibraryCatalog` controller logic.
- Bookmark now separates Reading and Collection domains with dedicated controller hooks, collection toolbar, selection toolbar, and tab views.
- Search now composes dedicated toolbar, source rail, results view, and `useSearchCatalog` multi-source controller logic.
- Search and Library filter drawers now share Vaul presentation infrastructure while keeping feature-specific filter state and source capability logic separate.
- `ShelfCard` and `HistoryCard` compose shared manga-cover/progress primitives instead of duplicating low-level media behavior.
- Manga loading grids consume the same responsive grid definition as loaded manga grids, reducing breakpoint mismatch during loading transitions.
- Route loading states and supporting views have been migrated to the canonical `PageHeader` contract.
- Deprecated `YomirraPageHeader` and `DesktopPageTitle` compatibility wrappers were removed after remaining consumers migrated.
- Reader chapter/settings overlays now share reader-specific Motion panel infrastructure instead of duplicating backdrop/header/scroll behavior.
- Toolbar search/control rows were normalized around the established 44px interaction height where applicable.
- Updates error presentation uses a dedicated/collapsible error treatment instead of dumping raw error strings into the page.
- Search cancellation remains scoped to browser-to-Next API requests unless an upstream adapter explicitly supports propagated cancellation.
- Search requests execute per source so unsupported filters can be omitted without excluding an otherwise usable source.
- Search pagination avoids re-querying a source after it reports that no next page is available until relevant search state changes.
- Settings and manga detail flows include update/collection/reading-status/mute management introduced during the current development cycle.

### Fixed

- Normalized `/api/sources/health` public responses to avoid leaking raw internal stacks or response headers.
- Fixed Komiku lazy cover extraction by preferring real lazy-load attributes over placeholder images.
- Fixed Komiku manga-card title/link matching across supported list pages.
- Corrected the MangaDex health target URL.
- Stale scan errors are cleared after a successful update scan.
- Unordered chapter arrays are handled safely during latest-chapter detection.
- Scan cooldown persists across app reloads.
- Partial source failure during global scan does not remove successful updates.
- Collection deletion clears corresponding memberships.
- BottomDock unread-badge hydration mismatch is prevented.
- Offline reader fallback no longer loops when a cached image is missing.
- Offline/local image URLs bypass Next.js image optimization where required.
- Blob URLs are revoked during reader teardown and chapter changes.
- Partial download-deletion failures preserve failed items while removing successful items.
- Filter-chip accessibility no longer infers pressed state only from visual variants.
- Search filter capability/pruning logic preserves valid user state across incomplete or changing source capability responses.
- Filter drawer safe-area/footer presentation is shared consistently between Search and Library.
- Bookmark collection toolbar and loading skeleton geometry were refined to match current responsive content more closely.

### Verification and Documentation Notes

- Canonical UI primitives and feature/controller refactors have focused unit/integration coverage in addition to project-wide typecheck, lint, test, and build workflows.
- Responsive headers, overlays, state retention, and Reader panel behavior still require targeted browser verification when changed; automated checks are not treated as proof of every browser/PWA interaction.
- Documentation no longer treats a shared grid skeleton as proof of universally zero CLS or describes structural refactors as automatically guaranteeing identical runtime behavior.

### Known Follow-ups

These are development notes, not shipped fixes:

- Real-device PWA and offline behavior verification across target browsers.
- Hosted source-health verification from production/serverless infrastructure.
- Propagate `AbortSignal` through the full upstream request stack where supported.
- Continue reducing existing lint warnings without mixing unrelated cleanup into feature changes.
- Continue accessibility verification for complex filter include/exclude and reader overlay interactions.

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
