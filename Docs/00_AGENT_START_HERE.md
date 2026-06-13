# Yomirra Zero-Base UI/UX Rework — Start Here

This package is the single source of instruction for the next agent pass.

## Main objective

Rework Yomirra’s UI/UX and design language from zero, based on actual repository inspection, not screenshots alone.

The previous UI direction still looks like a pale Android/Material-style web app. The next pass must rebuild the product language into:

**Premium iOS-native manga reader × cinematic editorial media app × Yomirra Deep Lagoon identity.**

## Non-negotiable rule

Do not start by styling screenshots.

Start by scanning the repository file-by-file and producing an evidence map.

The agent must inspect the real implementation:

- routes
- shells
- UI primitives
- manga cards
- reader components
- store/data flow
- image handling
- cache/PWA setup
- tokens
- responsive behavior
- accessibility behavior

## Read order

1. `01_MASTER_PROMPT_ZERO_BASE_REWORK.md`
2. `02_REPOSITORY_SCAN_PROTOCOL.md`
3. `03_YOMIRRA_DESIGN_LANGUAGE.md`
4. `04_COMPONENT_REWORK_SPEC.md`
5. `05_PAGE_REWORK_SPEC.md`
6. `06_PWA_CACHE_IMAGE_PLAN.md`
7. `07_ACCEPTANCE_CHECKLIST.md`

## Execution rule

The agent may heavily restructure UI composition, but must not rewrite product logic unless necessary and explicitly reported.

Allowed:
- UI structure
- visual hierarchy
- shell composition
- page layout
- search/tabs/nav/card component design
- tokens and variants
- surface/elevation system
- responsive layout

Protected:
- source adapter behavior
- manga fetch contracts
- readlist/history/bookmark store logic
- auth/session logic
- local/cloud sync logic
- reader navigation logic
- API route contracts
- route semantics

## Completion rule

Do not call the rework complete unless the result no longer resembles:

- Android Material 2018
- generic shadcn demo
- pale teal admin dashboard
- Tachiyomi clone
- flat mobile PWA form app
- same template across all pages
