# Yomirra UX & Design Architecture

This document formalizes the UX principles and architectural design decisions that power Yomirra, established through deep design tree analysis.

## 1. The Entry Experience: Home vs Library

We prioritize **maximum re-entry speed over content density.** The entry experience optimizes for one action: "Resume reading instantly."

### Landing Strategy
- **Home Dashboard:** The app opens to a dedicated Home dashboard, NOT the Library. 
- **Informative Layout:** The hero section uses a horizontal layout for "Lanjut Baca" (Continue Reading) to balance speed with information density. Giant single-item heroes are avoided to ensure multiple options are visible.
- **Dynamic Feeds:** Quick access to enabled sources via horizontal rows below the history.
- **Auto-Resume (Enhancement):** If the user reopens the app within a short window (<30 mins), skip Home entirely and drop directly into the reader.

## 2. Discovery Model: The High-Speed Router

Yomirra is not a catalog; it is a high-speed router. We do NOT build a heavy, unified discovery layer. We let sources own discovery.

- **Primary Discovery:** Source-scoped browsing. The user taps "Sources", selects a source (e.g., Shinigami), and sees a lightweight horizontal feed ("Popular Today", "Latest Updates"). 
- **Global Search:** The primary shortcut for users who already know what they want to read. Flat results, grouping subtly by source. Filtering is hidden behind an "Advanced" escape hatch.
- **Updates Tab:** Strictly personal. A chronological feed of new chapters for manga in the user's library. Not for trending or popular content.

## 3. The Continuous Streaming Engine

The reader is a controlled streaming model with an adaptive loading strategy. Naive infinite scroll is avoided.

- **Auto-Append:** The next chapter is automatically appended inline without a route transition or blocking UI.
- **Chapter Boundary:** A minimal, non-blocking divider (e.g., a fading "Chapter 43" label). No full-screen end cards.
- **URL Behavior:** `history.replaceState` updates the URL silently to preserve back-button logic without triggering re-renders.
- **Virtualization & Memory Management:** Unmount older chapters from the DOM while preserving scroll position and height maps. Ensure a sliding window of chapters (Current ± 1-2).

## 4. The Interaction Model: Gesture-Safe UI

The UI must be intentionally summoned and never accidentally triggered during aggressive scrolling.

- **Tap vs Scroll Disambiguation:** A touch is a tap ONLY IF movement is ≤ 10px and duration is ≤ 250ms. Any further movement cancels tap detection and classifies as a scroll.
- **Hitbox Zones:** Center 40% is the primary interaction zone for toggling the overlay. Top 30% and Bottom 30% are pure reading interaction zones (tap to scroll).
- **Auto-Dismiss:** Any scroll input triggers an immediate fade-out of the overlay UI.

## 5. Resilient Error Handling

Failed images must feel like a temporary gap in the stream, not a broken state. The system attempts to heal itself before asking the user to act.

- **Layout Stability:** Image containers must reserve space before load (using known dimensions or an estimated webtoon-safe fallback ratio). Never collapse failed images.
- **Silent Retry:** Auto-retry with bounded exponential backoff (e.g., 1s, 2.5s, 5s) while showing a skeleton/blur placeholder.
- **Page-Level Failure:** If retries fail, show a muted dark placeholder with a subtle reload affordance. Tap to force refetch. No red errors.
- **Section-Level Escalation:** If ≥ 3 consecutive images fail, escalate to a single inline block collapsing the repeated placeholders to prevent visual spam.
