# Stack — Yomirra

This document mirrors the current technology choices in `package.json` and the established runtime architecture. `package.json` is the source of truth for installed versions and scripts.

Do not casually upgrade or substitute core dependencies. Exact pins and semver ranges in `package.json` are intentional and should be reviewed as part of any dependency change.

## 1. Core Framework

| Package | Current declaration | Role |
| --- | --- | --- |
| `next` | `16.2.5` | App framework / App Router |
| `react` | `19.2.4` | UI runtime |
| `react-dom` | `19.2.4` | DOM renderer |
| `typescript` | `^5` | Type safety |

In use:

- App Router under `src/app/`;
- Server and Client Components;
- `"use client"` for interactive browser components;
- Next.js view-transition support configured by the project;
- Turbopack through the normal Next.js development flow.

## 2. Styling

| Package | Current declaration | Role |
| --- | --- | --- |
| `tailwindcss` | `^4` | Utility CSS |
| `@tailwindcss/postcss` | `^4` | PostCSS integration |
| `clsx` | `^2.1.1` | Conditional class composition |
| `tailwind-merge` | `^3.5.0` | Tailwind class conflict resolution |
| `class-variance-authority` | `^0.7.1` | Variant definitions |

Tailwind v4 is configured CSS-first. Theme/design tokens live in `src/app/(web)/globals.css`; do not add a `tailwind.config.ts` merely to introduce normal component tokens.

## 3. State and Data Fetching

| Package | Current declaration | Role |
| --- | --- | --- |
| `zustand` | `^5.0.13` | Established persistent/client state |
| `@tanstack/react-query` | `^5.100.9` | Remote/server request state |

Representative stores under `src/shared/store/` include Library, History, Reader, Downloads, Settings, source preferences, filters, and route-related state.

Complex feature orchestration can live in controller hooks under `src/shared/hooks/`, such as the current Library, Bookmark, and Search controllers. Do not move remote query state into Zustand merely to make a hook smaller.

## 4. Animation

| Package | Current declaration | Role |
| --- | --- | --- |
| `motion` | `^12.40.0` | Animation and reader-panel transitions |

Use:

```ts
import { motion, AnimatePresence } from "motion/react";
```

Do not import `framer-motion` separately.

Shared motion tokens live in `src/shared/lib/motion/tokens.ts`. Repeated interaction patterns should use shared tokens/variants; specialized canonical components such as `ReaderPanelShell` may own their internal transition and should be reused instead of copied.

## 5. Icons

| Package | Current declaration | Role |
| --- | --- | --- |
| `@phosphor-icons/react` | `^2.1.10` | Application icon system |

Use Phosphor Icons for new application UI instead of introducing another icon library.

## 6. UI and Overlay Primitives

| Package | Current declaration | Role |
| --- | --- | --- |
| `@radix-ui/react-dialog` | `^1.1.16` | Modal/dialog primitives |
| `@radix-ui/react-dropdown-menu` | `^2.1.17` | Dropdown menus |
| `@radix-ui/react-scroll-area` | `^1.2.11` | Scroll areas |
| `@radix-ui/react-separator` | `^1.1.9` | Separators |
| `@radix-ui/react-slot` | `^1.2.5` | Polymorphic composition |
| `@radix-ui/react-tabs` | `^1.1.14` | Tabs |
| `@radix-ui/react-tooltip` | `^1.2.9` | Tooltips |
| `vaul` | `^1.1.2` | General/filter sheet behavior |
| `cmdk` | `1.0.0` | Command palette |
| `sonner` | `^2.0.7` | Toasts |

Overlay technology is chosen by interaction family, not by a blanket “all drawers use Vaul” rule:

- **Dialogs:** Radix-based `Dialog` primitives.
- **Search/Library filter drawers:** Vaul through `FilterDrawerShell`.
- **General sheets:** Vaul where the shared Sheet contract fits.
- **Reader chapter/settings panels:** Motion through reader-specific `ReaderPanelShell`.

Do not replace Reader panels with Vaul, or filter drawers with the Motion reader shell, solely for implementation uniformity.

## 7. Backend and Infrastructure

| Package | Current declaration | Role |
| --- | --- | --- |
| `firebase` | `^12.14.0` | Authentication and supported Firestore synchronization |
| `ioredis` | `^5.10.1` | Redis client |
| `zod` | `^4.4.3` | Validation |
| `cheerio` | `^1.2.0` | HTML parsing in scraping adapters |

Source adapters and Redis integration are server-side concerns. Browser components must not import server adapters directly.

## 8. PWA

| Package | Current declaration | Role |
| --- | --- | --- |
| `@serwist/next` | `^9.5.11` | Next.js PWA integration |
| `serwist` | `^9.5.11` | Service-worker runtime |

Service-worker source: `src/app/sw.ts`.

PWA/offline behavior depends on browser runtime and storage conditions; validate significant changes in a real browser/device in addition to automated tests.

## 9. Offline and Reader Support

| Package | Current declaration | Role |
| --- | --- | --- |
| `jszip` | `^3.10.1` | Archive/CBZ-related packaging |
| `file-saver` | `^2.0.5` | Browser file-save trigger |
| `@tanstack/react-virtual` | `^3.14.2` | Virtualized long lists |
| `react-intersection-observer` | `^10.0.3` | Intersection/lazy-loading helpers |
| `@use-gesture/react` | `^10.3.1` | Touch/gesture input |

## 10. Theme and Runtime UX

| Package | Current declaration | Role |
| --- | --- | --- |
| `next-themes` | `^0.4.6` | Theme switching/persistence |
| `@vercel/speed-insights` | `^2.0.0` | Vercel performance telemetry integration |

## 11. Testing

| Package | Current declaration | Role |
| --- | --- | --- |
| `vitest` | `^4.1.5` | Test runner |
| `jsdom` | `^29.1.1` | DOM environment |
| `@testing-library/react` | `^16.3.2` | React component testing |
| `@vitejs/plugin-react` | `^6.0.1` | React support in Vitest |

See [TESTING.md](TESTING.md) for the verification strategy.

## 12. Deployment

The project is designed for Next.js deployment with server-side source adapters, Redis caching, Firebase client services, and a generated service worker.

Current infrastructure assumptions include:

- Node.js-capable server runtime for server integrations such as `ioredis`;
- environment variables supplied by the deployment platform;
- Firebase browser configuration for authentication/supported sync;
- Redis connection configuration for server caching.

Do not move server-only adapter/cache code into Edge/client bundles without verifying dependency/runtime compatibility.

## 13. Package Manager and Scripts

Use pnpm.

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm lint
pnpm test --run
```

The scripts themselves are defined in `package.json`.

## 14. Technology Guardrails

| Concern | Established choice | Avoid introducing without review |
| --- | --- | --- |
| Icons | Phosphor Icons | Lucide/Heroicons/react-icons as parallel systems |
| Animation | `motion/react` | separate `framer-motion` dependency/import path |
| Client state | Zustand | parallel Redux/Jotai/Recoil state architecture |
| Styling | Tailwind v4 + CSS tokens | styled-components/Emotion/CSS-module design system |
| Validation | Zod | parallel Yup/Joi validation layer |
| HTTP | native fetch through established API client/routes | Axios as a second client stack |
| Toasts | Sonner | parallel toast libraries |

These are architectural defaults, not a ban on evidence-based change. A replacement should solve a concrete problem and include migration/verification rather than being introduced for preference alone.
