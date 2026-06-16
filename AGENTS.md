# Yomirra Project Rules & Agent Guidelines

**Version:** 1.0.0
**Scope:** Yomirra Manga Reader (Next.js PWA)

This file defines the strict project-specific rules, philosophy, and design constraints for Yomirra. It overrides generic agent rules.

## 1. Core Philosophy: The High-Speed Reading Engine
* **Yomirra is a reading stream, not a content browser.** 
* The Reader IS the product. Any UX decision that interrupts the reading flow is a regression.
* Users are binge-readers of webtoons. They read 50-200+ chapters in a session and expect zero friction.
* Optimize for **speed over density**. Maximum re-entry speed is more important than a dense catalog of choices.

## 2. Interaction Model & Navigation
* **Zero Accidental UI Triggers:** The UI is hidden by default during reading. It is summoned via a strict center-zone tap (movement ≤ 10px, duration ≤ 250ms). Any vertical scroll input instantly hides the UI.
* **Auto-Append Continuous Stream:** Chapters are loaded inline automatically. No route transitions between chapters. A subtle inline divider separates chapters.
* **Progress Tracking:** A chapter is "read" only when its final boundary enters the viewport. Resume drops the user at their exact previously viewed image index.

## 3. Architecture & Discovery
* **Source-Driven Discovery:** Yomirra acts as a lightning-fast proxy to external sources. Discovery happens at the source level (e.g., browsing the Shinigami adapter feed), not via a heavy, unified internal aggregator.
* **Updates ≠ Discovery:** The Updates tab is strictly a chronological feed of new chapters for manga saved in the user's personal library.
* **Global Search:** Fast, intent-driven shortcut that queries enabled sources without deep tag filtering up front.

## 4. Engineering & UI Constraints
* **Layout Stability:** Failed images must NEVER collapse. Use estimated aspect ratios or known dimensions.
* **Self-Healing Error State:** Failed images retry silently (exponential backoff) before falling back to a layout-stable, muted placeholder requiring manual interaction. No glaring red errors.
* **Z-Index Layering:** Flat content layer (z: 0) and a summoned control layer. No persistent toolbars taking up screen real estate during active reading.

For deep-dive specifications on these principles, refer to the documentation in `/docs`.
