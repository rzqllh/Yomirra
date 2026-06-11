# Yomirra — Motion Contract

> **Version:** 0.1  
> **Status:** BINDING — Do not invent durations or easings outside this contract.  
> **Library:** Framer Motion v12  
> **Rule:** Every animation in the UI must map to a named tier in this file. If it does not fit a tier, stop and ask.

---

## 1. Timing Budget

| Tier | Duration | When to Use |
|------|----------|-------------|
| `instant` | `0ms` (reduced-motion) | All animations fallback |
| `micro` | `120ms` | Hover state, focus ring, icon swap |
| `fast` | `160ms` | Button press, toggle switch, badge pop |
| `standard` | `220ms` | Card enter, list item mount, tab switch |
| `deliberate` | `300ms` | Sheet open/close, drawer slide, modal |
| `skeleton-fade` | `180ms` | Skeleton → content crossfade |
| `reader-reveal` | `250ms` | Page image load-in (opacity only) |
| `nav-active` | `150ms` | Bottom nav active indicator slide |

> **Hard ceiling:** No animation in product UI may exceed `350ms`.  
> **Reader exception:** Reader page crossfade may use up to `300ms` but only on webtoon scroll direction change.

---

## 2. Easing Reference

| Name | Framer Motion Value | Usage |
|------|---------------------|-------|
| `ease-out-quick` | `[0.16, 1, 0.3, 1]` | Entering elements (feels snappy) |
| `ease-in-out-soft` | `[0.4, 0, 0.2, 1]` | Transitioning between states |
| `ease-in-dismiss` | `[0.4, 0, 1, 1]` | Exiting elements (feels natural) |
| `spring-gentle` | `{ type: "spring", stiffness: 300, damping: 30 }` | Nav active indicator, toggle |
| `spring-snappy` | `{ type: "spring", stiffness: 400, damping: 28 }` | Button press feedback |

---

## 3. Component-Specific Motion Rules

### Bottom Navigation — Active Indicator
```ts
// Spring slide, not tween
transition: { type: "spring", stiffness: 380, damping: 32 }
// Duration: ~150ms effective
```

### Card Enter (Grid/List mount)
```ts
// Opacity only — NO translateY pop on grid
initial: { opacity: 0 }
animate: { opacity: 1 }
transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
// Stagger: max 0.04s between items, max 6 items staggered then rest instant
```

### Sheet / Drawer Open
```ts
initial: { y: "100%" }
animate: { y: 0 }
exit: { y: "100%" }
transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
```

### Modal Open
```ts
initial: { opacity: 0, scale: 0.97 }
animate: { opacity: 1, scale: 1 }
exit: { opacity: 0, scale: 0.97 }
transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
```

### Skeleton → Content
```ts
// AnimatePresence with crossfade, NO layout shift
initial: { opacity: 0 }
animate: { opacity: 1 }
transition: { duration: 0.18, ease: "easeIn" }
```

### Reader Page Image Load
```ts
// Opacity only — no scale, no blur reveal
initial: { opacity: 0 }
animate: { opacity: 1 }
transition: { duration: 0.25, ease: "easeOut" }
```

### Readlist Toggle (Save/Unsave)
```ts
// Icon scale pop + color transition
animate: { scale: [1, 1.2, 1] }
transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] }
```

### Reader Top Bar Show/Hide
```ts
initial: { y: -56 }  // height of bar
animate: { y: 0 }
exit: { y: -56 }
transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
```

---

## 4. Reduced Motion Policy

> **Non-negotiable.** Every animated component must respect `prefers-reduced-motion`.

### Implementation Pattern

```ts
// In a shared hook
import { useReducedMotion } from "framer-motion";

export function useSafeMotion() {
  const shouldReduce = useReducedMotion();
  return {
    transition: shouldReduce
      ? { duration: 0 }
      : undefined, // use component default
    skipAnimations: shouldReduce,
  };
}
```

### Reduced Motion Rules
- All duration values → `0ms`
- Spring animations → instant state change
- Skeleton shimmer → static muted color, no pulse
- Sheet/modal → instant mount, no slide
- Card stagger → all instant
- Reader page → instant opacity-1

---

## 5. What Is Prohibited

### Prohibited Animation Types

| Prohibited | Reason |
|------------|--------|
| Grid-wide stagger with `> 6` items | Feels slow, cheap |
| `translateY` bounce on card enter | Looks AI-generated |
| Continuous/looping pulse except skeleton shimmer | Distracting |
| Blur-in / blur-out transitions | Heavy, mobile GPU cost |
| Page-level route transition slides | Feels like a demo, not a product |
| `scale` on cover image hover on mobile | Misfire-prone, not native |
| `rotateY` card flip for any state | Wrong product category |
| `AnimatePresence` with `mode="wait"` on entire page | Blocks perceived performance |
| Decorative floating/parallax elements | Not a manga site gimmick |
| Loading spinner as primary loading state | Use skeleton instead |

### Prohibited Patterns

```ts
// ❌ Never: random duration values
transition={{ duration: 0.37 }}

// ❌ Never: motion on raw data (not user-triggered)
// (e.g., animating when new chapters appear in background)

// ❌ Never: nested AnimatePresence without layoutId
// Creates ghost layering bugs

// ❌ Never: motion.div on every list item unconditionally
// Measure first, apply selectively
```

---

## 6. Performance Notes

- Animate only `opacity` and `transform` (translate, scale, rotate) — never `height`, `width`, `top`, `left`, `padding`, `margin`
- Use `will-change: transform` only on elements that definitely animate (reader top bar, bottom sheet)
- Remove `will-change` after animation completes
- On Android Chrome, prefer `opacity` transitions over `transform` on cover images (compositor layer limit)
- Reader canvas must never be inside an `AnimatePresence` — this causes flicker on chapter change
