# RULES — Yomirra Agent Rules

> These are **non-negotiable rules** for all agents working on the Yomirra codebase.
> Violations result in **INSTANT ROLLBACK** — the change will be reverted without review.

---

## RULE #1 — READ BEFORE WRITE (CRITICAL)

**Before writing a single line of code, you MUST audit the existing codebase.**

### Mandatory pre-flight checklist:

Before creating any component:
- [ ] Read `COMPONENTS.md` — does this component already exist?
- [ ] Search `src/components/` — is there an existing implementation?
- [ ] Check `src/components/ui/` — is there a base primitive to extend?

Before creating any state or hook:
- [ ] Read `SCHEMA.md` — does a store already handle this state?
- [ ] Read all store files in `src/shared/store/` — confirm the data doesn't exist
- [ ] Check `src/shared/hooks/` — does a hook already exist for this pattern?

Before writing any utility:
- [ ] Check `src/shared/utils/` for existing helpers
- [ ] Check `src/shared/lib/` for existing modules

**Failure to read first = creating duplicate code = INSTANT ROLLBACK.**

---

## RULE #2 — LAYER SEPARATION (CRITICAL)

See `ARCH.md` Section 3 for full details. Summary:

| What | Where it belongs | Where it NEVER goes |
|------|-----------------|---------------------|
| Source adapter logic | `src/server/lib/sources/adapters/` | Client components |
| Firebase init | `src/shared/lib/firebase.ts` (client-guarded) | API routes, Server components |
| Data fetching from adapters | API routes (`src/app/api/`) | Client components directly |
| Zustand stores | `src/shared/store/` | Server components |
| Client fetch calls | `src/shared/api-client.ts` | Server components |

**Violation triggers: INSTANT ROLLBACK.**

---

## RULE #3 — DESIGN TOKENS ONLY (CRITICAL)

**Never use raw hex values, RGB values, or arbitrary Tailwind brackets for colors.**

```tsx
// ❌ INSTANT ROLLBACK
<div className="bg-[#05050A]">
<div style={{ background: '#5E5CE6' }}>
<div className="bg-indigo-600">

// ✅ REQUIRED
<div className="bg-surface-base">
<div className="bg-accent">
```

All available tokens are in `DESIGN.md`. If a token doesn't exist for your use case, request it — do NOT hardcode.

---

## RULE #4 — FORBIDDEN PACKAGES (CRITICAL)

**Never install or import these packages:**

| Forbidden | Use instead |
|-----------|------------|
| `framer-motion` | `motion/react` |
| `lucide-react`, heroicons, react-icons | `@phosphor-icons/react` |
| `axios` | native `fetch` via `ApiClient` |
| `styled-components`, `emotion`, CSS modules | Tailwind v4 utility classes |
| `redux`, `jotai`, `recoil` | `zustand` |
| `moment`, `dayjs` | `date-fns` |
| `react-hot-toast`, `react-toastify` | `sonner` |
| `tailwind.config.ts` (creating one) | `@theme {}` in `globals.css` |

**Installing a forbidden package = INSTANT ROLLBACK.**

---

## RULE #5 — NO DUPLICATE STATE

If data already lives in a Zustand store, you MUST NOT create local React state for it.

```tsx
// ❌ INSTANT ROLLBACK
const [isBookmarked, setIsBookmarked] = useState(false);
const [history, setHistory] = useState([]);

// ✅ REQUIRED
const isInLibrary = useLibraryStore(state => state.isInLibrary(sourceId, id));
const history = useHistoryStore(state => state.entries);
```

The stores are the single source of truth. Local state is only allowed for purely UI-local concerns (e.g., an input's draft value, a dropdown's open/closed state).

---

## RULE #6 — MOTION TOKEN COMPLIANCE

**Never hardcode animation values inline.**

```tsx
// ❌ INSTANT ROLLBACK
<motion.div transition={{ ease: "easeOut", duration: 0.2 }} whileHover={{ y: -4 }}>

// ✅ REQUIRED — use Pressable for card interactions
<Pressable><MyCard /></Pressable>

// ✅ REQUIRED — use tokens for custom animations
import { motionDuration, transitions, variants } from "@/shared/lib/motion/tokens";
<motion.div transition={transitions.snappy} variants={variants.fadeUp}>
```

---

## RULE #7 — COMPONENT VARIANTS FIRST

**Before creating a new component, add a variant to an existing one.**

MangaCard supports `shelf`, `history`, `editorial`. If you need a new card layout, add a variant — do NOT create `MangaCardCompact.tsx` or `MangaListItem.tsx`.

The same rule applies to Button, Badge, and all other base UI components.

---

## RULE #8 — IMAGES IN READER/CARDS

| Context | Correct element | Why |
|---------|----------------|-----|
| Manga cover in cards | `<img referrerPolicy="no-referrer">` | External domain, hotlink protection |
| Reader page images | `<img src="/api/proxy/image?...">` or `<ReaderImage>` | HMAC-proxied |
| App assets (logo, icons) | `<Image>` from `next/image` | Internal assets only |

**Never use `<Image>` from next/image for external manga content.**

---

## RULE #9 — FIRESTORE / FIREBASE CLIENT BOUNDARY

`src/shared/lib/firebase.ts` MUST only be imported in:
- Client components (`"use client"`)
- Client-side hooks (`src/shared/hooks/`)

**Never import firebase.ts in:**
- API routes (`src/app/api/`)
- Server components (any file without `"use client"`)
- `src/server/**`

The file has a `window` guard, but importing it in server context will still cause build errors.

---

## RULE #10 — ENV VARS VIA `src/env.ts` ONLY

**Never access `process.env.*` directly outside of `src/env.ts`.**

```typescript
// ❌ WRONG
const secret = process.env.IMAGE_PROXY_SECRET;

// ✅ CORRECT
import { env } from "@/env";
const secret = env.IMAGE_PROXY_SECRET;
```

Adding a new env var: update `src/env.ts` schema AND `.env.example`.

---

## RULE #11 — SEARCH INPUT CANONICAL COMPONENT

**There is exactly ONE search input component: `src/components/ui/search-input.tsx`.**

Do NOT create inline search inputs in page files. Do NOT create `SearchBar.tsx`, `SearchField.tsx`, or similar components. Import and use `<SearchInput>`.

---

## RULE #12 — TAILWIND v4 CSS-FIRST CONFIG

**There is NO `tailwind.config.ts` in this project. Do not create one.**

All theme extensions go in the `@theme {}` block inside `src/app/(web)/globals.css`.

Adding a new design token:
```css
/* In globals.css @theme block */
@theme {
  --color-my-new-token: var(--my-new-token);
}
@layer base {
  :root {
    --my-new-token: #123456;
  }
}
```

---

## RULE #13 — READING MODE IS LOCKED TO VERTICAL

`ReaderPreferences.readingMode` is typed as `'vertical'` only. LTR/RTL paged mode has been deliberately removed.

**Do NOT add** paged reader components, LTR/RTL toggle UI, or `readingMode` options beyond `'vertical'`.

---

## RULE #14 — TYPE SAFETY

- **Never use `any`** unless there is an existing `eslint-disable` comment with documented reason
- **Never cast with `as unknown as X`** to bypass type errors — fix the types
- All new API routes MUST validate input with Zod (`src/server/lib/validation/api.ts`)
- All new env vars MUST be added to the Zod schema in `src/env.ts`

---

## RULE #15 — COMMIT SCOPE

**Each task is ONE atomic change.** Do NOT:
- Refactor unrelated files while implementing a feature
- Rename things not mentioned in the task
- Add "while I'm here" improvements

Stay in scope. Out-of-scope changes will be reverted.

---

## Summary: INSTANT ROLLBACK Triggers

| Trigger | Rule |
|---------|------|
| Duplicate component (not checking existing) | #1 |
| Duplicate state (not using existing store) | #5 |
| Server code in client / client code in server | #2 |
| Raw hex/RGB in className or style | #3 |
| Forbidden package installed | #4 |
| Hardcoded motion values | #6 |
| `<Image>` for external manga content | #8 |
| Firebase imported in API route | #9 |
| `process.env.*` accessed outside env.ts | #10 |
| New search input implementation | #11 |
| `tailwind.config.ts` created | #12 |
| `readingMode` changed from `'vertical'` | #13 |
| `any` type without justification | #14 |
