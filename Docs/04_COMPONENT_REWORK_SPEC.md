# Component Rework Spec

Build Yomirra’s design language as reusable primitives and product components.

## Rule

Do not rename old components and leave the same structure.

The component structure itself must change where necessary.

## 1. YomirraSurface

Purpose: Standardize surface hierarchy.

Suggested props:

```ts
type YomirraSurfaceTier =
  | "canvas"
  | "subtle"
  | "raised"
  | "elevated"
  | "floating"
  | "glass"
  | "media";
```

Responsibilities:

- background
- foreground
- rim/border
- shadow/elevation
- radius
- optional blur
- light/dark variants

Do not put product logic inside this component.

## 2. YomirraSection

Purpose: Consistent editorial section rhythm.

Supports:

- title
- subtitle
- action link
- density
- horizontal scroll mode
- grid mode
- no rigid divider by default

Rules:

- section spacing should create hierarchy
- title/action alignment must be intentional
- use content width rules
- avoid repeated ad-hoc margin/padding

## 3. YomirraPageHeader

Purpose: Replace rigid top bar.

Variants:

- `minimal`
- `editorial`
- `detail`
- `overlay`
- `settings`

Rules:

- no hard rectangular default app bar
- no strong bottom border unless scrolled/needed
- back button 44px touch target minimum
- safe-area aware
- title should feel integrated with page
- scroll blur only if stable

## 4. YomirraSearchField

Purpose: Branded search input.

Variants:

- `global`
- `page`
- `compact`
- `command`

Requirements:

- 44–48px height
- subtle rim
- precise icon alignment
- clear focus ring
- no heavy old shadow
- no standard form input feeling
- consistent placeholder and icon tone
- accessible label

## 5. YomirraBottomDock

Purpose: Mobile iOS-like navigation dock.

Requirements:

- floating
- safe-area aware
- active capsule/pill
- clear active route
- inactive state quiet but readable
- readable labels or compact label strategy
- not muddy
- not old Android Material bottom nav
- no page content overlap

Must support:

- `aria-current`
- touch target comfort
- reduced motion
- stable layout on 375px/390px

## 6. YomirraSidebar

Purpose: Desktop/tablet navigation.

Requirements:

- not an admin sidebar
- brand identity visible
- calm, compact, readable
- active state strong but elegant
- global search separated from nav
- user controls placed intentionally

Avoid:

- huge pale rail with low contrast
- repeated icons without hierarchy
- old dashboard visual language

## 7. YomirraSegmentedControl

Purpose: Replace underline tabs and old pills.

Variants:

- `full`
- `compact`
- `chips`

Rules:

- active state pill/fill
- clear text contrast
- keyboard accessible
- touch-friendly
- smooth indicator motion
- no magic widths
- no empty active pill with invisible label

Use full-width for primary switches like Bookmark Readlist/Riwayat.

Use compact for library filters if appropriate.

## 8. YomirraMangaCard

Purpose: Make manga feel like media/product objects.

Variants:

### `editorial`
For home/discovery:
- larger cover
- artwork-forward
- dark media overlay
- title/metadata integrated
- strong click target

### `continue`
For continue reading:
- landscape row
- cover thumb
- progress
- continue/play action
- clear source/chapter

### `shelf`
For library/bookmark grid:
- clean grid object
- cover first
- title/metadata below or overlay depending context
- bookmark state
- consistent aspect ratio

### `history`
For reading history:
- row card
- cover thumb
- last read date/progress
- resume action

### `compact`
For dense lists.

Rules:

- no generic cards
- no hard gray border
- no broken overlay in light mode
- no unreadable title
- no raw text-white except media token context
- support loading/error image fallback

## 9. State components

Rework:

- empty state
- error state
- loading/skeleton
- offline/cache state

Rules:

- useful copy
- clear actions
- theme-safe
- not generic alert boxes
- supports reader/source failures
