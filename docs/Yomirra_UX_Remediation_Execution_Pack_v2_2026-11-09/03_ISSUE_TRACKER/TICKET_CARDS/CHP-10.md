# CHP-10 — Chapter picker / ChapterSheet / LongList

**Priority:** P2 | **Evidence:** REQUIRES_QA | **Track:** F06

**Locate:** Chapter picker → ChapterSheet / LongList → `search and sort interaction with large chapter count`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3761.png, 09_VISUAL_EVIDENCE/screenshots/IMG_3762.png
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E07_chapter_sheet_header.jpg, 09_VISUAL_EVIDENCE/focus_regions/E08_chapter_active.jpg

**Observation:** 172-number grid is shown but performance, search state, and active-item anchoring are not demonstrated.

**Proposed fix direction (unapproved):** Test open at active chapter, sort flip, search, dismiss and reopen; no unexpected reset of reader scroll.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
