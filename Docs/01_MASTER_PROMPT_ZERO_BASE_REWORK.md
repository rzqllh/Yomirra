# Master Prompt — Yomirra Zero-Base UI/UX & Design Language Rework

You are working on **Yomirra**, a Next.js App Router manga reader.

Your task is to perform a **zero-base UI/UX and design language rework** based on the actual repository implementation.

Do not rely on screenshots as your primary source. Screenshots are only symptoms. The real source of truth is the codebase.

## Core mission

Rebuild Yomirra’s interface from a generic pale Android-like UI into a premium product with a distinct identity:

**Premium iOS-native manga reader × cinematic editorial media app × Yomirra Deep Lagoon identity.**

This is not CSS polish. This is not a theme tweak. This is not “round the corners and add blur”.

This is a full visual language reset across shell, navigation, controls, pages, manga cards, detail page, reader, and system states.

## The current problem

The existing interface still has these product smells:

- rigid rectangular top bars
- generic pale surfaces
- old Android/Material-style search fields
- weak segmented controls
- flat dashboard-like pages
- too many identical page layouts
- weak page identity
- muddy or low-impact bottom nav/dock
- excessive form/page template feeling
- manga cards that behave like generic cards instead of media objects
- light mode that feels pale and flat
- dark mode not strong enough as a brand identity
- no clear editorial rhythm
- no cinematic hierarchy

## Required approach

### Step 1 — Scan actual repo

Before proposing or implementing UI changes, inspect the real files.

You must read and map:

- `package.json`
- `next.config.*`
- `src/app/**`
- `src/components/**`
- `src/shared/**`
- `src/server/**`
- `src/lib/**`
- `src/features/**` if present
- `src/store/**` or equivalent
- `src/app/(web)/globals.css`
- existing docs under `DOCS/**`
- existing implementation plans/checklists
- current PWA/service worker/cache/image handling if any

Produce evidence before changing code.

### Step 2 — Create a UI/UX evidence map

Report:

| Area | File | Current implementation | Problem | Rework direction |
|---|---|---|---|---|

Minimum areas:

- app shell
- sidebar/dock/nav
- top bar/header
- search field
- tabs/segmented controls
- manga cards
- continue reading
- library grid
- bookmark/readlist/history
- sources page
- settings page
- manga detail page
- reader shell
- loading/empty/error states
- tokens/theme
- responsive behavior
- image handling/cache

### Step 3 — Build new primitives first

Do not style page-by-page randomly.

Create reusable Yomirra primitives first:

- `YomirraSurface`
- `YomirraSection`
- `YomirraPageHeader`
- `YomirraSearchField`
- `YomirraBottomDock`
- `YomirraSidebar`
- `YomirraSegmentedControl`
- `YomirraCommandSearch`
- `YomirraMangaCard`
- `YomirraMediaOverlay`
- `YomirraEmptyState`
- `YomirraErrorState`
- `YomirraLoadingState`

Use shadcn/Radix as accessible primitives, not as the final visual identity.

### Step 4 — Rework pages by intent

Every page must have a distinct product role.

- Home = editorial discovery and continue reading
- Library = catalog/search/filter shelf
- Bookmark = personal reading shelf and history
- Sources = source health/management
- Settings = calm grouped preferences
- Manga detail = cinematic title page
- Reader = manga-first immersive reading

Do not reuse the same “title + search + cards” template everywhere.

### Step 5 — Protect logic

Do not rewrite source adapter, store, auth, local/cloud sync, or reader navigation logic unless required.

If logic changes are unavoidable, report:

- why
- file
- old behavior
- new behavior
- risk
- verification

## Design identity lock

Use **Yomirra Deep Lagoon**.

### Core palette

```css
--yomirra-ink: #000D0F;
--yomirra-deep: #003135;
--yomirra-surface: #024950;
--yomirra-accent: #0FA4AF;
--yomirra-mist: #AFDDE5;
--yomirra-clay: #964734;
```

### Brand feeling

Yomirra must feel:

- dark-first
- cinematic
- calm but alive
- manga/media-first
- premium
- iOS-native inspired
- editorial
- smooth and readable
- focused for long reading sessions

Avoid:

- neon
- generic cyberpunk
- amber/gold premium cliché
- Android Material 2018
- default shadcn
- admin dashboard
- flat teal wash
- overused glass blur
- hard gray borders
- heavy old drop shadows

## Specific UI rules

### Headers

Do not use rigid rectangular app bars everywhere.

Use contextual headers:

- content-integrated page titles
- soft/floating header only where useful
- scroll-aware blur only if stable
- no hard bottom border as default
- proper safe area support

### Search

Search must not look like a generic form input.

Build one branded `YomirraSearchField`:

- 44–48px comfortable height
- precise icon alignment
- subtle rim/highlight
- elegant focus ring
- no heavy shadow
- no pale Android input feeling
- reusable across Home, Library, Sources, Bookmark, global command search

### Navigation

Desktop may use a sidebar, but it must not look like a low-energy admin rail.

Mobile must use a modern iOS-like bottom dock:

- floating
- safe-area aware
- active state clearly visible
- inactive icons quiet but readable
- not muddy
- not too tall
- not Material bottom navigation
- no page content hidden behind it

### Segmented controls

Use a modern segmented control, not underline tabs.

- active pill/fill
- clear text contrast
- comfortable touch target
- smooth but not flashy motion
- full-width for primary switches like Bookmark Readlist/Riwayat
- compact variant for smaller filters

### Manga cards

Manga cards are media/product objects.

Implement variants:

- `editorial` for discovery/home
- `continue` for continue reading
- `shelf` for library/bookmark grid
- `history` for reading history
- `compact` for dense utility lists

Media overlay rule:

Artwork is theme-independent. Cover overlays must remain dark in both light and dark mode so title/metadata remains readable.

### Light mode

Light mode must be premium mist canvas, not pale Android.

Use:

- layered mist/canvas
- crisp foreground
- clear hierarchy
- subtle surface depth
- minimal borders
- controlled accent

Avoid:

- flat pale teal everywhere
- low contrast labels
- gray separator lines
- heavy form shadows

### Dark mode

Dark mode is the primary brand expression.

Use:

- deep lagoon base
- cinematic surface layers
- aqua accent sparingly
- clay/copper only for rare semantic/warm states
- high readability
- media-first composition

## Required execution phases

### Phase A — Evidence scan
Scan repo, produce evidence map, identify current files to modify.

### Phase B — Token and primitive foundation
Create final tokens and primitives. Do not migrate all pages yet.

### Phase C — Shell and navigation rework
Rework app shell, desktop sidebar, mobile dock, global command/search, and top/header model.

### Phase D — Page identity rework
Migrate Home, Library, Bookmark, Sources, Settings.

### Phase E — Manga detail and reader rework
Rework manga detail, chapter list, reader toolbar, reader settings, chapter navigation, reader image behavior.

### Phase F — PWA/cache/image foundation
Implement the PWA/image caching plan only after UI shell is stable, unless image performance blocks the UI.

### Phase G — cleanup and verification
Run lint, typecheck, build, and tests where available.

## Required report after implementation

```md
## Changed
- ...

## Files touched
- ...

## Logic touched
- None / list with reason

## Verification
- pnpm lint:
- pnpm typecheck:
- pnpm build:
- tests:
- manual smoke routes:

## Known issues
- ...

## Next phase recommendation
- ...
```

Do not say “done” if only tokens changed. The visual language must actually change.
