# Yomirra — Full UI/UX Rewrite From Zero [MangaReader-Apps](directory;file:///c%3A/Users/Hafizh%20Rizqullah/Documents/Code/MangaReader-Apps)

# Skills: context × context × Huashu Design

# Product-Level Redesign, Not Cosmetic Polish

---

## Before Doing Anything — Mandatory Setup Sequence

Execute in this exact order. Do not skip or reorder.

**1.** Read the global Antigravity rules. [user_global](rule;user_global)  
**2.** Read the project-level `GEMINI.md`. [GEMINI.md](rule;file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/MangaReader-Apps/GEMINI.md)  
**3.** Read all four supporting constraint docs — these are binding:

- `YOMIRRA_DESIGN_TOKENS.md` — color, typography, spacing, shape anchor values. Do not invent values not in this file.
- `YOMIRRA_MOTION_CONTRACT.md` — animation timing and easing budget. Do not invent durations.
- `YOMIRRA_COMPONENT_INVENTORY.md` — audit template. Fill this completely during Pass 0 before Pass 1 begins.
- `YOMIRRA_ADAPTER_BOUNDARY.md` — exact boundary of what may and may not be touched in source adapter / server code.

**4.** Inspect the actual codebase using file system tools. Do not reason from memory.  
**5.** Inspect available agent skills.  
**6.** Use these skills as mandatory review lenses:

- `grill-me` context
- `ui-ux-promax` context
- `huashu-design` context

**7.** If any of these skills are missing and the repo provides `skills.sh`, inspect the script first, then install only the required local agent skills through `skills.sh`.  
**8.** Do not install npm/pnpm dependencies unless explicitly approved.  
**9.** Do not hallucinate. See Section 17 and Section 18 for the anti-hallucination contract.  
**10.** Do not preserve bad UI just because it exists.  
**11.** Do not break working product logic.

---

## 0. Meaning of "Rewrite From Zero"

"Rewrite from zero" means:

- rebuild the UI/UX layer from first principles;
- redesign page layouts;
- redesign component composition;
- redesign responsive behavior;
- redesign reader UI;
- redesign empty/loading/error states;
- redesign skeletons;
- redesign motion language;
- redesign copy hierarchy;
- rebuild reusable UI components where needed.

It does NOT automatically mean:

- rewriting backend/source adapters;
- changing API contracts;
- deleting stores;
- changing route semantics;
- changing database/auth/cloud sync;
- replacing the stack;
- installing new libraries;
- breaking existing working product flows.

Backend/API/source/reader logic may be touched only when UI cannot function correctly without a change. Before making any such change, consult `YOMIRRA_ADAPTER_BOUNDARY.md` for the exact allowed/not-allowed boundary. If the required change is listed as NOT ALLOWED, stop and submit an Adapter Change Request — do not work around it.

If a deeper architecture change is required beyond what `YOMIRRA_ADAPTER_BOUNDARY.md` permits, stop and ask for approval.

---

## 1. Mandatory Skill Usage

Use the skills as follows:

### Grill Me

Use this as the harsh critique layer.

Grill every weak surface:

- generic layout;
- fake premium styling;
- inconsistent spacing;
- noisy animation;
- bad hierarchy;
- raw controls;
- fake states;
- poor mobile behavior;
- desktop squeezed into mobile;
- cheap MangaDex copying;
- unreadable reader surfaces;
- dead buttons;
- duplicated styling;
- non-reusable components.

Do not be polite to bad UI. Identify why it is bad and what must replace it.

### UI-UX Promax

Use this as the product usability layer.

Evaluate:

- user flow;
- screen purpose;
- primary action;
- content hierarchy;
- information density;
- navigation clarity;
- empty/error/loading states;
- responsive behavior;
- accessibility;
- interaction feedback;
- conversion from search to reading.

Every screen must answer:

- what is this screen for?
- what should the user do next?
- what data state is this screen in?
- what happens when the source fails?
- how does user continue reading?

### Huashu Design

Use this as the visual composition and premium aesthetic layer.

Apply:

- strong composition;
- disciplined spacing;
- clean information hierarchy;
- refined card systems;
- premium manga/manhwa browsing feel;
- soft mobile-native surfaces;
- editorial desktop density;
- elegant reader chrome;
- quiet motion;
- readable contrast;
- non-generic component styling.

Do not copy any specific product blindly.

---

## 2. Product Identity Lock

Yomirra is:

- Tachiyomi-like first;
- MangaDex-inspired second;
- Yomirra-original always.

Tachiyomi-like means:

- source-aware manga reader;
- active source;
- search titles;
- library catalog;
- readlist/bookmarks;
- history;
- continue reading;
- chapter list;
- reader preferences;
- webtoon/horizontal reader modes;
- progress tracking;
- source failure handling.

MangaDex-inspired means:

- desktop density;
- sidebar/topbar structure;
- detail page structure;
- reader side panel idea;
- scan-friendly catalogue/list layouts.

Yomirra must not become:

- MangaDex clone;
- fake community platform;
- generic SaaS dashboard;
- anime fansite;
- random card grid;
- AI-generated template.

---

## 3. Current Route Semantics

Do not change route semantics without approval.

Expected current route semantics:

```txt
/                                      Beranda / featured discovery preview
/library                               Library / global catalog / explore titles
/readlist                              Readlist / saved bookmarked manga
/search                                Title search results
/sources                               Source manager
/browse                                Redirect only to /sources
/updates                               Latest updates
/popular                               Popular titles
/history                               Reading history
/settings                              App / reader preferences
/manga/[sourceId]/[mangaId]            Manga detail
/manga/[sourceId]/[mangaId]/read/[chapterId] Reader
```

If actual code differs from the above, report the exact difference in Pass 0 before changing anything.

---

## 4. Rewrite Goal

Rebuild the interface into a clean, reusable, product-grade system.

The final UI must feel:

- mobile-native;
- desktop-capable;
- manga/manhwa-first;
- premium but quiet;
- readable;
- fast;
- source-aware;
- reusable;
- consistent;
- emotionally distinct from generic manga sites.

The final UI must not feel:

- flat and raw;
- template-like;
- noisy;
- over-glassed;
- copied from MangaDex;
- inconsistent per page;
- patched together;
- desktop squeezed into mobile;
- mobile stretched into desktop.

---

## 5. Design Direction

Design language:

```txt
Dark-first capable.
Light mode must still look intentional.
Soft graphite / clean neutral surfaces.
Strong cover-focused layouts.
Red/accent only for meaningful actions.
Rounded but disciplined shape language.
Premium mobile bottom navigation.
Desktop sidebar/topbar density.
Reader UI that disappears when reading.
Motion that supports feedback, not decoration.
```

**Token anchor values are defined in `YOMIRRA_DESIGN_TOKENS.md`.** Every color, spacing, radius, and shadow decision must trace to a token in that file. Do not invent hex values. Do not use raw Tailwind default color classes (`text-gray-500`, `bg-zinc-900`) when a token equivalent exists.

**Motion timing and easing are defined in `YOMIRRA_MOTION_CONTRACT.md`.** Do not invent durations.

Avoid:

- random gradients;
- default shadcn look;
- neon cyberpunk;
- overblurred glass;
- huge empty hero gimmicks;
- fake stats;
- fake ratings;
- fake comments;
- decorative animation;
- generic "Discover amazing manga" copy.

---

## 6. Full Screen Rewrite Scope

**Global copy/i18n rule:** Before writing any UI copy string, check whether the project has an i18n/localization system (check `package.json` for `next-intl`, `i18next`, `react-i18n`, or similar). If yes, all strings must go through that system. If no i18n system exists, hardcoding Indonesian strings is acceptable for now but every hardcoded string must be flagged with a `// I18N_DEBT` comment. Do not introduce a new i18n system without approval.

### A. App Shell

Rebuild:

- mobile shell;
- desktop shell;
- bottom nav;
- side nav;
- top nav;
- safe area handling;
- viewport handling;
- content spacing;
- fixed element clearance.

Requirements:

- no horizontal overflow;
- no desktop leakage on mobile;
- no double navigation;
- bottom nav feels premium and mobile-native;
- desktop nav is dense but not cluttered;
- active states are clear;
- no debug logs;
- no raw layout hacks.

### B. Beranda

Purpose:

- featured discovery preview;
- continue reading;
- latest/popular preview;
- route into Library for deeper browsing.

Requirements:

- no infinite catalog on Home;
- no fake hero;
- no redundant giant desktop search if top search exists;
- mobile search can be compact;
- continue reading must be real;
- preview sections must use real data;
- "Muat lebih banyak" goes to `/library`.

### C. Library

Purpose:

- global manga/manhwa catalog from active source.

Requirements:

- search;
- latest/popular/all tabs if supported;
- sort/filter only if real — verify source capability flag before rendering;
- no fake tag filter;
- grid/list that feels good on mobile;
- desktop can be denser;
- empty state must not hide API bugs;
- loading skeleton must match final layout.

### D. Readlist

Purpose:

- saved/bookmarked manga.

Requirements:

- real saved data only;
- remove action;
- continue action if real history exists;
- last-read metadata if real;
- empty state routes to Library;
- copy uses Readlist, not Library.

### E. Search

Purpose:

- quick title search results.

Requirements:

- query state in URL;
- useful no-query state;
- source-aware results;
- loading/empty/error states;
- result cards route to detail.

### F. Sources

Purpose:

- source manager.

Requirements:

- source cards;
- active source;
- capabilities;
- status;
- no fake custom source support;
- filtering sources only;
- not manga search.

### G. Updates

Purpose:

- latest updates from source.

Requirements:

- real data;
- no fake timestamp/uploader;
- scan-friendly rows/cards;
- route to detail or reader only when valid.

### H. Popular

Purpose:

- popular discovery.

Requirements:

- real data;
- no fake rank/rating;
- strong cover-focused grid.

### I. Manga Detail

Purpose:

- decide whether to read/save a title.

Requirements:

- cover-focused hero;
- clear title;
- source/status/tags if real — verify from adapter response before rendering;
- synopsis readable;
- CTA stack:
  - Lanjut baca if real history exists;
  - Mulai baca if chapters exist;
  - Masuk/Tersimpan di readlist;
- chapter list;
- read state only if real;
- no fake comments/ratings/upload/report.

Mobile must be excellent.
Desktop must be information-dense.

### J. Reader

Purpose:

- read comfortably.

Requirements:

- only real reading modes:
  - Webtoon;
  - Horizontal Scroll;
- no fake modes;
- no fake controls;
- polished top bar;
- settings UI;
- immersive canvas;
- safe area aware;
- page image skeleton/error/retry;
- end-of-chapter panel only at last page;
- no permanent raw bottom controls;
- reader looks connected to rest of Yomirra;
- reader chrome should not compete with manga pages.

### K. History

Purpose:

- real reading activity.

Requirements:

- opened chapters only;
- continue action;
- remove action;
- clear history with confirmation;
- no fake progress.

### L. Settings

Purpose:

- preferences and account/data clarity.

Requirements:

- reader preferences;
- theme if supported;
- auth/sync state if real;
- guest/local data behavior;
- logged-in local-to-cloud semantics;
- no cloud sync overclaim;
- destructive actions require confirmation.

---

## 7. Reusable Component System Rewrite

Rebuild or consolidate reusable components so they are easy to import and reuse.

Before building any new component, check `YOMIRRA_COMPONENT_INVENTORY.md`. If the component has a status of `KEEP` or `EXTEND`, do not rewrite it — work with what exists. If status is `UNKNOWN`, audit it first and update the inventory.

Required component families:

### Base UI Primitives

```txt
Button
IconButton
Input
SearchInput
Command
Badge
Card
Surface
Tabs
Dialog
Sheet
Drawer
Tooltip
Separator
Skeleton
EmptyState
ErrorState
```

### Product Components

```txt
MangaCard
MangaGrid
MangaRow
ChapterRow
ChapterList
SourceCard
ReadlistItem
HistoryItem
ContinueReadingItem
ReaderTopBar
ReaderSettings
ReaderEndPanel
ReaderPage
```

### Layout Components

```txt
AppShell
MobileShell
DesktopShell
BottomNav
SideNav
TopNav
PageHeader
SectionHeader
ContentRail
ResponsiveGrid
```

Rules:

- components must be reusable;
- components must not secretly fetch unless designed as data components;
- presentational components should be pure where possible;
- route helpers must be used for navigation;
- variants must be tokenized — use `YOMIRRA_DESIGN_TOKENS.md` values;
- no repeated page-level button/card styles;
- no raw colors in pages;
- no duplicate component behavior.

---

## 8. Proposed Architecture Separation

During audit, propose a clean separation that fits the existing repo.

Do not move files yet unless this prompt is explicitly followed by approval.

Target separation concept:

```txt
backend/server/api/source-adapter concerns separate from UI
frontend route screens separate from reusable components
mobile-specific responsive UI isolated where necessary
components/design system centralized
shared types/helpers/stores/hooks centralized
feature modules grouped logically
```

You may propose folders such as:

```txt
src/app
src/features
src/components/ui
src/components/layout
src/components/product
src/components/reader
src/server
src/shared
src/styles
```

But do not force this exact structure if the existing repo has a safer convention.

For every proposed move, explain:

- why;
- what breaks if moved carelessly;
- migration order;
- compatibility alias needed or not;
- whether it should be done now or later.

---

## 9. Mobile-First Requirement

Mobile is not optional.

Fix and redesign around:

- iOS Safari;
- Android Chrome;
- 360px width;
- 390px width;
- safe-area insets;
- browser toolbar interference;
- bottom nav;
- reader controls;
- tap targets (minimum 44×44px);
- horizontal overflow;
- viewport config.

No screen may rely on desktop layout to be usable.

---

## 10. State Quality Requirement

Every async/data screen must have:

- loading state;
- empty state;
- error state;
- retry where relevant;
- skeleton where appropriate;
- source-aware error messaging.

Do not hide API failure behind "Manga tidak ditemukan".

Empty means truly no data.
Error means failed to fetch.
Unsupported filter means unsupported filter.

These must not be mixed.

---

## 11. Motion and Skeleton Requirement

**All motion timing and easing must come from `YOMIRRA_MOTION_CONTRACT.md`.** Do not invent durations or easing values. If a component's motion does not map to a named tier in the contract, stop and propose a new tier rather than using a raw number.

Motion must be:

- subtle;
- purposeful;
- reduced-motion aware (use `useReducedMotion()` from Framer Motion);
- not noisy;
- not looping without reason.

Skeleton must:

- match final layout;
- prevent layout shift;
- use tokens from `YOMIRRA_DESIGN_TOKENS.md`;
- not be generic grey blocks;
- not be full-page spinner where layout skeleton is better.

Prioritize:

- skeleton-to-content;
- reader page image reveal;
- bottom nav active;
- search/command interaction;
- readlist toggle;
- reader panel/end panel.

Avoid:

- grid-wide stagger (more than 6 items);
- bouncing icons;
- constant pulsing;
- decorative page transitions;
- flashy reader effects.

---

## 12. Security / Data Honesty Must Stay Intact

Even though this is a UI/UX rewrite, do not ignore security and data honesty.

Check:

- image proxy safety;
- raw HTML/content injection;
- external image handling;
- localStorage data;
- auth/sync claims;
- Firebase env state;
- destructive actions;
- source API failures.

Do not create UI that claims:

- sync works if it does not;
- filters work if they do not — check source capability flag;
- cloud data is safe if rules are unknown;
- delete local data affects cloud or vice versa unless verified.

---

## 13. Implementation Style

This is a big rewrite, so do not implement everything in one giant uncontrolled patch.

Work in passes.

Before implementation, return a plan.

After approval, implement pass by pass.

**Pass order:**

```txt
Pass 0  — Audit and visual/product teardown
          Fill YOMIRRA_COMPONENT_INVENTORY.md completely.
          Await human approval before Pass 1.

Pass 1  — Design tokens and component grammar
          Implement YOMIRRA_DESIGN_TOKENS.md into globals.css.
          Verify @theme{} tokens render correctly.

Pass 2  — App shell and mobile viewport
          Mobile shell, desktop shell, bottom nav, safe area.

Pass 3A — Base UI Primitives + Layout Components
          Button, Input, Skeleton, EmptyState, ErrorState,
          AppShell, BottomNav, SideNav, TopNav, etc.

Pass 3B — Product Components + Reader Components
          MangaCard, MangaGrid, ChapterRow, ChapterList,
          ReaderTopBar, ReaderSettings, ReaderEndPanel, ReaderPage.

Pass 4  — Home / Library / Search / Sources

Pass 5  — Manga Detail / Chapter List

Pass 6  — Reader UX rewrite

Pass 7  — Readlist / History / Settings

Pass 8  — Skeleton / Motion / Empty / Error states
          Full reduced-motion audit.
          Verify YOMIRRA_MOTION_CONTRACT.md compliance.

Pass 9  — Security/data honesty cleanup

Pass 10 — Verification and changelog
```

Do not skip Pass 0.

**Component Inventory Approval Gate:** After Pass 0 audit, submit the filled `YOMIRRA_COMPONENT_INVENTORY.md` for approval. Do not begin Pass 1 until the inventory is approved. Every REPLACE and DELETE decision must have a documented reason reviewed by a human.

---

## 14. Pass 0 Output Required First

Before coding, return this:

```md
# Yomirra UI/UX Rewrite Plan

## Brutal Executive Verdict

What is wrong with the current UI and why it needs a rewrite.

## Product Alignment Check

Tachiyomi-first:
MangaDex-second:
Yomirra-original:

## Current UI Failure Points

List the worst UI/UX issues.

## Route Semantics Verification

For each expected route, state:

- Expected path
- Actual file path found
- Match / Mismatch
- Notes if mismatch

## Component Inventory Summary

Reference the filled YOMIRRA_COMPONENT_INVENTORY.md.
Summarize counts: KEEP / EXTEND / RESTYLE / REPLACE / DELETE / MISSING.
Flag any CRITICAL risk components.

## i18n / Copy Status

- i18n system found: YES / NO
- Library: [name or NONE]
- Hardcoded string count estimate
- I18N_DEBT flag policy: will use // I18N_DEBT comment on all hardcoded strings

## Screen-by-Screen Redesign Plan

For each route:

- current issue;
- target experience;
- components needed;
- data dependency;
- risk.

## Component System Plan

- primitives;
- product components;
- layout components;
- reader components;
- state components.

## Mobile Plan

- viewport;
- safe area;
- bottom nav;
- reader;
- touch behavior.

## Reader Rewrite Plan

- mode simplification;
- reader canvas;
- top bar;
- settings;
- end-of-chapter;
- page loading/error;
- progress.

## Visual Direction

- Reference: YOMIRRA_DESIGN_TOKENS.md confirmed read
- Reference: YOMIRRA_MOTION_CONTRACT.md confirmed read
- Any token gaps or proposed additions

## Architecture Separation Plan

- FE routes/screens;
- BE/API/source;
- Mobile;
- Components;
- Shared utilities/stores/hooks.

## Adapter Boundary Notes

Any source adapter findings. Note every place where UI currently violates or almost violates the boundary defined in YOMIRRA_ADAPTER_BOUNDARY.md.

## Security and Data Honesty Notes

Anything that UI must not lie about.

## Implementation Passes

Pass-by-pass plan with:

- files likely affected;
- acceptance criteria;
- risk;
- approval needed.

## Approval Gate

Reply PROCEED to implement Pass 1, or revise the plan.
Note: PROCEED must come from the human reviewer, not auto-generated.
```

Do not implement before this plan is approved.

---

## 15. Hard Forbidden Shortcuts

Never:

- simply change colors and call it a rewrite;
- copy MangaDex UI one-to-one;
- render fake filters — always verify source capability flag first;
- render fake reader controls;
- render fake sync/cloud state;
- hide errors as empty states;
- create one-off page styles everywhere;
- ignore mobile viewport bugs;
- ignore reader UX;
- ignore accessibility;
- ignore reusable components;
- ignore security;
- perform huge file moves without a migration plan;
- say "complete" because pages look different;
- report a component as done without verifying it renders at 360px width;
- assume a component exists without finding its actual file path;
- use a hex value not in `YOMIRRA_DESIGN_TOKENS.md`;
- use an animation duration not in `YOMIRRA_MOTION_CONTRACT.md`;
- begin Pass 1 before `YOMIRRA_COMPONENT_INVENTORY.md` is filled and approved;
- auto-proceed past an approval gate.

---

## 16. Quality Bar

This rewrite is successful only if:

- every screen has a clear purpose;
- every primary action is obvious;
- every data state is honest;
- every reusable component is easy to import;
- mobile feels native;
- desktop feels intentional;
- reader feels special and comfortable;
- Yomirra looks like one product, not separate experiments;
- no fake feature appears;
- lint/typecheck/build pass after implementation;
- limitations are documented honestly;
- every color and spacing value traces to a token in `YOMIRRA_DESIGN_TOKENS.md`;
- every animation traces to a tier in `YOMIRRA_MOTION_CONTRACT.md`;
- reduced motion is respected across the entire UI.

---

## 17. Anti-Hallucination Contract

This section defines what the agent must verify from the codebase versus what it must not assume.

### 17.1 Verify Before Claiming

| If asked about...    | Agent must...                                                            |
| -------------------- | ------------------------------------------------------------------------ |
| Component existence  | Find the actual file path with `find` or `grep`. Do not assume.          |
| Route file location  | Find the actual `page.tsx` or `route.ts` file. Do not assume.            |
| Store shape          | Read the Zustand store file. Do not assume field names.                  |
| Source capabilities  | Read the source adapter or capability flag type. Do not assume.          |
| Package availability | Check `package.json`. Do not assume a library is installed.              |
| i18n system          | Check `package.json` and import statements. Do not assume.               |
| Token definitions    | Check `globals.css` or `tailwind.config.ts`. Do not assume tokens exist. |
| Image proxy behavior | Read the proxy route handler. Do not assume it works a certain way.      |
| Auth state shape     | Read the auth store or provider. Do not assume field names.              |

### 17.2 Null Assertion Rules

If any of the following is true, STOP and report instead of proceeding:

- A component expected by the plan cannot be found in the codebase → report as MISSING in inventory
- A route expected by the plan does not match actual file structure → report the mismatch in Pass 0
- A Zustand store does not have the expected shape → report the actual shape, do not reshape without approval
- A source capability flag does not exist → do not render the UI that depends on it; report the gap
- `YOMIRRA_DESIGN_TOKENS.md` has not been read → stop; read it before writing any styled code
- `YOMIRRA_ADAPTER_BOUNDARY.md` has not been read → stop; read it before touching any non-UI file
- `YOMIRRA_COMPONENT_INVENTORY.md` is not filled → stop; do not begin Pass 1

### 17.3 Ground Truth Hierarchy

When information conflicts, trust sources in this order:

1. Actual codebase files (highest authority)
2. `GEMINI.md` project rules
3. Supporting docs (`DESIGN_TOKENS`, `MOTION_CONTRACT`, `ADAPTER_BOUNDARY`, `COMPONENT_INVENTORY`)
4. This prompt
5. Agent reasoning / prior knowledge (lowest — always verify against above)

If the codebase contradicts this prompt, report the conflict. Do not silently resolve it.

### 17.4 Pass Completion Standard

A pass is only complete when:

- All changed files compile without TypeScript errors
- All changed files pass the lint rules defined in `GEMINI.md`
- The UI renders at 360px width on mobile without horizontal overflow
- Every new component can be imported by another component without circular dependency
- No `console.error` or `console.warn` in the browser related to new code
- Human reviewer has acknowledged completion

Do not self-declare a pass as DONE. Report completion criteria results and wait for acknowledgment.

---

## 18. Verification Protocol

Before writing any code in any pass:

```
1. What file am I changing?
   → State the exact path. If unknown, find it first.

2. What does the current file do?
   → Read it. Summarize its current behavior in 1-2 sentences.

3. What am I changing and why?
   → State the change and its reason in the plan.

4. What could break?
   → List all known callsites/consumers of this file.

5. Is this change in scope?
   → If it touches adapter/server/store/auth: check YOMIRRA_ADAPTER_BOUNDARY.md first.

6. Do I have approval?
   → For REPLACE/DELETE: approval required.
   → For RESTYLE/EXTEND: proceed if in current pass scope.
```

Skipping this protocol and writing code immediately is a violation.
