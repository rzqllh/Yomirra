# SYS-02 — Shared shell / OverlayHost / Toast

**Priority:** P1 | **Evidence:** VISUAL_OR_OWNER_CONFIRMED | **Track:** F02

**Locate:** Shared shell → OverlayHost / Toast → `header collision + placement`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3753.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3759.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3760.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3803.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E06_reader_remove_toast.jpg, 09_VISUAL_EVIDENCE/focus_regions/E05_reader_bookmark_toast.jpg, 09_VISUAL_EVIDENCE/focus_regions/E35_reader_resume_toast.jpg

**Observation:** Toast menghalangi kontrol reader; , , .

**Proposed fix direction (unapproved):** Buat layout policy overlay: prioritas toast, header, modal, safe area, notifikasi. Tidak menutup navigasi primer; resume/toast memiliki posisi, ukuran, dan durasi yang sesuai.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
