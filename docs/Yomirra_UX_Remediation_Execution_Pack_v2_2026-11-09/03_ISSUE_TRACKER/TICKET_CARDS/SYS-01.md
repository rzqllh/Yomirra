# SYS-01 — Shared shell / AppShell / BottomDock

**Priority:** P1 | **Evidence:** VISUAL_OR_OWNER_CONFIRMED | **Track:** F01

**Locate:** Shared shell → AppShell / BottomDock → `fixed position + page scroll end`

**Original screenshot:** 09_VISUAL_EVIDENCE/screenshots/IMG_3798(1).jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3799.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3800.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3795.png, 09_VISUAL_EVIDENCE/screenshots/IMG_3796.png, 09_VISUAL_EVIDENCE/screenshots/IMG_3766.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3767.png, 09_VISUAL_EVIDENCE/screenshots/IMG_3768.png, 09_VISUAL_EVIDENCE/screenshots/IMG_3770.jpeg, 09_VISUAL_EVIDENCE/screenshots/IMG_3780.png, 09_VISUAL_EVIDENCE/screenshots/IMG_3788.png
**Focus region:** 09_VISUAL_EVIDENCE/focus_regions/E31_settings_visual.jpg, 09_VISUAL_EVIDENCE/focus_regions/E32_settings_storage.jpg, 09_VISUAL_EVIDENCE/focus_regions/E33_settings_destructive.jpg, 09_VISUAL_EVIDENCE/focus_regions/E28_help_dock.jpg, 09_VISUAL_EVIDENCE/focus_regions/E29_help_technical.jpg, 09_VISUAL_EVIDENCE/focus_regions/E12_detail_chapter_rows.jpg, 09_VISUAL_EVIDENCE/focus_regions/E13_home_continue.jpg, 09_VISUAL_EVIDENCE/focus_regions/E19_library_history.jpg, 09_VISUAL_EVIDENCE/focus_regions/E24_schedule_cards.jpg

**Observation:** Floating bottom dock menutupi konten dan tombol: Settings , Help , Detail , Home , Library , Jadwal .

**Proposed fix direction (unapproved):** Setiap scroll container memiliki area akhir yang cukup agar semua elemen dapat di-scroll di atas dock + safe area; tidak ada CTA/teks yang terhalang pada posisi akhir.

## Required agent actions (one ticket per context)
- [ ] Open original and crop, verify symptom actually visible.
- [ ] Find **real** route/component and source path; record it. Names in this card are conceptual.
- [ ] Reproduce in app if possible; separate visual observation from code-proven cause.
- [ ] List every other page using the same shared primitive.
- [ ] Propose smallest **systemic, behavior-preserving** fix. Obtain owner authorization before modifying.
- [ ] After approval, capture matching before/after states and execute linked QA tests.
- [ ] Update tracker with evidence, status and any remaining open owner question.

**Current state:** BACKLOG_UNVALIDATED / NOT_APPROVED / UNRUN.
