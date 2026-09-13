# GEMINI — Yomirra Agent Instructions

> **Agent:** Gemini (Main Executor)
> **Project:** Yomirra — Mobile-first PWA Manga/Webtoon Reader
> **Stack:** Next.js 16 + React 19 + Tailwind v4 + Zustand v5 + Firebase + Vercel
> **Pipeline role:** You receive a structured task plan. You execute it against the codebase.

---

## 0. MANDATORY PRE-FLIGHT (Do this BEFORE every task)

Before writing any code, you MUST complete this checklist:

```
[ ] 1. Read RULES.md — memorize all INSTANT ROLLBACK triggers
[ ] 2. Read COMPONENTS.md — check if component already exists
[ ] 3. Read SCHEMA.md — check if state/type already exists
[ ] 4. Read DESIGN.md — find the correct token class
[ ] 5. Search codebase for similar existing patterns
[ ] 6. Identify the correct layer (server/client/shared) per ARCH.md
```

**Skipping this checklist = duplicate code, wrong layer, design inconsistency.**
**Every violation is caught in review and rolled back. Do not skip.**

---

## 1. Project Identity

- **Name:** Yomirra
- **Type:** PWA (Progressive Web App), webtoon/manga reader
- **Deploy:** Vercel (Node.js runtime, NOT Edge)
- **Repo structure:** Single Next.js app (not monorepo despite pnpm-workspace.yaml)
- **Primary audience:** Mobile users reading Indonesian webtoons/manga

---

## 2. Tech Stack (Locked)

See `STACK.md` for full details. Critical facts:

- **Tailwind v4** — CSS-first config in `globals.css @theme {}`. NO `tailwind.config.ts`.
- **Motion** — import from `"motion/react"`, NOT `"framer-motion"`
- **Icons** — `@phosphor-icons/react` ONLY
- **Package manager** — `pnpm` only
- **Next.js** — App Router. `experimental.viewTransition: true` is active.

---

## 3. Directory Reference

```
src/
├── app/(web)/          ← Routes (route group, NOT 'app' directly)
│   └── globals.css     ← ALL design tokens live here
├── app/api/            ← API routes (server layer)
├── components/
│   ├── ui/             ← Design system primitives (Button, Badge, etc.)
│   ├── app/            ← Shell components (nav, header, home)
│   ├── manga/          ← Manga-specific UI
│   ├── reader/         ← Reader UI
│   ├── download/       ← Download UI & storage warning banners
│   ├── skeletons/      ← Loading states
│   └── states/         ← Empty/error states
├── server/             ← SERVER ONLY (never import in client)
│   └── lib/sources/    ← Source adapters
├── shared/
│   ├── api-client.ts   ← Client-side HTTP (not server)
│   ├── store/          ← Zustand stores (12 stores)
│   ├── lib/
│   │   ├── firebase.ts ← CLIENT ONLY (has window guard)
│   │   └── motion/     ← Animation tokens + variants
│   ├── hooks/          ← Custom hooks
│   ├── sources/        ← Source types + registries (shared)
│   └── types/          ← TypeScript types
```

---

## 4. Layer Rules (Non-Negotiable)

```
CLIENT COMPONENT → ApiClient → API Route → SourceManager → Source Adapter
                                             ↓
                                         Redis Cache
```

**Do NOT shortcut this chain.** Client components NEVER call source adapters directly.
**Firebase** is client-side only — NEVER import in API routes or server components.

---

## 5. Design System Rules

All color/typography/spacing MUST use CSS custom property tokens. See `DESIGN.md`.

**Correct pattern:**

```tsx
<div className="bg-surface-raised border border-border-subtle rounded-lg p-4">
  <h2 className="text-text-primary text-lg font-bold">Title</h2>
  <p className="text-text-muted text-sm">Subtitle</p>
</div>
```

**Forbidden pattern:**

```tsx
<div className="bg-[#0A0A14] border border-white/10 rounded-lg p-4">
```

---

## 6. State Management Rules

**Read stores before creating state:**

```typescript
// Before creating any useState, check these files:
src/shared/store/library-store.ts            // library, bookmarks, ratings
src/shared/store/history-store.ts            // reading history, page progress
src/shared/store/reader-store.ts             // reader preferences
src/shared/store/download-store.ts           // offline downloads
src/shared/store/settings-store.ts           // app settings
src/shared/store/search-filter-store.ts      // search filters
src/shared/store/route-state-store.ts        // navigation state
src/shared/store/collection-store.ts         // custom collections
src/shared/store/library-filter-store.ts     // library filters
src/shared/store/source-preferences-store.ts // source preferences
src/shared/store/stats-store.ts              // reading stats
src/shared/store/update-store.ts             // chapter releases for library items
```

**Only use `useState` for:**

- Input draft values (before commit)
- Component-local visibility (dropdown open/close)
- Transient loading states not needed globally

---

## 7. Component Rules

See `COMPONENTS.md` and `GEMINI.components.md` for full component reference.

**Key rules:**

- **Card Architecture:** Card archetypes (`ShelfCard`, `HistoryCard`, `EditorialCard`, `LeaderboardRow`) are distinct domain components. Do not collapse them into a single mega component. They share low-level primitives (`MangaCover`, `ReadingProgress`) and routing helpers (`getMangaDetailHref`, `getReaderHref`).
- **Canonical Primitives:**
  - `PageHeader` — canonical header for section, destination, and detail page flows where the standard Yomirra page-header contract applies.
  - `FilterDrawerShell` & `FilterSection` — canonical filter drawer wrapper for catalog & library filters.
  - `FilterChip` — canonical toggle chip component (`aria-pressed`).
  - `MangaCover` & `ReadingProgress` — canonical cover image and reading progress bar primitives.
  - `MangaGrid` & `MangaGridSkeleton` — canonical responsive manga grid layout.
  - `ReaderPanelShell` — reader-specific Motion panel infrastructure. Current modes: `ReaderChapterDrawer` → bottom-dialog, `ReaderSettingsDrawer` → side-panel on desktop, mobile reader panels → bottom-panel behavior. `ReaderPanelShell` is intentionally separate from Vaul-based `FilterDrawerShell`.
- `SearchInput` — always import from `@/components/ui/search-input`. Never inline.
- `Button` — always use from `@/components/ui/button`. Never raw `<button>` with custom styles.
- `Skeleton` — use pre-built skeletons from `src/components/skeletons/`. Never inline skeleton patterns.

---

## 8. Motion Rules

```typescript
// ALWAYS import tokens
import { motionDuration, transitions, variants } from "@/shared/lib/motion/tokens";

// ALWAYS use Pressable for interactive cards
import { Pressable } from "@/components/motion/pressable";
<Pressable><YourCard /></Pressable>

// NEVER inline motion values
<motion.div transition={{ ease: "easeOut", duration: 0.2 }}>  // ❌
```

Respect `prefers-reduced-motion`:

```typescript
import { useSafeMotion } from "@/shared/hooks/use-safe-motion";
```

---

## 9. Icon Rules

```typescript
// ✅ CORRECT
import { MagnifyingGlass, BookmarkSimple, Play } from "@phosphor-icons/react";
<MagnifyingGlass size={20} weight="bold" />

// ❌ FORBIDDEN
import { Search } from "lucide-react";  // Wrong library
🔍  // Emoji as icon
```

Available weights: `regular` | `bold` | `fill` | `duotone` | `light` | `thin`

---

## 10. Image Rules

```tsx
// Manga covers and reader pages — external URLs need proxy or referrer bypass:
<img
  src={manga.coverUrl}
  alt={manga.title}
  referrerPolicy="no-referrer"
  loading="lazy"
  decoding="async"
  onError={() => setImageError(true)}
/>

// Reader pages — use signed proxy URL:
<ReaderImage src={signProxyUrl(page.url)} />  // or use existing component

// App assets only — use Next.js Image:
<Image src="/logo.png" alt="Yomirra" width={32} height={32} />
```

---

## 11. TypeScript Rules

- No `any` types without a comment explaining why + `eslint-disable`
- No `as unknown as X` type assertions to bypass errors
- All new API inputs validated with Zod (`src/server/lib/validation/api.ts`)
- New env vars: add to `src/env.ts` Zod schema + `.env.example`
- Access env vars ONLY via `import { env } from "@/env"`

---

## 12. File Creation Rules

### Adding a new page:

- Location: `src/app/(web)/[route]/page.tsx`
- Wrap interactive content in `"use client"` component
- Use `MobilePageShell` wrapper for consistent layout

### Adding a new component:

1. Check COMPONENTS.md first — does it exist?
2. If base UI: `src/components/ui/`
3. If domain-specific: `src/components/[domain]/`
4. Always export named export (not default)
5. Include TypeScript interface for props

### Adding a new store:

1. Check existing stores first
2. Location: `src/shared/store/`
3. Use `zustand` with `persist` middleware if persistence needed
4. Include TypeScript interface for state + actions
5. Export with `use[Name]Store` naming

### Adding a new API route:

1. Location: `src/app/api/[route]/route.ts`
2. Validate input with Zod
3. Use `sourceManager` for source operations
4. Return `{ data: T }` success or `{ error: { code, message } }` failure
5. Apply Redis caching for expensive operations

---

## 13. Scope Discipline

**Each task = one atomic change.**

Do NOT:

- Refactor files unrelated to the task
- Rename things not in scope
- Add "improvements" not requested
- Change design tokens without a design task

DO:

- Ask for clarification if scope is unclear
- Flag if task requires touching a layer it shouldn't
- Report if a RULES.md rule would be violated by the task

---

## 14. PWA / Offline Considerations

- Do NOT break the Service Worker cache by changing file paths of cached assets
- Offline download logic lives in `src/shared/lib/download-engine.ts` — do not reimplementi
- Cache name `"yomirra-chapter-cache-v1"` is used for offline chapters — do not rename
- Serwist config is in `next.config.ts` — do not modify without explicit task

---

## 15. View Transitions

The app uses the View Transitions API (`experimental.viewTransition: true` in next.config.ts).

- Shared element transitions use `view-transition-name` via the `vt-hover`, `vt-cover-mobile`, `vt-cover-desktop` CSS classes
- Transition names are set via CSS custom property: `style={{ '--vt-name': name } as CSSProperties}`
- IDs must be sanitized: `safeId = id.replace(/[^a-zA-Z0-9-]/g, '-')`
- Do NOT apply `view-transition-name` to elements that render in lists without unique IDs

---

## 16. Key File Reference

| Need            | File                                 |
| --------------- | ------------------------------------ |
| Design tokens   | `src/app/(web)/globals.css`          |
| Motion tokens   | `src/shared/lib/motion/tokens.ts`    |
| Motion variants | `src/shared/lib/motion/variants.ts`  |
| Route helpers   | `src/shared/lib/routes.ts`           |
| CN utility      | `src/shared/utils/cn.ts`             |
| API client      | `src/shared/api-client.ts`           |
| Firebase init   | `src/shared/lib/firebase.ts`         |
| Env vars        | `src/env.ts`                         |
| Nav config      | `src/shared/config/nav.ts`           |
| Source types    | `src/shared/sources/source-types.ts` |

---

## 17. Reference Documentation

Always consult these before starting:

- `PRD.md` — feature status (is this feature stable or WIP?)
- `ARCH.md` — layer separation rules
- `STACK.md` — locked dependencies, forbidden packages
- `SCHEMA.md` — existing types and store contracts
- `DESIGN.md` — color/typography/motion tokens
- `COMPONENTS.md` — existing components and forbidden patterns
- `RULES.md` — INSTANT ROLLBACK triggers
- `SOURCES.md` — source adapter system
- `TESTING.md` — test conventions
- `GEMINI.components.md` — component-specific agent rules

---

## 18. Output Format

When delivering completed work:

```
## Changes Made
- [FILE] `src/components/...` — description of change
- [NEW] `src/components/...` — new file created

## Verification
- [ ] Ran typecheck: `pnpm typecheck`
- [ ] No new `any` types
- [ ] Design tokens used (no raw hex)
- [ ] Existing components reused
- [ ] Existing stores used
- [ ] Layer boundaries respected

## Notes
(anything unusual, decisions made, follow-up needed)
```

## 19. Private Source Rules

**NEVER expose, mention, or commit any Private sources to the public git.**
- Do NOT put placeholders or keys in .env.example that hint at Private sources.
- Do NOT discuss them in public readmes, PRs, or git commits. Keep all Private Source configurations strictly inside the local .env and un-tracked contexts.
- Treat the existence of Private sources as strictly confidential.
