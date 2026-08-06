# COMPONENTS — Yomirra Component Library

> This document defines the canonical implementation of every reusable component.
> Agents MUST check this file before building any UI — if a component exists here, do NOT rebuild it from scratch.

---

## 0. Canonical Search Input (Priority: CRITICAL)

The search input is the #1 source of UI inconsistency in this codebase. There are currently 3 different implementations. **A single, canonical `<SearchInput>` component MUST be created and used everywhere.**

### ✅ Canonical `SearchInput` Spec

```tsx
// src/components/ui/search-input.tsx

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean;
}
```

**Visual spec (from design system):**
- Height: `h-11` (44px — minimum touch target)
- Border radius: `rounded-full`
- Background: `bg-surface-muted`
- Border: `border border-border-subtle`
- Focus: `focus-within:border-border-default focus-within:ring-1 focus-within:ring-accent/30`
- Icon: `MagnifyingGlass` from Phosphor Icons, left-padded, `text-text-muted`
- Clear button: `X` icon, appears when value is non-empty, `text-text-muted hover:text-text-primary`
- Placeholder: `text-text-muted text-sm`

**Usage — everywhere search appears:**
```tsx
// ✅ Correct — import and use canonical component
import { SearchInput } from "@/components/ui/search-input";

<SearchInput
  placeholder="Cari komik favoritmu..."
  value={query}
  onChange={setQuery}
/>

// ❌ WRONG — inline implementation
<div className="flex items-center rounded-full ...">
  <MagnifyingGlass />
  <input placeholder="Cari..." />
</div>
```

### Pages Using SearchInput (must be migrated)
- `src/app/(web)/search/page.tsx`
- `src/app/(web)/sources/[sourceId]/page.tsx`
- `src/app/(web)/library/page.tsx` (within library layout)

---

## 1. Base UI Components (`src/components/ui/`)

### `Button` (`button.tsx`)

Built with CVA. Full variant/size system.

```tsx
import { Button } from "@/components/ui/button";
```

**Variants:**
| Variant | Usage |
|---------|-------|
| `default` | Primary action (white/dark background) |
| `accent` | Brand accent fill (`bg-accent/10 text-accent`) |
| `secondary` | Secondary surface (`bg-surface-raised`) |
| `tertiary` | Low-emphasis text button |
| `ghost` | Invisible until hover |
| `outline` | Bordered, transparent fill |
| `destructive` | Error/delete actions |
| `reader` | Reader UI controls |
| `link` | Inline link style |

**Sizes:**
| Size | Height | Usage |
|------|--------|-------|
| `sm` | 32px | Compact areas |
| `default` | 40px | Standard |
| `lg` | 48px | Primary CTAs |
| `icon` | 40×40px | Icon-only buttons |
| `icon-sm` | 32×32px | Small icon buttons |
| `icon-lg` | 48×48px | Large icon buttons |

**Extra props:**
- `loading={true}` — shows spinner, disables button
- `active={true}` — applies active state styling (`bg-accent-dim text-accent`)

```tsx
// ✅ Correct usage
<Button variant="accent" size="lg" loading={isPending}>
  Save to Library
</Button>

// ❌ Wrong — custom button from scratch
<button className="bg-accent rounded-md px-4 py-2">Save</button>
```

---

### `IconButton` (`icon-button.tsx`)

A semantic wrapper around `Button` that enforces `aria-label` for accessibility and defaults to rounded-full.

```tsx
import { IconButton } from "@/components/ui/icon-button";
<IconButton variant="ghost" size="default" aria-label="Settings">
  <GearSix size={20} />
</IconButton>
```

---

### `Badge` (`badge.tsx`)

```tsx
import { Badge } from "@/components/ui/badge";
<Badge variant="default">ONGOING</Badge>
```

---

### Sheet / Drawer (`sheet.tsx`)

For bottom sheets and side panels. Uses `vaul` under the hood.

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
```

---

### Dialog (`dialog.tsx`)

Modal dialogs via Radix UI.

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
```

---

### Custom Select (`custom-select.tsx`)

Custom styled select dropdown.

---

### Toggle Switch (`toggle-switch.tsx`)

iOS-style toggle for settings.

---

### Skeleton (`skeleton.tsx`)

```tsx
import { Skeleton } from "@/components/ui/skeleton";
<Skeleton className="h-4 w-32" />
```

---

### Error Boundary (`error-boundary.tsx`)

Wrap data-fetching trees.

---

### Directional Transition (`directional-transition.tsx`)

Animated enter/exit transitions for View Transitions.

---

## 2. MangaCard (`src/components/manga/manga-card.tsx`)

**Three variants — props-driven, NOT separate components:**

```tsx
<MangaCard
  manga={item}
  sourceId="mangadex"
  variant="shelf"      // "shelf" | "history" | "editorial"
  priority={false}
/>
```

| Variant | Layout | Usage |
|---------|--------|-------|
| `shelf` | Vertical card (2:3 cover) | Grid view, source feeds |
| `history` | Horizontal row (small cover) | Reading history list |
| `editorial` | Ticket stub shape | Featured/popular rankings |

**Do NOT create new MangaCard variants.** If a new display format is needed, add it to the existing component.

**Cover image rules:**
- Use `<img>` with `referrerPolicy="no-referrer"` (NOT Next.js `<Image>`)
- Always handle `imageError` state with `<ImageBroken>` fallback
- Apply `loading="lazy"` and `decoding="async"` on all non-priority cards

---

## 3. Skeleton Components (`src/components/skeletons/`)

Pre-built loading states — use these, don't create new ones:

| Component | Usage |
|-----------|-------|
| `ChapterListSkeleton` | Chapter list loading |
| `HistorySkeleton` | History page loading |
| `LibrarySkeleton` | Library grid loading |
| `MangaCardSkeleton` | Individual card loading |
| `MangaDetailSkeleton` | Detail page loading |
| `MangaGridSkeleton` | Grid of cards loading |
| `ReaderPageSkeleton` | Reader page loading |
| `SearchResultSkeleton` | Search results loading |
| `SourceListSkeleton` | Source list loading |

---

## 4. State Components (`src/components/states/`)

| Component | Usage |
|-----------|-------|
| `EmptyState` | No data found states |
| `ErrorState` | Error with retry UI |

---

## 5. Motion Primitives (`src/components/motion/`)

### `Pressable` (`pressable.tsx`)

Wrap interactive elements with press feedback:

```tsx
import { Pressable } from "@/components/motion/pressable";

<Pressable>
  <MyCard />
</Pressable>
```

This uses `variants.pressable` from `motion/variants.ts`. Do NOT manually apply `whileHover={{ y: -4 }}` on cards — use this.

### `MotionProvider` (`motion-provider.tsx`)

Wraps app with `prefers-reduced-motion` detection.

---

## 6. App Shell Components (`src/components/app/`)

| Component | Purpose |
|-----------|---------|
| `AppShell` | Root shell with bottom nav + page layout |
| `BottomDock` | 5-tab mobile navigation bar |
| `TopNav` | Mobile top navigation with back/title |
| `Header` | Desktop header |
| `CommandMenu` | `⌘K` search popup |
| `HomeView` | Home page orchestrator |
| `SourceFeed` | Manga grid from a single source |
| `SourceFeedSkeleton` | Source feed loading state |
| `FeaturedHeroCarousel` | Hero carousel for home |
| `MagazineHero` | Alternative hero layout |
| `FloatingResumeDock` | "Continue reading" floating dock |
| `ContinueReadingList` | Horizontal continue-reading row |
| `HomeSearchPill` | Home page search trigger pill |
| `MobilePageShell` | Wrapper for mobile-specific pages |
| `NetworkStatus` | Offline/online indicator |
| `ThemeToggle` | Dark/light mode toggle |

---

## 7. Reader Components (`src/components/reader/`)

| Component | Purpose |
|-----------|---------|
| `ReaderShell` | Main reader container |
| `ReaderView` | Reader view controller |
| `ContinuousVerticalReader` | Webtoon vertical scroll reader |
| `ReaderImage` | Single page image with proxy |
| `ReaderProgress` | Reading progress bar |
| `ReaderChapterDrawer` | Chapter list drawer |
| `ReaderSettingsDrawer` | Settings drawer |
| `SubtleChapterDivider` | Visual divider between chapters |
| `PageImageError` | Image load error state |

---

## 8. Feature Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `UpdatesList` | List of recent manga updates grouped by date | `src/components/updates/` |
| `CollectionManager` | UI for creating, renaming, and deleting collections | `src/components/settings/` |
| `MangaStatusButton` | Button to set/clear reading status | `src/components/manga/` |
| `MangaCollectionButton` | Button to add/remove manga from collections | `src/components/manga/` |
| `LibraryFilterDrawer` | Drawer containing collection and status filters | `src/components/library/` |
| `BackupRestoreModal` | Modal for exporting and importing app state | `src/components/settings/` |
| `NotificationPreferences` | UI for automatic scan and mute preferences | `src/components/settings/` |

---

## 9. Forbidden Patterns (Component-Level)

### ❌ Inline border without prefix
```tsx
// BROKEN — missing border- prefix (Tailwind silently ignores)
<div className="relative ... -white/10 ... -sm">

// ✅ Correct
<div className="relative ... border-border-glass shadow-sm">
```

### ❌ Inline motion values (use tokens)
```tsx
// ❌ WRONG
<motion.div whileHover={{ y: -4 }} transition={{ ease: "easeOut", duration: 0.2 }}>

// ✅ CORRECT — use Pressable or tokens
<Pressable>...</Pressable>
// or
<motion.div variants={variants.pressable} whileHover="hover" whileTap="tap">
```

### ❌ Mixed border token styles
```tsx
// ❌ WRONG — mixing raw Tailwind with design tokens
<div className="border border-white/10">
<div className="border border-gray-800">

// ✅ CORRECT — always use design token classes
<div className="border border-border-subtle">
<div className="border border-border-glass">
```

### ❌ Next.js `<Image>` for manga covers
```tsx
// ❌ WRONG in reader/card components (external domains, hotlink)
<Image src={manga.coverUrl} alt={manga.title} fill />

// ✅ CORRECT — raw img with referrer policy
<img
  src={manga.coverUrl}
  alt={manga.title}
  referrerPolicy="no-referrer"
  loading="lazy"
  decoding="async"
  onError={() => setImageError(true)}
/>
```

(Note: `<Image>` IS correct for reader page images via `/api/proxy/image`)

### ❌ Creating duplicate stores
```tsx
// ❌ WRONG — creating new state for something a store already handles
const [isBookmarked, setIsBookmarked] = useState(false);

// ✅ CORRECT — use existing store
const isInLibrary = useLibraryStore(state => state.isInLibrary(sourceId, mangaId));
```

### ❌ Raw hex or RGB values in className
```tsx
// ❌ WRONG
<div className="bg-[#05050A] text-[#FDFDFD]">

// ✅ CORRECT
<div className="bg-surface-base text-text-primary">
```

### ❌ Multiple search input implementations
```tsx
// ❌ WRONG — any inline search input implementation
<div className="flex items-center rounded-full bg-surface-muted ...">
  <MagnifyingGlass />
  <input ... />
</div>

// ✅ CORRECT — always use canonical component
<SearchInput value={q} onChange={setQ} placeholder="..." />
```
