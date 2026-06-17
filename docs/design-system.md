# Design System

> Extend file — referenced from `AGENTS.md`.
> Baca ini sebelum task apapun yang involve warna, tipografi, spacing, shadow, atau animasi.
> **Single source of truth untuk semua token:** `src/app/(web)/globals.css`

---

## Color — 60-30-10 Rule

> - **60%** → Background & neutral surfaces
> - **30%** → Supporting / secondary surfaces
> - **10%** → Accent, CTA, highlights

Semua token di bawah hidup sebagai CSS variables yang di-map ke Tailwind via `@theme {}` di `globals.css`.
Format Tailwind: `bg-surface-base`, `text-text-primary`, `border-border-subtle`, dst.

| CSS Variable               | Light                      | Dark                           | Tailwind Class            | Usage                         |
| -------------------------- | -------------------------- | ------------------------------ | ------------------------- | ----------------------------- |
| `--surface-base`           | `#FAFAFC`                  | `#05050A`                      | `bg-surface-base`         | Deepest base background       |
| `--surface-raised`         | `#F2F2F7`                  | `#0A0A14`                      | `bg-surface-raised`       | Slightly raised surface       |
| `--surface-overlay`        | `#FFFFFF`                  | `#111122`                      | `bg-surface-overlay`      | Elevated panels, cards        |
| `--surface-muted`          | `#EAEAEB`                  | `#1A1A2E`                      | `bg-surface-muted`        | Muted states / backgrounds    |
| `--surface-hover`          | `#E5E5EA`                  | `#1F1F3D`                      | `bg-surface-hover`        | Interaction hover states      |
| `--surface-glass`          | `rgba(255,255,255,0.65)`   | `rgba(17,17,34,0.65)`          | `bg-surface-glass`        | Translucent glass             |
| `--text-primary`           | `#1C1C1E`                  | `#FDFDFD`                      | `text-text-primary`       | Primary content text          |
| `--text-secondary`         | `#3A3A3C`                  | `#D1D1D6`                      | `text-text-secondary`     | Subtle / secondary text       |
| `--text-muted`             | `#6C6C70`                  | `#98989D`                      | `text-text-muted`         | Captions, disabled, hints     |
| `--text-on-accent`         | `#FFFFFF`                  | `#FFFFFF`                      | `text-text-on-accent`     | Text on accent background     |
| `--color-accent`           | `#5856D6`                  | `#5E5CE6`                      | `text-accent`, `bg-accent`| Indigo CTA / primary          |
| `--color-accent-dim`       | `rgba(88,86,214,0.10)`     | `rgba(94,92,230,0.15)`         | `bg-accent-dim`           | Transparent accent fill       |
| `--color-accent-hover`     | `#4644B8`                  | `#7D7AFF`                      | `bg-accent-hover`         | Primary button hover          |
| `--border-subtle`          | `rgba(88,86,214,0.15)`     | `rgba(94,92,230,0.20)`         | `border-border-subtle`    | Very subtle dividers          |
| `--border-default`         | `rgba(88,86,214,0.30)`     | `rgba(94,92,230,0.40)`         | `border-border-default`   | Standard borders / inputs     |
| `--border-strong`          | `rgba(88,86,214,0.40)`     | `rgba(94,92,230,0.60)`         | `border-border-strong`    | High contrast borders         |
| `--border-glass`           | `rgba(0,0,0,0.05)`         | `rgba(255,255,255,0.08)`       | `border-border-glass`     | Subtle rim for glass panels   |
| `--color-semantic-success` | `#34C759`                  | `#32D74B`                      | `text-semantic-success`   | Success states                |
| `--color-semantic-warning` | `#FF9500`                  | `#FF9F0A`                      | `text-semantic-warning`   | Warning states                |
| `--color-semantic-error`   | `#FF3B30`                  | `#FF453A`                      | `text-semantic-error`     | Delete, destructive, error    |
| `--color-semantic-info`    | `#5856D6`                  | `#5E5CE6`                      | `text-semantic-info`      | Informational                 |
| `--media-foreground`       | `#F2F2F7` (always)         | `#F2F2F7` (always)             | `text-media-foreground`   | Text on media (always light)  |
| `--media-muted-foreground` | `rgba(242,242,247,0.78)`   | `rgba(242,242,247,0.78)`       | `text-media-muted`        | Muted text on media           |

**Dark mode strategy:** `class` — managed by `next-themes`.
**Default class:** `:root, .dark` — dark mode adalah default.
**Theme provider:** `src/components/providers/` — `ThemeProvider` dari `next-themes`.

### shadcn/ui Compatibility Mapping

Token berikut di-map secara eksplisit untuk kompatibilitas dengan Radix/shadcn primitives:

```css
--background: var(--surface-base);
--foreground: var(--text-primary);
--card: var(--surface-raised);
--popover: var(--surface-overlay);
--primary: var(--color-accent);
--primary-foreground: var(--text-on-accent);
--secondary: var(--surface-muted);
--muted: var(--surface-muted);
--muted-foreground: var(--text-muted);
--destructive: var(--color-semantic-error);
--border: var(--border-default);
--input: var(--border-default);
--ring: var(--color-accent-dim);
```

### Media Overlay (Always Dark — Theme-independent)

```css
--media-overlay-strong: rgba(5, 5, 10, 0.92);
--media-overlay-mid:    rgba(5, 5, 10, 0.58);
--media-overlay-soft:   rgba(5, 5, 10, 0.12);
```

Dipakai via utility class `.bg-media-gradient` di cover images.

---

## Typography

**Primary font:** Plus Jakarta Sans (loaded via `next/font/google`, CSS var: `--font-ui`)
**Mono font:** JetBrains Mono, Fira Code (CSS var: `--font-mono`)
**Anti-aliasing:** `-webkit-font-smoothing: antialiased` on `body`

| Scale     | CSS Token      | Size  | Weight | Line Height | Letter Spacing | Usage                  |
| --------- | -------------- | ----- | ------ | ----------- | -------------- | ---------------------- |
| `display` | `text-2xl`     | 28px  | 700    | 1.15        | -0.04em        | Hero text              |
| `h1`      | `text-xl`      | 22px  | 700    | 1.25        | -0.03em        | Page titles            |
| `h2`      | `text-lg`      | 18px  | 600    | 1.35        | -0.02em        | Section titles         |
| `h3`      | `text-md`      | 16px  | 500    | 1.4         | -0.01em        | Card / group titles    |
| `body-lg` | `text-base`    | 15px  | 400    | 1.6         | —              | Large body text        |
| `body`    | `text-sm`      | 13px  | 400    | 1.5         | —              | Default body           |
| `body-sm` | `text-xs`      | 12px  | 400    | 1.45        | 0.01em         | Small body, labels     |
| `caption` | `text-2xs`     | 10px  | 500    | 1.4         | 0.02em         | Metadata, hints        |
| `code`    | `font-mono`    | 13px  | 400    | 1.5         | —              | Inline code, shortcuts |

> **Aturan:** Gunakan token Tailwind (`text-sm`, `text-xl`) — tidak ada `text-[13px]` arbitrary.

---

## Spacing Scale

**Base unit:** 4px
**Rule:** Gunakan Tailwind spacing utilities. Custom value hanya jika benar-benar diperlukan.

| Token          | Value | Tailwind equiv |
| -------------- | ----- | -------------- |
| `--spacing-1`  | 4px   | `p-1`, `m-1`  |
| `--spacing-2`  | 8px   | `p-2`, `m-2`  |
| `--spacing-3`  | 12px  | `p-3`, `m-3`  |
| `--spacing-4`  | 16px  | `p-4`, `m-4`  |
| `--spacing-5`  | 20px  | `p-5`, `m-5`  |
| `--spacing-6`  | 24px  | `p-6`, `m-6`  |
| `--spacing-8`  | 32px  | `p-8`, `m-8`  |
| `--spacing-10` | 40px  | `p-10`        |
| `--spacing-12` | 48px  | `p-12`        |
| `--spacing-16` | 64px  | `p-16`        |

**Layout tokens:**
```css
--mobile-header-height: 56px;
--bottom-nav-content-height: 64px;
--bottom-nav-height: calc(64px + env(safe-area-inset-bottom));
--page-bottom-safe: calc(var(--bottom-nav-height) + 16px);
--safe-top: env(safe-area-inset-top);
--safe-bottom: env(safe-area-inset-bottom);
```

---

## Border Radius

| Token           | Value   | Tailwind equiv     | Usage                        |
| --------------- | ------- | ------------------ | ---------------------------- |
| `--radius-xs`   | 4px     | `rounded`          | Tags, chips kecil, small input |
| `--radius-sm`   | 8px     | `rounded-lg`       | Input fields, small buttons  |
| `--radius-md`   | 12px    | `rounded-xl`       | Cards, standard buttons      |
| `--radius-lg`   | 16px    | `rounded-2xl`      | Modal, sheet, large card     |
| `--radius-xl`   | 24px    | `rounded-3xl`      | Feature cards, dialog        |
| `--radius-full` | 9999px  | `rounded-full`     | Pills, avatars, toggles      |

---

## Shadows

| Token             | Usage                                        |
| ----------------- | -------------------------------------------- |
| `--shadow-none`   | No shadow                                    |
| `--shadow-sm`     | Subtle lift — card idle                      |
| `--shadow-md`     | Hover elevation — interactive card           |
| `--shadow-lg`     | Dropdowns, modals above content              |
| `--shadow-heavy`  | Floating glass panels, dialogs (theme-aware) |
| `--shadow-glass`  | Glass headers/docks (theme-aware, inset rim) |
| `--shadow-reader` | Reader mode dark vignette                    |

**Dark shadows** lebih aggressive karena dark surfaces need stronger separation.

---

## Z-Index Scale

| Value | Token           | Tailwind via CSS var | Usage                    |
| ----- | --------------- | -------------------- | ------------------------ |
| 0     | `--z-base`      | `z-[var(--z-base)]`  | Default                  |
| 10    | `--z-raised`    | —                    | Raised elements          |
| 40    | `--z-dropdown`  | —                    | Dropdowns, tooltips      |
| 50    | `--z-sticky`    | —                    | Sticky navbar / sidebar  |
| 60    | `--z-drawer`    | —                    | Drawer, bottom sheets    |
| 70    | `--z-overlay`   | —                    | Modal backdrops          |
| 80    | `--z-toast`     | —                    | Toast notifications      |

---

## Animation / Motion Tokens

**View Transition durations** (globals.css):

| Token              | Value  | Usage               |
| ------------------ | ------ | ------------------- |
| `--duration-exit`  | 150ms  | Old view fades out  |
| `--duration-enter` | 210ms  | New view fades in   |
| `--duration-move`  | 400ms  | Morph / slide move  |

**View Transition types** (CSS `::view-transition` pseudo-elements):
- `.fade-out` / `.fade-in` — Simple fade
- `.slide-down` / `.slide-up` — Y-axis slide
- `.nav-forward` / `.nav-back` — X-axis directional slide (60px offset)
- `.morph` — Blur-through morph (400ms)

**Timing function** for `::view-transition-group(*)`: Custom spring linear curve (defined in globals.css).

**Persistent nav groups** (no transition animation):
- `view-transition-group(persistent-top-nav)`
- `view-transition-group(persistent-bottom-nav)`
- `view-transition-group(persistent-side-nav)`

**Framer Motion defaults** (from component observation):
- Spring: `{ type: "spring", stiffness: 300, damping: 25 }` — card interactions
- Nav underline: `{ type: "spring", bounce: 0.2, duration: 0.6 }`
- Overlays: `{ duration: 0.15, ease: "easeOut" }` — fast micro-animations

**Reduced motion global fallback** (globals.css):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
  }
}
```

---

## Glassmorphism Pattern

Gunakan hanya pada elemen floating/sticky (navbar, bottom nav, reader toolbar, dialog).

```css
/* Dark mode */
background: var(--surface-glass);           /* rgba(17,17,34,0.65) */
backdrop-filter: blur(12px);               /* atau blur(16px) untuk heavy panels */
-webkit-backdrop-filter: blur(12px);
border: 1px solid var(--border-glass);     /* rgba(255,255,255,0.08) */
box-shadow: var(--shadow-glass);

/* Light mode */
background: var(--surface-glass);           /* rgba(255,255,255,0.65) */
backdrop-filter: blur(12px);
border: 1px solid var(--border-glass);     /* rgba(0,0,0,0.05) */
```

> **Opacity range:** 65–85% — di bawah itu konten di balik glass tidak terbaca dengan baik.

---

## Component Library

| Kategori               | Implementasi                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| Base design system     | Custom components (`src/components/ui/`)                          |
| Primitive headless     | Radix UI (Dialog, DropdownMenu, ScrollArea, Tabs, Tooltip, Slot)  |
| Icon library           | `@phosphor-icons/react` — Regular / Fill / Duotone weight         |
| Component variants     | `class-variance-authority` (CVA) + `cn()` helper                  |
| Theme config           | `src/app/(web)/globals.css` + `src/components/providers/`         |
| Component reference    | `src/app/(web)/design-demo/` (internal dev page)                  |

---

## Button Variant Reference

Defined in `src/components/ui/button.tsx` via CVA:

| Variant       | Usage                                            |
| ------------- | ------------------------------------------------ |
| `default`     | Solid, high-contrast (text-primary bg)           |
| `accent`      | Accent tinted background, for primary CTA        |
| `secondary`   | Raised surface background, bordered              |
| `tertiary`    | Text-only, subtle hover                          |
| `ghost`       | No background, only hover surface                |
| `outline`     | Transparent bg, strong border                    |
| `destructive` | Semantic error background, for delete actions    |
| `reader`      | Dark-adapted for reader overlay                  |
| `link`        | Text-only, underline on hover                    |

**Sizes:** `sm` | `default` | `lg` | `icon` | `icon-sm` | `icon-lg`

---

*Last updated: 2026-06-17*
