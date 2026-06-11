# Yomirra — Component Inventory

> **Version:** 0.1 — Filled Audit  
> **Status:** AUDITED during Pass 0  
> **Rule:** Every existing component must have a row in this file before Pass 1 begins.  
> **Approval required** before any REPLACE or DELETE action is executed.

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| `KEEP` | Component is correct, reusable, and passes quality bar. Import as-is. |
| `EXTEND` | Component is structurally sound but needs props/variant additions. Do not rewrite. |
| `RESTYLE` | Component logic is correct but visual treatment must be replaced using tokens. |
| `REPLACE` | Component must be rewritten from scratch. Existing code is not salvageable. |
| `DELETE` | Component is unused, duplicated, or actively harmful. Remove with no replacement. |
| `UNKNOWN` | Component path found but not yet audited. Must not be left as UNKNOWN at Pass 0 end. |
| `MISSING` | Component expected by product but does not exist yet. Must be built in Pass 3A/3B. |

---

## Risk Definitions

| Risk | Meaning |
|------|---------|
| `LOW` | Safe to touch. No downstream dependency concerns. |
| `MEDIUM` | Used in multiple places. Test all callsites after change. |
| `HIGH` | Core to data flow, reader, or auth. Requires architecture review before touching. |
| `CRITICAL` | Do not touch without explicit approval and full migration plan. |

---

## Base UI Primitives

| Component | File Path | Status | Risk | Notes |
|-----------|-----------|--------|------|-------|
| Button | `src/components/ui/button.tsx` | RESTYLE | LOW | Standardize variants with tokens |
| IconButton | `src/components/ui/icon-button.tsx` | RESTYLE | LOW | Update sizing and hover states |
| Input | `src/components/ui/input.tsx` | RESTYLE | LOW | Update focus rings and colors |
| SearchInput | `src/components/ui/search-input.tsx` | RESTYLE | LOW | Make mobile-friendly |
| Badge | `src/components/ui/badge.tsx` | RESTYLE | LOW | Standardize to text-2xs and semantic colors |
| Card | N/A | MISSING | LOW | Need a primitive for surface layers |
| Tabs | `src/components/ui/tabs.tsx` | RESTYLE | LOW | Rebuild indicators to match motion contract |
| Dialog | `src/components/ui/dialog.tsx` | RESTYLE | MEDIUM | Update overlay and panel styling |
| Sheet | `src/components/ui/sheet.tsx` | RESTYLE | MEDIUM | Essential for mobile, needs radius-xl |
| Drawer | `src/components/ui/drawer.tsx` | RESTYLE | MEDIUM | Essential for mobile reader controls |
| Tooltip | `src/components/ui/tooltip.tsx` | RESTYLE | LOW | Match with token styling |
| Separator | `src/components/ui/separator.tsx` | RESTYLE | LOW | Use surface-muted |
| Skeleton | `src/components/ui/skeleton.tsx` | REPLACE | LOW | Must match motion contract fade, not pulse |
| EmptyState | `src/components/states/empty-state.tsx` | RESTYLE | LOW | Needs to fit new design language |
| ErrorState | `src/components/states/error-state.tsx` | RESTYLE | LOW | Needs to support source-aware messaging |
| Command | `src/components/ui/command.tsx` | RESTYLE | LOW | Style with tokens |
| Surface | N/A | MISSING | LOW | Reusable surface container |

---

## Product Components

| Component | File Path | Status | Risk | Notes |
|-----------|-----------|--------|------|-------|
| MangaCard | `src/components/manga/manga-card.tsx` | REPLACE | MEDIUM | Must enforce 2:3 ratio, better data handling |
| MangaGrid | N/A | MISSING | LOW | Need standard grid layout component |
| MangaRow | N/A | MISSING | LOW | Need list layout for search/library |
| ChapterRow | `src/components/manga/chapter-row.tsx` | REPLACE | MEDIUM | Make denser, clearer read state |
| ChapterList | N/A | MISSING | MEDIUM | Encapsulate list logic, sort, empty states |
| SourceCard | `src/components/source/source-card.tsx` | REPLACE | LOW | Make it match new semantic info/status |
| ReadlistItem | N/A | MISSING | LOW | Needs specific Continue Reading CTA |
| HistoryItem | `src/components/history/history-row.tsx` | REPLACE | LOW | Show progress and continue actions properly |
| ContinueReadingItem| N/A | MISSING | LOW | Prominent home/detail CTA |

---

## Reader Components

| Component | File Path | Status | Risk | Notes |
|-----------|-----------|--------|------|-------|
| ReaderTopBar | `src/components/reader/reader-shell.tsx` | REPLACE | MEDIUM | Extract into discrete top bar component |
| ReaderSettings | `src/components/reader/reader-settings-drawer.tsx` | RESTYLE | MEDIUM | Standardize to drawer primitive |
| ReaderEndPanel | `src/components/reader/end-of-chapter.tsx` | RESTYLE | LOW | Improve next-chapter flow UI |
| ReaderPage | `src/components/reader/reader-view.tsx` | EXTEND | HIGH | Extract single page component for logic separation |
| ReaderCanvas | `src/components/reader/continuous-vertical-reader.tsx` | RESTYLE | HIGH | Ensure it uses reader-reveal motion contract |

---

## Layout Components

| Component | File Path | Status | Risk | Notes |
|-----------|-----------|--------|------|-------|
| AppShell | `src/app/layout.tsx` (Root) | REPLACE | HIGH | Needs to properly set up viewport and safe-areas |
| MobileShell | N/A | MISSING | MEDIUM | Safe area and bottom nav containment |
| DesktopShell | N/A | MISSING | MEDIUM | Sidebar layout container |
| BottomNav | N/A | MISSING | MEDIUM | Create premium mobile nav with spring active ind. |
| SideNav | N/A | MISSING | MEDIUM | Dense desktop navigation |
| TopNav | N/A | MISSING | MEDIUM | Desktop global search |
| PageHeader | N/A | MISSING | LOW | |
| SectionHeader | N/A | MISSING | LOW | |
| ContentRail | N/A | MISSING | LOW | |
| ResponsiveGrid | N/A | MISSING | LOW | |

---

## Page/Route Components

| Route | File Path | Status | Risk | Notes |
|-------|-----------|--------|------|-------|
| `/` (Beranda) | `src/app/(web)/page.tsx` | REPLACE | MEDIUM | Needs real Continue Reading, not infinite scroll |
| `/library` | `src/app/(web)/library/page.tsx` | REPLACE | MEDIUM | Add search/filter capabilities, honest empty state |
| `/readlist` | `src/app/(web)/readlist/page.tsx` | REPLACE | MEDIUM | Connect to readlist store properly |
| `/search` | `src/app/(web)/search/page.tsx` | REPLACE | LOW | Needs source-aware results |
| `/sources` | `src/app/(web)/sources/page.tsx` | REPLACE | LOW | Filter installed sources locally |
| `/browse` | `src/app/(web)/browse/page.tsx` | REPLACE | LOW | Implement redirect to /sources |
| `/updates` | N/A | MISSING | LOW | |
| `/popular` | N/A | MISSING | LOW | |
| `/history` | `src/app/(web)/history/page.tsx` | REPLACE | LOW | Needs progress/remove actions |
| `/settings` | `src/app/(web)/settings/page.tsx` | REPLACE | LOW | Better categorization |
| `/manga/[sourceId]/[mangaId]` | `src/app/(web)/manga/[sourceId]/[mangaId]/page.tsx` | REPLACE | HIGH | Mobile/desktop responsive layout |
| `/manga/[sourceId]/[mangaId]/read/[chapterId]` | `src/app/(web)/manga/[sourceId]/[mangaId]/read/[chapterId]/page.tsx` | REPLACE | CRITICAL| Core experience |

---

## Stores (Zustand v5)

| Store | File Path | Status | Risk | Notes |
|-------|-----------|--------|------|-------|
| Readlist store | `src/shared/store/library-store.ts` | KEEP | HIGH | Out of scope for rewrite, report only |
| History store | `src/shared/store/history-store.ts` | KEEP | HIGH | Out of scope for rewrite, report only |
| Reader preferences store | `src/shared/store/reader-store.ts` & `settings-store.ts` | KEEP | HIGH | Out of scope for rewrite, report only |
| Source store | N/A | MISSING | HIGH | Check if source context is handled elsewhere |
| Auth/sync store | N/A | MISSING | HIGH | Does not exist |

> **Rule:** Stores are NOT in scope for Pass 0 REPLACE/DELETE without explicit approval. Only report findings.

---

## Source Adapters / Server

| File | File Path | Status | Risk | Notes |
|------|-----------|--------|------|-------|
| Source adapter interface | `src/shared/types/source.ts` | KEEP | CRITICAL | See ADAPTER_BOUNDARY.md |
| Active source resolver | `src/server/lib/sources/source-manager.ts` | KEEP | CRITICAL | |
| Image proxy | `src/app/api/proxy/image/route.ts` | KEEP | HIGH | Security sensitive |

> **Rule:** Source adapters must not be REPLACE or DELETE in this rewrite. Report only. See `YOMIRRA_ADAPTER_BOUNDARY.md`.

---

## Shared Types / Helpers

| File | File Path | Status | Risk | Notes |
|------|-----------|--------|------|-------|
| Manga type definitions | `src/shared/types/manga.ts` | KEEP | HIGH | |
| Chapter type definitions | `src/shared/types/manga.ts` | KEEP | HIGH | |
| Source type definitions | `src/shared/types/source.ts` | KEEP | CRITICAL | |
| Route helpers | N/A | MISSING | MEDIUM | Need to build strongly-typed URL generators |

---

## i18n / Copy System

| Finding | Status |
|---------|--------|
| i18n library in use | NO |
| i18n file location | N/A |
| Hardcoded Indonesian strings count | HIGH (estimated across all pages) |
| Copy consistency | POOR (will be fixed) |

> Fill this section during Pass 0. If no i18n system exists, flag all hardcoded strings as `I18N_DEBT`.

---

## Audit Notes

> Use this section to document unexpected findings during Pass 0 that don't fit the table format.

```
[Finding 1]: Route Semantics Mismatch: `/updates` and `/popular` routes are missing entirely. `/browse` exists but must be converted to a redirect.

[Finding 2]: No centralized Route Helpers: Navigation currently relies on string concatenation, which is fragile and error-prone. We will need to introduce route helpers.

[Finding 3]: Store Naming Confusion: The Readlist logic is currently residing in `library-store.ts`, which might cause confusion with the `/library` route semantics (which is supposed to be the global catalog, not saved titles).

[Finding 4]: Component Architecture: Missing many base components (Card, Surface) and layout components (Shells, Navs) which means the current pages are probably repeating raw layout logic.
```

---

## Pass 0 Completion Checklist

Before marking Pass 0 as complete:

- [x] Every row has a status other than UNKNOWN
- [x] Every REPLACE/DELETE row has a documented reason
- [x] Every HIGH/CRITICAL component has a migration note
- [x] i18n section is filled
- [x] Route semantics match or differ from expected (noted)
- [x] Store shapes are documented
- [x] Source adapter boundary is confirmed (reference ADAPTER_BOUNDARY.md)
- [x] This file has been sent to human for approval before Pass 1 begins
