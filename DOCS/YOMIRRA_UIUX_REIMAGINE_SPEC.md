# Yomirra UI/UX Reimagine Spec

This spec defines the visual and interaction direction for Yomirra.

## Design verdict

Current UI should be treated as insufficient if it feels:

- generic,
- flat,
- visually boring,
- too app-template-like,
- inconsistent between pages,
- overloaded with magic numbers,
- disconnected from manga-reader emotion,
- or not optimized for mobile reading behavior.

The redesign should feel like a premium manga reading app with cinematic calm, strong hierarchy, comfortable reading flow, and polished micro-interactions.

## Product personality

Yomirra should feel:

- premium,
- quiet but alive,
- cinematic,
- mobile-native,
- manga-first,
- fast,
- comfortable for long sessions,
- visually memorable without being noisy.

Avoid:

- neon cyberpunk,
- random gradients,
- template dashboard cards,
- generic glassmorphism,
- overdecorated shadows,
- bright red destructive states,
- unreadable translucent text,
- inconsistent rounded corners,
- random icon sizes,
- random spacing.

## Color system

Palette locked from the provided visual reference:

| Role | Color | Usage |
|---|---:|---|
| Deep base | `#003135` | dominant dark background, app shell depth |
| Secondary surface | `#024950` | elevated panels, nav, sheet, cards |
| Warm clay | `#964734` | soft danger, warning, destructive accent, warm contrast |
| Aqua accent | `#0FA4AF` | primary accent, active states, progress, selected nav |
| Mist blue | `#AFDDE5` | text on dark, subtle highlights, calm surfaces |

### 60-30-10 application

For dark priority:

- 60%: deep base family from `#003135`.
- 30%: secondary surface family from `#024950`.
- 10%: accent family from `#0FA4AF`, with small warm clay usage from `#964734`.

For light mode:

- Use mist blue and near-white cool surfaces as the 60%.
- Use desaturated teal surfaces as the 30%.
- Use aqua accent as the 10%.
- Use warm clay only for controlled attention/destructive states.

### Semantic token proposal

Use semantic tokens, not raw colors in components.

```css
:root {
  --yomirra-base: #003135;
  --yomirra-surface: #024950;
  --yomirra-warm: #964734;
  --yomirra-accent: #0FA4AF;
  --yomirra-mist: #AFDDE5;

  --background: 190 100% 10%;
  --foreground: 190 45% 88%;

  --card: 188 93% 16%;
  --card-foreground: 190 45% 90%;

  --popover: 188 93% 16%;
  --popover-foreground: 190 45% 90%;

  --primary: 184 84% 37%;
  --primary-foreground: 190 45% 96%;

  --secondary: 188 93% 16%;
  --secondary-foreground: 190 45% 88%;

  --muted: 188 60% 13%;
  --muted-foreground: 190 26% 68%;

  --accent: 184 84% 37%;
  --accent-foreground: 190 45% 96%;

  --destructive: 13 38% 43%;
  --destructive-foreground: 30 40% 96%;

  --border: 188 40% 24%;
  --input: 188 40% 24%;
  --ring: 184 84% 42%;
}
```

Important: verify WCAG contrast in actual UI, because contrast depends on text size, background, opacity, blur, and state.

## Typography

Recommended:

- UI/body: `Plus Jakarta Sans`.
- Numeric/chapter labels: optional mono token, only for metadata rhythm.
- Avoid too many font families.

Hierarchy:

- Page title: strong, compact, high contrast.
- Section title: calm but visible.
- Metadata: smaller, never too low contrast.
- Card title: readable on mobile without squeezing.
- Reader controls: icon + accessible label.

Do not use tiny low-contrast captions for important manga metadata.

## Spacing system

Replace random spacing with a rhythm.

Use a clear scale:

```ts
const space = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
}
```

Rules:

- Mobile page horizontal padding: usually `px-4`, sometimes `px-5` for premium spacious screens.
- Avoid per-page random `py-[17px]` or `gap-[19px]`.
- Cards should share consistent inner padding.
- Lists should have consistent section gaps.
- Reader mode can use specialized spacing tokens.

## Radius system

Use semantic radius:

```css
--radius-xs: 0.5rem;
--radius-sm: 0.75rem;
--radius-md: 1rem;
--radius-lg: 1.25rem;
--radius-xl: 1.5rem;
--radius-2xl: 2rem;
--radius-pill: 999px;
```

Rules:

- Manga cards: medium-large radius.
- Bottom nav: pill/capsule.
- Sheets/dialogs: large radius.
- Small icon buttons: consistent circular/pill shape.
- Do not mix `rounded-lg`, `rounded-2xl`, `rounded-[22px]`, `rounded-[28px]` randomly.

## Layout direction

### App shell

Mobile-first shell:

- Top area should be minimal and contextual.
- Bottom navigation should not collide with iOS Safari bottom toolbar.
- Use safe-area padding:
  - `env(safe-area-inset-bottom)`
  - `env(safe-area-inset-top)`
- Bottom nav should be elevated, compact, and not cover content.
- Main content should include bottom padding equal to bottom nav height + safe area.

Desktop/tablet:

- Sidebar or rail may replace bottom nav.
- Content width should use layout containers, not random max-width values.
- Avoid giant empty dashboard-style cards.

### Navigation

Required:

- Clear active state.
- Keyboard accessible.
- Touch comfortable.
- No duplicated navigation logic.
- Routes centralized in a single route config.
- Labels/icons centralized.
- No hardcoded route strings scattered in components.

### Manga card

A manga card should support:

- Cover image.
- Title.
- Source badge if relevant.
- Total chapter or latest chapter.
- Last updated.
- Reading progress if in library/readlist.
- Bookmark/readlist quick action.
- Skeleton state.
- Error image fallback.
- Accessible title/label.

Avoid:

- repeated metadata,
- duplicated bookmark buttons,
- unreadable overlay text,
- same card design for every context when the user intent differs.

### Library / Readlist

Should feel like a personal reading shelf, not a generic grid.

Must include:

- Continue Reading / Lanjut Baca.
- Saved list.
- Sort controls.
- Search within saved items.
- Empty state with clear CTA.
- Local guest data behavior.
- Cloud sync status if logged in.
- No broken filters.
- No labels that lie about data.

### Reader

Reader is the core experience.

Must check:

- Previous/next chapter behavior.
- Chapter list/sheet.
- Mode toggle: vertical/webtoon/paged if supported.
- Tap zones.
- Toolbar hide/show.
- Progress.
- Safe area.
- Image loading.
- Error retry.
- Scroll position persistence.
- Reduced motion.
- Keyboard shortcuts on desktop.
- Avoid accidental navigation.
- Controls must not be placeholder.

Visual direction:

- Chrome should disappear when reading.
- Controls should feel light, glassy, and contextual.
- Reader image area must prioritize content.
- No heavy nav blocking panels.
- Bottom actions must respect Safari/gesture areas.

## Component primitives

Prioritize shadcn/ui and Radix-backed primitives:

- Button
- Card
- Input
- Tabs
- Select
- Dialog
- Sheet
- Drawer if present and suitable
- DropdownMenu
- Tooltip
- Command
- ScrollArea
- Separator
- Badge
- Skeleton
- Switch
- Slider
- Progress
- Toast/Sonner

Do not create inaccessible custom dropdown/dialog/sheet if Radix primitives can solve it.

## Motion

Motion should make the app feel alive, not noisy.

Use:

- subtle page transition,
- directional transition for navigation,
- active nav indicator movement,
- card press feedback,
- reader toolbar reveal/hide,
- skeleton shimmer only if tasteful,
- reduced-motion fallback.

Avoid:

- bouncing everywhere,
- long animation,
- random easing,
- animation on every card that causes jank.

Tokenize motion:

```ts
const motion = {
  fast: "120ms",
  base: "180ms",
  slow: "260ms",
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
}
```

## Accessibility

Required:

- WCAG contrast checks.
- Visible focus ring.
- Correct button/link semantics.
- Dialog/sheet focus trap.
- Keyboard navigation.
- Accessible labels for icon-only buttons.
- `aria-current` for active nav.
- `aria-busy` or clear loading semantics where useful.
- No interaction hidden behind hover only.
- Touch target should be comfortable on mobile.
- Reduced motion support.

## Dark/light toggle

Required behavior:

- Toggle available in settings and/or app shell.
- Theme persisted.
- System preference can be respected as default.
- No flash if avoidable.
- All components must have both dark and light tokens.
- Do not hardcode dark-only colors in components.

## Visual quality bar

A screen is not accepted if:

- it could be mistaken for a generic admin dashboard,
- it uses random spacing,
- active states are unclear,
- it lacks loading/empty/error states,
- it ignores mobile bottom safe area,
- it has low contrast text,
- it uses non-tokenized color,
- it adds decorative glass that harms readability,
- or it ships placeholder controls.
