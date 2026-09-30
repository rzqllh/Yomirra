# Yomirra Admin — Ink Ops Revamp

## Scope

Full UI/UX revamp of the supplied admin bundle while preserving the existing admin API surface and data contracts.

### Updated surfaces

- `admin-layout.tsx`
- Overview
- Source Health
- Search Lab
- Reader Reports
- Site Control
- Infrastructure / Redis
- Core Source modal
- Custom Source Studio modal
- Admin portal tests

### Added

- `components/admin-ui.tsx`
  - shared card
  - section header
  - status pill
  - buttons
  - feedback / notice
  - metric cell
  - empty state
  - confirmation dialog

## Design direction

**Yomirra Ink Ops**

- warm near-black canvas
- red Yomirra accent only for brand/primary actions
- green only for healthy/success
- amber only for warning/degraded
- rose/red semantic treatment for destructive/error states
- dense operational hierarchy rather than generic SaaS cards
- table-first desktop data views with mobile row/card adaptation
- restrained shadows and motion
- stronger focus, hover, disabled, and loading states

## Functional changes

- Removed the hardcoded client fallback master key.
- Removed automatic development login using the fallback key.
- Existing explicit passkey flow remains intact.
- Admin view is deep-linkable through `?view=` and follows browser back/forward state.
- Native `confirm()` usage replaced with consistent confirmation dialogs in the supplied admin surfaces.
- Source list is prioritized by operational severity.
- Reader Reports now supports local text search in addition to status filtering.
- Custom Source modal state resets correctly when opening a different source.
- Existing admin API endpoints remain preserved.

## Security note

This bundle still uses the existing passkey transport model because the supplied archive does not include the server-side admin session/auth implementation. A full production hardening should later replace browser-held master credentials with a server-created HttpOnly session.

## Verification completed on this bundle

- All TS/TSX files pass TypeScript `transpileModule` parsing.
- No unused import/local diagnostics found in the supplied TSX files using TypeScript static analysis.
- No remaining purple/indigo/cyan/blue accent classes in the admin bundle.
- No native `confirm()` calls remain.
- No `yomirra-ops-master-2026` hardcoded fallback remains.
- Existing `/api/admin/*` endpoint set is preserved.

## Integration verification still required in the full Yomirra repository

Because the uploaded archive contains only the admin component subtree and not the full Next.js project, run the repository's normal gates after replacing the folder:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm build`
5. Browser verification at desktop and mobile widths

