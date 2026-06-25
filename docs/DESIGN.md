# DESIGN — Yomirra Design System

> **Palette:** Midnight Indigo | **Mode:** Dark-first, Light available | **File:** `src/app/(web)/globals.css`

---

## 1. Design Philosophy

- **Dark-first:** The primary experience is dark mode. Light mode is a secondary, fully-supported option.
- **Webtoon-first:** Every layout decision optimizes for vertical content consumption on mobile.
- **Glass morphism accents:** Translucent surfaces and blur effects for overlays, not primary content areas.
- **Apple HIG influence:** Minimum 44×44px touch targets, safe area insets, spring-based animations.
- **Token-only styling:** No raw hex values in component code. Always use CSS custom properties via Tailwind token classes.

---

## 2. Color Tokens

All tokens are defined in `globals.css` and mapped to Tailwind via `@theme {}`.

### Surface Tokens

| Token Class | CSS Variable | Dark Value | Light Value | Usage |
|-------------|-------------|------------|-------------|-------|
| `bg-surface-base` | `--surface-base` | `#05050A` | `#FAFAFC` | Root background, deepest layer |
| `bg-surface-raised` | `--surface-raised` | `#0A0A14` | `#F2F2F7` | Raised cards, panels |
| `bg-surface-overlay` | `--surface-overlay` | `#111122` | `#FFFFFF` | Elevated panels, sheets |
| `bg-surface-muted` | `--surface-muted` | `#1A1A2E` | `#EAEAEB` | Muted states, skeleton |
| `bg-surface-hover` | `--surface-hover` | `#1F1F3D` | `#E5E5EA` | Hover interaction state |
| `bg-surface-glass` | `--surface-glass` | `rgba(17,17,34,0.65)` | `rgba(255,255,255,0.65)` | Translucent glass panels |

### Text Tokens

| Token Class | CSS Variable | Dark Value | Light Value | Usage |
|-------------|-------------|------------|-------------|-------|
| `text-text-primary` | `--text-primary` | `#FDFDFD` | `#1C1C1E` | Primary body text, headings |
| `text-text-secondary` | `--text-secondary` | `#D1D1D6` | `#3A3A3C` | Secondary labels |
| `text-text-muted` | `--text-muted` | `#98989D` | `#6C6C70` | Captions, metadata |
| `text-text-on-accent` | `--text-on-accent` | `#FFFFFF` | `#FFFFFF` | Text on accent background |

### Border Tokens

| Token Class | CSS Variable | Dark Value | Light Value |
|-------------|-------------|------------|-------------|
| `border-border-subtle` | `--border-subtle` | `rgba(94,92,230,0.2)` | `rgba(88,86,214,0.15)` |
| `border-border-default` | `--border-default` | `rgba(94,92,230,0.4)` | `rgba(88,86,214,0.3)` |
| `border-border-strong` | `--border-strong` | `rgba(94,92,230,0.6)` | `rgba(88,86,214,0.4)` |
| `border-border-glass` | `--border-glass` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.05)` |

### Accent Tokens

| Token Class | CSS Variable | Dark Value | Light Value | Usage |
|-------------|-------------|------------|-------------|-------|
| `bg-accent` / `text-accent` | `--color-accent` | `#5E5CE6` | `#5856D6` | Primary interactive accent (Indigo) |
| `bg-accent-dim` | `--color-accent-dim` | `rgba(94,92,230,0.15)` | `rgba(88,86,214,0.1)` | Subtle accent fill |
| `text-accent-hover` | `--color-accent-hover` | `#7D7AFF` | `#4644B8` | Accent hover state |

### Semantic Tokens

| Token Class | Dark Value | Light Value | Usage |
|-------------|------------|-------------|-------|
| `text-semantic-success` | `#32D74B` | `#34C759` | Success states |
| `text-semantic-warning` | `#FF9F0A` | `#FF9500` | Warnings, star ratings |
| `text-semantic-error` | `#FF453A` | `#FF3B30` | Errors, destructive actions |
| `text-semantic-info` | `#5E5CE6` | `#5856D6` | Info (same as accent) |

### Media Overlay Tokens (Theme-Independent, Always Dark)

| Token | Value | Usage |
|-------|-------|-------|
| `--media-overlay-strong` | `rgba(5,5,10,0.92)` | Full overlay on cover images |
| `--media-overlay-mid` | `rgba(5,5,10,0.58)` | Partial overlay for readability |
| `--media-overlay-soft` | `rgba(5,5,10,0.12)` | Subtle tint |
| `text-media-foreground` | `#F2F2F7` | Text on top of manga covers |
| `text-media-muted` | `rgba(242,242,247,0.78)` | Secondary text on covers |

---

## 3. Typography

### Font Family
**Plus Jakarta Sans** — Primary typeface (all weights)
**JetBrains Mono** — Code/monospace only (`font-mono`)

```css
/* In layout.tsx — ensure these fonts are loaded */
/* Plus Jakarta Sans: weights 400, 500, 600, 700, 800 */
```

### Type Scale (defined in `@theme`)

| Class | Size | Line Height | Weight | Letter Spacing | Usage |
|-------|------|------------|--------|----------------|-------|
| `text-2xs` | 10px | 1.4 | 500 | +0.02em | Labels, badges (tiny) |
| `text-xs` | 12px | 1.45 | 400 | +0.01em | Captions, metadata |
| `text-sm` | 13px | 1.5 | 400 | — | Secondary body text |
| `text-base` | 15px | 1.6 | 400 | — | Primary body text |
| `text-md` | 16px | 1.4 | 500 | -0.01em | Medium emphasis |
| `text-lg` | 18px | 1.35 | 600 | -0.02em | Section headings |
| `text-xl` | 22px | 1.25 | 700 | -0.03em | Page titles |
| `text-2xl` | 28px | 1.15 | 700 | -0.04em | Hero headings |

---

## 4. Spacing Scale

| Token | Value | Tailwind class |
|-------|-------|----------------|
| `--spacing-1` | 4px | `p-1`, `m-1`, `gap-1` |
| `--spacing-2` | 8px | `p-2`, `m-2`, `gap-2` |
| `--spacing-3` | 12px | `p-3`, `m-3`, `gap-3` |
| `--spacing-4` | 16px | `p-4`, `m-4`, `gap-4` |
| `--spacing-5` | 20px | `p-5`, `m-5`, `gap-5` |
| `--spacing-6` | 24px | `p-6`, `m-6`, `gap-6` |
| `--spacing-8` | 32px | `p-8`, `m-8`, `gap-8` |
| `--spacing-10` | 40px | `p-10`, `m-10`, `gap-10` |
| `--spacing-12` | 48px | `p-12`, `m-12`, `gap-12` |
| `--spacing-16` | 64px | `p-16`, `m-16`, `gap-16` |

---

## 5. Border Radius Scale

| Class | Value | Usage |
|-------|-------|-------|
| `rounded-xs` → `--radius-xs` | 4px | Badges, tiny chips |
| `rounded-sm` → `--radius-sm` | 8px | Buttons (default), inputs |
| `rounded-md` → `--radius-md` | 12px | Cards, panels |
| `rounded-lg` → `--radius-lg` | 16px | Bottom sheets, large cards |
| `rounded-xl` → `--radius-xl` | 24px | Drawers, modals |
| `rounded-full` | 9999px | Pills, avatars, icon buttons |

---

## 6. Z-Index Scale

| Token | Value | Tailwind class | Usage |
|-------|-------|----------------|-------|
| `--z-base` | 0 | `z-0` | Default flow |
| `--z-raised` | 10 | `z-[10]` | Raised cards |
| `--z-dropdown` | 40 | `z-[40]` | Dropdowns, popovers |
| `--z-sticky` | 50 | `z-[50]` | Sticky headers |
| `--z-drawer` | 60 | `z-[60]` | Bottom sheets, drawers |
| `--z-overlay` | 70 | `z-[70]` | Overlays |
| `--z-toast` | 80 | `z-[80]` | Toasts (Sonner) |

**Never** use arbitrary z-index values outside this scale.

---

## 7. Shadow Scale

| Token | Usage |
|-------|-------|
| `shadow-none` | No shadow |
| `shadow-sm` | Subtle depth, small cards |
| `shadow-md` | Cards, floating elements |
| `shadow-lg` | Sheets, modals |
| `shadow-heavy` | Docks, heavy overlays |
| `shadow-glass` | Glass panels (includes inset rim light) |
| `shadow-reader` | Reader page images |

---

## 8. Layout Constants

| Token | Value | Usage |
|-------|-------|-------|
| `--mobile-header-height` | 56px | Top navigation height |
| `--bottom-nav-content-height` | 64px | Bottom dock content area |
| `--bottom-nav-height` | content + safe-bottom | Full bottom nav height |
| `--page-bottom-safe` | bottom-nav + 16px | Minimum bottom padding for content |
| `--safe-top` | `env(safe-area-inset-top)` | iOS notch clearance |
| `--safe-bottom` | `env(safe-area-inset-bottom)` | iOS home indicator clearance |

---

## 9. Motion System

### Duration Tokens (`src/shared/lib/motion/tokens.ts`)

```typescript
export const motionDuration = {
  instant: 0.08,   // immediate feedback
  fast:    0.14,   // micro-interactions
  normal:  0.20,   // standard transitions
  slow:    0.32,   // deliberate movements
  page:    0.45,   // page-level transitions
};
```

### Easing Tokens

```typescript
export const motionEase = {
  standard: [0.22, 1, 0.36, 1],    // default
  softOut:  [0.16, 1, 0.3, 1],     // soft deceleration
  sharp:    [0.4, 0, 0.2, 1],      // quick in, quick out
};
```

### Spring Presets

```typescript
export const transitions = {
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.7 },
  smooth: { type: "spring", stiffness: 360, damping: 32, mass: 0.9 },
  gentle: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
};
```

### Variants (`src/shared/lib/motion/variants.ts`)

```typescript
variants.pressable  // Card press effect: scale + y lift
variants.fadeUp     // Entrance from below: opacity + y=8px
variants.pop        // Pop-in: opacity + scale=0.96
```

### Motion Rules

- **ALWAYS** import tokens from `src/shared/lib/motion/tokens.ts`
- **ALWAYS** use `variants.pressable` for interactive cards (not `whileHover={{ y: -4 }}` inline)
- Respect `prefers-reduced-motion` — use `src/shared/hooks/use-safe-motion.ts`
- Use `animate` prop for state-driven animations, NOT `whileHover` for complex sequences
- Maximum animation duration for micro-interactions: `motionDuration.normal` (0.2s)

---

## 10. Glass Morphism Pattern

Used for: headers, bottom dock, floating buttons, overlays.

```tsx
// ✅ Correct glass panel
<div className="bg-surface-glass backdrop-blur-md border border-border-glass shadow-glass">

// ❌ Wrong — raw values
<div style={{ background: 'rgba(17,17,34,0.65)', backdropFilter: 'blur(12px)' }}>
```

---

## 11. View Transitions

Applied via CSS class names on navigation elements:

| Class | Effect |
|-------|--------|
| `vt-hover` | Manga cover shared element (mobile hover, desktop tap) |
| `vt-cover-mobile` | Cover transition on mobile only |
| `vt-cover-desktop` | Cover transition on desktop only |
| `nav-forward` | Slide in from right |
| `nav-back` | Slide out to right |
| `fade-in` / `fade-out` | Opacity transition |
| `morph` | Shared element morph with blur |

View transition names are set dynamically:
```tsx
const safeId = `${sourceId}-${mangaId}`.replace(/[^a-zA-Z0-9-]/g, '-');
style={{ '--vt-name': `manga-cover-${safeId}` } as React.CSSProperties}
```

---

## 12. Component Design Tokens (shadcn/ui mapping)

The following CSS vars map Yomirra tokens to shadcn/ui variable names for Radix UI compatibility:

```css
--background: var(--surface-base)
--foreground: var(--text-primary)
--card:       var(--surface-raised)
--primary:    var(--color-accent)
--muted:      var(--surface-muted)
--border:     var(--border-default)
--ring:       var(--color-accent-dim)
--radius:     8px
```
