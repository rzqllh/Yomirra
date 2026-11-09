# SET-04 — App settings / AppSettings / StorageMetrics

**Priority:** P2 | **Evidence:** VISUAL_OR_OWNER_CONFIRMED | **Track:** F11

**Locate:** App settings → AppSettings / StorageMetrics → `total bytes vs shown buckets`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3797(1).png
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E30_settings_account.jpg

**Observation:** `Penyimpanan terpakai 44.7MB`, 43.9MB cache, 0MB offline; total lainnya tidak terurai. Angka belum tentu salah.

**Proposed fix direction (unapproved):** Tampilkan kategori lain bila bermakna atau jelaskan total mencakup metadata/data lain. Gunakan satu istilah unit (`bab`, `berkas`, `gambar`) sesuai konteks.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
