# [Project Name]

> [One-line description of what this project is and does]

**URL:**
**Status:** `WIP` / `Staging` / `Production`
**Goal:**
**Target Audience:**
**Extends:** `_extends/DESIGN_SYSTEM.md` · `_extends/DB_SCHEMA.md` · `_extends/API_CONTRACTS.md`

---

## Tech Stack

> Keep the preset that matches your project. Delete the rest. Add rows as needed.

---

### PRESET — Next.js (App Router)

| Tool                 | Version / Notes  |
| -------------------- | ---------------- |
| Next.js              | (App Router)     |
| React                |                  |
| TypeScript           | Strict mode      |
| Tailwind CSS         |                  |
| Framer Motion        | (`motion/react`) |
| Zustand              |                  |
| SWR / TanStack Query |                  |
| next-auth            |                  |
| next-intl            |                  |
| next-themes          |                  |
| Supabase / Prisma    |                  |
| Package Manager      | bun              |

---

### PRESET — React + Vite

| Tool            | Version / Notes |
| --------------- | --------------- |
| React           |                 |
| Vite            |                 |
| TypeScript      | Strict mode     |
| Tailwind CSS    |                 |
| React Router    |                 |
| Zustand / Jotai |                 |
| TanStack Query  |                 |
| Package Manager | bun             |

---

### PRESET — Node.js / Express / Hono

| Tool            | Version / Notes          |
| --------------- | ------------------------ |
| Node.js         |                          |
| Framework       | Express / Hono / Fastify |
| TypeScript      | Strict mode              |
| ORM             | Prisma / Drizzle         |
| Validation      | Zod                      |
| Auth            | JWT / Passport           |
| DB              | PostgreSQL / SQLite      |
| Package Manager | bun                      |

---

### PRESET — Python / FastAPI

| Tool            | Version / Notes       |
| --------------- | --------------------- |
| Python          |                       |
| Framework       | FastAPI               |
| Validation      | Pydantic v2           |
| ORM             | SQLAlchemy / Tortoise |
| Migrations      | Alembic               |
| Auth            | python-jose / passlib |
| DB              | PostgreSQL / SQLite   |
| Package Manager | Poetry                |

---

### Commands

| Command     | Description            |
| ----------- | ---------------------- |
| `[install]` | Install dependencies   |
| `[dev]`     | Start dev server       |
| `[build]`   | Production build       |
| `[start]`   | Serve production build |
| `[lint]`    | Run linter             |
| `[test]`    | Run tests              |
| `[add]`     | Add a dependency       |

---

## Project Structure

> Describe every folder — purpose, what it contains, what lives in it.
> Separate concerns clearly: FE / BE / Auth / DB / Shared / Config.

```
[root]/
```

**Architecture pattern:** `Feature-based` / `Layer-based` / `Domain-driven`

---

## Code Conventions

**Language:** TypeScript strict / Python typed
**Components:** Functional, explicit prop types — no implicit `any`

**Naming:**

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions & variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types / Interfaces: `PascalCase` — prefer `type` over `interface`

**Imports:** `@/` path alias mapped to project root
**Icons:**
**Class merging:** `clsx` + `tailwind-merge` / `cn()`
**Async pattern:** `async/await` — no `.then()` chains
**Error handling:**
**State management:**

---

## ⛔ DO NOT

> Non-negotiable rules. Agent must ask before doing anything that would violate these.

- If a prompt or instruction is ambiguous, **ask first before coding**
- Never use `npm` or `yarn` — always use `bun` / `pnpm`
- Never use `any` in TypeScript — strict mode is enforced
- Never hardcode user-facing strings — always use i18n keys _(if applicable)_
- Never commit `.env`, `.env.local`, or any file containing real secrets
- Never expose server-side secrets (e.g. `SERVICE_ROLE_KEY`) to the client
- Never create a component over 200 lines without decomposing it
- Never push directly to `main` — always use feature branches
- Never use `useEffect` for data fetching — use SWR / TanStack Query _(if applicable)_
- Never leave `console.log` in production code

---

## Features

> List every feature in scope. Keep this updated as scope changes.

| Feature | Status                             | Notes |
| ------- | ---------------------------------- | ----- |
|         | `planned` / `in-progress` / `done` |       |

---

## Testing

**Framework:** Vitest / Jest / Pytest / Playwright / none
**Coverage target:**

**Scope:**

- Unit:
- Integration:
- E2E:

```bash
# Run all tests

# Run with coverage

# Run E2E
```

---

## Build

```bash
# Build command

```

**Expected output:**
**Build time (approx):**

**Pre-deploy checklist:**

- [ ] Zero TypeScript / type errors
- [ ] All tests passing
- [ ] No `console.log` in production
- [ ] `.env.example` is up to date
- [ ] Bundle size within budget

---

## Git Rules

**Strategy:** `main` + feature branches / `main` + `dev` + feature branches
**Branch naming:** `feat/` · `fix/` · `chore/` · `docs/` · `refactor/`
**Commit format:** Conventional Commits

```
feat: add user authentication
fix: resolve hydration mismatch on theme toggle
chore: update dependencies
docs: update CLAUDE.md with new env vars
refactor: extract Button into common/components
```

**Rules:**

- Commit after every meaningful change before moving to the next task
- Never force-push to `main`
- PR must pass lint + build before merge

---

## Environment Variables

> Never expose `_SECRET`, `_KEY`, `SERVICE_ROLE_*` variables to the client.
> Keep `.env.example` in sync with every new variable added.

| Variable | Client-safe | Required | Description |
| -------- | :---------: | :------: | ----------- |
|          |   ✅ / ❌   | ✅ / ⚠️  |             |

---

## External Services

| Service | Purpose | Auth method | Rate limit | Docs |
| ------- | ------- | ----------- | ---------- | ---- |
|         |         |             |            |      |

---

## Deployment

**Platform:** Vercel / Railway / Render / Fly.io / VPS
**Production URL:**
**Staging URL:**
**CI/CD:** GitHub Actions / none
**Deploy trigger:** Push to `main` / manual

---

_Last updated: [YYYY-MM-DD]_
