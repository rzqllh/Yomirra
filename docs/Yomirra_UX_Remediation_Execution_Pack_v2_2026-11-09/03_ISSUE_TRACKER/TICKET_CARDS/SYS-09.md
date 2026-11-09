# SYS-09 — Shared shell / OverlayHost

**Priority:** P2 | **Evidence:** REQUIRES_QA | **Track:** F02

**Locate:** Shared shell → OverlayHost → `tap interception, focus, background scrolling`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3754.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3776.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3781.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E01_reader_dark_controls.jpg, 09_VISUAL_EVIDENCE/focus_regions/E20_library_filter.jpg

**Observation:** Floating dock dan large popover mungkin menangkap tap/sentuhan di area bawahnya.

**Proposed fix direction (unapproved):** Uji hit-testing, click-through, scroll-lock, escape/back, outside-click, keyboard focus, overscroll.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
