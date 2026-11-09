# SYS-10 — Shared shell / StickyHeader / ScrollSurface

**Priority:** P2 | **Evidence:** VISUAL_OR_OWNER_CONFIRMED | **Track:** F03

**Locate:** Shared shell → StickyHeader / ScrollSurface → `heading clipped vs content scroll`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3776.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3795.png, 09_VISUAL_EVIDENCE/screenshots/IMG_3797(1).png
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E28_help_dock.jpg, 09_VISUAL_EVIDENCE/focus_regions/E30_settings_account.jpg

**Observation:** Header and subtitle on several routes visibly ellipsize; determine whether wrapping or available width is the source of the loss of meaning.

**Proposed fix direction (unapproved):** Define semantic truncation budget for title/subtitle, ensure full important label discoverability and eliminate gratuitous clipping.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
