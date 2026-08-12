# Design — Yomirra Design System

> **Palette:** Midnight Indigo · **Mode:** Dark-first, light available · **Token source:** `src/app/(web)/globals.css`

This document describes the current public design contract. `globals.css` is the source of truth for token values; canonical components are the source of truth for component-specific spacing and behavior.

## 1. Design Principles

- **Mobile-first:** primary interaction and content consumption are optimized for mobile without treating desktop as an afterthought.
- **Dark-first:** dark mode is the primary visual direction; light mode is supported through the same semantic tokens.
- **Webtoon-aware:** reading and manga discovery prioritize vertical consumption, clear hierarchy, and stable media layouts.
- **Glass as an accent:** translucent surfaces are appropriate for navigation, overlays, and selected floating surfaces rather than every content container.
- **Accessible interaction:** interactive controls should preserve readable contrast, semantic state, keyboard behavior where relevant, and practical touch targets.
- **Token-led styling:** prefer semantic surface/text/border/accent classes over raw color values in feature code.
- **Canonical seams:** repeated UI chrome belongs in shared components; feature-specific structure remains in the owning feature.

## 2. Color Tokens

### Dark theme

| Token | Current value | Typical use |
| --- | --- | --- |
| `--surface-base` | `#000000` | deepest application background |
| `--surface-raised` | `#0A0A14` | raised content surface |
| `--surface-overlay` | `#111122` | elevated panels/overlays |
| `--surface-muted` | `#1A1A2E` | muted controls and skeletons |
| `--surface-hover` | `#1F1F3D` | interaction hover state |
| `--surface-glass` | `rgba(17, 17, 34, 0.70)` | translucent navigation/overlay surfaces |
| `--text-primary` | `#FDFDFD` | primary text |
| `--text-secondary` | `#D1D1D6` | secondary text |
| `--text-muted` | `#98989D` | metadata/captions |
| `--color-accent` | `#6C6AFA` | primary indigo accent |
| `--color-accent-dim` | `rgba(108, 106, 250, 0.15)` | subtle accent fill |
| `--color-accent-hover` | `#8A88FF` | accent hover state |
| `--color-semantic-success` | `#32D74B` | success |
| `--color-semantic-warning` | `#FF9F0A` | warning |
| `--color-semantic-error` | `#FF453A` | error/destructive |
| `--color-semantic-info` | `#6C6AFA` | informational accent |

### Light theme

| Token | Current value |
| --- | --- |
| `--surface-base` | `#FAFAFC` |
| `--surface-raised` | `#F2F2F7` |
| `--surface-overlay` | `#FFFFFF` |
| `--surface-muted` | `#EAEAEB` |
| `--surface-hover` | `#E5E5EA` |
| `--surface-glass` | `rgba(255, 255, 255, 0.70)` |
| `--text-primary` | `#1C1C1E` |
| `--text-secondary` | `#3A3A3C` |
| `--text-muted` | `#6C6C70` |
| `--color-accent` | `#5856D6` |
| `--color-accent-hover` | `#4644B8` |

### Border tokens

| Token | Dark value | Light value |
| --- | --- | --- |
| `--border-subtle` | `rgba(94, 92, 230, 0.2)` | `rgba(88, 86, 214, 0.15)` |
| `--border-default` | `rgba(94, 92, 230, 0.4)` | `rgba(88, 86, 214, 0.3)` |
| `--border-strong` | `rgba(94, 92, 230, 0.6)` | `rgba(88, 86, 214, 0.4)` |
| `--border-glass` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.05)` |

Use the Tailwind mappings (`bg-surface-*`, `text-text-*`, `border-border-*`, `text-accent`, etc.) rather than hard-coding these values in components.

## 3. Typography

Primary UI typography is Plus Jakarta Sans; `font-mono` maps to JetBrains Mono/Fira Code fallback for code-like content.

The current custom Tailwind type scale is:

| Class | Size | Line height | Weight |
| --- | ---: | ---: | ---: |
| `text-2xs` | 10px | 1.4 | 500 |
| `text-xs` | 12px | 1.45 | 400 |
| `text-sm` | 14px | 1.5 | 400 |
| `text-base` | 16px | 1.6 | 400 |
| `text-md` | 18px | 1.4 | 500 |
| `text-lg` | 20px | 1.35 | 600 |
| `text-xl` | 24px | 1.25 | 700 |
| `text-2xl` | 28px | 1.15 | 700 |

Component code can still use standard Tailwind sizes where the canonical component already establishes them. Do not duplicate a component solely to force a slightly different type size.

## 4. Spacing and Radius

The project exposes a 4px-based spacing scale through `@theme` (`1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`) and radius tokens from 4px through 24px plus full pills.

Common intent:

- `rounded-sm` / `rounded-md`: compact controls and cards;
- `rounded-lg`: larger cards/panels;
- `rounded-xl`: prominent drawers/modals;
- `rounded-full`: pills and circular actions.

Canonical components own their internal spacing/radius. Consumer `className` should usually position the component rather than restyle its entire internal contract.

## 5. Layout and Safe Areas

Current layout tokens include:

| Token | Purpose |
| --- | --- |
| `--safe-top` | `env(safe-area-inset-top)` |
| `--safe-bottom` | `env(safe-area-inset-bottom)` |
| `--mobile-header-height` | 56px mobile header baseline |
| `--bottom-nav-content-height` | 64px bottom navigation content |
| `--bottom-nav-height` | bottom navigation + safe bottom |
| `--page-bottom-safe` | bottom navigation + content clearance |

For normal pages using the fixed mobile `PageHeader`, the established content offset pattern is:

```text
pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)]
md:pt-8
```

Do not add a second top offset inside a feature when its parent already accounts for the fixed header.

## 6. PageHeader Pattern

`PageHeader` is the visual contract for section/destination pages:

- mobile: fixed top navigation header, optionally transparent or glass based on scroll/variant;
- desktop: raised hero/section title container;
- supports icon, description, actions, metadata, and optional back navigation.

Feature routes should compose `PageHeader` rather than maintaining separate mobile and desktop title implementations.

## 7. Manga Grid

The canonical `MangaGrid` responsive layout currently uses:

```text
base: 2 columns
sm:   3 columns
md:   4 columns
lg:   5 columns
xl:   6 columns
```

`MangaGridSkeleton` consumes the same `MANGA_GRID_CLASS`. This keeps breakpoint behavior aligned between loading and loaded grids and reduces one class of layout reflow; it is not a claim that page CLS is universally zero.

## 8. Overlay Families

Yomirra intentionally has more than one overlay implementation because their interaction contracts differ.

### Filter drawers

Search and Library filters use Vaul through `FilterDrawerShell`. The shell owns the mobile bottom-sheet chrome, overlay, scrolling, Reset/Apply layout, and safe-area footer.

### Reader panels

Reader chapter/settings overlays use Motion through `ReaderPanelShell` with reader-specific `bottom-dialog` and `side-panel` modes.

Do not combine these families into a universal drawer abstraction just to reduce component count.

## 9. Z-Index Ownership

The global token scale exposes base, raised, dropdown, sticky, drawer, overlay, and toast layers. Canonical shells may own specialized layering internally when required by their established implementation.

Consumers should not override the z-index of `PageHeader`, `FilterDrawerShell`, `Dialog`, or `ReaderPanelShell` casually. If a layering conflict exists, fix it at the canonical shell or token boundary rather than adding competing arbitrary z-index values throughout feature code.

## 10. Motion

Shared motion tokens live in `src/shared/lib/motion/tokens.ts`:

```ts
motionDuration.instant // 0.08
motionDuration.fast    // 0.14
motionDuration.normal  // 0.20
motionDuration.slow    // 0.32
motionDuration.page    // 0.45
```

Common springs include `transitions.snappy`, `transitions.smooth`, and `transitions.gentle`.

Use shared tokens/variants for repeated interaction patterns. A specialized canonical component may own its internal transition (for example `ReaderPanelShell`); consumers should then reuse the shell rather than duplicating or overriding that transition locally.

Respect reduced-motion behavior where the feature exposes animation beyond simple CSS state transitions.

## 11. Glass Surfaces

Glass treatment is appropriate for headers, docks, floating controls, and overlays:

```tsx
<div className="bg-surface-glass backdrop-blur-md border border-border-glass shadow-glass" />
```

Prefer semantic tokens over literal `rgba(...)` values in feature components.

## 12. Media/Cover Rules

Manga cards use `MangaCover` for normal cover behavior. The primitive owns image fallback/loading policy; the card owns geometry and overlays.

Use signed image-proxy URLs in source/reader flows that require them. Do not assume every external cover must pass through the same proxy path.

## 13. Accessibility and Interaction

- Use semantic controls rather than clickable `div`s.
- `IconButton` requires an accessible label.
- Selection/filter pills should expose state (`aria-pressed`) instead of relying on color alone.
- Keep practical touch targets around 44px for primary mobile controls where the design permits.
- Preserve Escape/backdrop/close-button behavior of canonical dialogs/panels.
- Browser smoke tests are required for significant responsive or overlay changes; static type checks cannot verify interaction geometry.
