# UI Guidelines

> Extend file — referenced from `AGENTS.md`.
> Baca ini sebelum task apapun yang involve komponen, styling, TypeScript, atau state management.

---

## Component Architecture

### File Size Rules

- **Max 200 baris** per file komponen. Jika melebihi, decompose ke sub-komponen.
- **Pemisahan concern yang ketat:**
  - Logic / hooks → diextract ke custom hook di `src/shared/hooks/` atau hook lokal
  - Types → diextract ke `types/` atau top of file (jika scoped)
  - Shared sub-components → file terpisah dalam folder yang sama

### Directory Structure for Components

```
src/components/
├── ui/          # Primitive / Base design system (Button, Dialog, Tabs...)
├── app/         # App-level shell (TopNav, BottomDock, AppShell, etc.)
├── manga/       # Domain: manga cards, detail, chapter list
├── reader/      # Domain: reader shell, readers, settings
├── history/     # Domain: history page components
├── source/      # Domain: source management UI
├── motion/      # Shared animation wrappers
├── skeletons/   # Skeleton loaders
├── states/      # Empty state components
└── providers/   # React context providers
```

### When to Create vs Reuse

**Before creating a new component:**
1. Check `src/components/ui/` untuk primitives (Button, Dialog, IconButton, etc.)
2. Check `src/components/[domain]/` untuk existing domain components
3. Check `src/components/skeletons/` untuk loading states
4. Check `src/components/states/` untuk empty states

---

## TypeScript Rules

### Strict Mode Enforced

`tsconfig.json` mengaktifkan strict mode. Enforce setiap saat:

```ts
// ❌ FORBIDDEN
const data: any = fetchedData;
catch (e: any) { }
function handler(event: any) { }

// ✅ CORRECT
const data: MangaDetail = fetchedData;
catch (e: unknown) {
  if (e instanceof Error) { /* handle */ }
}
function handler(event: React.MouseEvent<HTMLButtonElement>) { }
```

### Exceptions (documented, dengan comment)

Situasi di mana `any` diizinkan dengan **wajib ada eslint-disable comment + justifikasi:**

```ts
// src/components/reader/reader-shell.tsx — WakeLock API belum ada di TS DOM types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wakeLock: any = null;
const lock = await (navigator as any).wakeLock.request('screen');

// src/shared/hooks/use-sync.ts — Firestore data() return type tidak diketahui
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = change.doc.data() as LibraryItem; // cast ke tipe konkret, bukan any
```

> **Resolusi ideal:** Definisikan interface global `WakeLockSentinel` di `src/types/global.d.ts` untuk menghilangkan WakeLock `any`. Firestore `data()` sebaiknya di-cast ke interface konkret, bukan `any`.

### Framer Motion Event Types

```ts
// ❌ WRONG
const handleDragEnd = (event: any, info: any) => { ... }

// ✅ CORRECT
import type { PanInfo } from "motion/react";
const handleDragEnd = (event: PointerEvent, info: PanInfo) => { ... }
```

### Catch Blocks

```ts
// ❌ WRONG
} catch (error: any) {
  console.error(error.message);
}

// ✅ CORRECT
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
}
```

---

## Styling Rules (Tailwind v4)

### Token-First

**Always use design tokens, not arbitrary values:**

```tsx
// ❌ WRONG
<div className="text-[13px] bg-[#1a1a2e] border border-[rgba(94,92,230,0.4)] rounded-[12px]">

// ✅ CORRECT
<div className="text-sm bg-surface-raised border border-border-default rounded-xl">
```

**Exception:** Valores dinâmicos que não podem ser representados por tokens:
```tsx
// OK — dynamic inline style, bukan class
style={{ viewTransitionName: `manga-cover-${mangaId}` }}
style={{ backgroundColor: getBackgroundColor() }}
```

### cn() Helper

Selalu gunakan `cn()` untuk merge classes:

```ts
import { cn } from "@/shared/utils/cn";

// cn() = clsx + tailwind-merge
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "accent" && "accent-classes",
  className  // always spread passed className last
)} />
```

### Class Variance Authority (CVA)

Untuk komponen dengan variasi:

```ts
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "base-classes",  // shared
  {
    variants: {
      variant: { default: "...", accent: "...", ghost: "..." },
      size: { sm: "...", default: "...", lg: "..." },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

### Tailwind v4 Specifics

- Import: `@import "tailwindcss"` (bukan `@tailwind base; @tailwind components;`)
- Theme override: `@theme { --color-xxx: ...; }` di globals.css
- Semua CSS variable wajib di-declare di `:root {}` dan `.dark {}` di globals.css
- Tidak ada `tailwind.config.ts` — konfigurasi via `@theme` di CSS

---

## Component Patterns

### Server vs Client Components

**Heuristic:**
- Default ke **Server Component** — tidak ada state, tidak ada event handler, tidak ada browser API.
- Tambahkan `"use client"` HANYA jika komponen membutuhkan: state (`useState`, `useReducer`), effects (`useEffect`), event handlers, atau browser-only APIs (`localStorage`, `navigator`, `window`).

```
src/app/manga/[sourceId]/[mangaId]/page.tsx  → Server Component (fetch data)
src/components/reader/reader-shell.tsx       → "use client" (state, events, WakeLock)
src/components/ui/button.tsx                 → "use client" (event handling)
src/components/app/top-nav.tsx               → "use client" (scroll state, auth)
```

### Data Fetching

```tsx
// ❌ WRONG — useEffect untuk fetching
useEffect(() => {
  fetch('/api/manga').then(res => res.json()).then(setData);
}, []);

// ✅ CORRECT — Server Component
async function Page() {
  const data = await apiClient.getMangaDetail(sourceId, mangaId);
  return <MangaView data={data} />;
}
```

**Client-side data (TanStack Query):**
```tsx
import { useQuery } from "@tanstack/react-query";
const { data, isLoading } = useQuery({
  queryKey: ["manga", sourceId, mangaId],
  queryFn: () => apiClient.getMangaDetail(sourceId, mangaId),
});
```

> **Rule:** Jangan pakai `useEffect` untuk data fetching. Pakai Server Components atau TanStack Query.

### State Management

| Type of State         | Use                                           |
| --------------------- | --------------------------------------------- |
| Local UI state        | `useState` / `useReducer`                     |
| URL-based state       | `useSearchParams` / `usePathname`             |
| Cross-component state | Zustand store (`src/shared/store/`)           |
| Async server state    | TanStack Query                                |
| Reader UI state       | `useReaderStore` (Zustand)                    |
| User library/history  | `useLibraryStore` / `useHistoryStore` (Zustand persist) |

**Zustand subscription rule:**
```ts
// ❌ WRONG — subscibe ke seluruh state, banyak re-render
const store = useDownloadStore();

// ✅ CORRECT — subscribe ke slice yang dibutuhkan saja
const download = useDownloadStore(state => state.downloads[id]);
const addDownload = useDownloadStore(state => state.addDownload);
```

### Hydration Guard (Zustand Persist)

Komponen yang depend pada state yang di-persist di IndexedDB wajib ada hydration guard:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);

// atau gunakan helper hook
import { useMounted } from "@/shared/hooks/use-mounted";

if (!mounted) return <Skeleton />; // Jangan render tanpa data hydrated
```

---

## Icon Usage

**Library:** `@phosphor-icons/react` — **satu-satunya** icon library yang diizinkan.
**Jangan pernah install lucide-react, heroicons, atau library lain.**

```tsx
import { BookBookmark, MagnifyingGlass, Play } from "@phosphor-icons/react";

// Default weight: Regular
<BookBookmark size={24} />

// Active/selected state: Fill
<BookBookmark size={24} weight="fill" />

// Decorative / accents: Duotone
<BookBookmark size={24} weight="duotone" />

// SSR-safe (gunakan dari /dist/ssr kalau ada hydration issue)
import { Gear } from "@phosphor-icons/react/dist/ssr";
```

**Ukuran standar:**
- Inline dengan text: `size={16}`
- Button icon: `size={18}` atau `size={20}`
- Navigation icon: `size={22}` atau `size={24}`
- Large decorative: `size={28}` atau `size={32}`

---

## Accessibility Checklist

- [ ] Setiap `<IconButton>` wajib punya `aria-label`
- [ ] Setiap `<input>` wajib punya `id` + `<label htmlFor={id}>`
- [ ] Setiap gambar informatif: `alt` yang deskriptif. Gambar dekoratif: `alt=""`
- [ ] Focus visible — tidak ada `outline: none` tanpa custom focus style yang visible
- [ ] Dialog: focus trap + close dengan `Escape`
- [ ] Min touch target: `44px × 44px` di mobile

---

## Common Anti-Patterns

| Anti-Pattern                               | Fix                                              |
| ------------------------------------------ | ------------------------------------------------ |
| `useEffect` untuk data fetch               | Server Component atau TanStack Query             |
| `any` di catch block                       | `unknown` + instanceof check                     |
| `window.confirm()` atau `window.alert()`   | Custom Dialog dari `@/components/ui/dialog`      |
| Arbitrary color: `bg-[#1a1a2e]`            | Token: `bg-surface-raised`                       |
| Import lucide-react atau heroicons         | Import dari `@phosphor-icons/react`              |
| Icon button tanpa `aria-label`             | Tambahkan `aria-label="[aksi yang dilakukan]"`   |
| Subscribe ke entire Zustand store          | Subscribe ke slice minimal yang diperlukan       |
| Component lebih dari 200 baris             | Decompose ke sub-komponen                        |
| Global `import React from "react"`         | Tidak perlu di React 19 — hapus                  |
| `<img>` langsung untuk external image      | Gunakan image proxy (`signImageUrl`) atau `<img` dengan `referrerPolicy="no-referrer"` |

---

*Last updated: 2026-06-17*
