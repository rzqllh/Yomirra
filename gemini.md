# GEMINI.md — Yomirra Project Operating Guide

**Project:** Yomirra
**Version:** 1.0.0
**Last updated:** 2026-06
**Purpose:** Project-specific operating rules for Antigravity Agent working inside the Yomirra codebase.

---

## 0. Absolute Rule

Do not hallucinate.

If something is not verified from the codebase, screenshots, logs, terminal output, or explicit user instruction, mark it as **Unknown** or **Inference**.

Never claim:

- a route exists unless inspected;
- a component is wired unless inspected;
- a feature works unless manually or programmatically verified;
- lint/typecheck/test/build passed unless actually run;
- UI matches reference screenshots unless visually checked;
- source CRUD/multi-source/auth/sync exists unless implemented.

The user cares more about honest status than fake confidence.

---

## 1. Product Identity

Yomirra is a premium manga/comic reader built around source-adapter logic.

Yomirra should combine:

- Tachiyomi-like source reader logic;
- premium responsive architecture;
- MangaDex-inspired desktop information density;
- original Yomirra copy and product language;
- real Library, History, Continue Reading, and reader preference flows;
- truthful source-aware loading, empty, and error states.

Yomirra is not:

- a MangaDex clone;
- a scanlation community platform;
- a forum product;
- a chapter upload platform;
- a fake social manga website;
- a generic SaaS dashboard;
- an AI-generated anime template.

Use MangaDex only as a structural UX reference for:

- desktop sidebar;
- top search placement;
- dense detail page layout;
- desktop reader side panel.

Do not copy MangaDex copy, branding, community features, uploader flows, report flows, or social mechanics unless the user explicitly approves and the backend/product logic exists.

---

## 2. Current Product Logic

Yomirra follows this reading loop:

```txt
Manage sources
→ Search manga/title from active source
→ Open manga detail
→ Save to Library
→ Open chapter
→ Reader opens
→ History updates
→ Progress updates
→ Continue Reading appears on Home, Detail, Library, and History
```

This loop is more important than decorative UI.

If this loop breaks, the product is broken.

---

## 3. Expected Stack and Architecture

Do not assume blindly. Inspect first.

Expected stack based on current project direction:

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- Phosphor icons
- Zustand stores
- React Query or existing async data-fetching layer
- source adapter registry
- route helpers
- local persistence for Library/History unless auth/sync is explicitly implemented

Before making changes, verify actual package versions and file locations.

Do not install or replace dependencies without approval.

Do not introduce:

- `react-icons`
- Lucide icons
- random UI libraries
- unrelated animation libraries
- a new state library
- a new design system

unless the user explicitly approves.

---

## 4. Locked Route Semantics

These route meanings are locked unless the user explicitly changes them.

```txt
/                                      Home / discovery hub
/search                                Title search results
/sources                               Source manager
/browse                                Redirect only to /sources
/updates                               Latest updates
/popular                               Popular titles
/library                               Global title catalog / discovery hub
/readlist                              Saved bookmarked manga
/history                               Reading history
/settings                              App / reader preferences
/manga/[sourceId]/[mangaId]            Manga detail
/manga/[sourceId]/[mangaId]/read/[chapterId] Reader
```

Rules:

- `/search` is for manga/title search only.
- `/sources` is for source management only.
- `/browse` must not remain as a real separate product surface if `/sources` is canonical.
- `/browse` should redirect to `/sources` for compatibility.
- No stale links may point to deleted or repurposed routes.
- All dynamic route params must be safely encoded.
- Use centralized route helpers when available.
- Do not manually concatenate dynamic URLs if a helper exists.

---

## 5. Search Rules

There are three search surfaces. Do not mix them.

### Desktop TopNav Search

Purpose:

- global manga/title search.

Behavior:

- desktop only;
- placeholder: `Cari judul`;
- submit navigates to `/search?q=...`;
- empty query should not navigate to a broken page;
- results must open manga detail.

### Mobile Home Search

Purpose:

- mobile shortcut for manga/title search.

Behavior:

- compact inline search on Home mobile;
- same search behavior as TopNav;
- navigates to `/search?q=...`.

### Sources Search

Purpose:

- filter installed source adapters only.

Behavior:

- lives on `/sources`;
- filters source cards locally;
- never calls manga search API;
- never shows manga results.

Wrong implementation examples:

- `/sources` showing manga title results.
- `/search` showing source cards.
- Home desktop duplicating a huge search area when TopNav already handles title search.
- Search controls with no actual behavior.

---

## 6. Source System Rules

Yomirra is source-aware.

A source must expose metadata and capabilities such as:

```ts
type SourceMetadata = {
  id: string;
  name: string;
  description?: string;
  language?: string;
  isEnabled: boolean;
  isInstalled: boolean;
  capabilities: {
    popular: boolean;
    latest: boolean;
    search: boolean;
    detail: boolean;
    chapters: boolean;
    pages: boolean;
  };
  status?: "online" | "slow" | "unavailable" | "unknown";
};
```

Rules:

- Do not fake additional sources.
- If only Shinigami exists, show only Shinigami.
- Do not build fake “add any source URL” behavior.
- Custom source creation requires a real adapter schema.
- If source creation is not implemented, show disabled/coming-later state or omit the action.
- Source failures must look like source failures, not full app failures.
- If a source capability is false, the UI must not pretend the feature works.

---

## 7. Library and History Rules

Library and History must be real.

### Library

Library means manga saved/bookmarked by the user.

Rules:

- no dummy manga;
- no fake saved titles;
- no fake cloud sync;
- persists locally unless real auth/sync exists;
- item identity must use `sourceId + mangaId`, not title alone.

### History

History means chapters actually opened/read.

Rules:

- opening a chapter creates or updates history;
- no fake timestamps;
- no fake progress;
- clear history requires confirmation;
- history persists locally unless real auth/sync exists.

### Continue Reading

Continue Reading must only appear if real reading history exists.

Never show Continue Reading based on guessed chapter data.

---

## 8. Manga Detail Rules

The manga detail page should be MangaDex-inspired structurally, but Yomirra-native logically.

Desktop layout:

- blurred banner/backdrop;
- left cover column;
- CTA stack under cover;
- right dense information area;
- synopsis;
- chapter list.

Mobile layout:

- stacked, readable, tap-friendly;
- no awkward desktop leftovers.

Required behavior:

- cover fallback;
- source badge;
- real metadata only;
- real CTA logic;
- real chapter list state;
- truthful loading/error/empty states.

CTA priority:

1. `Lanjut baca` only if real history exists.
2. `Mulai baca` only if chapters exist.
3. `Masuk readlist` / `Tersimpan di readlist`.

Do not show:

- fake ratings;
- fake follower counts;
- fake comment counts;
- fake uploader/scan group data;
- report/upload buttons unless actually implemented;
- “continue” if no history exists.

Chapter list must include:

- loading skeleton;
- error state with retry;
- empty state;
- readable rows;
- sort if implemented;
- read/progress state only when real;
- route to reader via helper.

---

## 9. Reader Rules

The reader is the core product.

If the reader is bad, the product is bad.

Desktop reader:

- centered reading canvas;
- right-side panel;
- panel can collapse/expand;
- collapsed state persists if a store exists;
- panel must not permanently obstruct pages;
- top controls are minimal.

Mobile reader:

- no desktop side panel;
- use compact overlay, drawer, or sheet;
- preserve immersive reading.

Reader panel may include only working controls:

- manga title;
- chapter title;
- page/chapter navigation;
- reading mode;
- reading direction;
- fit/max width;
- background tone;
- header visibility;
- reader settings.

Do not render fake toggles.

If paged mode is incomplete, say so.
If progress style is incomplete, do not show the control.
If settings do not persist, do not claim persistence.

Required:

- page image skeleton;
- per-page error and retry;
- reader back fallback to manga detail;
- history update on chapter open;
- progress update if trackable;
- keyboard support where implemented;
- accessible labels on icon-only buttons.

---

## 10. Navigation Rules

Desktop:

- SideNav + TopNav;
- no BottomNav;
- content must not hide behind fixed nav;
- active states must work on nested routes.

Mobile:

- BottomNav;
- no desktop SideNav;
- no double navigation;
- tap targets minimum 44px.

Sidebar groups:

```txt
Discover
- Beranda
- Update Terbaru
- Populer

Collection
- Library
- Readlist
- Riwayat

Sources
- Sumber

Preferences
- Pengaturan
```

Mobile bottom nav:

```txt
Beranda
Library
Readlist
Riwayat
Pengaturan
```

Do not add MangaDex community navigation such as forums, groups, upload, notices, rights holders, or compliance pages unless explicitly requested.

---

## 11. UI System Rules

Use the existing Yomirra design system.

Must use:

- tokens;
- Tailwind theme mapping;
- shadcn primitives;
- project-level wrappers;
- Phosphor icons;
- consistent spacing;
- consistent radius;
- consistent surface hierarchy;
- dark-first manga reader tone.

Must not use:

- random raw colors;
- random gradients;
- fake glass everywhere;
- default shadcn styling left untouched;
- noisy shadows;
- inconsistent radii;
- generic SaaS cards;
- anime fanpage styling;
- multiple icon families.

Covers and manga pages are the visual focus. UI frames content; it should not compete with it.

---

## 12. Copywriting Rules

Use original Yomirra copy.

Do not copy MangaDex text verbatim.

Tone:

- concise;
- clear;
- premium;
- product-native;
- not cringe;
- not corporate SaaS;
- not overly casual.

Approved terms:

```txt
Beranda
Update Terbaru
Populer
Library
Riwayat
Sumber
Pengaturan
Cari judul
Lanjut baca
Mulai baca
Masuk readlist
Tersimpan di readlist
Chapter
Halaman
Mode baca
Arah baca
Lebar tampilan
Pengaturan pembaca
Sembunyikan panel
Tampilkan panel
```

Avoid:

- random English/Indonesian mixing outside approved terms;
- “Discover amazing manga” style copy;
- fake excitement;
- copy that claims unsupported features.

---

## 13. Data Truthfulness Rules

The UI must reflect real data availability.

Do not display:

- fake counts;
- fake ratings;
- fake timestamps;
- fake comments;
- fake users;
- fake uploaders;
- fake scanlation groups;
- fake source list;
- fake sync state;
- fake account state.

If data is missing:

- omit the section;
- show a truthful empty state;
- or show the field only when data exists.

Never fill gaps with guessed content.

---

## 14. Implementation Mode Rules

Before coding:

1. inspect relevant files;
2. inspect existing components and stores;
3. inspect route helpers;
4. inspect API/client contracts;
5. identify exact files affected.

During coding:

- make the smallest coherent change;
- do not rewrite unrelated pages;
- do not remove existing functionality unless explicitly approved;
- do not add dependencies without approval;
- preserve mobile and desktop behavior;
- preserve accessibility.

After coding:

- list changed files;
- describe behavior changed;
- state known limitations;
- report actual verification commands and results.

---

## 15. Approval Gates

Ask for approval before:

- adding/removing/replacing dependencies;
- changing route semantics;
- deleting routes or components;
- changing API response contracts;
- changing database schema;
- adding auth/sync/cloud persistence;
- broad visual redesign;
- implementing fake-compatible source CRUD;
- adding community/social features.

Required approval format:

```md
## Understanding Check

**Goal:** ...
**Files affected:** ...
**Approach:** ...
**Important impact:** ...
**Out of scope:** ...

Reply PROCEED to implement, or revise the plan.
```

Do not ask approval for small fixes clearly requested by the user.

---

## 16. Verification Rules

Do not claim verification unless actually run.

Run when relevant:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If `pnpm test` is missing or placeholder, state that clearly.

Manual QA required for major UI work:

- mobile portrait;
- mobile landscape;
- tablet;
- small laptop;
- desktop;
- wide desktop.

Manual QA required for Yomirra core flow:

1. TopNav search opens `/search`.
2. Mobile Home search opens `/search`.
3. `/search?q=...` shows real title results.
4. `/sources` filters sources only.
5. `/browse` redirects to `/sources`.
6. Home shows real Continue Reading only when history exists.
7. Detail page CTA logic is truthful.
8. Add to Readlist works.
9. Reader opens chapter pages.
10. Reader panel hides/shows.
11. History updates after opening chapter.
12. Readlist last-read metadata updates if saved.
13. Bottom nav works on mobile.
14. SideNav/TopNav works on desktop.
15. No fake social/community features appear.

---

## 17. Required Output Format After Implementation

Use this format:

```md
## Implemented Changes

### Files changed

- `path/to/file`

### What changed

- Concrete behavior, not vague summaries.

### Why

- Root problem addressed.

### Verification

- `pnpm lint`: pass/fail/not run
- `pnpm typecheck`: pass/fail/not run
- `pnpm test`: pass/fail/not run/placeholder
- `pnpm build`: pass/fail/not run

### Manual checks

- Exact routes, viewports, and interactions checked.

### Known limitations

- Anything incomplete or intentionally deferred.
```

Do not overclaim.

---

## 18. Forbidden Shortcuts

Never do these:

- rename `/browse` to `/sources` without redirect;
- create `/search` as a placeholder;
- create `/updates` or `/popular` with fake data;
- show “Lanjut baca” without real history;
- show “Tersimpan” without real library state;
- render reader controls that do not work;
- hide route errors behind empty states;
- mark a task complete because files were created;
- say “build passed” without running build;
- copy MangaDex wording;
- add community features because MangaDex has them;
- replace project styling with generic template UI;
- use dummy data and call it a feature.

---

## 19. Current Non-Goals

Do not implement unless explicitly requested:

- forums;
- comments;
- scanlation groups;
- upload chapter;
- report chapter;
- fake rating system;
- fake follower count;
- cloud sync;
- auth;
- arbitrary custom source URL creation;
- notifications;
- social profile;
- admin dashboard.

---

## 20. Quality Standard

A task is complete only when:

- the behavior works;
- the route is valid;
- loading/empty/error states exist;
- UI is responsive;
- copy is original and consistent;
- no fake data is shown;
- type/lint/build status is honestly reported;
- known limitations are written down.

The goal is not maximum complexity.

The goal is deliberate, polished, maintainable product work.
