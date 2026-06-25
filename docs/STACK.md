# STACK — Yomirra

> All versions are **locked**. Do NOT upgrade without explicit review. Do NOT substitute with alternatives not listed here.

---

## 1. Core Framework

| Package | Version | Role |
|---------|---------|------|
| `next` | `16.2.5` | App framework (App Router) |
| `react` | `19.2.4` | UI runtime |
| `react-dom` | `19.2.4` | DOM renderer |
| `typescript` | `^5` | Type safety |

**Next.js features in use:**
- App Router (`src/app/`)
- Server Components (layouts, data-fetching pages)
- `"use client"` for interactive components
- `experimental.viewTransition: true` — View Transitions API
- Turbopack enabled by default in dev

---

## 2. Styling

| Package | Version | Role |
|---------|---------|------|
| `tailwindcss` | `^4` | Utility CSS |
| `@tailwindcss/postcss` | `^4` | PostCSS integration |
| `postcss` | via config | CSS processing |
| `clsx` | `^2.1.1` | Conditional classes |
| `tailwind-merge` | `^3.5.0` | Class conflict resolution |
| `class-variance-authority` | `^0.7.1` | Component variants |

**Critical:** Tailwind v4 uses CSS-first configuration. There is **no** `tailwind.config.ts`. All theme tokens are defined in `@theme {}` inside `src/app/(web)/globals.css`. Do NOT create a tailwind.config.ts.

---

## 3. State Management

| Package | Version | Role |
|---------|---------|------|
| `zustand` | `^5.0.13` | Global client state |
| `@tanstack/react-query` | `^5.100.9` | Server state / data fetching |

**Stores (all in `src/shared/store/`):**
- `library-store.ts` — saved manga, ratings, sync
- `history-store.ts` — reading history, page progress
- `reader-store.ts` — reader preferences, overlay state
- `download-store.ts` — offline download queue/status
- `settings-store.ts` — app-wide settings
- `search-filter-store.ts` — search filter state
- `route-state-store.ts` — navigation state

---

## 4. Animation

| Package | Version | Role |
|---------|---------|------|
| `motion` | `^12.40.0` | Animation library |

Import path: `import { motion, AnimatePresence } from "motion/react"`
Tokens: `src/shared/lib/motion/tokens.ts`
Variants: `src/shared/lib/motion/variants.ts`

**Forbidden:** Do NOT import from `framer-motion`. Always use `motion/react`.

---

## 5. Icons

| Package | Version | Role |
|---------|---------|------|
| `@phosphor-icons/react` | `^2.1.10` | Icon library |

**Only use Phosphor Icons.** Do NOT use Lucide, Heroicons, or React Icons. Import: `import { IconName } from "@phosphor-icons/react"`.

---

## 6. UI Primitives

| Package | Version | Role |
|---------|---------|------|
| `@radix-ui/react-dialog` | `^1.1.16` | Modal/Dialog |
| `@radix-ui/react-dropdown-menu` | `^2.1.17` | Dropdown |
| `@radix-ui/react-scroll-area` | `^1.2.11` | Custom scrollbar |
| `@radix-ui/react-separator` | `^1.1.9` | Divider |
| `@radix-ui/react-slot` | `^1.2.5` | Polymorphic slot |
| `@radix-ui/react-tabs` | `^1.1.14` | Tab panels |
| `@radix-ui/react-tooltip` | `^1.2.9` | Tooltips |
| `vaul` | `^1.1.2` | Bottom sheet / Drawer |
| `cmdk` | `1.0.0` | Command palette |
| `sonner` | `^2.0.7` | Toast notifications |

---

## 7. Backend / Infra

| Package | Version | Role |
|---------|---------|------|
| `firebase` | `^12.14.0` | Auth + Firestore (client-side only) |
| `ioredis` | `^5.10.1` | Redis client (Upstash) |
| `zod` | `^4.4.3` | Schema validation |
| `cheerio` | `^1.2.0` | HTML scraping in source adapters |

---

## 8. PWA

| Package | Version | Role |
|---------|---------|------|
| `@serwist/next` | `^9.5.11` | Next.js PWA integration |
| `serwist` | `^9.5.11` | Service worker runtime |

Service worker entry: `src/app/sw.ts`
Output: `public/sw.js`
Disabled in development (`disable: process.env.NODE_ENV === "development"`)

---

## 9. Offline / Download

| Package | Version | Role |
|---------|---------|------|
| `jszip` | `^3.10.1` | CBZ packaging |
| `file-saver` | `^2.0.5` | File download trigger |
| `@tanstack/react-virtual` | `^3.14.2` | Virtual scrolling for long lists |
| `react-intersection-observer` | `^10.0.3` | Lazy loading trigger |

---

## 10. Gesture & Input

| Package | Version | Role |
|---------|---------|------|
| `@use-gesture/react` | `^10.3.1` | Touch gestures (swipe, pinch) |

---

## 11. Testing

| Package | Version | Role |
|---------|---------|------|
| `vitest` | `^4.1.5` | Test runner |
| `jsdom` | `^29.1.1` | DOM simulation |
| `@vitejs/plugin-react` | `^6.0.1` | React support in tests |

Config: `vitest.config.ts`, setup: `vitest.setup.ts`

---

## 12. Deployment Infrastructure

| Service | Provider | Purpose |
|---------|---------|---------|
| Hosting | **Vercel** | Next.js deployment |
| Redis | **Upstash** | API response cache (serverless Redis) |
| Auth + Database | **Firebase** | Auth + Firestore sync |
| Image CDN | **Cloudinary** | (configured, usage TBD) |
| Source scraping | Server-side adapters | No external scraping service |

### Vercel-Specific Notes
- Runtime: Node.js (not Edge) — `ioredis` requires Node runtime
- Environment variables injected at runtime, NOT build time (see `src/env.ts`)
- Build-time env validation is intentionally lenient — runtime validation is strict

---

## 13. Package Manager

**pnpm** — do NOT use npm or yarn.

```bash
pnpm install       # install deps
pnpm dev           # dev server (Turbopack)
pnpm build         # production build
pnpm test          # vitest
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint
```

---

## 14. Forbidden Alternatives

| Category | FORBIDDEN | USE INSTEAD |
|---------|-----------|------------|
| Icons | Lucide, Heroicons, react-icons | `@phosphor-icons/react` |
| Animation | framer-motion | `motion/react` |
| State | jotai, recoil, redux | `zustand` |
| Styling | styled-components, emotion, CSS modules | Tailwind v4 utility classes + CSS tokens |
| Tailwind config | `tailwind.config.ts` | `@theme {}` in `globals.css` |
| HTTP client | axios | native `fetch` via `ApiClient` in `src/shared/api-client.ts` |
| Validation | yup, joi | `zod` |
| Date | moment.js | `date-fns` |
| Toasts | react-hot-toast, react-toastify | `sonner` |
| Drawer/Sheet | any custom | `vaul` |
