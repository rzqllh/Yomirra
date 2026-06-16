# ⚡ Zero-Latency Gesture Architecture

## High-Speed Manga Reader Engine (Yomirra)

---

## 1. OBJECTIVE

Design a gesture system that feels:

- **Instant (no delay perception)**
- **Predictable (no surprise transitions)**
- **Non-blocking (never interrupts reading flow)**

Primary principle:

> **User input must map directly to visual output without animation lag.**

---

## 2. CORE PRINCIPLES

### 2.1 Direct Manipulation (MANDATORY)

- Every gesture MUST directly affect UI state
- No delayed animation between input → response

BAD:

- Tap → wait → animate

GOOD:

- Tap → immediate state change

---

### 2.2 No Gesture-Induced Latency

- No debounce on core gestures
- No artificial easing on scroll/drag
- Avoid `setTimeout`, `delay`, or chained animations

---

### 2.3 Gesture Priority Hierarchy

| Priority | Gesture           | Behavior              |
| -------- | ----------------- | --------------------- |
| 1        | Scroll (vertical) | MUST NEVER be blocked |
| 2        | Tap (center)      | UI toggle             |
| 3        | Horizontal swipe  | Navigation (optional) |
| 4        | Pinch / Zoom      | Transform layer only  |

---

### 2.4 Isolation Rule

Each gesture must operate on **independent layers**:

- Scroll → document flow
- Zoom → transform layer (NOT layout)
- UI overlay → absolute layer

NEVER mix them.

---

## 3. GESTURE SYSTEM DESIGN

---

### 3.1 Vertical Scroll (PRIMARY ENGINE)

**Facts:**

- This is the main reading interaction

**Rules:**

- Native scroll ONLY (no JS scroll hijacking)
- No scroll-linked animations
- No `useSpring` or interpolation

**Implementation:**

```tsx
<div className="overflow-y-auto">
```

**Forbidden:**

- scroll smoothing
- parallax
- scroll-triggered fades

---

### 3.2 Tap Gesture (UI Toggle)

**Zones:**

```
[ LEFT ] [ CENTER ] [ RIGHT ]
```

| Zone   | Action                      |
| ------ | --------------------------- |
| Left   | Previous chapter (optional) |
| Center | Toggle UI                   |
| Right  | Next chapter (optional)     |

---

**Zero-Latency Rule:**

- UI must appear instantly (<16ms)
- NO fade-in required

Optional:

```css
transition: opacity 120ms ease-out;
```

---

### 3.3 Overlay System (ReaderShell)

**Layering:**

```tsx
<div className="relative">
  <ReaderContent />
  <ReaderOverlay className="absolute inset-0 pointer-events-none" />
</div>
```

**Rules:**

- Overlay must NOT reflow layout
- Overlay must NOT block scroll unless active
- Use `pointer-events` toggle

---

### 3.4 Pinch-to-Zoom (Advanced Gesture)

**Only place where physics is allowed**

---

#### Architecture:

```tsx
<motion.div
  style={{ x, y, scale }}
  drag
  dragMomentum={false}
  dragElastic={0}
>
```

---

#### Rules:

- Apply transform ONLY:
  - `scale`
  - `translateX`
  - `translateY`

- NEVER:
  - change width/height
  - trigger re-layout

---

#### Constraints:

| Property | Limit   |
| -------- | ------- |
| scale    | 1 → 3   |
| velocity | clamped |
| bounce   | minimal |

---

#### Critical:

> Zoom must NOT affect scroll container

---

### 3.5 Swipe Navigation (OPTIONAL)

**Only if explicitly enabled**

---

#### Behavior:

- Horizontal swipe → chapter change

---

#### Rules:

- Must NOT conflict with vertical scroll
- Threshold-based trigger

```ts
if (abs(deltaX) > 80 && velocityX > threshold)
```

---

#### No animation chaining:

- Instant snap or fast transition (<150ms)

---

## 4. EVENT HANDLING STRATEGY

---

### 4.1 Passive Listeners

```ts
{
  passive: true;
}
```

**Reason:**

- Prevent scroll blocking

---

### 4.2 Avoid Re-render Triggers

BAD:

```tsx
setState on every touchmove
```

GOOD:

```tsx
useRef for continuous updates
```

---

### 4.3 RAF (Only if needed)

Use ONLY for:

- syncing transform updates

```ts
requestAnimationFrame(update);
```

---

## 5. PERFORMANCE CONSTRAINTS

---

### 5.1 Frame Budget

| Metric        | Target |
| ------------- | ------ |
| Input latency | < 16ms |
| Frame time    | < 16ms |
| FPS           | 60     |

---

### 5.2 Forbidden Patterns

- ❌ `useSpring` on scroll
- ❌ `transition-all`
- ❌ layout-based animation
- ❌ opacity animation on content
- ❌ scroll event heavy logic

---

## 6. RENDER LAYER MODEL

---

### Layer Separation:

```
[ Overlay Layer ]   → UI (buttons, nav)
[ Transform Layer ] → Zoomed image
[ Content Layer ]   → Scrollable pages
```

---

### Key Rule:

> Only ONE layer updates per gesture

---

## 7. FAIL-SAFE RULES

---

### 7.1 If FPS drops:

- Disable non-essential animations
- Fallback to static UI

---

### 7.2 If gesture conflict:

- PRIORITIZE scroll

---

### 7.3 If uncertainty:

```ts
// TODO: uncertain gesture conflict
```

---

## 8. FINAL CONTRACT

A valid implementation MUST:

- Feel **instant**
- Never block scroll
- Never shift layout mid-read
- Never animate core content
- Only animate **user-driven transforms**

---

## TL;DR

- Scroll = native, untouched
- Tap = instant
- Zoom = transform only
- Overlay = separate layer
- Animation = almost none

> If it looks “cool” but slows reading → REMOVE IT
