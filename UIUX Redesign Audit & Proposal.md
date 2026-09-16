# Yomirra — UI/UX Redesign Audit & Proposal

> Status: `AUDIT / PROPOSAL ONLY`
> Implementation: `NOT STARTED`
> Reference directory: `redesign-reference/`
> Source of truth: actual repository + runtime behavior
> Date:
> Auditor:

---

# 1. Executive Summary

## Current State
Ringkas kondisi Yomirra saat ini dalam 3–6 poin.

## Core Problems
Sebutkan masalah yang paling berdampak, bukan seluruh detail kecil.

## Proposed Direction
Ringkas arah redesign yang direkomendasikan.

## Overall Risk
`Low / Medium / High`

Reason:
- ...

---

# 2. Scope & Inventory

## Routes / Screens Found

| Screen / Route | Exists | Mobile | Tablet | Desktop | Reference Available | Audit Status |
|---|---:|---:|---:|---:|---:|---|
| Beranda | ✅ | ✅ | ? | ? | ✅ | Pending |
| Library | | | | | | |
| Bookmark | | | | | | |
| Cari | | | | | | |
| Sources | | | | | | |
| Manga Detail | | | | | | |
| Reader | | | | | | |
| Reader Settings | | | | | | |
| Chapter List | | | | | | |
| Settings | | | | | | |
| Updates | | | | | | |
| Popular | | | | | | |
| Backup / Restore | | | | | | |
| Other | | | | | | |

Tambahkan semua route/screen lain yang ditemukan di repo.

---

# 3. Component Inventory

| Component | Used By | Current Role | Reusable? | Problem | Proposed Action |
|---|---|---|---:|---|---|
| BottomDock | | | | | |
| PageHeader | | | | | |
| SettingsSection | | | | | |
| SettingsItem | | | | | |
| Modal / Dialog | | | | | |
| Bottom Sheet | | | | | |
| Segmented Control | | | | | |
| Button | | | | | |
| Icon Button | | | | | |
| Input | | | | | |
| Chip / Badge | | | | | |

Flag jika:
- component terlalu page-specific
- duplicate
- punya variant tidak konsisten
- seharusnya menjadi shared primitive

---

# 4. Verified Findings

Hanya masukkan fakta yang benar-benar sudah diverifikasi dari:
- code
- runtime
- screenshot/reference
- actual navigation/state

Format:

### V-001 — [Judul Temuan]
**Area:**  
**Evidence:**  
**Current behavior:**  
**Impact:**  
**Related files/components:**  

### V-002 — ...
...

---

# 5. Inferred Issues

Masukkan asumsi atau dugaan yang masuk akal tetapi belum sepenuhnya terbukti.

### I-001 — [Judul]
**Observation:**  
**Inference:**  
**Why it matters:**  
**How to verify:**  

Jangan tulis inference sebagai fakta.

---

# 6. Information Architecture Audit

## Current IA
Jelaskan struktur navigasi aktual.

## Proposed Mobile Primary Navigation

- Beranda
- Library
- Bookmark
- Cari

## Settings
Proposed role:
- secondary destination
- accessible from top-level header/profile utility
- not part of bottom dock

## Secondary Destinations
Audit placement untuk:
- Updates
- Popular
- Sources
- Downloads
- Settings
- Backup
- other utilities

## Findings
Apa yang redundant, misplaced, atau terlalu tersembunyi?

---

# 7. Bottom Navigation Audit

## Current
Jelaskan actual implementation.

## Problems
- ...

## Proposed
`Beranda / Library / Bookmark / Cari`

## Active State
Jelaskan:
- icon behavior
- label behavior
- selected surface
- motion
- hit target
- safe-area handling

## Desktop / Tablet Adaptation
Jelaskan apakah:
- bottom dock berubah menjadi top nav
- sidebar
- navigation rail
- atau pattern lain

Jangan copy mobile dock mentah ke desktop.

---

# 8. Global Visual Direction

## Direction
`Modern Editorial Utility`

## Characteristics
- ...
- ...

## Avoid
- Material / Google Settings look
- excessive nested cards
- excessive glass
- random gradients
- arbitrary pills
- equal visual weight everywhere
- decorative UI tanpa functional hierarchy

---

# 9. Geometry / Squircle System

## Principle
Seluruh aplikasi menggunakan squircle / square-circle geometry sebagai default visual language.

## Proposed Radius Tokens

| Token | Intended Use | Value / Formula |
|---|---|---|
| radius-xs | | |
| radius-sm | | |
| radius-md | | |
| radius-lg | | |
| radius-xl | | |
| radius-sheet | | |

## Nested Radius Formula
Example:

`R_child = max(R_parent - inset, R_min)`

Jelaskan actual recommendation berdasarkan spacing/token repo.

## Full Circle Exceptions
Hanya jika memang secara geometris perlu:
- toggle thumb
- status dot
- spinner
- progress handle
- etc.

Catat semua penggunaan `rounded-full` existing yang perlu diaudit.

---

# 10. Typography Hierarchy

| Role | Usage | Size | Weight | Line Height | Example |
|---|---|---:|---:|---:|---|
| Display | | | | | |
| Page Title | | | | | |
| Section Title | | | | | |
| Card Title | | | | | |
| Body | | | | | |
| Secondary | | | | | |
| Caption | | | | | |
| Metadata | | | | | |

Pastikan hierarchy tidak hanya mengandalkan font-weight.

---

# 11. Spacing & Layout System

## Spacing Tokens
Propose consistent spacing scale.

## Mobile
- horizontal page margin:
- section gap:
- card padding:
- row padding:
- control gap:

## Tablet
...

## Desktop
...

## Density Rule
Jelaskan kapan UI boleh compact dan kapan harus spacious.

---

# 12. Semantic Color System

## Core Palette

| Role | Light | Dark | Usage |
|---|---|---|---|
| Background | | | |
| Surface Base | | | |
| Surface Raised | | | |
| Surface Overlay | | | |
| Glass | | | |
| Text Primary | | | |
| Text Secondary | | | |
| Text Muted | | | |
| Border | | | |
| Accent | | | |
| Success | | | |
| Warning | | | |
| Error / Destructive | | | |
| Info | | | |

---

# 13. Visual Hierarchy by Variant

## Primary / Accent

### Usage
Dipakai untuk:
- primary CTA
- selected navigation
- focused state
- selected segmented option
- progress penting

### Do Not Use For
- decorative icon random
- every card
- secondary labels

### States

| State | Background | Text/Icon | Border | Elevation |
|---|---|---|---|---|
| Default | | | | |
| Hover | | | | |
| Active | | | | |
| Focus | | | | |
| Disabled | | | | |

---

## Secondary

Isi aturan yang sama.

---

## Glass / Frosted

Jelaskan:
- kapan boleh digunakan
- kapan tidak
- blur amount
- opacity logic
- fallback jika backdrop-filter unavailable
- contrast requirement

---

## Destructive

Cakup:
- button
- text action
- destructive modal
- confirmation hierarchy

Harus beda jelas dari Primary.

---

## Success / Warning / Info
Buat rule yang sama.

---

# 14. Component Variant Matrix

| Component | Primary | Secondary | Ghost | Glass | Destructive | Disabled | Loading |
|---|---:|---:|---:|---:|---:|---:|---:|
| Button | ✅ | ✅ | ✅ | ? | ✅ | ✅ | ✅ |
| Icon Button | | | | | | | |
| Chip | | | | | | | |
| Segmented Control | | | | | | | |
| List Action | | | | | | | |
| Modal CTA | | | | | | | |
| Reader Control | | | | | | | |

Catat variant yang sebenarnya dibutuhkan.
Jangan bikin variant hanya karena “mungkin nanti”.

---

# 15. State System

Audit visual dan behavior untuk:

| State | Current | Problem | Proposed |
|---|---|---|---|
| Default | | | |
| Hover | | | |
| Pressed | | | |
| Focus | | | |
| Selected | | | |
| Disabled | | | |
| Loading | | | |
| Success | | | |
| Warning | | | |
| Error | | | |
| Offline | | | |
| Syncing | | | |
| Empty | | | |
| Current Chapter | | | |
| Saved | | | |
| Muted | | | |

---

# 16. Page-by-Page Audit

Gunakan format yang sama untuk setiap screen.

---

## 16.x — [PAGE NAME]

### Current Purpose
Apa fungsi page ini sekarang.

### Verified Current Behavior
- ...

### Current Problems

#### UX
- ...

#### Visual
- ...

#### Layout
- ...

#### Responsive
- ...

#### Accessibility
- ...

### Reference Review
Reference file(s):
- `redesign-reference/...`

Yang bagus dari reference:
- ...

Yang jangan ditiru mentah:
- ...

### Proposed Redesign
Jelaskan komposisi layar dari atas ke bawah.

### Keep
Fitur/behavior yang tetap.

### Move
Yang dipindahkan ke tempat lebih tepat.

### Merge
Yang sebaiknya digabung.

### Remove Candidate
Hanya proposal.
**Tidak boleh dieksekusi tanpa approval.**

### Unknown / Needs Validation
- ...

### Implementation Impact
Files/components kemungkinan terdampak:
- ...

### Risk
`Low / Medium / High`

---

Gunakan section di atas untuk minimal:

### Beranda
Audit:
- continue reading
- Sorotan & Peringkat
- source selector
- ranking
- header
- bottom nav

### Library
Audit:
- active source
- search/filter
- latest read
- following
- saved/downloaded
- grid/list

### Bookmark
Audit:
- saved manga
- collection
- reading state
- create/edit collection

### Cari
Audit:
- multi-source semantics
- result grouping
- source filters
- sort
- genre/status filters

### Sources
Audit:
- active source
- installed source
- health
- version/update
- source actions

### Manga Detail
Audit:
- artwork
- cover
- title/meta
- CTA
- progress
- actions
- synopsis
- genre
- chapter list

### Reader
Audit:
- immersive reading
- top overlay
- progress
- controls
- auto-hide
- gestures
- safe area

### Reader Settings
Audit:
- background
- fit
- spacing
- direction
- navigation
- preload
- wake lock
- progress

### Chapter List
Audit:
- current chapter
- search
- sorting
- metadata

### Settings
Audit:
- account
- quick settings
- preferences
- update
- privacy
- storage
- about

Tambahkan page lain yang ditemukan.

---

# 17. Settings IA Proposal

## Settings Home
Tentukan informasi yang cukup tampil di dashboard utama.

## Quick Settings
Candidate:
- Theme
- Data Saver
- Sync
- Notification

Validasi berdasarkan actual usage.

## Sections

### Akun & Sinkronisasi
...

### Preferensi Tampilan
...

### Pembaruan & Notifikasi
...

### Konten & Keamanan
...

### Data & Penyimpanan
...

### Tentang
...

## Candidate to Move Out
Contoh:
- collection management → Bookmark/collection domain
- navigation shortcuts → proper navigation
- etc.

Semua masih proposal sampai approval.

---

# 18. Modal / Dialog / Sheet System

## Modal Families

### Confirmation
Use case:
Structure:
Actions:

### Destructive Confirmation
Use case:
Structure:
Actions:

### Information Dialog
...

### Bottom Sheet
...

### Reader Sheet
...

### Full / Near-Full Sheet
...

## Shared Anatomy
Definisikan:
- header
- title
- description
- close affordance
- body
- footer
- action ordering
- spacing
- motion

---

# 19. Copywriting Audit

Audit:
- terminology consistency
- CTA wording
- destructive copy
- confirmation copy
- empty-state copy
- reader terminology
- source terminology
- Library vs Bookmark terminology

## Terminology Table

| Concept | Current Terms Found | Proposed Canonical Term |
|---|---|---|
| Save | | |
| Collection | | |
| Reading Progress | | |
| Source | | |
| Search | | |
| Update | | |

---

# 20. Responsive / Adaptive Strategy

## Small Mobile
`<...>`

## Large Mobile / iPhone
`<...>`

## Tablet
`<...>`

## Desktop
`<...>`

Audit:
- navigation pattern
- max content width
- number of columns
- sheet vs side panel
- hover/focus availability
- keyboard navigation
- reader desktop panel

---

# 21. iOS PWA / Safe Area Audit

## Current Behavior
...

## Problems
...

## Requirements

### Top
- `env(safe-area-inset-top)`
- Dynamic Island / status bar
- overlay/scrim behavior

### Bottom
- `env(safe-area-inset-bottom)`
- home indicator
- bottom dock
- reader control spacing

### Reader
Jelaskan full-bleed image vs interactive chrome.

### Installed PWA vs Browser
Audit behavior difference jika ada.

---

# 22. Accessibility Audit

Minimum checks:
- contrast
- semantic HTML
- aria labels
- keyboard navigation
- focus visible
- hit target
- reduced motion
- readable font size
- destructive confirmation
- sheet focus trap
- scroll locking

## Findings
...

---

# 23. Motion & Interaction

## Global Motion Principles
- ...

## Navigation Transition
...

## Modal / Sheet
...

## Selection
...

## Reader Overlay
...

## Reduced Motion
...

Jangan tambahkan animation hanya untuk dekorasi.

---

# 24. Hydration Mismatch Investigation

## Known Area
`MangaHeaderActions`

## Observed Server State
...

## Observed Client State
...

## Root Cause
`Verified / Inferred`

## Correct Fix Options

### Option A
...

### Option B
...

## Rejected Fix
Examples:
- `suppressHydrationWarning` tanpa menyelesaikan source mismatch
- client-only hacks tanpa alasan

## Recommended Fix
...

## Risk
...

---

# 25. Redundant / Misplaced Feature Candidates

| Feature | Current Location | Problem | Proposed Action | Confidence | Approval Needed |
|---|---|---|---|---|---|
| | | | Move / Merge / Keep / Remove Candidate | | ✅ |

Jangan hapus apa pun di tahap ini.

---

# 26. Technical Design-System Proposal

## Existing Tokens to Reuse
...

## Existing Tokens to Change
...

## New Tokens Actually Required
...

## Tokens to Deprecate
...

## Shared Components to Refactor
...

## Components to Merge
...

## Components to Leave Alone
...

Tujuan:
**jangan menciptakan design system paralel.**

---

# 27. Migration Strategy

## Phase A — Foundations
Examples:
- color tokens
- radius
- spacing
- typography
- shared primitives

## Phase B — Navigation / Shell
...

## Phase C — Core Screens
...

## Phase D — Reader
...

## Phase E — Modal / States
...

## Phase F — Cleanup
...

Untuk setiap phase:
- scope
- dependencies
- risk
- verification

---

# 28. Regression Risks

| Risk | Area | Severity | Prevention |
|---|---|---|---|
| | | Low/Medium/High | |

Cakup:
- navigation behavior
- store state
- hydration
- reader gestures
- responsive UI
- source-specific logic
- PWA behavior

---

# 29. Proposed Decisions

Gunakan format:

### D-001 — [Decision]
**Status:** Proposed  
**Problem:**  
**Proposal:**  
**Why:**  
**Alternatives considered:**  
**Impact:**  
**Approval required:** Yes  

### D-002
...

---

# 30. Approval Required

Tuliskan hanya keputusan yang memang perlu user putuskan sebelum implementasi.

Format:

### A-001
**Decision needed:**  
**Recommended:**  
**Alternative:**  
**Impact if approved:**  

Jangan lanjut implementasi sampai bagian ini di-review.

---

# 31. Recommended Implementation Order

Setelah approval, urutkan implementasi berdasarkan dependency dan risiko.

Contoh:

`tokens → primitives → navigation → page shell → core pages → reader → modal/sheets → states → cleanup`

Berikan alasan jika urutannya berbeda.

---

# 32. Verification Plan

Sebelum redesign dianggap selesai, minimum verification harus mencakup:

## Visual
- reference comparison
- responsive
- light/dark
- squircle consistency
- hierarchy
- contrast

## Functional
- navigation
- search
- Library
- Bookmark
- source switching
- reader
- reader settings
- chapter navigation
- account/sync
- backup

## Platform
- iOS PWA
- mobile browser
- tablet
- desktop

## Technical
- no hydration errors
- no console errors
- no broken route
- no state regression
- no inaccessible modal
- no unexpected layout shift

---

# 33. Final Verdict

## Keep
...

## Refactor
...

## Move
...

## Merge
...

## Candidate for Removal
...

## Highest Priority
...

## Lowest Priority
...

---

# STOP CONDITION

Setelah menghasilkan audit + redesign proposal ini:

**STOP.**

Jangan:
- mengedit file
- melakukan refactor
- mengubah token
- mengubah route
- menghapus fitur
- menjalankan migration redesign

Tunggu explicit approval user terlebih dahulu.