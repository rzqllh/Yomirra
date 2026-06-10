# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
