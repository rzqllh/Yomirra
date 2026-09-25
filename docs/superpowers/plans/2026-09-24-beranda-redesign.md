# Beranda Redesign & Strict Bookmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement strict explicit bookmarking (Opsi A) to prevent non-bookmarked comics from appearing in Updates/Library, and overhaul the Beranda (Home page) based on Gambar 1 (Editorial Yomirra Ink aesthetic: breadcrumb + navigation pills, cursive headline, interactive spotlight carousel with `<` and `>` controls, Top 5 leaderboard strip with colored ranking numbers, redesigned Lanjut Baca progress cards with 3-dot options, and cohesive baru diperbarui shelf).

**Architecture:** 
1. **Bookmark Strictness:** Stop auto-adding comics to `libraryStore` when users rate a manga (`MangaRating`) or add to a custom collection (`MangaCollectionButton`). Add orphan update cleanup in `removeFromLibrary` to purge `updateStore` records.
2. **Beranda Layout:** Restructure `HomeView` and `HomeFeedClient` into modular, testable components: `HomeNavTabs`, `HomeHeroHeader` (with Prev/Next spotlight paging and source selector), `EditorialSpotlight` (supporting carousel cycling), `HomeLeaderboardPanel` (styled `01`-`05` ranking numbers and metadata), and `ContinueReadingCard` (with source pill, `...` menu, chapter label, and red progress bar).

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, TypeScript, Zustand, Phosphor Icons (`@phosphor-icons/react`), Vitest, Testing Library.

## Global Constraints
- **Strict Scope Boundary:** Only touch files related to the Beranda overhaul and the bookmark strictness fix.
- **Design System:** Use Yomirra Ink tokens (`bg-surface-base`, `bg-surface-raised`, `border-border-subtle`, `text-accent`, `font-serif italic` for editorial handwritten headings). No generic AI patterns or raw unstyled elements.
- **Responsive:** Ensure mobile, tablet, and desktop viewports are responsive (cards wrap or scroll horizontally with `scrollbar-hide` on mobile, 2-3 column grids on desktop).
- **TDD:** Every task must have a test written and verified before committing.

---

### Task 1: Strict Bookmark Decoupling & Orphan Cleanup (Opsi A)

**Files:**
- Modify: `src/shared/store/library-store.ts:158-190`
- Modify: `src/components/manga/manga-rating.tsx:70-85`
- Modify: `src/components/manga/manga-collection-button.tsx:55-72`
- Test: `src/shared/store/__tests__/library-store.test.ts`
- Test: `src/components/manga/__tests__/manga-collection-actions.test.tsx`

**Interfaces:**
- `useLibraryStore.getState().removeFromLibrary(sourceId: string, mangaId: string)`: Must trigger `useUpdateStore.getState().removeUpdateById(key)` or `removeUpdate(sourceId, mangaId)`.
- `ensureInLibrary()` in `MangaCollectionButton`: Should not force unbookmarked items into `libraryStore` unless explicitly bookmarked, or collection store maintains standalone membership.

- [ ] **Step 1: Write failing test for orphan cleanup on removeFromLibrary**

In `src/shared/store/__tests__/library-store.test.ts`:
```typescript
it("cleans up corresponding record in updateStore when removed from library", () => {
  useLibraryStore.getState().addToLibrary({
    sourceId: "shinigami",
    mangaId: "test-manga",
    title: "Test Manga",
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  useUpdateStore.getState().upsertUpdate({
    sourceId: "shinigami",
    mangaId: "test-manga",
    mangaTitle: "Test Manga",
    latestChapterId: "ch-1",
  });
  expect(useUpdateStore.getState().getUpdate("shinigami", "test-manga")).toBeDefined();

  useLibraryStore.getState().removeFromLibrary("shinigami", "test-manga");
  expect(useUpdateStore.getState().getUpdate("shinigami", "test-manga")).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- library-store`
Expected: FAIL with update record still defined after `removeFromLibrary`.

- [ ] **Step 3: Implement orphan cleanup in removeFromLibrary and decouple rating/collection auto-add**

In `src/shared/store/library-store.ts`:
```typescript
import { useUpdateStore, getUpdateKey } from "@/shared/store/update-store";
...
// In removeFromLibrary:
removedItems.forEach(([key, item]) => {
  const updateKey = item.id ?? getUpdateKey(item.sourceId, item.mangaId);
  useUpdateStore.getState().removeUpdateById(updateKey);
  useUpdateStore.getState().removeUpdate(item.sourceId, item.mangaId);
});
```
In `src/components/manga/manga-rating.tsx`:
Only update `libraryStore.updateLibraryItem` if `libraryStore.isInLibrary(sourceId, mangaId)` is already true; do not automatically inject unbookmarked manga into the library on simple rating.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- library-store`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/store/library-store.ts src/components/manga/manga-rating.tsx src/shared/store/__tests__/library-store.test.ts
git commit -m "fix(library): enforce strict explicit bookmarking and cleanup orphan updates"
```

---

### Task 2: Home Sub-Navigation Mode Pills (`HomeNavTabs`)

**Files:**
- Create: `src/components/app/home-nav-tabs.tsx`
- Test: `src/components/app/__tests__/home-nav-tabs.test.tsx`
- Modify: `src/components/app/home-view.tsx`

**Interfaces:**
- Produces: `HomeNavTabs({ activeTab = "untukmu" }: { activeTab?: "untukmu" | "jelajahi" | "populer" | "terbaru" })`
- Renders:
  - Breadcrumb on left: `YOMIRRA > Beranda`
  - Pill navigation on right:
    - `Untukmu` (active with red pill `bg-accent text-white`, House/Bookmark icon)
    - `Jelajahi` (link to `/library` with Compass icon)
    - `Daftar Populer` (link to `/popular` with ChartBar icon)
    - `Rilis Terbaru` (link to `/latest` with Lightning icon)

- [ ] **Step 1: Write failing test for HomeNavTabs**

In `src/components/app/__tests__/home-nav-tabs.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import { HomeNavTabs } from "../home-nav-tabs";
import { describe, it, expect } from "vitest";

describe("HomeNavTabs Component", () => {
  it("renders breadcrumb and navigation pills matching Gambar 1", () => {
    render(<HomeNavTabs activeTab="untukmu" />);
    expect(screen.getByText(/YOMIRRA/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /untukmu/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /jelajahi/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /daftar populer/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /rilis terbaru/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- home-nav-tabs`
Expected: FAIL with "module not found".

- [ ] **Step 3: Implement HomeNavTabs component**

Create `src/components/app/home-nav-tabs.tsx`:
```tsx
"use client";

import Link from "next/link";
import { House, Compass, ChartBar, Lightning } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export interface HomeNavTabsProps {
  activeTab?: "untukmu" | "jelajahi" | "populer" | "terbaru";
  className?: string;
}

export function HomeNavTabs({ activeTab = "untukmu", className }: HomeNavTabsProps) {
  const tabs = [
    { id: "untukmu", label: "Untukmu", href: "/", icon: House },
    { id: "jelajahi", label: "Jelajahi", href: "/library", icon: Compass },
    { id: "populer", label: "Daftar Populer", href: "/popular", icon: ChartBar },
    { id: "terbaru", label: "Rilis Terbaru", href: "/latest", icon: Lightning },
  ];

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4 py-2 border-b border-border-subtle/50 mb-2", className)}>
      <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-text-muted">
        <span className="text-text-primary tracking-widest font-black">YOMIRRA</span>
        <span className="text-text-muted/60">&gt;</span>
        <span className="text-text-secondary">Beranda</span>
      </div>

      <nav aria-label="Mode Beranda" className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                isActive
                  ? "bg-accent text-white shadow-xs"
                  : "bg-surface-raised border border-border-subtle/80 text-text-secondary hover:text-text-primary hover:border-accent/40"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={14} weight={isActive ? "fill" : "bold"} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- home-nav-tabs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/app/home-nav-tabs.tsx src/components/app/__tests__/home-nav-tabs.test.tsx
git commit -m "feat(home): add HomeNavTabs with breadcrumb and pill mode switcher"
```

---

### Task 3: Editorial Hero Header & Script Display Typography (`HomeHeroHeader`)

**Files:**
- Create: `src/components/app/home-hero-header.tsx`
- Test: `src/components/app/__tests__/home-hero-header.test.tsx`
- Modify: `src/components/app/home-feed-client.tsx`

**Interfaces:**
- Produces: `HomeHeroHeader({ activeSourceId, onPrevSpotlight, onNextSpotlight, onSelectSource, sources })`
- Renders:
  - Red accent bar with `| BACAANMU DIMULAI DI SINI` (uppercase tracking-[0.14em] text-[11px] font-bold text-accent)
  - Editorial cursive heading: `Mau baca apa hari ini?` (`font-serif italic font-normal text-[38px] sm:text-[48px] md:text-[54px]`)
  - Subtitle: `Sorotan & peringkat` on left
  - Carousel Controls on right:
    - `<` prev button and `>` next button (`rounded-full border border-border-subtle bg-surface-raised size-8`)
    - Source pill button: `${sourceName} ->` (`bg-accent text-white rounded-full px-3.5 py-1.5 text-xs font-bold`)

- [ ] **Step 1: Write failing test for HomeHeroHeader**

In `src/components/app/__tests__/home-hero-header.test.tsx`:
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { HomeHeroHeader } from "../home-hero-header";
import { describe, it, expect, vi } from "vitest";

describe("HomeHeroHeader Component", () => {
  it("renders editorial title and triggers carousel navigation", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <HomeHeroHeader
        activeSourceName="Shinigami"
        onPrevSpotlight={onPrev}
        onNextSpotlight={onNext}
      />
    );

    expect(screen.getByText(/bacaanmu dimulai di sini/i)).toBeTruthy();
    expect(screen.getByText(/mau baca apa hari ini\?/i)).toBeTruthy();
    expect(screen.getByText(/sorotan & peringkat/i)).toBeTruthy();

    const prevBtn = screen.getByRole("button", { name: /sorotan sebelumnya/i });
    const nextBtn = screen.getByRole("button", { name: /sorotan berikutnya/i });
    fireEvent.click(prevBtn);
    expect(onPrev).toHaveBeenCalledOnce();
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- home-hero-header`
Expected: FAIL with "module not found".

- [ ] **Step 3: Implement HomeHeroHeader component**

Create `src/components/app/home-hero-header.tsx`:
```tsx
"use client";

import * as React from "react";
import { CaretLeft, CaretRight, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";

export interface HomeHeroHeaderProps {
  activeSourceName: string;
  sourceHref?: string;
  onPrevSpotlight?: () => void;
  onNextSpotlight?: () => void;
  className?: string;
}

export function HomeHeroHeader({
  activeSourceName,
  sourceHref = "/sources",
  onPrevSpotlight,
  onNextSpotlight,
  className,
}: HomeHeroHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Top Banner Accent */}
      <div className="border-l-2 border-accent pl-3 sm:pl-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-accent">
          Bacaanmu dimulai di sini
        </p>
        <h1 className="font-serif italic text-[36px] sm:text-[46px] md:text-[52px] leading-tight text-text-primary tracking-tight mt-1 select-none">
          Mau baca apa hari ini?
        </h1>
      </div>

      {/* Row 2: Subtitle & Carousel / Source Controls */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <h2 className="font-serif italic text-xl sm:text-2xl font-bold text-text-primary">
          Sorotan &amp; peringkat
        </h2>

        <div className="flex items-center gap-2">
          {/* Arrow Buttons for Carousel */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevSpotlight}
              aria-label="Sorotan sebelumnya"
              className="size-8 rounded-full bg-surface-raised border border-border-subtle hover:border-accent/40 hover:bg-surface-hover text-text-secondary hover:text-text-primary flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <button
              type="button"
              onClick={onNextSpotlight}
              aria-label="Sorotan berikutnya"
              className="size-8 rounded-full bg-surface-raised border border-border-subtle hover:border-accent/40 hover:bg-surface-hover text-text-secondary hover:text-text-primary flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>

          {/* Active Source Pill Link */}
          <Link
            href={sourceHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-white font-bold text-xs shadow-xs hover:bg-accent-hover active:scale-95 transition-all"
            aria-label={`Lihat sumber ${activeSourceName}`}
          >
            <span>{activeSourceName}</span>
            <ArrowRight size={13} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- home-hero-header`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/app/home-hero-header.tsx src/components/app/__tests__/home-hero-header.test.tsx
git commit -m "feat(home): add HomeHeroHeader with cursive display title and carousel controls"
```

---

### Task 4: Spotlight Carousel Card Redesign (`EditorialSpotlight`)

**Files:**
- Modify: `src/components/app/editorial-spotlight.tsx`
- Test: `src/components/app/__tests__/editorial-spotlight.test.tsx`

**Interfaces:**
- Consumes: `manga: MangaItem`, `sourceId: string`, `className?: string`
- Renders:
  - Left: Manga cover image (clean 2:3 aspect crop with smooth scale hover)
  - Right:
    - Red uppercase tag: `PILIHAN HARI INI`
    - Title: Styled in `font-serif italic font-bold text-2xl sm:text-3xl leading-tight text-text-primary`
    - Description: Clean truncated synopsis
    - Subtitle: `Manhwa · Chapter 54`
    - Action: `Lihat komik ->` (with `BookOpen` icon)

- [ ] **Step 1: Write test for EditorialSpotlight styling and data rendering**

Create `src/components/app/__tests__/editorial-spotlight.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import { EditorialSpotlight } from "../editorial-spotlight";
import { describe, it, expect } from "vitest";

describe("EditorialSpotlight Component", () => {
  const mockManga = {
    id: "supreme-demon",
    title: "The Supreme Demon Swordmaster",
    description: "Sama Geon, yang berhasil menyatukan Sekte Iblis...",
    coverUrl: "https://example.com/cover.jpg",
    format: "Manhwa",
    latestChapter: "Chapter 54",
  };

  it("renders tag, title, synopsis, and CTA link", () => {
    render(<EditorialSpotlight manga={mockManga} sourceId="shinigami" />);
    expect(screen.getByText(/pilihan hari ini/i)).toBeTruthy();
    expect(screen.getByText("The Supreme Demon Swordmaster")).toBeTruthy();
    expect(screen.getByText(/Sama Geon/i)).toBeTruthy();
    expect(screen.getByText(/Manhwa · Chapter 54/i)).toBeTruthy();
    const cta = screen.getByRole("link", { name: /lihat komik/i });
    expect(cta.getAttribute("href")).toContain("/manga/shinigami/supreme-demon");
  });
});
```

- [ ] **Step 2: Run test to verify it fails or needs refinement**

Run: `pnpm test -- editorial-spotlight`
Expected: Status check.

- [ ] **Step 3: Update EditorialSpotlight to match Gambar 1 styling**

Update `src/components/app/editorial-spotlight.tsx`:
```tsx
"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "@phosphor-icons/react";
import { MangaCover } from "@/components/manga/manga-cover";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";
import type { MangaItem } from "@/shared/sources/source-types";

interface EditorialSpotlightProps {
  manga: MangaItem;
  sourceId: string;
  className?: string;
}

export function EditorialSpotlight({ manga, sourceId, className }: EditorialSpotlightProps) {
  const href = getMangaDetailHref(sourceId, manga.id, "/");

  return (
    <article
      className={cn(
        "relative rounded-2xl bg-surface-raised border border-border-subtle/80 hover:border-accent/40 transition-all duration-200 shadow-xs grid grid-cols-1 sm:grid-cols-[minmax(140px,0.7fr)_minmax(0,1.3fr)] overflow-hidden h-full",
        className
      )}
    >
      {/* Cover Image */}
      <Link
        href={href}
        className="relative block h-48 sm:h-full w-full overflow-hidden bg-surface-base border-b sm:border-b-0 sm:border-r border-border-subtle/70 group"
        aria-label={`Lihat ${manga.title}`}
      >
        <MangaCover
          src={manga.coverUrl}
          alt={manga.title}
          fallbackTitle={manga.title}
          className="h-full w-full"
          imageClassName="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </Link>

      {/* Info Section */}
      <div className="flex flex-col justify-between p-4 sm:p-6 lg:p-7 min-w-0">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-accent mb-1.5">
            Pilihan hari ini
          </p>
          <Link href={href} className="block group">
            <h2 className="font-serif italic font-bold text-2xl sm:text-3xl text-text-primary group-hover:text-accent transition-colors leading-tight line-clamp-2">
              {manga.title}
            </h2>
          </Link>
          {manga.description && (
            <p className="text-xs sm:text-sm text-text-secondary line-clamp-3 leading-relaxed mt-2.5">
              {manga.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 mt-4 pt-2">
          <p className="text-xs font-semibold text-text-muted">
            {[manga.format, manga.latestChapter].filter(Boolean).join(" · ")}
          </p>
          <Link
            href={href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-bold text-xs shadow-xs hover:bg-accent-hover active:scale-95 transition-all"
            aria-label={`Lihat komik ${manga.title}`}
          >
            <BookOpen size={16} weight="bold" />
            <span>Lihat komik</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- editorial-spotlight`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/app/editorial-spotlight.tsx src/components/app/__tests__/editorial-spotlight.test.tsx
git commit -m "feat(home): redesign EditorialSpotlight card with cursive title and Yomirra Ink surface"
```

---

### Task 5: Top 5 Leaderboard Panel Redesign (`LeaderboardRow`)

**Files:**
- Modify: `src/components/manga/card/leaderboard-row.tsx`
- Modify: `src/components/app/home-feed-client.tsx`
- Test: `src/components/manga/card/__tests__/leaderboard-row.test.tsx`

**Interfaces:**
- Consumes: `manga: MangaItem & { rank?: number }`, `sourceId: string`
- Renders:
  - Header: `Paling banyak dibaca` with `Lihat semua ->` link to `/popular`
  - 5 Rows:
    - Number rank: `01` (red), `02` (orange), `03` (amber), `04`, `05` (text-muted)
    - Thumbnail: 36x48px squircle with subtle border
    - Title: Bold truncate
    - Subtitle: `★ 8.6 · Chapter 912`

- [ ] **Step 1: Write test for LeaderboardRow with ranked numbers and score**

Create or update `src/components/manga/card/__tests__/leaderboard-row.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import { LeaderboardRow } from "../leaderboard-row";
import { describe, it, expect } from "vitest";

describe("LeaderboardRow Component", () => {
  it("renders padded rank number (01) and score with star", () => {
    render(
      <LeaderboardRow
        manga={{ id: "de", title: "Demonic Emperor", rank: 1, score: 8.6, latestChapter: "Chapter 912" }}
        sourceId="shinigami"
      />
    );
    expect(screen.getByText("01")).toBeTruthy();
    expect(screen.getByText("Demonic Emperor")).toBeTruthy();
    expect(screen.getByText("8.6")).toBeTruthy();
    expect(screen.getByText(/Chapter 912/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `pnpm test -- leaderboard-row`
Expected: Verification of status.

- [ ] **Step 3: Update LeaderboardRow to match Gambar 1 styling**

In `src/components/manga/card/leaderboard-row.tsx`:
```tsx
"use client";

import Link from "next/link";
import { Star } from "@phosphor-icons/react";
import { MangaCover } from "../manga-cover";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { cn } from "@/shared/utils/cn";
import type { MangaItem } from "@/shared/sources/source-types";

interface LeaderboardRowProps {
  manga: MangaItem & { rank?: number };
  sourceId: string;
}

export function LeaderboardRow({ manga, sourceId }: LeaderboardRowProps) {
  const rank = manga.rank || 1;
  const paddedRank = rank < 10 ? `0${rank}` : String(rank);
  const href = getMangaDetailHref(sourceId, manga.id, "/");

  const rankColor =
    rank === 1
      ? "text-red-500"
      : rank === 2
      ? "text-orange-500"
      : rank === 3
      ? "text-amber-500"
      : "text-text-muted";

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-surface-hover/80 transition-colors"
      aria-label={`Peringkat ${rank}: ${manga.title}`}
    >
      <span className={cn("text-base font-black tracking-tight w-6 shrink-0 text-center", rankColor)}>
        {paddedRank}
      </span>

      <div className="relative w-9 h-12 rounded-[6px] overflow-hidden bg-surface-base border border-border-subtle shrink-0 shadow-xs group-hover:scale-105 transition-transform">
        <MangaCover src={manga.coverUrl} alt={manga.title} iconSize={14} imageClassName="object-cover w-full h-full" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-xs sm:text-[13px] text-text-primary group-hover:text-accent transition-colors truncate">
          {manga.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
          {manga.score !== undefined && Number(manga.score) > 0 && (
            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
              <Star size={11} weight="fill" />
              <span>{Number(manga.score).toFixed(1)}</span>
            </span>
          )}
          {manga.latestChapter && (
            <span className="truncate">{manga.latestChapter}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- leaderboard-row`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/manga/card/leaderboard-row.tsx src/components/manga/card/__tests__/leaderboard-row.test.tsx
git commit -m "feat(home): style LeaderboardRow with padded colorful ranks and star rating"
```

---

### Task 6: Lanjut Baca Redesign with 3-Dot Options & Red Accent Progress (`ContinueReadingList`)

**Files:**
- Modify: `src/components/app/continue-reading-list.tsx`
- Test: `src/components/app/__tests__/continue-reading-list.test.tsx`

**Interfaces:**
- Consumes: `items: HistoryItem[]`
- Renders:
  - Header: `• Lanjut Baca` (red dot) | `10 judul · Lihat rak buku ->` (link to `/bookmark`)
  - 3-column cards:
    - Cover thumbnail on left (`w-14 sm:w-16 aspect-[3/4]`)
    - Source badge: `SHINIGAMI` (caps pill)
    - Options button `...` (`DotsThree` icon)
    - Manga title (bold truncate)
    - Chapter label: `Chapter 180`
    - Progress bar: red accent bar + percentage `99%`

- [ ] **Step 1: Write test for ContinueReadingList card elements**

Create `src/components/app/__tests__/continue-reading-list.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import { ContinueReadingList } from "../continue-reading-list";
import { describe, it, expect, vi } from "vitest";

describe("ContinueReadingList Component", () => {
  const mockItems = [
    {
      sourceId: "shinigami",
      mangaId: "iron-hound",
      mangaTitle: "Revenge Of The Iron-Blooded Sword Hound",
      chapterId: "ch-180",
      chapterTitle: "Chapter 180",
      coverUrl: "https://example.com/cover.jpg",
      progressPercent: 99,
      readAt: new Date().toISOString(),
    },
  ];

  it("renders section header and card with progress bar and options button", () => {
    render(<ContinueReadingList items={mockItems as any} />);
    expect(screen.getByText(/Lanjut Baca/i)).toBeTruthy();
    expect(screen.getByText(/Lihat rak buku/i)).toBeTruthy();
    expect(screen.getByText("Revenge Of The Iron-Blooded Sword Hound")).toBeTruthy();
    expect(screen.getByText("Chapter 180")).toBeTruthy();
    expect(screen.getByText("99%")).toBeTruthy();
    expect(screen.getByRole("button", { name: /opsi/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `pnpm test -- continue-reading-list`
Expected: Status check.

- [ ] **Step 3: Update ContinueReadingList to match Gambar 1**

In `src/components/app/continue-reading-list.tsx`:
Update card markup to include `DotsThree` menu button, source badge, bold title, chapter label, and clean red progress bar with percentage.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- continue-reading-list`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/app/continue-reading-list.tsx src/components/app/__tests__/continue-reading-list.test.tsx
git commit -m "feat(home): redesign ContinueReadingList cards with source pill, progress bar, and options menu"
```

---

### Task 7: Full Beranda Assembly & Regression Verification

**Files:**
- Modify: `src/components/app/home-feed-client.tsx`
- Modify: `src/components/app/home-view.tsx`
- Test: `src/components/app/__tests__/home-feed-client.test.tsx`

**Interfaces:**
- Connect carousel index state in `HomeFeedClient` (`spotlightIndex` cycled by `HomeHeroHeader` prev/next buttons).
- Insert `HomeNavTabs` at top of `HomeView`.
- Assemble `HomeHeroHeader`, `EditorialSpotlight`, `HomeLeaderboardPanel`, `ContinueReadingList`, and `Baru diperbarui`.

- [ ] **Step 1: Write integration test for HomeFeedClient with carousel state**

In `src/components/app/__tests__/home-feed-client.test.tsx`:
Add tests verifying:
- Clicking next/prev buttons changes the active spotlight manga.
- Mode switcher and leaderboard panel are properly rendered.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- home-feed-client`
Expected: FAIL.

- [ ] **Step 3: Implement full assembly in HomeFeedClient and HomeView**

Integrate `HomeNavTabs`, carousel index cycling state, updated `EditorialSpotlight`, and leaderboard container.

- [ ] **Step 4: Run all unit and integration tests**

Run: `pnpm test -- home`
Expected: All tests pass.

- [ ] **Step 5: Full project verification**

Run: `pnpm typecheck`
Expected: Exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/app/home-feed-client.tsx src/components/app/home-view.tsx src/components/app/__tests__/home-feed-client.test.tsx
git commit -m "feat(home): complete Beranda overhaul with editorial spotlight carousel and leaderboard"
```
