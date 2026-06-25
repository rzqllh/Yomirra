# GEMINI.components — Component Rules (Extend File)

> **Extend file for:** `GEMINI.md`
> **Scope:** UI component implementation rules for Yomirra
> **Load alongside:** `GEMINI.md` when task involves ANY UI component work

---

## 0. Pre-Component Checklist

Before touching any component:

```
[ ] Read COMPONENTS.md — does this component exist?
[ ] Check src/components/ui/ — is there a base primitive?
[ ] Identify correct variant pattern — can I add a variant vs create new?
[ ] Verify correct layer — is "use client" needed?
[ ] Confirm motion token usage — tokens.ts or variants.ts?
[ ] Check for existing skeleton in src/components/skeletons/
```

---

## 1. Component Organization

### Domain → Directory Mapping

| What | Location |
|------|---------|
| Design system primitives | `src/components/ui/` |
| App shell, navigation | `src/components/app/` |
| Manga cards, detail, chapters | `src/components/manga/` |
| Reader UI | `src/components/reader/` |
| Search UI | `src/components/search/` |
| Reading history | `src/components/history/` |
| Source browser | `src/components/source/` |
| Downloads page UI | `src/components/downloads/` |
| Loading states | `src/components/skeletons/` |
| Empty/error states | `src/components/states/` |
| Motion wrappers | `src/components/motion/` |
| React providers | `src/components/providers/` |

**Rule:** Do NOT create a new directory. All new components belong in one of the above.

---

## 2. The SearchInput Problem (HIGHEST PRIORITY FIX)

There are currently **3 different search input implementations** across the app. This is the primary inconsistency to resolve.

### Canonical Implementation to Create

**File:** `src/components/ui/search-input.tsx`

```tsx
"use client";

import * as React from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function SearchInput({
  placeholder = "Cari...",
  value,
  onChange,
  onClear,
  className,
  autoFocus,
  disabled,
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-11 px-3 rounded-full",
        "bg-surface-muted border border-border-subtle",
        "focus-within:border-border-default focus-within:ring-1 focus-within:ring-accent/30",
        "transition-all duration-150",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <MagnifyingGlass
        size={16}
        weight="bold"
        className="text-text-muted shrink-0"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className={cn(
          "flex-1 min-w-0 bg-transparent outline-none",
          "text-text-primary text-sm placeholder:text-text-muted",
          "disabled:cursor-not-allowed"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}
```

### Locations to Migrate (in order of priority)

1. `src/app/(web)/search/page.tsx` — search page input
2. `src/app/(web)/sources/[sourceId]/page.tsx` — source search input
3. `src/app/(web)/library/page.tsx` — library search input

### Migration Pattern

```tsx
// ❌ Before (remove this)
<div className="flex items-center rounded-full bg-surface-muted px-3 py-2.5 ...">
  <MagnifyingGlass className="text-text-muted" size={16} />
  <input
    className="bg-transparent flex-1 text-sm outline-none placeholder:text-text-muted ..."
    placeholder="Cari komik favoritmu..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />
  <span className="text-text-muted text-sm px-2">⌘K</span>
</div>

// ✅ After (replace with this)
<SearchInput
  placeholder="Cari komik favoritmu..."
  value={query}
  onChange={setQuery}
/>
```

---

## 3. MangaCard Rules

**File:** `src/components/manga/manga-card.tsx`

### The three variants:
```tsx
// Vertical card (grid displays)
<MangaCard manga={item} sourceId="shinigami" variant="shelf" />

// Horizontal row (history)
<MangaCard manga={item} sourceId="shinigami" variant="history"
  chapterId={chapter.id} chapterTitle={chapter.title} progressPercent={42} />

// Ticket stub (featured/ranked)
<MangaCard manga={item} sourceId="shinigami" variant="editorial" />
```

### Rules:
- Do NOT create a 4th variant without explicit design approval
- BookmarkButton is an internal sub-component — do NOT export or reuse it elsewhere
- View transition name is generated from `${sourceId}-${mangaId}` — do NOT change this pattern
- Image error state (`ImageBroken` fallback) MUST be preserved in any edits

### Known bugs to fix (not add):
```tsx
// ❌ Broken classnames (missing border- prefix) — fix on sight
className="... -white/10 ..."  →  className="... border-border-glass ..."
className="... -sm ..."        →  className="... shadow-sm ..."
```

---

## 4. Button Rules

**File:** `src/components/ui/button.tsx`

Never create a custom button. Always use `<Button>` with the correct variant.

```tsx
// ✅ For primary actions
<Button variant="accent" size="default">Save</Button>

// ✅ For icon-only buttons (must use IconButton to enforce aria-label)
import { IconButton } from "@/components/ui/icon-button";
<IconButton variant="ghost" size="default" aria-label="Open settings">
  <GearSix size={20} />
</IconButton>

// ✅ For loading state
<Button loading={isSubmitting}>Save</Button>

// ❌ Never do this
<button className="bg-accent text-white rounded-md px-4 py-2 ...">
```

**Touch target rule:** All interactive elements MUST be ≥44×44px. `size="icon"` is 40×40 — use `size="icon-lg"` (48×48) in mobile-first contexts.

---

## 5. Skeleton Rules

Always use pre-built skeletons. Never inline skeleton patterns.

```tsx
// ✅ Import existing skeleton
import { MangaCardSkeleton } from "@/components/skeletons/manga-card-skeleton";
import { MangaGridSkeleton } from "@/components/skeletons/manga-grid-skeleton";

// ❌ Never inline
<div className="animate-pulse bg-surface-muted rounded-lg h-48 w-32" />
```

Available: `ChapterListSkeleton`, `HistorySkeleton`, `LibrarySkeleton`, `MangaCardSkeleton`, `MangaDetailSkeleton`, `MangaGridSkeleton`, `ReaderPageSkeleton`, `SearchResultSkeleton`, `SourceListSkeleton`

---

## 6. Motion Component Rules

### For interactive cards (press, hover):
```tsx
// ✅ Always use Pressable
import { Pressable } from "@/components/motion/pressable";
<Pressable><MangaCard ... /></Pressable>
```

### For entrance animations:
```tsx
// ✅ Use variants from tokens
import { variants } from "@/shared/lib/motion/variants";
import { transitions } from "@/shared/lib/motion/tokens";

<motion.div
  variants={variants.fadeUp}
  initial="hidden"
  animate="visible"
  transition={transitions.gentle}
>
```

### For spring transitions:
```tsx
// ✅ Use spring presets
<motion.div transition={transitions.snappy}>  // Fast, responsive
<motion.div transition={transitions.smooth}>  // Deliberate, flowing
<motion.div transition={transitions.gentle}>  // Subtle, non-springy
```

### Never:
```tsx
// ❌ Inline duration/ease
<motion.div transition={{ duration: 0.2, ease: "easeOut" }}>

// ❌ Non-token spring values
<motion.div transition={{ type: "spring", stiffness: 300, damping: 20 }}>

// ❌ Layout-shifting hover
<motion.div whileHover={{ y: -4 }}>  // Use Pressable instead
```

---

## 7. Design Token Enforcement

### Surface classes:
```tsx
bg-surface-base      // Deepest background
bg-surface-raised    // Cards
bg-surface-overlay   // Elevated panels, sheets
bg-surface-muted     // Input backgrounds, skeleton
bg-surface-hover     // Hover state
bg-surface-glass     // + backdrop-blur-md for glass effect
```

### Text classes:
```tsx
text-text-primary    // Body text, headings
text-text-secondary  // Secondary labels
text-text-muted      // Captions, placeholders, timestamps
text-text-on-accent  // Text on accent-colored backgrounds
```

### Border classes (use ONLY these):
```tsx
border-border-subtle   // Subtle dividers, inactive states
border-border-default  // Standard borders
border-border-strong   // Emphasized borders, active states
border-border-glass    // Glass panel rim lighting
```

### ❌ Forbidden border patterns:
```tsx
border-white/10     // Raw opacity — use border-border-glass
border-gray-800     // Raw color — use border-border-subtle
border-[#111]       // Raw hex — always forbidden
```

---

## 8. Glass Panel Pattern

The canonical glass panel:
```tsx
// ✅ Full glass pattern
<div className="bg-surface-glass backdrop-blur-md border border-border-glass shadow-glass rounded-xl">

// ✅ Light glass (less blur)
<div className="bg-surface-glass backdrop-blur-sm border border-border-subtle rounded-lg">

// ❌ Raw values
<div style={{ background: 'rgba(17,17,34,0.65)', backdropFilter: 'blur(12px)' }}>
```

---

## 9. Empty & Error States

```tsx
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";

// Use these. Never create inline empty/error divs.
<EmptyState title="Tidak ada hasil" description="Coba kata kunci lain" />
<ErrorState message={error.message} onRetry={() => refetch()} />
```

---

## 10. Responsive Breakpoints

Yomirra is mobile-first. Breakpoints in order:

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| (base) | ≥375px | Mobile — primary target |
| `sm:` | ≥640px | Large mobile |
| `md:` | ≥768px | Tablet |
| `lg:` | ≥1024px | Desktop |
| `xl:` | ≥1280px | Wide desktop |

**Rule:** All components MUST be usable at 375px. Desktop enhancements are additive.

---

## 11. Accessibility Minimums

Every interactive component MUST have:

```tsx
// Buttons/links — descriptive label
<Button aria-label="Add to library" />

// Form inputs — label association
<label htmlFor="search-input">Search</label>
<input id="search-input" />

// Images — alt text
<img alt={manga.title} />

// Focus states — visible ring
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent

// Touch targets — minimum 44×44px
// (use IconButton size="default" = 40px minimum, size="lg" = 48px preferred)
```

---

## 12. Quick ❌/✅ Reference

| Pattern | ❌ Forbidden | ✅ Correct |
|---------|------------|-----------|
| Search input | Inline `<div><input></div>` | `<SearchInput>` |
| Manga card | New component | `<MangaCard variant="...">` |
| Raw button | `<button className="bg-accent ...">` | `<Button variant="accent">` |
| Motion | `whileHover={{ y: -4 }}` | `<Pressable>` |
| Motion duration | `transition={{ duration: 0.2 }}` | `transition={transitions.gentle}` |
| Color | `className="bg-[#05050A]"` | `className="bg-surface-base"` |
| Border | `border-white/10` | `border-border-glass` |
| Icon | `<SearchIcon>` from lucide | `<MagnifyingGlass>` from phosphor |
| Image (cover) | `<Image>` from next/image | `<img referrerPolicy="no-referrer">` |
| Skeleton | `<div className="animate-pulse">` | `<MangaCardSkeleton>` |
| Empty state | `<div className="...">No results</div>` | `<EmptyState title="...">` |
| Error state | `<p className="text-red-500">{error}</p>` | `<ErrorState message={error}>` |
