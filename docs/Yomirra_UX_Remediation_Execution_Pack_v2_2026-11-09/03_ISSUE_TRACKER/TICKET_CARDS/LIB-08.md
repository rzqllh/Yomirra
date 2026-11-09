# LIB-08 — Library / Library / ScopeCounter

**Priority:** P2 | **Evidence:** REQUIRES_QA | **Track:** F08

**Locate:** Library → Library / ScopeCounter → `saved count reconciliation`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3781.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3787.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E20_library_filter.jpg, 09_VISUAL_EVIDENCE/focus_regions/E23_library_saved_cover.jpg

**Observation:** 138 saved vs 136 automatic bucket; two items might be system collection, excluded states, or a data issue.

**Proposed fix direction (unapproved):** Document exact set semantics and compare to data; only fix counts if mismatch is reproduced.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
