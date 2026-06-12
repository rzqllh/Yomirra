# Yomirra Full Audit Checklist

Use this checklist to audit the actual repository.

## 1. Repository baseline

- [ ] `package.json` scripts verified.
- [ ] Next.js version verified.
- [ ] React version verified.
- [ ] Tailwind version verified.
- [ ] TypeScript strictness verified.
- [ ] shadcn/ui config verified.
- [ ] components path alias verified.
- [ ] route groups verified.
- [ ] build output checked.
- [ ] production deployment constraints checked.

Report:

```md
## Baseline
- Framework:
- Package manager:
- UI stack:
- State stack:
- Data stack:
- Test stack:
- Deployment:
- Unknowns:
```

## 2. Route audit

Inventory every route under `src/app`.

For each route:

| Route | Purpose | Status | Data source | Loading | Empty | Error | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|

Check at minimum:

- [ ] `/`
- [ ] `/browse`
- [ ] `/search` if present
- [ ] `/library` if present
- [ ] `/readlist` if present
- [ ] `/bookmark` if present
- [ ] `/updates` if present
- [ ] `/popular` if present
- [ ] `/settings`
- [ ] `/manga/[sourceId]/[mangaId]`
- [ ] `/manga/[sourceId]/[mangaId]/read/[chapterId]`
- [ ] API source routes

Flag:

- [ ] hardcoded route strings
- [ ] dead routes
- [ ] duplicate routes with same product meaning
- [ ] nav routes that do not exist
- [ ] pages that exist but are not reachable
- [ ] pages reachable but broken

## 3. Product logic audit

### Library / Readlist / Bookmark

- [ ] Naming is consistent between UI and stores.
- [ ] Guest saved data works locally.
- [ ] Logged-in saved data syncs correctly if implemented.
- [ ] Local-to-cloud migration after login is implemented or clearly not implemented.
- [ ] Duplicate items are prevented.
- [ ] Removing item works.
- [ ] Sorting works.
- [ ] Search within saved list works.
- [ ] Empty state is useful.
- [ ] Metadata is accurate.

### History

- [ ] Reading history is written when reader is used.
- [ ] Continue reading target is correct.
- [ ] Last chapter/page/scroll position is stored if intended.
- [ ] History duplicate handling is correct.
- [ ] History UI reflects real data.

### Browse/Search

- [ ] Search input calls the right data source.
- [ ] Quick search and catalog search are clearly separated if both exist.
- [ ] Filters are not fake.
- [ ] Source selection is real.
- [ ] Pagination/infinite scroll works if present.
- [ ] Error and no-result states exist.
- [ ] Debounce behavior is intentional.
- [ ] Query state is shareable in URL if intended.

### Manga detail

- [ ] Manga title/source/cover/description loaded from adapter.
- [ ] Chapter list is accurate.
- [ ] Chapter sorting works.
- [ ] Latest chapter/total chapter shown correctly.
- [ ] Continue button resolves correct chapter.
- [ ] Bookmark/follow/readlist action works.
- [ ] Loading skeleton exists.
- [ ] Error retry exists.

### Reader

- [ ] Chapter images load.
- [ ] Previous/next chapter works.
- [ ] Reader mode works or unavailable mode is removed.
- [ ] Toolbar controls work.
- [ ] Chapter selector works.
- [ ] Progress state works.
- [ ] Scroll/tap behavior works.
- [ ] Mobile safe area handled.
- [ ] Desktop keyboard shortcuts handled if present.
- [ ] Broken images have fallback/retry.
- [ ] Reader settings persist.
- [ ] No placeholder buttons remain.

## 4. UI/UX audit

For each major screen, score 1-5:

| Screen | Hierarchy | Spacing | Color | Motion | A11y | Mobile comfort | Distinctiveness | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|

Minimum screens:

- [ ] Home
- [ ] Browse
- [ ] Search
- [ ] Library / Readlist
- [ ] Bookmark
- [ ] Manga detail
- [ ] Reader
- [ ] Settings
- [ ] Empty/error/loading states
- [ ] Navigation shell

Flag:

- [ ] boring/flat layout
- [ ] no product personality
- [ ] generic SaaS cards
- [ ] weak active states
- [ ] duplicated UI patterns
- [ ] inconsistent titles
- [ ] inconsistent buttons
- [ ] inconsistent icon sizes
- [ ] inconsistent radius
- [ ] inconsistent shadows
- [ ] inconsistent card density
- [ ] inconsistent mobile padding
- [ ] content hidden behind nav
- [ ] poor iOS Safari safe-area behavior

## 5. Magic number inventory

Search for:

- [ ] `-[`
- [ ] `[`
- [ ] `calc(`
- [ ] `vh`
- [ ] `vw`
- [ ] `z-[`
- [ ] `duration-[`
- [ ] `rounded-[`
- [ ] `shadow-[`
- [ ] `text-[`
- [ ] `leading-[`
- [ ] `tracking-[`
- [ ] repeated `px-*`, `py-*`, `gap-*` patterns that should be component variants

Classify each finding:

| File | Magic number | Type | Why risky | Replacement |
|---|---|---|---|---|

Replacement categories:

- design token
- layout constant
- component variant
- CSS variable
- documented exception

## 6. Design system audit

- [ ] `globals.css` or theme file has semantic tokens.
- [ ] No raw hex in components except documented exceptions.
- [ ] shadcn tokens mapped correctly.
- [ ] Dark and light tokens exist.
- [ ] Accent palette applied by role, not randomly.
- [ ] Destructive state is soft and accessible.
- [ ] Focus ring token visible.
- [ ] Cards and panels use shared surface rules.
- [ ] Typography scale exists.
- [ ] Radius scale exists.
- [ ] Motion tokens exist.
- [ ] Safe-area tokens exist.

## 7. Component audit

Inventory components:

| Component | Path | Purpose | Reusable? | Problems | Action |
|---|---|---|---|---|---|

Check:

- [ ] `AppShell`
- [ ] `MobilePageShell`
- [ ] navigation components
- [ ] manga card variants
- [ ] reader controls
- [ ] history row
- [ ] empty state
- [ ] search input
- [ ] sorting controls
- [ ] source selector
- [ ] theme toggle
- [ ] skeletons
- [ ] status badges
- [ ] action buttons

Flag:

- [ ] duplicated card components
- [ ] duplicated search inputs
- [ ] duplicated nav configs
- [ ] one-off page-only components that should be reusable
- [ ] too many client components
- [ ] props too loose
- [ ] missing variants
- [ ] UI state not represented in props

## 8. Accessibility audit

- [ ] keyboard navigation
- [ ] focus ring
- [ ] aria-label for icon buttons
- [ ] aria-current for active nav
- [ ] dialog/sheet focus behavior
- [ ] form labels
- [ ] contrast
- [ ] target size
- [ ] reduced motion
- [ ] no hover-only core action
- [ ] screen-reader meaning for loading/empty/error

## 9. Performance audit

- [ ] unnecessary client components
- [ ] image optimization
- [ ] remote image config
- [ ] suspense/loading boundaries
- [ ] skeleton vs layout shift
- [ ] bundle heavy dependencies
- [ ] excessive animation
- [ ] huge lists without virtualization/pagination
- [ ] repeated sorting/filtering without memoization
- [ ] server/client data duplication

## 10. Security/reliability audit

- [ ] source adapter input validation
- [ ] image proxy allowlist/safety
- [ ] unsafe URL handling
- [ ] auth ownership checks
- [ ] env variable docs
- [ ] API error normalization
- [ ] rate limit/backoff if relevant
- [ ] storage migration safety
- [ ] corrupted local storage recovery
- [ ] production build/deploy issues

## Final scoring

```md
## Final Score
- Product logic:
- UI/UX:
- Accessibility:
- Architecture:
- Performance:
- Reliability:
- Overall readiness:

## Top 10 blockers
1.
2.
...

## Top 10 highest-impact fixes
1.
2.
...
```
