# RDR-09 — Reader / ReaderImageLayout

**Priority:** P1 | **Evidence:** REQUIRES_QA | **Track:** F05

**Locate:** Reader → ReaderImageLayout → `lazy load + scroll anchor restoration`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3754.jpeg
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E01_reader_dark_controls.jpg

**Observation:** Perubahan tinggi gambar, font/viewport, atau lazy loading dapat menggeser posisi resume.

**Proposed fix direction (unapproved):** Uji position stability setelah reload/orientation/quality change/network slow; catat apakah lokasi baca kembali dengan presisi yang diterima.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
