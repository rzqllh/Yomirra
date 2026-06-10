# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Premium Motion System:** Implemented `motion/react` across the application. Added layout animations for search chips, spring physics for modal overlays, and scale-tap effects for cards.
- **Offline-to-Online Sync:** Added a background sync listener (`use-sync.ts`) that listens for `online` window events to trigger Firestore data reconciliation, providing POS-style reliability.
- **Global Settings Store:** Introduced `settings-store.ts` using Zustand `persist` to securely manage user preferences locally.
- **Data Saver Mode:** Implemented dynamic image optimization toggling in reader components using `next/image` and Vercel Edge caching to significantly reduce bandwidth usage.
- **NSFW Content Filter:** Added global genre exclusion logic (`-adult`, `-mature`, `-smut`, `-nsfw`, `-ecchi`) directly to `api-client.ts` to ensure clean search results when the filter is active.

### Changed
- **Skeleton Loading States:** Replaced raw `CircleNotch` spinners with structurally accurate skeleton components (`MangaCardSkeleton`, `MangaDetailSkeleton`, `ChapterListSkeleton`) across Home, Library, and Detail pages to prevent Layout Shifts.
- **Firebase Types:** Hardened Firebase configuration to properly handle `Firestore | null` types, ensuring safe closures and eliminating implicit `any` bugs during compilation.
- **Reader Shell Animations:** Calibrated overlay transition durations down to `200ms` from `300ms` for a snappier, more responsive reading experience.

### Fixed
- **Hover Scale Glitch:** Fixed a critical bug in `MangaCard` where Tailwind V4 interpreted `scale-1025` as `1025%` instead of `1.025`, causing extreme zoom on hover.
- **DOM Image Conflicts:** Resolved a TypeScript compilation error in `paged-reader.tsx` where the native DOM `Image` constructor collided with `next/image`.

## [0.1.0] - 2026-06-10

### Added
- **Routing:** Scaffolded new `/library` and `/history` placeholder pages.
- **Iconography:** Fully integrated `@phosphor-icons/react` as the single source of truth for icons.
- **Config:** Added `typecheck` and `test` scripts to `package.json` for CI/CD readiness.
- **Code Quality:** Added `eslint.config.mjs` flat config overrides to exclude `.agents` and build artifacts.

### Changed
- **Atomic Architecture Restructure:** 
  - Migrated `src/web/components` → `src/components`.
  - Migrated `src/server/lib/store` → `src/shared/store`.
  - Migrated `src/server/types` → `src/shared/types`.
  - Migrated `src/server/lib/utils` and `src/server/lib/api-client` → `src/shared/`.
- **Path Aliases:** Reconfigured `tsconfig.json` to utilize `@/components` and `@/shared` aliases, ensuring global consistency.
- **Linting Baseline:** Refactored multiple backend and client components to enforce strict TypeScript typings, eliminating 51 previous `any`-related warnings/errors.
- **Store Architecture:** Re-verified `reader-store.ts` for strict separation of concerns (no server dependencies) and Zustand v5 compliance.

### Removed
- **Dependencies:** Removed `lucide-react` completely to maintain a cohesive design system and prevent icon slop.
- **Legacy UI:** Permanently deleted the generic `glass-panel.tsx` component in favor of strict CSS variable-based tokens.
- **Redundant Routes:** Deleted standalone `/search` page; search features will be integrated directly into `/browse`.

### Fixed
- **API Typings:** Patched `catch` blocks across all API routes to use strict `unknown` error typing.
- **Reader Store:** Corrected union type intersections in `settings/page.tsx` for `ReaderMode` and `ReadingDirection`.
- **Image Next Warning:** Safely bypassed `no-img-element` warnings in reader pages to preserve image hotlink referer behavior.
