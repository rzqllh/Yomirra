# RDR-07 — Reader / ReaderToast

**Priority:** P2 | **Evidence:** VISUAL_OR_OWNER_CONFIRMED | **Track:** F02

**Locate:** Reader → ReaderToast → `bookmark add/remove notification`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3759.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3760.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E06_reader_remove_toast.jpg, 09_VISUAL_EVIDENCE/focus_regions/E05_reader_bookmark_toast.jpg

**Observation:** Notification bookmark menggunakan success dan info styling berbeda, dengan block sangat besar: .

**Proposed fix direction (unapproved):** Kontrak toast compact dengan level info/success/error yang jelas dan copy objek `Judul disimpan`/`Dihapus dari simpanan`.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
