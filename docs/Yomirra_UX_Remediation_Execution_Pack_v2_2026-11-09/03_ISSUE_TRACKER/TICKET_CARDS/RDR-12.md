# RDR-12 — Reader / Reader / HistoryLink

**Priority:** P1 | **Evidence:** REQUIRES_QA | **Track:** F05

**Locate:** Reader → Reader / HistoryLink → `history 0% vs reader nonzero`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3754.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3780.png, 09_VISUAL_EVIDENCE/screenshots/IMG_3770.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E01_reader_dark_controls.jpg, 09_VISUAL_EVIDENCE/focus_regions/E19_library_history.jpg, 09_VISUAL_EVIDENCE/focus_regions/E13_home_continue.jpg

**Observation:** History shows chapter 152 at 0%; a reader image shows 3%. These are screenshots at different times and may not be synchronized.

**Proposed fix direction (unapproved):** Reproduce by reading, leaving, reopening, reloading; compare persisted % and restored scroll; do not claim mismatch from screenshots alone.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
