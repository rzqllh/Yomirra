# SYS-04 — Shared shell / PageContainer / SectionStack

**Priority:** P2 | **Evidence:** VISUAL_OR_OWNER_CONFIRMED | **Track:** F03

**Locate:** Shared shell → PageContainer / SectionStack → `section, card, row padding`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3754.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3776.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3781.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E01_reader_dark_controls.jpg, 09_VISUAL_EVIDENCE/focus_regions/E20_library_filter.jpg

**Observation:** Kerapatan layout tidak seragam: Reader dock padat; Settings cards terlalu besar; komponen search/filter kadang menumpuk.

**Proposed fix direction (unapproved):** Tetapkan spacing scale menurut level: page, section, card, row, control, inline text. Gunakan satu layout token system, jangan patch margin acak.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
