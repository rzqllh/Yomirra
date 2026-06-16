# 📘 Yomirra Reader Engine Design System

### Version: 1.0 — High-Speed Reading Architecture

---

# 1. CORE PHILOSOPHY

## 1.1 Primary Goal

Maximize **reading flow continuity** by eliminating:

- Visual noise
- Latency perception
- Cognitive interruption

## 1.2 Non-Negotiable Principles

### P1 — Instant Content

- Content MUST render immediately (0ms animation)
- No fade-in, no slide-in for reading content

### P2 — Zero Distraction

- UI must not compete with reading area
- Motion is considered distraction unless proven otherwise

### P3 — Flow State Preservation

- User should feel like scrolling a continuous strip
- No “event-like” transitions

### P4 — Deterministic Interaction

- Every gesture = predictable outcome
- No delayed or elastic UI response (except gestures)

---

# 2. MOTION SYSTEM

## 2.1 Motion Philosophy

Motion is **NOT decoration**
Motion is **ONLY feedback for interaction**

---

## 2.2 Allowed Motion Types

| Type                               | Allowed    | Notes              |
| ---------------------------------- | ---------- | ------------------ |
| Gesture-driven (pinch, zoom, drag) | ✅ YES     | Must use physics   |
| Tap feedback (button press)        | ✅ YES     | ≤100ms             |
| Overlay toggle                     | ✅ LIMITED | ≤150ms             |
| Navigation UI                      | ⚠️ LIMITED | ≤200ms             |
| Content animation                  | ❌ NO      | Strictly forbidden |

---

## 2.3 Forbidden Motion

- ❌ fade-in (opacity transition)
- ❌ slide-in content
- ❌ animate-in / animate-out
- ❌ transition-all
- ❌ duration > 200ms
- ❌ spring on non-gesture elements
- ❌ scroll-linked animation (parallax, easing, etc.)

---

## 2.4 Duration Constraints

| Context      | Max Duration |
| ------------ | ------------ |
| Tap feedback | 100ms        |
| Overlay UI   | 150ms        |
| Navigation   | 200ms        |
| Gesture      | Real-time    |

---

## 2.5 Easing Rules

- Default: `ease-out`
- No bounce
- No elastic easing (except gestures)

---

# 3. LAYOUT SYSTEM

## 3.1 Reading Layout Rules

- Vertical continuous flow
- No layout shift allowed
- Image height must be:
  - Pre-calculated OR
  - Instantly snapped (no transition)

---

## 3.2 Stability Requirements

- No CLS (Cumulative Layout Shift)
- No reflow during scroll
- No dynamic resizing animations

---

## 3.3 Image Rendering

### MUST:

- Render immediately after decode
- Reserve space before load

### MUST NOT:

- Fade-in images
- Animate aspect ratio
- Lazy blur transitions

---

# 4. INTERACTION MODEL

## 4.1 Gesture System

### Allowed:

- Pinch to zoom
- Double tap zoom
- Drag/pan

### Requirements:

- Must use physics (spring)
- Must feel 1:1 with input
- No delay

---

## 4.2 Tap Zones

| Area       | Action                |
| ---------- | --------------------- |
| Center     | Toggle UI             |
| Left/Right | Navigation (optional) |

### Rules:

- Response must be instant (<50ms perceived)
- No animation before action

---

## 4.3 Scroll Behavior

- Native scroll only
- No scroll smoothing hacks
- No scroll animation wrappers

---

# 5. UI LAYER SYSTEM

## 5.1 Layer Priority

1. Content (highest priority)
2. Gesture layer
3. Overlay UI
4. Background

---

## 5.2 Overlay Rules

### MUST:

- Appear fast (≤150ms)
- Be dismissible instantly

### MUST NOT:

- Animate aggressively
- Block reading unnecessarily

---

## 5.3 Navigation UI

- Must feel lightweight
- Must not lag behind scroll
- Avoid opacity transitions

---

# 6. PERFORMANCE RULES

## 6.1 Rendering

- Avoid unnecessary re-renders
- Use memoization where needed
- Avoid state changes during scroll

---

## 6.2 Animation Performance

- No JS-based animation on scroll
- No physics calculation per frame (unless gesture)

---

## 6.3 Image Loading

- Use proper sizing
- Avoid layout thrashing
- Batch loading when possible

---

# 7. CODE CONSTRAINTS

## 7.1 Tailwind Restrictions

### BANNED:

- duration-300+
- transition-all
- animate-in / fade-in
- ease-in-out (for content)

### ALLOWED:

- duration-100 / 150 / 200
- transition-opacity (UI only)
- transition-transform (UI only)

---

## 7.2 Framer Motion Rules

### ALLOWED:

- Gesture handling only

### FORBIDDEN:

- Layout animations
- Auto animations
- Scroll-based animations

---

## 7.3 React Rules

- Avoid state-driven animation
- Avoid unnecessary effects
- Prevent re-render loops

---

# 8. COMPONENT STANDARDS

## 8.1 ReaderImage

- No animation
- Stable layout
- Instant render

---

## 8.2 ReaderProgress

- No spring
- Direct mapping to scroll

---

## 8.3 ReaderShell

- Minimal overlay animation
- Fast toggle

---

## 8.4 EndOfChapter

- Static
- No entrance animation

---

# 9. ANTI-PATTERNS

## NEVER DO THIS:

- Animate content entering viewport
- Use animation to “hide loading”
- Add motion for aesthetics
- Delay UI response for smoothness
- Stack multiple animations simultaneously

---

# 10. DESIGN VALIDATION CHECKLIST

Before merging any UI change:

- [ ] Does this animation affect reading flow?
- [ ] Is it strictly necessary?
- [ ] Is duration ≤ allowed limit?
- [ ] Does it cause layout shift?
- [ ] Does it run during scroll?
- [ ] Can it be removed without UX loss?

If any answer is questionable → REMOVE IT

---

# FINAL PRINCIPLE

A perfect reader should feel like:

> “Nothing is happening… except reading.”

If user notices the UI → the system failed.
