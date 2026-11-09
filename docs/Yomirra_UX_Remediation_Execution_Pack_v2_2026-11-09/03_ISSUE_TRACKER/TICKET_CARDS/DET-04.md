# DET-04 — Comic detail / ComicChapterList

**Priority:** P1 | **Evidence:** REQUIRES_QA | **Track:** F06

**Locate:** Comic detail → ComicChapterList → `chapter count vs latest shown`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3765.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E11_detail_hero_actions.jpg

**Observation:** Detail menampilkan total 173 dan pada layar terlihat daftar berawal 155 meski sumber lain menampilkan latest 172. Bisa disebabkan scroll/paginasi/sort.

**Proposed fix direction (unapproved):** Tes hasil urutan, total chapter, chapter tertinggi, chapter khusus, serta sort, sebelum menuduh data mismatch.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
