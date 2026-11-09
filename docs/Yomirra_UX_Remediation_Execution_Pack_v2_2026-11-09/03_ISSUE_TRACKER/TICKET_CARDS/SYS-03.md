# SYS-03 — Shared shell / PageHeader / Filters

**Priority:** P2 | **Evidence:** VISUAL_OR_OWNER_CONFIRMED | **Track:** F03

**Locate:** Shared shell → PageHeader / Filters → `long title, subtitle, selected value`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3776.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3781.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3782.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3783.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3794.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3763.png
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E20_library_filter.jpg, 09_VISUAL_EVIDENCE/focus_regions/E21_library_source_menu.jpg, 09_VISUAL_EVIDENCE/focus_regions/E27_search_result.jpg, 09_VISUAL_EVIDENCE/focus_regions/E09_reader_settings_scope.jpg

**Observation:** Header title/subtitle dan beberapa pilihan terpotong: , , , . Sebagian title tampak blur di screenshot; sebabnya belum diketahui.

**Proposed fix direction (unapproved):** Periksa actual text rendering; aturan 1/2 baris yang konsisten dan disclosure full label saat fokus; singkatkan copy sebelum truncating nilai penting.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
