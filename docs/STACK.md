# Stack

`package.json` adalah source of truth untuk versi package. Dokumen ini menjelaskan dependency utama dan boundary penggunaannya.

## Core

| Package | Version | Peran |
| --- | --- | --- |
| Next.js | `16.3.5` | App Router, server routes, build |
| React | `19.2.4` | UI runtime |
| React DOM | `19.2.4` | DOM renderer |
| TypeScript | `^5` | type checking |

Build script:

```bash
next build --webpack
```

## Styling

| Package | Version |
| --- | --- |
| Tailwind CSS | `^4` |
| `@tailwindcss/postcss` | `^4` |
| `clsx` | `^2.1.1` |
| `tailwind-merge` | `^3.5.0` |
| `class-variance-authority` | `^0.7.1` |

## State dan request

- Zustand `^5.0.13` — local/persisted client state.
- TanStack Query `^5.100.9` — remote request state/cache.

## Motion dan UI primitives

- `motion ^12.40.0`
- Radix UI packages
- `vaul ^1.1.2`
- `cmdk 1.0.0`
- `sonner ^2.0.7`
- `@phosphor-icons/react ^2.1.10`

Gunakan `motion/react`, bukan dependency animation paralel.

## Server dan infrastructure

- Firebase `^12.14.0` — auth + supported cloud sync.
- ioredis `^5.10.1` — Redis cache/search catalog.
- Zod `^4.4.3` — runtime validation.
- Cheerio `^1.2.0` — HTML parsing pada adapter tertentu.

## PWA dan offline

- `@serwist/next ^9.5.11`
- `serwist ^9.5.11`
- `jszip ^3.10.1`
- `file-saver ^2.0.5`
- `@tanstack/react-virtual ^3.14.2`
- `react-intersection-observer ^10.0.3`
- `@use-gesture/react ^10.3.1`

## Theme dan telemetry

- `next-themes ^0.4.6`
- `@vercel/speed-insights ^2.0.0`

## Testing

- Vitest `^4.1.5`
- jsdom `^29.1.1`
- Testing Library React `^16.3.2`
- Vite React plugin `^6.0.1`

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
pnpm start
```

## Guardrails

| Concern | Established choice |
| --- | --- |
| icons | Phosphor |
| animation | Motion |
| client state | Zustand |
| remote state | TanStack Query |
| styling | Tailwind + CSS tokens |
| validation | Zod |
| toasts | Sonner |
| HTTP | native fetch melalui API client/routes |

Dependency baru harus menyelesaikan masalah nyata yang tidak sudah ditangani stack existing.
