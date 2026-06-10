# Yomirra — Multi-Pass Execution Brief (Pass 1–3)

## Pre-Execution Checklist

Before starting **any pass**:

1. Read global Antigravity rules.
2. Read project-level `GEMINI.md`.
3. Inspect all files listed per pass before editing.
4. Run `pnpm lint && pnpm typecheck && pnpm build` before and after each pass.
5. Report failures honestly. Never hide errors.
6. Zero fake data. Zero fake filters. Zero overclaimed features.

Execute passes **sequentially**. Do not blend pass scopes.

---

## Pass 1 — Route Contract Stabilization

### Goal

Eliminate broken route semantics after Library/Readlist semantic separation.

### Locked Route Semantics

```
/                                          → Beranda (discovery preview)
/library                                   → global catalog / discovery hub
/readlist                                  → saved / bookmarked manga
/search                                    → search results
/sources                                   → source manager
/browse                                    → redirect to /sources (compatibility only)
/updates                                   → latest updates
/popular                                   → popular titles
/history                                   → reading history
/settings                                  → app & reader preferences
/manga/[sourceId]/[mangaId]               → manga detail
/manga/[sourceId]/[mangaId]/read/[chapterId] → reader
```

### Required Work

**1. `/browse` redirect**

- Create `src/app/(web)/browse/page.tsx`
- Redirect permanently to `/sources`
- Compatibility-only — not a real product page

**2. `/updates` page**

- Create `src/app/(web)/updates/page.tsx`
- Use `apiClient.getLatest(activeSourceId, page)` — use `"shinigami"` if no active source store exists yet
- Show: loading state, empty state, error state with retry, `MangaCard` grid/list
- Copy:
  - Title: `Update Terbaru`
  - Empty: `Belum ada update dari sumber aktif.`
  - Error: `Gagal memuat update terbaru.`
- No fake timestamps, uploader info, or comment counts

**3. `/popular` page**

- Create `src/app/(web)/popular/page.tsx`
- Use `apiClient.getPopular(activeSourceId, page)` — use `"shinigami"` if no active source store
- Show: loading state, empty state, error state with retry, `MangaCard` grid/list
- Copy:
  - Title: `Populer`
  - Empty: `Belum ada judul populer dari sumber aktif.`
  - Error: `Gagal memuat judul populer.`
- No fake rank badges, ratings, follower counts, or comment counts

**4. Route helper adoption**

Update `src/shared/lib/routes.ts` if needed. Replace all hardcoded strings where helpers already exist:

- Home mobile search → `getSearchHref(query)`
- TopNav search → `getSearchHref(query)`
- Home "Lihat Semua" history link → `getHistoryHref()`
- History empty CTA → `getLibraryHref()`, not raw `/`
- SideNav and BottomNav → use route helpers where practical
- CommandMenu → add `Readlist` entry and use route helpers for all nav items

**5. Navigation structure**

SideNav groups:

```
Discover:    Beranda · Library · Update Terbaru · Populer
Collection:  Readlist · Riwayat
Sources:     Sumber
Preferences: Pengaturan
```

BottomNav:

```
Beranda · Library · Readlist · Riwayat · Pengaturan
```

### Out of Scope for Pass 1

- Reader refactor
- Firebase / auth / sync
- Tag or format filters
- `library-store` rename
- Button system polish
- Manga Detail rewrite
- Source adapter behavior changes

### Acceptance Criteria

- [ ] `/browse` redirects to `/sources`
- [ ] `/updates` loads real data; all three states present
- [ ] `/popular` loads real data; all three states present
- [ ] SideNav active states work for all routes
- [ ] BottomNav active states work for all routes
- [ ] CommandMenu includes Readlist; all nav items use route helpers
- [ ] No hardcoded route string where a helper already exists
- [ ] No route pointing to stale `/browse`
- [ ] No readlist/saved UI linking to `/library`
- [ ] No fake data anywhere

### Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Report each result explicitly. If `pnpm test` is missing or placeholder, state so clearly.

### Final Report Format

```
## Implemented Changes

### Files changed
- ...

### What changed
- ...

### Why
- ...

### Verification
- pnpm lint:
- pnpm typecheck:
- pnpm test:
- pnpm build:

### Manual checks
- /browse
- /sources
- /updates
- /popular
- /library
- /readlist
- SideNav
- BottomNav
- CommandMenu

### Known limitations
- ...
```

---

## Pass 2 — Library Page Redesign

### Goal

Redesign the Library page into an immersive manga discovery shelf. **No new features** — redesign only. Keep all existing functionality: sidebar navigation, global search, library grid, filters/sort, manga cards, and pagination.

### Design Direction

- Premium dark manga reader aesthetic — not SaaS, not admin dashboard
- Cinematic deep dark background with subtle depth and layering
- **Crimson/red as primary brand accent** (aligned with Yomirra logo), violet/purple only as secondary accent
- Manga covers are the primary visual anchor
- Improve spacing, visual hierarchy, card readability, and browsing flow

### Layout Requirements

**Sidebar**

- Keep left sidebar structure
- Indonesian section labels: `BACA`, `KOLEKSI`, `LAINNYA`
- Nav items: Beranda, Library, Sumber, Readlist, Riwayat, Pengaturan
- Active Library state: elegant and subtle — no large neon purple block

**Header / TopNav**

- Keep global search bar
- Search placeholder: `Cari manga, manhwa, atau manhua...`
- Login button: visually quiet and premium — not a prominent CTA

**Library Intro Section**

- Page title: `Library`
- Subtitle: `Jelajahi semua judul yang tersedia di Yomirra.`
- Inline metadata pill: `3.248 judul · 128 update hari ini`
- **No large stat cards or dashboard-style KPI boxes**

**Filter System**

- Primary quick tabs: `Semua Judul`, `Update Terbaru`, `Populer`, `Tamat`
- Secondary compact controls row: Genre, Status, Sumber, Urutan
- Only render filter options **backed by real API support** — do not show filters the active adapter cannot process
- Keep UI clean and lightweight, not a full filter panel

**Manga Cards**

- Cover-focused cards, larger than current
- 5 columns on desktop (better breathing room than 4)
- Title: below cover, or as a subtle gradient overlay at card bottom
- Metadata format: `Ch. 86 · 3 jam lalu`
- Maximum **1 primary badge** per card — no stacking badges
- Bookmark/action icons: subtle by default, revealed on hover

**Pagination**

- Keep existing pagination (not infinite scroll)
- Style: compact, centered
- Button labels: `Sebelumnya` / `Berikutnya`

### Copy Guidelines

- Indonesian, casual, natural — not corporate or SaaS-flavored
- Manga-reader browsing language — discovery, not analytics

### Do Not

- Add new unrelated features or data
- Add large stat cards, analytics panels, or KPI boxes
- Overuse purple glow or neon accents
- Produce a generic AI-generated dashboard aesthetic
- Cover manga thumbnails with heavy overlays
- Show filter controls for unsupported API params

---

## Pass 3 — Reader Phase 4: Enhancements

Four enhancements targeting core manga reader experience. Execute in any order within this pass; all four must be complete before Pass 3 is marked done.

---

### 3.1 — PWA Setup

**Goal:** Make Yomirra installable as a native-like app on mobile — no browser chrome during reading.

**Required:**

Create `public/manifest.json`:

```json
{
  "name": "Yomirra",
  "short_name": "Yomirra",
  "start_url": "/",
  "display": "standalone",
  "background_color": "[app dark background hex]",
  "theme_color": "[app dark background hex]",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

In `app/layout.tsx`:

- Add `<link rel="manifest" href="/manifest.json">`
- Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` (180×180)
- Add `<meta name="theme-color" content="[app color]">`

Service Worker:

- Register via `next-pwa` or manual approach
- Offline shell caching is sufficient — full offline manga is out of scope for this pass

**Acceptance:**

- [ ] Mobile Chrome/Safari shows "Add to Home Screen" / install prompt
- [ ] App opens without browser chrome in standalone mode
- [ ] Lighthouse PWA audit passes installability check

---

### 3.2 — Keyboard Shortcuts (Desktop Reader)

**Goal:** Support keyboard navigation in the reader on desktop.

**Target file:** Reader page or `reader-shell.tsx`

**Shortcut map:**

| Key                       | Action                   | Mode             |
| ------------------------- | ------------------------ | ---------------- |
| `ArrowRight`              | Next page                | Paged            |
| `ArrowLeft`               | Previous page            | Paged            |
| `ArrowDown` / `Space`     | Next page / scroll nudge | Paged & Vertical |
| `ArrowUp` / `Shift+Space` | Previous page            | Paged            |
| `Escape`                  | Close open drawer/panel  | All              |
| `F`                       | Toggle fullscreen        | All              |

**Implementation:**

- Use `useEffect` with `keydown` event listener; cleanup on unmount
- Guard: do not fire if the focused element is an `input`, `textarea`, or `select`
- Paged mode: arrow keys control page navigation
- Vertical/continuous mode: arrow keys and space trigger scroll nudge only — not hard jump

**Acceptance:**

- [ ] Arrow keys navigate pages in paged mode
- [ ] `Escape` closes open drawer/panel
- [ ] No key conflicts with browser defaults when reader is not in focus

---

### 3.3 — Per-Page Error Handling + Image Skeleton

**Goal:** Handle individual page image failures gracefully without triggering a full-page reload. Critical for users on unstable connections (commuterline, low-signal areas).

**Required:**

Wrap each manga page `<Image>` in a `MangaPageImage` component that handles three states:

_Loading state:_

- Skeleton placeholder with maintained aspect ratio (`aspect-ratio: 2/3` for standard manga portrait; `aspect-ratio: auto` if dimensions are known ahead of time)
- Prevents layout shift before image resolves
- Smooth fade-in transition on load

_Error state:_

- Inline error placeholder (icon + message text)
- `Muat Ulang` retry button
- On retry: reload that image's `src` only — **do not call `router.refresh()` or reload the full page**

_Implementation notes:_

- Use `onError` on the `<Image>` or `<img>` element
- Track per-image state with local `useState({ loading, error })`
- Retry by toggling a cache-bust query param on `src` or resetting state

**Copy:**

- Error caption: `Gagal memuat halaman ini`
- Retry button label: `Muat Ulang`

**Do not:**

- Trigger full page or router refresh on image error
- Show generic 404 or HTTP error codes to the user

**Acceptance:**

- [ ] Single failed image shows inline retry — not blank space
- [ ] Skeleton shown while loading with stable layout height
- [ ] Retry reloads only that image
- [ ] No layout shift when image loads or fails

---

### 3.4 — Chapter Navigation (Next / Previous from Reader)

**Goal:** Allow users to go to the next or previous chapter directly from inside the reader — like Webtoon's end-of-chapter flow.

**Required:**

_End-of-chapter panel — Paged mode:_

- After the last page, show a full-width end-chapter panel/card
- Show: current chapter label, "Chapter Selanjutnya" with chapter name/number, primary action button
- If no next chapter exists: show `Ini adalah chapter terbaru.`

_End-of-chapter nudge — Continuous/Vertical mode:_

- After scrolling past the last image, show a sticky bottom bar with next chapter info and action button

_Previous chapter:_

- Persistent control in reader shell top bar
- If no previous chapter: disable or hide — do not show broken nav

_Navigation target:_

- Route to: `/manga/[sourceId]/[mangaId]/read/[nextChapterId]`
- Use chapter list already loaded in reader state or detail page

**Copy:**

- Next chapter button: `Chapter Selanjutnya: [chapter name or number]`
- Previous chapter: `Chapter Sebelumnya`
- No next: `Ini adalah chapter terbaru.`
- No previous: `Ini adalah chapter pertama.`

**Do not:**

- Auto-navigate to next chapter without user action
- Show chapter titles or numbers from placeholder/fake data

**Acceptance:**

- [ ] End of chapter (paged) shows next chapter panel with correct data
- [ ] End of chapter (vertical) shows next chapter bottom bar
- [ ] Tapping next chapter navigates to correct `chapterId` route
- [ ] Previous chapter button works or is cleanly hidden
- [ ] First/last chapter edge cases show correct copy, no broken nav

---

## Final Verification (All Passes)

After all passes are complete:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Do not mark work complete if any check fails.

### Manual Checklist

**Routes:**

- [ ] `/browse` → redirects to `/sources`
- [ ] `/updates` → loads real data, all three states present
- [ ] `/popular` → loads real data, all three states present
- [ ] `/library` → redesigned UI, only honest/supported filters shown
- [ ] `/readlist` → saved manga visible, no `/library` route leakage
- [ ] `/history` → uses route helpers

**Navigation:**

- [ ] SideNav → correct groups, active states work for all routes
- [ ] BottomNav → correct items, active states work
- [ ] CommandMenu → includes Readlist, all nav uses helpers

**Reader:**

- [ ] Paged mode → `ArrowLeft`/`ArrowRight` navigates pages
- [ ] `Escape` → closes open drawer/panel
- [ ] Image skeleton → stable layout while loading, no shift
- [ ] Image error → per-image retry button works, no full reload triggered
- [ ] End of chapter (paged) → next chapter panel appears with real data
- [ ] End of chapter (vertical) → next chapter bottom bar appears
- [ ] Previous chapter → works, or hidden cleanly if first chapter

**PWA:**

- [ ] Mobile Chrome/Safari → install prompt or "Add to Home Screen" visible
- [ ] Standalone mode → no browser chrome visible during reading

---

## Deferred Items (Out of Scope for This Brief)

Document these in your final report — do not implement in Pass 1–3:

- **Global multi-source parallel search** — next high-priority pass; requires `/api/sources/search` endpoint and `Promise.all` across active sources grouped by source name
- **Library catalog filter truthfulness** — verify which filter params Shinigami actually supports; disable unsupported ones
- **Readlist productization** — `ReadlistItemCard` with remove action, last-read state, continue reading metadata
- **Firebase / auth / sync hardening** — finish or gate as experimental; document env vars; remove untyped `any`
- **Image proxy security hardening** — restrict allowed hostnames, content-type, response size
- **`WebtoonReader` duplicate cleanup** — merge or remove unused component
- **Component system unification** — remove fake `UP` badge, tokenize raw color values, unify one-off button/input instances
