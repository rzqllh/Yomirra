# Page Rework Spec

Each page must have a distinct intent and composition.

## Shared requirements

All pages:

- use Yomirra primitives
- avoid old header/search/card template
- preserve existing logic/data flow
- no horizontal overflow
- mobile-first
- desktop/tablet adaptive
- safe-area aware
- light/dark complete
- accessible controls

## Home

Intent: editorial discovery and reading continuation.

Must include:

- Continue Reading with strong priority
- featured/popular/update sections
- manga cards as media objects
- source identity without making the page look like an admin feed
- section rhythm

Avoid:

- generic dashboard rows
- flat card list
- too many identical horizontal sliders

Desktop:

- can use editorial grid and horizontal shelves
- avoid content stretching too wide

Mobile:

- content should feel like a native media app feed
- bottom dock should not cover cards

## Library

Intent: catalog/search/filter shelf.

Must include:

- page identity as a browsing catalog
- strong search/filter area
- segmented sort/filter
- grid optimized for manga covers
- no empty active pill bug
- clear active filter labels

Avoid:

- huge generic top whitespace
- old segmented control
- filter floating far away from context
- cards too small on desktop
- grid that feels like file manager

Desktop:

- content width should be intentional
- grid density should scale cleanly

Mobile:

- search/filter should be reachable and compact

## Bookmark

Intent: personal shelf.

Must include:

- primary Readlist/Riwayat switch
- distinct readlist grid vs history rows
- personal shelf feel
- clear sort and clear/delete actions
- history progress if available

Avoid:

- same catalog page with different title
- segmented control with invisible active text
- giant empty flat areas
- old list cards

## Sources

Intent: source management/status.

Must include:

- source status card
- capabilities
- version/source metadata
- search only if source count grows or it is useful
- calm grouped management style

Avoid:

- giant empty dashboard page
- full-width pale box with weak hierarchy
- overpromising custom sources if unsupported

## Settings

Intent: calm grouped preferences.

Must include:

- account/sync section
- appearance/theme section
- cache/storage/PWA section when implemented
- navigation shortcuts if useful
- grouped iOS-like sections

Avoid:

- admin dashboard card stack
- generic white cards with heavy shadow
- huge wasted space
- settings controls with unclear state

## Manga Detail

Intent: cinematic title page.

Must include:

- strong cover/artwork presence
- title, author, status, genres
- primary CTA
- readlist action
- description
- chapter search/list
- contextual back behavior

Rules:

- back button must be context-aware, not blindly `router.back()`
- if user came from reader, detail back must not send them back to reader unless explicitly intended
- media should feel cinematic, not a generic detail form

## Reader

Intent: manga-first immersive reading.

Must include:

- vertical scroll default
- optional horizontal/page mode if supported
- minimal chrome
- reader controls hide/reveal
- next/previous chapter
- chapter list
- image loading/error fallback
- progressive/lazy image loading
- safe-area handling
- keyboard support on desktop if present

Avoid:

- heavy toolbar
- navigation blocking manga content
- accidental back/navigation
- overanimated controls

## Desktop rules

Desktop must not become a stretched mobile layout.

Use:

- sidebar/rail if appropriate
- centered content widths
- denser manga grids
- larger editorial shelves
- readable settings width

Avoid:

- huge empty pale background
- cards spread too far apart
- generic admin app layout
