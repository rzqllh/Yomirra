# Yomirra Design Language — Deep Lagoon

This document defines the design identity for Yomirra.

## Product identity

Yomirra is not a dashboard. It is not a generic manga index. It is a manga reading product with a cinematic media identity.

Target:

**Premium iOS-native manga reader × cinematic editorial media app × Yomirra Deep Lagoon identity.**

## Brand keywords

- deep
- calm
- cinematic
- editorial
- readable
- immersive
- premium
- quiet but alive
- manga-first
- mobile-native

## Anti-keywords

- Android Material 2018
- generic shadcn demo
- dashboard app
- pale teal form UI
- generic glassmorphism
- neon cyberpunk
- heavy gray borders
- muddy transparency
- template card grid
- old mobile web

## Palette

### Core brand colors

```css
--yomirra-ink: #000D0F;
--yomirra-deep: #003135;
--yomirra-surface: #024950;
--yomirra-accent: #0FA4AF;
--yomirra-mist: #AFDDE5;
--yomirra-clay: #964734;
```

### Usage roles

- `ink` = deepest app background, OLED-like reading environment
- `deep` = primary brand background
- `surface` = raised panel/card foundation
- `accent` = primary interactive state, progress, focus, active nav
- `mist` = foreground/highlight/soft light surfaces
- `clay` = rare warm accent, soft destructive/warning/editorial marker

Do not use bright gold/amber as primary accent. It risks generic premium UI.

## Surface hierarchy

Create semantic tokens for:

```css
--canvas;
--canvas-subtle;
--surface;
--surface-raised;
--surface-elevated;
--surface-floating;
--surface-glass;
--surface-reader;
--rim;
--rim-strong;
--foreground;
--foreground-soft;
--foreground-muted;
--accent;
--accent-soft;
--accent-foreground;
--danger;
--danger-soft;
--warning;
--success;
--info;
--focus-ring;
```

## Elevation language

Yomirra must use soft depth, not old drop shadows.

Use:

- rim light
- subtle inner stroke
- soft ambient shadow
- layered surfaces
- contrast through spacing and surface role

Avoid:

- heavy gray shadow
- default `shadow-md` everywhere
- hard divider lines
- neumorphism blobs
- blur on everything

## Glass usage

Glass is reserved for:

- mobile bottom dock
- contextual top overlays
- reader controls
- detail overlay controls
- modals/sheets if appropriate

Do not apply glass to every card/panel.

## Typography

Use **Plus Jakarta Sans** as the only required font family.

Tone:

- clear
- modern
- compact
- readable
- not overly decorative

Rules:

- big page titles should feel editorial
- manga titles must be readable
- metadata must not be too low contrast
- button labels must stay accessible
- avoid tiny 10px text for important content

## Iconography

Icons should be:

- consistent stroke/weight
- not too thin on light mode
- not oversized
- active state must be visually clear
- icon-only buttons require accessible labels

## Motion

Motion should be subtle and product-useful.

Allowed:

- active nav pill transition
- segmented control indicator movement
- page control fades
- reader toolbar reveal/hide
- card press feedback
- search focus transition

Avoid:

- bounce
- excessive scale
- long animation
- motion that delays reading
- motion without reduced-motion fallback

## Light mode

Light mode is **Mist Canvas**, not white dashboard.

Desired:

- premium cool mist background
- crisp foreground
- layered white/mist panels
- darker media overlays
- subtle accent

Avoid:

- pure white large flat area
- pale teal everywhere
- gray divider-heavy layout
- old input styling

## Dark mode

Dark mode is the strongest brand state.

Desired:

- deep lagoon canvas
- clear aqua active states
- cinematic cards
- quiet surfaces
- strong media presence

Avoid:

- generic black-gray app
- neon outline
- over-saturated teal
- low-contrast body text

## Artwork/media rule

Manga covers are theme-independent media.

Overlay on cover art must be dark in both light and dark mode.

Use media-specific tokens:

```css
--media-overlay-strong: rgba(0, 13, 15, 0.92);
--media-overlay-mid: rgba(0, 13, 15, 0.58);
--media-overlay-soft: rgba(0, 13, 15, 0.12);
--media-foreground: #F4FBFC;
--media-muted-foreground: rgba(244, 251, 252, 0.78);
```

Do not use light theme foreground directly on artwork overlays.
