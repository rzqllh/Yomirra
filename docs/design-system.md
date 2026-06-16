# Design System

> Extend file — referenced from `CLAUDE.md`.
> Fill this in before building any UI. Agent reads this for every component task.

---

## Color Palette

> Follow the 60-30-10 rule.
>
> - 60% → Background / neutral surfaces
> - 30% → Supporting / secondary surfaces
> - 10% → Accent / CTA

### Tokens

| Token                    | Light | Dark | Usage                   |
| ------------------------ | ----- | ---- | ----------------------- |
| `--color-background`     |       |      | Page background         |
| `--color-surface`        |       |      | Card / panel background |
| `--color-surface-raised` |       |      | Elevated elements       |
| `--color-primary`        |       |      | Primary CTA, links      |
| `--color-secondary`      |       |      | Secondary actions       |
| `--color-accent`         |       |      | Highlights, badges      |
| `--color-text`           |       |      | Body text               |
| `--color-text-muted`     |       |      | Captions, hints         |
| `--color-border`         |       |      | Dividers, outlines      |
| `--color-destructive`    |       |      | Errors, delete          |
| `--color-success`        |       |      | Success states          |
| `--color-warning`        |       |      | Warning states          |

**CSS Variable file:** `src/styles/globals.css` / `app/globals.css`

---

## Typography

| Scale   | Font Family | Size | Weight | Line Height | Usage                 |
| ------- | ----------- | ---- | ------ | ----------- | --------------------- |
| Display |             |      |        |             | Hero headings         |
| H1      |             |      |        |             | Page titles           |
| H2      |             |      |        |             | Section titles        |
| H3      |             |      |        |             | Card / group titles   |
| Body    |             |      | 400    | 1.6         | Paragraph text        |
| Small   |             |      |        |             | Captions, metadata    |
| Code    |             |      |        |             | Inline code, snippets |

**Google Fonts / Local:**
**Fallback stack:**

---

## Spacing

**Base unit:** `4px` (Tailwind default rem scale)
**Container max-width:**
**Section padding — desktop:**
**Section padding — mobile:**
**Gutter (column gap):**

---

## Border Radius

| Token           | Value | Usage            |
| --------------- | ----- | ---------------- |
| `--radius-sm`   |       | Inputs, chips    |
| `--radius-md`   |       | Cards, buttons   |
| `--radius-lg`   |       | Modals, sheets   |
| `--radius-xl`   |       | Feature sections |
| `--radius-full` |       | Pills, avatars   |

---

## Shadows

| Level       | Usage                       |
| ----------- | --------------------------- |
| `shadow-sm` | Subtle lift, inactive cards |
| `shadow-md` | Active cards, dropdowns     |
| `shadow-lg` | Modals, popovers            |
| `shadow-xl` | Full-screen overlays        |

---

## Z-Index Scale

| Value | Usage                       |
| ----- | --------------------------- |
| 10    | Sticky headers / sidebars   |
| 20    | Dropdowns / tooltips        |
| 30    | Modals / drawers            |
| 40    | Toasts / notifications      |
| 50    | Command palette / spotlight |

---

## Animation

**Micro-interactions:** 150ms
**Standard transitions:** 300ms
**Emphasis / page transitions:** 500ms
**Easing — enter:** `ease-out`
**Easing — exit:** `ease-in`
**Stagger delay (lists):** 50ms per item
**Reduced motion:** Always respect `prefers-reduced-motion: reduce`

---

## Glassmorphism (if used)

```css
/* Dark mode */
background: rgba(255, 255, 255, 0.06);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);

/* Light mode — use higher opacity or it disappears */
background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(12px);
border: 1px solid rgba(0, 0, 0, 0.08);
```

---

## Component Library

**Base:**
**Icon set:**
**Theme config file:**
**Dark mode strategy:** `class` / `media` / `data-attribute`

---

## Accessibility Baseline

- Contrast ratio: **4.5:1** minimum for normal text, **3:1** for large text
- Touch targets: **44×44px** minimum
- Focus rings: visible on all interactive elements
- All images: descriptive `alt` text
- WCAG target level: `AA` / `AAA`

---

_Last updated: [YYYY-MM-DD]_
