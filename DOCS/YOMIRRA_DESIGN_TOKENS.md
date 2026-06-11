# Yomirra — Design Token Contract

> **Version:** 0.1 — Seed Anchor  
> **Status:** BINDING — Do not deviate without explicit approval and documented reason.  
> **Stack:** Tailwind CSS v4 + CSS custom properties in `@theme {}`  
> **Rule:** Every color, spacing, radius, and shadow decision in UI code must trace back to a token in this file. No raw hex values in component files.

---

## 1. Color System

### 1.1 Surface — Dark Mode (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-surface-base` | `#0D0D0F` | App background, page root |
| `--color-surface-raised` | `#161618` | Cards, inline surfaces |
| `--color-surface-overlay` | `#1C1C1F` | Sheets, modals, drawers |
| `--color-surface-muted` | `#2A2A2F` | Skeleton, hairline dividers |
| `--color-surface-hover` | `#222226` | Card hover state |

### 1.2 Surface — Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-surface-base` | `#F4F4F6` | App background |
| `--color-surface-raised` | `#FFFFFF` | Cards, inline surfaces |
| `--color-surface-overlay` | `#FFFFFF` | Sheets, modals, drawers |
| `--color-surface-muted` | `#E4E4E8` | Skeleton, dividers |
| `--color-surface-hover` | `#ECECEF` | Card hover state |

### 1.3 Text

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--color-text-primary` | `#F0F0F2` | `#0D0D0F` | Body, headings, labels |
| `--color-text-secondary` | `#8A8A9A` | `#5A5A6A` | Metadata, subtitles, counts |
| `--color-text-muted` | `#55556A` | `#9A9AAA` | Disabled, placeholders, hints |
| `--color-text-on-accent` | `#FFFFFF` | `#FFFFFF` | Text on accent/red background |

### 1.4 Accent — Red

> **HARD RULE:** Accent red is used **only** for:
> - Primary action buttons: "Mulai baca", "Lanjut baca"
> - Active navigation indicator (bottom nav, side nav)
> - Read/unread chapter state indicator dot
> - Readlist save toggle (saved state)
>
> **Using red anywhere else is a token violation. Report before adding new uses.**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-accent` | `#E8343A` | Primary CTA bg, active nav |
| `--color-accent-dim` | `#E8343A20` | Soft badge bg, selection bg |
| `--color-accent-hover` | `#D02E34` | Primary CTA hover |
| `--color-accent-on` | `#FFFFFF` | Text on accent |

### 1.5 Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-semantic-success` | `#30D158` | Sync success, save confirmation |
| `--color-semantic-warning` | `#FF9F0A` | Source degraded, partial fail |
| `--color-semantic-error` | `#FF453A` | Fetch error, retry state |
| `--color-semantic-info` | `#0A84FF` | Source info badge, update badge |

### 1.6 Border

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--color-border-subtle` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.05)` | Card border, container edge |
| `--color-border-default` | `rgba(255,255,255,0.09)` | `rgba(0,0,0,0.09)` | Input, divider |
| `--color-border-strong` | `rgba(255,255,255,0.16)` | `rgba(0,0,0,0.16)` | Focused input, selected card |

---

## 2. Typography

### 2.1 Font Stack

| Role | Font | Fallback |
|------|------|----------|
| UI / Body | `"Inter Variable"` or `"Inter"` | `system-ui, -apple-system, sans-serif` |
| Numeric / Mono | `"JetBrains Mono"` | `"Fira Code", "Cascadia Code", monospace` |

> **Do not introduce additional typefaces without approval.** If Inter Variable is not loaded, `system-ui` is acceptable fallback. Never use display serifs, slab serifs, or decorative faces in product UI.

### 2.2 Type Scale

| Token | Size | Weight | Line-Height | Letter-Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `--text-2xs` | 10px | 500 | 1.4 | +0.02em | Badges (compact) |
| `--text-xs` | 12px | 400 | 1.45 | +0.01em | Metadata, captions, tags |
| `--text-sm` | 13px | 400 | 1.5 | 0 | Labels, chapter row info |
| `--text-base` | 15px | 400 | 1.6 | 0 | Body, synopsis |
| `--text-md` | 16px | 500 | 1.4 | -0.01em | UI labels, nav items |
| `--text-lg` | 18px | 600 | 1.35 | -0.02em | Section headers |
| `--text-xl` | 22px | 700 | 1.25 | -0.03em | Page titles |
| `--text-2xl` | 28px | 700 | 1.15 | -0.04em | Manga title hero |

> Mono font applies to: chapter numbers, volume numbers, page counters, source IDs.

---

## 3. Spacing

> **Base unit: 4px.** All spacing values must be multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Icon-label gap, tight pairs |
| `--space-2` | 8px | Inline element padding, compact rows |
| `--space-3` | 12px | Input vertical padding, list item gap |
| `--space-4` | 16px | Default content padding, card inner |
| `--space-5` | 20px | Section row gap |
| `--space-6` | 24px | Card padding, sheet inner padding |
| `--space-8` | 32px | Section-to-section spacing |
| `--space-10` | 40px | Page-level breathing, hero padding |
| `--space-12` | 48px | Large section gap, safe area buffer |
| `--space-16` | 64px | Page header height reference |

---

## 4. Shape — Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Inline badges, tiny chips |
| `--radius-sm` | 8px | Buttons, inputs, tags |
| `--radius-md` | 12px | Cards (compact), tooltips |
| `--radius-lg` | 16px | Cards (standard), source cards |
| `--radius-xl` | 24px | Bottom sheets, drawers (top corners) |
| `--radius-full` | 9999px | Pills, avatar, toggle |

---

## 5. Elevation — Shadow

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | `none` | Flat inline surfaces |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)` | Subtle card lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.30), 0 2px 6px rgba(0,0,0,0.18)` | Sheets, bottom nav shadow |
| `--shadow-lg` | `0 8px 28px rgba(0,0,0,0.40), 0 4px 12px rgba(0,0,0,0.25)` | Modals, overlays |
| `--shadow-reader` | `0 0 40px rgba(0,0,0,0.70)` | Reader top bar when visible |

---

## 6. Cover Art Ratio

> **All manga cover images must use the `2:3` aspect ratio without exception.**

| Context | Ratio | Note |
|---------|-------|------|
| Grid card | `2:3` | `aspect-[2/3]` in Tailwind |
| Continue reading strip | `2:3` | Thumbnail |
| Detail hero cover | `2:3` | May use object-cover with blur bg |
| Row item thumbnail | `2:3` | Compact size, same ratio |
| Skeleton placeholder | `2:3` | Must match final ratio exactly |

---

## 7. Tailwind v4 Implementation

Add this block to your global CSS file (typically `src/styles/globals.css` or `src/app/globals.css`):

```css
@import "tailwindcss";

@theme {
  /* Surfaces */
  --color-surface-base: #0D0D0F;
  --color-surface-raised: #161618;
  --color-surface-overlay: #1C1C1F;
  --color-surface-muted: #2A2A2F;
  --color-surface-hover: #222226;

  /* Text */
  --color-text-primary: #F0F0F2;
  --color-text-secondary: #8A8A9A;
  --color-text-muted: #55556A;
  --color-text-on-accent: #FFFFFF;

  /* Accent */
  --color-accent: #E8343A;
  --color-accent-hover: #D02E34;
  --color-accent-on: #FFFFFF;

  /* Semantic */
  --color-semantic-success: #30D158;
  --color-semantic-warning: #FF9F0A;
  --color-semantic-error: #FF453A;
  --color-semantic-info: #0A84FF;

  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Typography */
  --font-ui: "Inter Variable", "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
}

/* Light mode override */
@media (prefers-color-scheme: light) {
  @theme {
    --color-surface-base: #F4F4F6;
    --color-surface-raised: #FFFFFF;
    --color-surface-overlay: #FFFFFF;
    --color-surface-muted: #E4E4E8;
    --color-surface-hover: #ECECEF;
    --color-text-primary: #0D0D0F;
    --color-text-secondary: #5A5A6A;
    --color-text-muted: #9A9AAA;
  }
}
```

> If the project already has a `globals.css` with existing color variables, **do not replace it blindly**. Report the conflict in Pass 0 and propose a merge strategy.

---

## 8. What Agents Must NOT Do

- Invent hex values not in this file
- Use Tailwind default color classes (`text-gray-500`, `bg-zinc-900`) when a token equivalent exists
- Add gradient backgrounds to surfaces unless it is the reader background blur specifically
- Use `opacity-*` to simulate "muted" text — use `--color-text-muted` instead
- Mix dark and light surface tokens in the same component
- Use accent color for decorative elements, borders, or hover glows
- Change any token value without bumping the version number and documenting the reason
