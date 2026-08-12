# Components — Yomirra UI Conventions

This document describes the reusable UI seams that currently exist in Yomirra and the boundaries contributors should preserve.

The goal is not to force every screen into one configurable component. Prefer small canonical primitives plus domain-specific feature components when their responsibilities differ.

## 1. Canonical App Header

`PageHeader` (`src/components/app/header.tsx`) is the canonical section/destination page header.

```tsx
<PageHeader
  title="Library"
  description="Koleksi komik dan riwayat bacaan favoritmu."
  icon={<Books size={32} weight="duotone" />}
  meta={<span>24 judul</span>}
  actions={...}
/>
```

Current public props include:

- `title`
- `description`
- `icon`
- `showBack`
- `backHref`
- `actions`
- `meta`
- `variant: "transparent" | "glass" | "auto"`
- `className`

`PageHeader` owns the responsive contract: a fixed mobile header and a desktop section/hero header. Do not recreate equivalent mobile + desktop headers in individual feature pages.

The old `YomirraPageHeader` and `DesktopPageTitle` compatibility wrappers have been removed. Do not reintroduce them.

## 2. Base UI Primitives (`src/components/ui/`)

Use existing primitives before adding new ones. Important current components include:

| Component | Purpose |
| --- | --- |
| `Button` | Shared action/button variants and sizes |
| `IconButton` | Accessible icon-only actions |
| `SearchInput` | Canonical search field with clear behavior |
| `CustomSelect` | Styled select control |
| `FilterChip` | Selectable/filter pill with explicit `aria-pressed` semantics |
| `FilterDrawerShell` | Shared Vaul presentation shell for feature filters |
| `FilterSection` | Layout wrapper for groups inside filter drawers |
| `ReadingProgress` | Semantic clamped reading-progress primitive |
| `SegmentedControl` | Tab/segmented selection UI |
| `Dialog` | Radix modal/dialog primitives |
| `Sheet` | General Vaul sheet primitives where the generic sheet contract fits |
| `Skeleton` | Base loading placeholder |
| `Pagination` | Shared pagination controls |
| `HorizontalScrollContainer` | Reusable horizontal scrolling rail |
| `ToggleSwitch` | Settings-style toggle |

### SearchInput

Do not build an inline search field when the canonical `SearchInput` fits.

```tsx
<SearchInput
  value={query}
  onChange={(event) => setQuery(event.target.value)}
  onClear={() => setQuery("")}
  placeholder="Cari komik..."
/>
```

Feature components own query semantics; `SearchInput` owns the reusable field presentation and interaction contract.

### FilterChip

`FilterChip` supports the current visual states used by filters/source rails, including default, accent, error/offline, include/check, exclude/minus, and down-badge behavior.

Use `selected` for selection semantics so `aria-pressed` reflects state. Do not infer accessibility state solely from a visual variant.

### FilterDrawerShell + FilterSection

Search and Library filters share Vaul presentation through `FilterDrawerShell`:

```tsx
<FilterDrawerShell
  title="Filter Pencarian"
  description="Atur filter hasil pencarian"
  activeCount={activeCount}
  onOpen={syncDraftFromStore}
  onReset={resetDraft}
  onApply={applyDraft}
>
  <FilterSection title="Urutkan">...</FilterSection>
  <FilterSection title="Genre">...</FilterSection>
</FilterDrawerShell>
```

The shell owns:

- Vaul root/portal/overlay/content chrome;
- open/close presentation state;
- header, Reset, and Apply controls;
- scrolling and safe-area footer handling.

The shell must not own source capabilities, selected genres, collection rules, search state, or other feature business logic. `LibraryFilterDrawer` and `SearchFilterDrawer` remain feature-specific controllers/content.

## 3. Manga Presentation Primitives

### MangaCover

`MangaCover` (`src/components/manga/manga-cover.tsx`) centralizes low-level cover-image behavior:

- raw `<img>` rendering;
- `referrerPolicy="no-referrer"`;
- `decoding="async"`;
- lazy loading by default and eager loading when `priority` is set;
- `onError` fallback;
- completed-image `naturalWidth === 0` fallback;
- optional fallback title.

Consumers still own card geometry, aspect ratio, borders, overlays, and metadata placement.

```tsx
<div className="aspect-[2/3] overflow-hidden rounded-2xl">
  <MangaCover
    src={manga.coverUrl}
    alt={manga.title}
    fallbackTitle={manga.title}
  />
</div>
```

Do not duplicate image-error state and raw cover fallback handling inside new cards when `MangaCover` fits.

### ReadingProgress

`ReadingProgress` accepts a percentage value, clamps it to `0..100`, exposes progressbar semantics, and optionally renders the percentage label.

```tsx
<ReadingProgress value={progress} size="sm" showLabel />
```

Keep chapter/business semantics outside this primitive.

### MangaGrid

`MangaGrid` is the canonical responsive manga grid. Its shared `MANGA_GRID_CLASS` currently defines:

```text
base: 2 columns
sm:   3 columns
md:   4 columns
lg:   5 columns
xl:   6 columns
```

`MangaGridSkeleton` imports the same constant so loading and loaded grids use the same responsive breakpoints.

Do not copy the breakpoint string into route-level loading states.

## 4. Card Archetypes

Yomirra intentionally keeps distinct card archetypes under `src/components/manga/card/`:

- `ShelfCard`
- `HistoryCard`
- `EditorialCard`
- `LeaderboardRow`

These cards may share `MangaCover`, `ReadingProgress`, routing helpers, or other low-level primitives, but they should not be collapsed into a single `MangaCard` with a growing list of unrelated variants.

Add a shared primitive only when the duplicated responsibility is genuinely shared. Keep layout and interaction differences in the domain/card archetype that owns them.

## 5. Loading and Skeleton Components

Reusable skeletons live under `src/components/skeletons/`. Current families include chapter-list, history, library, manga-card, manga-detail, manga-grid, reader-page, search-result, and source-list loading states.

Rules:

- Prefer an existing skeleton instead of rebuilding the same shape in `loading.tsx`.
- A skeleton should approximate the real component's dimensions closely enough to reduce visible reflow.
- Do not claim a shared skeleton proves CLS is zero; it only removes or reduces specific sources of layout shift.
- Keep route `loading.tsx` composition thin and use canonical headers/skeletons where applicable.

## 6. Feature Components and Controller Hooks

Large client routes are decomposed by responsibility rather than arbitrary line-count limits.

### Library

```text
components/library/
├── library-page-view.tsx
├── library-toolbar.tsx
├── library-status-rail.tsx
├── library-collection-rail.tsx
├── library-results.tsx
└── library-filter-drawer.tsx

shared/hooks/use-library-catalog.ts
```

`LibraryPageView` composes presentation. `useLibraryCatalog` owns the established route/search/filter/query orchestration.

### Bookmark

```text
components/bookmark/
├── bookmark-page-view.tsx
├── reading-tab.tsx
├── collection-tab.tsx
├── collection-toolbar.tsx
└── collection-selection-toolbar.tsx

shared/hooks/
├── use-bookmark-reading.ts
└── use-bookmark-collection.ts
```

The Reading and Collection tabs remain separate domains instead of mirroring Library's structure mechanically.

### Search

```text
components/search/
├── search-page-view.tsx
├── search-toolbar.tsx
├── search-source-rail.tsx
├── search-results.tsx
└── search-filter-drawer.tsx

shared/hooks/use-search-catalog.ts
```

`useSearchCatalog` owns multi-source query orchestration; the view components own presentation.

## 7. Reader Components

Reader UI has its own interaction constraints and is not part of the Vaul filter-drawer family.

### ReaderPanelShell

`ReaderPanelShell` (`src/components/reader/reader-panel-shell.tsx`) owns shared reader-panel infrastructure:

- `AnimatePresence` and Motion transitions;
- backdrop rendering/click dismissal;
- Escape-key dismissal;
- title/icon/header controls;
- close `IconButton`;
- scroll container;
- `bottom-dialog` and `side-panel` desktop layout modes.

`ReaderChapterDrawer` and `ReaderSettingsDrawer` compose the shell while keeping chapter/search/sort/navigation and reader-settings state in their own feature components.

Do not merge `ReaderPanelShell` with `FilterDrawerShell` solely because both appear as overlays. Their libraries, responsive behavior, and interaction contracts are intentionally different.

## 8. Component Ownership Rules

Use this decision order before adding a component:

1. Does an existing canonical primitive already own this responsibility? Reuse it.
2. Is the duplication low-level and truly identical? Extract a small compositional primitive.
3. Is the layout/business behavior domain-specific? Keep a feature component.
4. Would a proposed abstraction need many semantic props or unrelated variants? Do not create it yet.

`className` should normally handle external layout/custom positioning rather than redefine the internal visual contract of a canonical component.

## 9. Patterns to Avoid

### Duplicate header chrome

```tsx
// Avoid rebuilding separate mobile + desktop page titles.
<PageHeader title="..." />
```

### Duplicate filter sheet chrome

Do not inline another Vaul overlay/header/apply-footer implementation for Search/Library-style filters. Compose `FilterDrawerShell`.

### Duplicate cover error handling

Do not add another local `imageError` implementation for normal manga cards when `MangaCover` is appropriate.

### Mega variant components

Avoid APIs such as:

```tsx
<MangaCard variant="shelf | history | editorial | continue | reader | ..." />
```

when the variants have substantially different structure or behavior.

### Universal drawer abstraction

Do not create one app-wide drawer that hides Vaul and Motion behind a large configuration object. Maintain the filter and reader overlay families separately.

### Raw design values

Use established design tokens/classes instead of introducing arbitrary hex/RGB values in feature components. See [DESIGN.md](DESIGN.md).

### Duplicate state

Do not create local state for data already owned by an established Zustand store unless the local state is explicitly a draft/transient UI layer (for example, filter draft state before Apply).
