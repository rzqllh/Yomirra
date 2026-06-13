# Repository Scan Protocol

The next agent must scan files one by one and avoid screenshot-only reasoning.

## Purpose

The previous UI iterations were too shallow because they restyled the visible screens instead of auditing the component architecture.

This protocol forces evidence-based rework.

## Hard rule

No conclusion without file evidence.

If you say a component is generic, duplicated, broken, or old-looking, cite the file and explain why.

## Scan order

### 1. Baseline

Read:

- `package.json`
- `tsconfig.json`
- `next.config.*`
- `components.json`
- `src/app/(web)/globals.css`
- `tailwind.config.*` if present
- `postcss.config.*`

Report:

```md
## Baseline
- Next version:
- React version:
- Tailwind version:
- shadcn setup:
- state/cache libraries:
- PWA/SW libraries:
- image optimization setup:
- test commands:
```

### 2. App routes

Scan `src/app/**`.

Create route inventory:

| Route | File | Purpose | UI shell | Data source | Main components | Issues |
|---|---|---|---|---|---|---|

Minimum:

- `/`
- `/library`
- `/bookmark`
- `/sources`
- `/settings`
- manga detail
- reader
- popular/update pages
- source routes/API routes

### 3. Components

Scan `src/components/**`.

Create component inventory:

| Component | File | Role | Reusable? | Current smell | Action |
|---|---|---|---|---|---|

Required groups:

- app shell/nav/header
- UI primitives
- manga cards
- reader controls
- state components
- page-specific components

### 4. Stores/data

Scan:

- `src/shared/store/**`
- `src/store/**`
- `src/lib/**`
- `src/server/**`
- adapter/source files

Map:

- readlist/bookmark state
- history state
- reader state
- theme/settings state
- source adapter fetch
- API route behavior
- cache behavior
- image proxy/SW/PWA if any

### 5. Style/token scan

Search for:

- raw hex colors
- `text-white`
- arbitrary Tailwind values: `w-[...]`, `h-[...]`, `text-[...]`, `leading-[...]`, `rounded-[...]`, `shadow-[...]`, `z-[...]`
- `calc(...)`
- `env(safe-area...)`
- repeated page spacing
- hard borders
- repeated surface classes
- repeated nav route strings

Classify:

| File | Pattern | Type | Risk | Action |
|---|---|---|---|---|

### 6. Visual language audit

For each main screen, inspect implementation and score:

| Screen | Header | Search | Nav | Cards | Surface | Identity | Mobile | Desktop | Verdict |
|---|---|---|---|---|---|---|---|---|---|

Screens:

- Home
- Library
- Bookmark
- Sources
- Settings
- Detail
- Reader

### 7. Behavior audit

Verify:

- route navigation
- manga card links
- back behavior
- reader → detail/list behavior
- search flow
- source flow
- readlist/bookmark behavior
- history behavior
- theme toggle
- safe area
- mobile 375/390px
- desktop layout
- no horizontal overflow

## Required evidence output

Before coding, produce:

```md
# Yomirra Rework Evidence Map

## Files scanned
...

## Core architecture
...

## UI smells with evidence
...

## Logic protection map
...

## Components to replace
...

## Components to preserve
...

## Risk list
...

## Implementation plan
...
```

## Anti-hallucination rules

Do not:

- invent files
- assume feature behavior from screenshots
- say a flow works without inspecting code or running it
- move routes without reason
- rewrite logic while claiming UI-only
- create duplicate components if existing ones can be safely evolved
- keep old components with new names if structure remains old
