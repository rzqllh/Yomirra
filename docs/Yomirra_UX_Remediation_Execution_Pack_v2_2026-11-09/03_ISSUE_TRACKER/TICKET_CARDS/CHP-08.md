# CHP-08 — Reader / Chapter picker / ReaderSettings / ScopeAndReset

**Priority:** P1 | **Evidence:** REQUIRES_QA | **Track:** F11

**Locate:** Reader / Chapter picker → ReaderSettings / ScopeAndReset → `per-title vs all, reset, override indicator`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3763.png
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E09_reader_settings_scope.jpg

**Observation:** `Khusus judul ini`, `Semua komik`, tanda bullet, `Reset ke default` belum menyatakan inheritance/override semantics.

**Proposed fix direction (unapproved):** Uji per-title/global precedence, reset scope, kapan data disimpan, dan visible override indicators.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
