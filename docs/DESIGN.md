# Yomirra Ink — design contract

Source: `src/app/(web)/globals.css` for tokens; `src/components/ui` for controls; `src/components/manga/card` for cards. PR 11 uses the red and warm version of the provided `design-system.html`. The HTML is a visual reference, not a runtime dependency or a source of product data.

## Foundations

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Canvas | `#f7f5f0` | `#05050a` | Page backgrounds |
| Surface | `#ffffff` | `#101118` | Cards and panels |
| Raised | `#ffffff` | `#181924` | Dialogs and menus |
| Text | `#14151a` | `#f5f5f7` | Body and headings |
| Secondary text | `#4f5362` | `#b2b6c7` | Supporting copy |
| Hanko accent | `#9e2a2b` | `#ce6552` | Primary action and active state; dark adjusted for readable text on raised panels |
| Accent foreground | `#ffffff` | `#101118` | Text on solid accent |

Use semantic classes (`bg-surface-*`, `text-text-*`, `text-accent`, `text-accent-on`) so theme changes propagate. Application surfaces use canvas/surface/accent in roughly a 60:30:10 composition; this is a visual budget rather than an exact pixel count. Reader canvas remains independent of app chrome.

Status colors are paired, soft backgrounds and legible foregrounds: `bg-status-success-bg text-status-success-fg`, and corresponding `warning`, `error`, and `info`. Reserve solid semantic colors for existing emphasis or icons. Do not depend on color alone to convey state.

UI font is Plus Jakarta Sans. `ink-display` uses Yuji Boku on editorial headings; `ink-caption` uses Newsreader for ranking numerals. Use those accents sparingly. Body text is 16px where space allows, metadata generally 12–14px. Control/card/panel radii are 12/18/24px. The control target is at least 44px, with visible focus. Browser zoom remains enabled.

## Component entry points

| Need | Canonical entry point |
| --- | --- |
| Action | `Button`, `IconButton` |
| Status | `Badge`; `sonner` toast with `Toaster` |
| Selection | `CustomSelect`, `Choice`, `ToggleSwitch` |
| Numeric input | `RangeSlider` |
| Loading | `Skeleton` (`ink-skeleton`) |
| Dialog | `Dialog` with `DialogContent` |
| Grid book | `ShelfCard`; compact/reading variants in `manga/card` |
| Home highlight | `EditorialSpotlight` |
| Navigation | `TopNav`, `DesktopRail`, `BottomDock` |

Use existing state and source routes. A card link and its bookmark button must be siblings, since a button inside a link is invalid HTML. Icons come from `@phosphor-icons/react`. The provided HTML uses CDN icon fonts for illustration only; the app keeps its bundled React icons.

## Interaction

The home highlight presents a portrait cover and one featured title for the selected source. It does not auto-advance. The source selector uses `aria-pressed`. State changes on bookmark, switch and selection keep text labels and reduced motion behavior. Menus and dialogs retain their Radix keyboard/focus semantics; Sonner retains queue, dismissal and announcements. CSS supplies their appearance.

The shared skeleton uses a slow ambient sweep that stops with `prefers-reduced-motion`. Dialog content enters with a short blur and scale, exits in reverse, and keeps the translation required for true viewport centering. Form controls use their native input underneath the custom indicator, with the native value and keyboard behavior intact.

## Migration guardrails

Existing feature screens keep their business logic, reader canvas choices, source filtering and persisted state. New feature markup should call the components above and use semantic tokens. Avoid more `text-[9px]`, oversized artwork stretched into horizontal banners, and forced glass on every card. Desktop and tablet are first-class layouts; mobile still has its established navigation pattern. Verify focus, contrast, text scaling and layout at phone, tablet and desktop widths whenever screens are migrated.
