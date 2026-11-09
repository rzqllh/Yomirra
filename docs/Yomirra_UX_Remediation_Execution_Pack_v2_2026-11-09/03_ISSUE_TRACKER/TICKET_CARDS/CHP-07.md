# CHP-07 — Reader / Chapter picker / ReaderSettings / Direction

**Priority:** P1 | **Evidence:** REQUIRES_QA | **Track:** F11

**Locate:** Reader / Chapter picker → ReaderSettings / Direction → `Kiri ke Kanan vs Kanan ke Kiri`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3764.png
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E10_reader_settings_control.jpg

**Observation:** `Arah baca Kiri ke Kanan/Kanan ke Kiri` muncul tanpa konteks vertical/paged mode: .

**Proposed fix direction (unapproved):** Konfirmasi apakah paged reading memang ada; hide/disable setting tidak relevan dalam vertical-only reader.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
