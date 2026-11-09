# RDR-08 — Reader / HistoryRestore

**Priority:** P1 | **Evidence:** REQUIRES_QA | **Track:** F05

**Locate:** Reader → HistoryRestore → `resume toast vs image position`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3753.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3803.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E35_reader_resume_toast.jpg

**Observation:** Resume toast `hal. 4` berbeda dari `Hal. 2/23`: , .

**Proposed fix direction (unapproved):** Reproduksi setelah seluruh gambar dimuat, verifikasi progress scroll, image index, history; jangan menyatakan bug sebelum tes.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
