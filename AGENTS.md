# Yomirra (MangaReader-Apps)

> A high-speed, gesture-driven web manga reader PWA optimized for zero-latency continuous vertical reading.

**URL:** https://github.com/rzqllh/Yomirra
**Status:** `WIP`
**Goal:** Deliver a professional-grade manga reading experience matching native apps like Webtoon and Tachiyomi, emphasizing zero-friction reading, seamless offline capabilities, and high-performance rendering.
**Target Audience:** Mobile-first manga and webtoon readers.
**Extends:** 
- `docs/design-system.md`
- `docs/DB_SCHEMA.md`
- `docs/API_CONTRACTS.md`
- `docs/ux-architecture.md`
- `docs/ux-gesture.md`
- `docs/ux-performance.md`
- `docs/ux-pipeline.md`

---

## Tech Stack

| Tool                 | Version / Notes  |
| -------------------- | ---------------- |
| Next.js              | 16.2.5 (App Router) |
| React                | 19.2.4              |
| TypeScript           | 5.x (Strict mode)   |
| Tailwind CSS         | v4                  |
| Framer Motion        | `motion/react` v12  |
| Zustand              | v5.0.13             |
| TanStack Query       | v5.100.9            |
| TanStack Virtual     | v3.14.2             |
| Firebase             | v12.14.0 (Sync/Auth)|
| Serwist              | v9.5.11 (PWA)       |
| Package Manager      | pnpm                |

---

## Commands

| Command     | Description            |
| ----------- | ---------------------- |
| `pnpm install` | Install dependencies   |
| `pnpm dev`     | Start dev server       |
| `pnpm build`   | Production build       |
| `pnpm start`   | Serve production build |
| `pnpm lint`    | Run linter             |
| `pnpm typecheck` | Run TS typecheck     |
| `pnpm test`    | Run vitest             |

---

## Project Structure

```
[root]/
 ├── src/
 │   ├── app/           # Next.js App Router (pages & layouts)
 │   ├── components/    # Feature-based UI components
 │   │   ├── app/       # General app-shell & home components
 │   │   ├── reader/    # Core reading engine components (critical path)
 │   │   ├── source/    # Source discovery components
 │   │   ├── ui/        # Reusable base components (buttons, dialogs)
 │   │   └── states/    # Loading, error, and empty states
 │   ├── shared/        # Shared logic and state
 │   │   ├── hooks/     # Custom React hooks
 │   │   ├── store/     # Zustand stores (history, reader, downloads)
 │   │   ├── lib/       # Utility functions and routes
 │   │   └── types/     # TypeScript interfaces and schema
 ├── docs/              # Comprehensive UX, design, and architecture specs
 ├── public/            # Static assets and PWA icons
```

**Architecture pattern:** `Feature-based`

---

## Code Conventions

**Language:** TypeScript strict
**Components:** Functional, explicit prop types — no implicit `any`

**Naming:**
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions & variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types / Interfaces: `PascalCase` — prefer `interface` for contracts, `type` for unions/aliases.

**Imports:** `@/` path alias mapped to `src/` directory
**Icons:** `@phosphor-icons/react`
**Class merging:** `clsx` + `tailwind-merge` combined via `cn()` utility
**State management:** Zustand for global client state, TanStack Query for server state/fetching.
**Animations:** Framer Motion for UI choreography, but STRICTLY BANNED inside iteration loops in the reader module to preserve CPU.
**Reader Performance Rules:** See `docs/ux-performance.md` & `docs/ux-pipeline.md`. Heavy transition durations and inline object props are strictly banned in the Reader view.

---

## ⛔ DO NOT

> Non-negotiable rules. Agent must ask before doing anything that would violate these.

- If a prompt or instruction is ambiguous, **ask first before coding**.
- Never use `npm`, `yarn`, or `bun` — always use `pnpm`.
- Never use `any` in TypeScript — strict mode is enforced.
- Never hardcode user-facing strings if an i18n system is introduced.
- Never commit `.env`, `.env.local`, or any file containing real secrets.
- Never expose server-side secrets to the client.
- Never create a component over 200 lines without decomposing it.
- Never push directly to `main` — always use feature branches.
- Never use `useEffect` for data fetching — use TanStack Query.
- Never use `useSpring` inside the `ReaderImage` iteration loop.
- Never leave `console.log` in production code.

---

## Features

| Feature                 | Status        | Notes |
| ----------------------- | ------------- | ----- |
| Home Dashboard          | `in-progress` | Continues reading list & shortcuts |
| Source Discovery        | `in-progress` | Per-source discovery & searching |
| Continuous Reader       | `done`        | Zero-friction, virtualization & eager load |
| Firebase Cloud Sync     | `in-progress` | History & bookmark cross-device sync |
| PWA Offline Mode        | `in-progress` | Serwist caching & background downloads |

---

## Testing

**Framework:** Vitest
**Coverage target:** Essential utilities & store logic.

```bash
# Run unit tests
pnpm test
```

---

## Pre-deploy checklist

- [ ] Zero TypeScript / type errors (`pnpm typecheck`)
- [ ] Linter passing (`pnpm lint`) - specifically checking reader performance rules
- [ ] No `console.log` in production
- [ ] `.env.example` is up to date

---

## Git Rules

**Strategy:** `main` + feature branches
**Branch naming:** `feat/` · `fix/` · `chore/` · `docs/` · `refactor/`
**Commit format:** Conventional Commits

```
feat: add user authentication
fix: resolve hydration mismatch on theme toggle
chore: update dependencies
docs: update architecture with new env vars
refactor: extract Button into common/components
```

**Rules:**
- Commit after every meaningful change before moving to the next task.
- Never force-push to `main`.
- PR must pass lint + build before merge.

---

## Environment Variables

> Never expose `_SECRET`, `_KEY` variables to the client.

| Variable | Client-safe | Required | Description |
| -------- | :---------: | :------: | ----------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | ✅ | Firebase configuration |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | ✅ | Firebase configuration |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | ✅ | Firebase configuration |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | ✅ | Firebase configuration |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | ✅ | Firebase configuration |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | ✅ | Firebase configuration |

---

_Last updated: 2026-06-17_
