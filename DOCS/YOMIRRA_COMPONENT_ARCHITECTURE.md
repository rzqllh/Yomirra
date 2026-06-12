# Yomirra Component Architecture

Goal: make the project easier to audit, fix, and extend without mixing backend, frontend, mobile, feature logic, and reusable components.

## Folder principles

Separate:

- app routes,
- feature logic,
- shared UI,
- shared app shell,
- source adapter contracts,
- stores,
- server/API logic,
- design tokens,
- utilities.

Do not dump every component into one folder.

## Proposed structure

Adjust to existing repo instead of blindly moving files.

```txt
src/
  app/
    (web)/
      page.tsx
      browse/
      search/
      library/
      bookmark/
      settings/
      manga/
    api/

  components/
    ui/
      button.tsx
      card.tsx
      input.tsx
      sheet.tsx
      dialog.tsx
      tabs.tsx
      ...
    app/
      app-shell.tsx
      mobile-page-shell.tsx
      bottom-nav.tsx
      side-nav.tsx
      theme-toggle.tsx
      page-header.tsx
    manga/
      manga-card.tsx
      manga-cover.tsx
      manga-meta.tsx
      chapter-list.tsx
      source-badge.tsx
    reader/
      reader-shell.tsx
      reader-toolbar.tsx
      reader-image.tsx
      chapter-navigation.tsx
      reader-settings-sheet.tsx
    states/
      empty-state.tsx
      error-state.tsx
      loading-state.tsx
      skeletons.tsx

  features/
    browse/
      components/
      hooks/
      lib/
    library/
      components/
      hooks/
      lib/
    reader/
      components/
      hooks/
      lib/
    search/
      components/
      hooks/
      lib/
    settings/
      components/
      hooks/
      lib/

  shared/
    config/
      routes.ts
      navigation.ts
      theme.ts
    constants/
      layout.ts
      storage-keys.ts
    hooks/
      use-mounted.ts
      use-media-query.ts
    lib/
      cn.ts
      routes.ts
      format.ts
      safe-url.ts
    store/
      library-store.ts
      history-store.ts
      reader-store.ts
      settings-store.ts
    types/
      manga.ts
      source.ts
      user.ts

  server/
    adapters/
    api/
    auth/
    cache/
```

## Route config

No route strings scattered across files.

Create a single route config:

```ts
export const routes = {
  home: "/",
  browse: "/browse",
  search: "/search",
  library: "/library",
  bookmarks: "/bookmark",
  settings: "/settings",
  mangaDetail: (sourceId: string, mangaId: string) =>
    `/manga/${sourceId}/${mangaId}`,
  reader: (sourceId: string, mangaId: string, chapterId: string) =>
    `/manga/${sourceId}/${mangaId}/read/${chapterId}`,
} as const;
```

Navigation should consume this config.

## Layout constants

Create layout constants for safe areas and shell sizes.

```ts
export const layout = {
  mobileHeaderHeight: "3.5rem",
  bottomNavHeight: "4.75rem",
  readerToolbarHeight: "3.75rem",
  safeBottom: "env(safe-area-inset-bottom)",
} as const;
```

Use CSS variables/classes instead of repeating values.

## Component design rules

### Shared UI components

`components/ui` must be low-level primitives only.

Examples:

- Button
- Card
- Input
- Sheet
- Dialog
- Tabs
- Select
- Skeleton
- Tooltip

Do not put product logic into `components/ui`.

### App components

`components/app` contains reusable app shell and navigation.

Examples:

- `AppShell`
- `MobilePageShell`
- `BottomNav`
- `SideNav`
- `ThemeToggle`
- `PageHeader`

### Manga components

`components/manga` contains generic manga display components.

Examples:

- `MangaCard`
- `MangaCover`
- `MangaMeta`
- `ChapterList`
- `SourceBadge`

### Reader components

`components/reader` contains reader-specific UI.

Examples:

- `ReaderShell`
- `ReaderToolbar`
- `ReaderImage`
- `ChapterNavigation`
- `ReaderSettingsSheet`

### Feature components

`features/*/components` contains page/feature composition that is not globally reusable.

## Manga card variants

Use one component with variants, not many almost-identical components.

Suggested variants:

```ts
type MangaCardVariant =
  | "compact"
  | "shelf"
  | "continue"
  | "discovery"
  | "history"
  | "source";
```

Each variant controls layout, density, metadata, and action placement.

## State/store rules

Separate state by domain:

- library/readlist store
- history store
- reader settings store
- theme/settings store
- auth/sync store if applicable

Avoid one giant store.

Every persisted store needs:

- version
- migration strategy
- corrupted data fallback
- clear storage key
- guest vs logged-in behavior

## Local-to-cloud migration expectation

When user logs in:

1. Read valid local guest data.
2. Compare with cloud data.
3. Merge safely.
4. Avoid duplicates.
5. Preserve latest reading progress.
6. Save to cloud.
7. Mark migration done.
8. Keep rollback/failure behavior.
9. Do not delete local data until cloud save succeeds.

If this is not implemented, the UI must not claim sync is done.

## Server/client boundary

Default to server components where possible.

Use client components for:

- interactive controls,
- stores,
- local storage,
- reader gestures,
- theme toggle,
- dialogs/sheets,
- motion.

Do not mark a whole page as `"use client"` unless needed.

## shadcn/Radix policy

Use shadcn/ui components as the styled component layer and Radix primitives for accessible interaction behavior.

Custom components can exist, but they must not reimplement inaccessible dropdowns, sheets, dialogs, tabs, or select controls.

## Styling rules

Prefer:

- semantic tokens,
- component variants,
- shared layout primitives,
- `cn()` utility,
- CSS variables.

Avoid:

- raw hex in JSX,
- one-off arbitrary Tailwind values,
- repeated class strings,
- giant conditional class blocks,
- mixing too many visual systems.

## Testing targets

Minimum test targets:

- route config generates correct hrefs,
- library store add/remove/merge,
- history store update/resume,
- local-to-cloud migration merge logic,
- reader previous/next chapter logic,
- search/filter/sort logic,
- component render for major empty/error states.
