# YOMIRRA UX REMEDIATION — COMPREHENSIVE EXECUTION READINESS REPORT

> **Status:** AUTHORIZED EXECUTION IN PROGRESS (Wave 1)
> **Gate:** AUTONOMY: ON (Approved scope) | Scope lock: UI/UX remediation only
> **Governance:** XYN Persona Agent System | Controller: Ritsuka Xyn (`xyn-01-xyn`) | Independent QA: Rinne Xyn (`xyn-13-test`)
> **Artifact Reference:** See [`EXECUTION_TRACKER_88.md`](file:///C:/Users/Hafizh%20Rizqullah/.gemini/antigravity-cli/brain/5f36113d-659a-4455-ad54-86f662ae371b/EXECUTION_TRACKER_88.md) for individual ticket cards.

## 1. Executive Summary & Audit Pack Reconciliation
Paket audit `Yomirra_UX_Remediation_Execution_Pack_v2_2026-11-09` telah diperiksa secara menyeluruh (read-only).
- **Total Tiket Diverifikasi:** Tepat **88 tiket** (tidak ada tiket yang diabaikan atau disampel diam-diam).
- **Distribusi Disposisi:**
  - `FIX`: **55 tiket** — Masalah visual/interaksi yang terkonfirmasi langsung di kode sumber dan memiliki rancangan perbaikan terukur tanpa risiko data.
  - `QA_REQUIRED`: **17 tiket** — Klaim anomali/desinkronisasi yang wajib direproduksi di runtime sebelum menyentuh kode (misal presisi scroll restoration, counter 138 vs 136).
  - `PRODUCT_DECISION`: **16 tiket** — Keputusan semantik produk yang tidak boleh diputuskan sepihak oleh agent (Grillme terlampir di Bab 5).
  - `NOT_REPRODUCIBLE`: **0** | `DUPLICATE`: **0** | `OUT_OF_SCOPE`: **0**.

### Reconciled Area Matrix (Exact Balanced Accounting)
| Area Teknis | Total Tiket | FIX | QA_REQUIRED | PRODUCT_DECISION |
|---|---|---|---|---|
| **Area 1: Shared Foundation** (Shell, layout, safe area, overlay, dock) | 6 | 5 | 1 | 0 |
| **Area 2: Shared UI Primitives** (Button, dropdown, toast, modal, typography) | 4 | 4 | 0 | 0 |
| **Area 3: Reader Engine & Navigation** (Reader HUD, scrubber, chapter drawer, settings) | 22 | 10 | 6 | 6 |
| **Area 4: Discovery, Catalog & Library** (Home, Search, Explore, Popular, Library) | 26 | 19 | 3 | 4 |
| **Area 5: Detail Komik & Weekly Schedule** (Hero, chapter list, day strip, auto schedule) | 12 | 6 | 4 | 2 |
| **Area 6: Settings, Onboarding, Notifications & Help** (Settings rows, data actions, FAQ) | 17 | 11 | 2 | 4 |
| **Area 7: Accessibility, Responsive & Performance** (Dynamic type, streaming suspense) | 1 | 0 | 1 | 0 |
| **GRAND TOTAL** | **88** | **55** | **17** | **16** |
*Reconciliation verification: 55 + 17 + 16 = 88. 100% matched across all technical areas.*


## 2. Root-Cause Analysis: 5 Live Feedback Items (Mobile Preview)
### Item 1: Mobile Onboarding Vertical Scroll Lock
- **Observed Behavior:** Di layar ponsel (360px-400px), overlay onboarding dapat di-scroll vertikal, memotong konsistensi posisi cover dan CTA.
- **Root Cause:** `src/components/overlays/onboarding-overlay.tsx:190` menggunakan `min-h-dvh flex-col overflow-y-auto`. Deck cover buku (`w-56 aspect-[2/3]` = tinggi 336px) ditambah teks dan header melebihi tinggi layar ponsel 667-844px.
- **Proposed Fix:** Terapkan responsive cover scaling khusus mobile (`max-h-[30vh]` atau `w-40 sm:w-56 md:w-72`), kunci `overflow-hidden` pada container slide di mobile, dan pertahankan layout viewport 100dvh yang stabil tanpa bouncing/scrolling.

### Item 2: Mobile CTA Button Clipping di 360px/400px
- **Observed Behavior:** Tombol `Lanjut →` di sudut kanan bawah terpotong atau terdesak keluar pada lebar 360-400px (bukti: `uploaded_media_0`).
- **Root Cause:** Container navigasi bawah (`onboarding-overlay.tsx:372-427`) membagi ruang horizontal antara 3 pill dot (`size-11` touch target) dan tombol `Lanjut` (`flex-1 min-h-11 sm:w-44`) dengan padding horizontal `px-6` + safe-area insets, menyebabkan tombol overflow saat teks panjang.
- **Proposed Fix:** Optimalkan padding horizontal container mobile menjadi `px-4`, gunakan flex layout yang resilient dengan min-width touch target 44px tanpa overflow.

### Item 3: Hint Navigasi Keyboard di Mobile/Tablet
- **Observed Behavior:** Di mobile/tablet muncul teks `Gunakan tombol panah keyboard ← → untuk navigasi cepat` (bukti: `uploaded_media_1`).
- **Root Cause:** `onboarding-overlay.tsx:448` menggunakan media query `hidden [@media(hover:hover)_and_(pointer:fine)]:flex`. Pada mobile preview devtools desktop atau perangkat hybrid, kueri ini mengevaluasi `true` sehingga menampilkan instruksi keyboard yang tidak relevan.
- **Proposed Fix:** Gunakan pengecekan gesture/pointer yang benar: hanya tampilkan keyboard tip pada `md:flex` (desktop non-touch breakpoint), dan tampilkan swipe/tap affordance yang natural pada mobile.

### Item 4: Tombol Pengaturan di Header Menyala Sendiri
- **Observed Behavior:** Tombol gear di header dan baris "Pengaturan" di dropdown popover aktif dengan warna merah/pink terang padahal sedang di Beranda (bukti: `uploaded_media_2` & `3`).
- **Root Cause:** `src/components/chrome/header-actions.tsx`: 
  - Baris 73-75: Trigger button diberi style `isMenuOpen ? "border-accent/30 bg-accent/15 text-accent" : "..."` sehingga setiap kali menu dibuka, gear langsung berubah merah.
  - Baris 124: Link `<Link href="/settings" ...>` memiliki class hardcoded `text-accent bg-accent/10 font-bold` tanpa memeriksa `usePathname() === "/settings"`.
- **Proposed Fix:** Trigger button harus mempertahankan background netral saat menu dibuka (`bg-surface-hover/80 text-text-primary`), dan item menu "Pengaturan" hanya memiliki style active jika `pathname === "/settings"`.

### Item 5: Page Transition Sluggishness & Skeleton Streaming
- **Observed Behavior:** Pergantian antar halaman terasa lambat; user menginginkan shell halaman langsung ter-render dulu, baru konten berat dimuat via skeleton.
- **Root Cause:** Halaman server Next.js (seperti `src/app/(web)/popular/page.tsx:28-50` dan `browse/page.tsx`) meng-`await` fetch upstream multi-source secara synchronous di page root sebelum mengirimkan byte HTML ke client. Selain itu `src/app/(web)/loading.tsx:7` merender `<div className="sr-only">Loading...</div>` sehingga layar tampak membeku selama fetch berlangsung.
- **Proposed Fix:** 
  1. Perbaiki `loading.tsx` untuk menampilkan instant shell skeleton yang halus.
  2. Bungkus feed data upstream yang lambat ke dalam komponen server yang di-streaming melalui `<Suspense fallback={<FeedSkeleton />}>`.

### Item 6: Copywriting Provider-Neutrality
- **Observed Behavior:** Step 2 onboarding masih menyebut merek pihak ketiga `ala Webtoon vertikal` dan `Mode Webtoon vertikal & Paged reader`.
- **Proposed Fix:** Ganti seluruh terminologi pihak ketiga dengan standar netral Yomirra:
  - `ala Webtoon vertikal` → `Mode gulir vertikal mengalir`.
  - `Mode Webtoon vertikal & Paged reader` → `Mode baca vertikal & per-halaman`.

## 3. Comprehensive Mapping across 7 Technical Areas (All 88 Tickets)

### Area 1: Shared Foundation (App Shell, Layout, Safe Area, Overlay, Navigation)
| ID | Pri | Route / Page | Component & Element | Source File & Symbol | Disp | RC | Proposed Remediation & Target Criteria |
|---|---|---|---|---|---|---|---|
| **SYS-01** | `P1` | Shared shell | `AppShell / BottomDock` <br> fixed position + page scroll end | `src/components/chrome/bottom-dock.tsx` <br> `BottomDock` | `FIX` | `R1` | Setiap scroll container memiliki area akhir yang cukup agar semua elemen dapat di-scroll di atas dock + safe area; tidak ada CTA/teks yang terhalang pada posisi akhir. |
| **SYS-02** | `P1` | Shared shell | `OverlayHost / Toast` <br> header collision + placement | `src/components/ui/sonner.tsx` <br> `Toaster` | `FIX` | `R2` | Buat layout policy overlay: prioritas toast, header, modal, safe area, notifikasi. Tidak menutup navigasi primer; resume/toast memiliki posisi, ukuran, dan durasi yang sesuai. |
| **SYS-06** | `P2` | Shared shell | `BottomDock` <br> icons, active pill, search destination | `src/components/chrome/bottom-dock.tsx` <br> `BottomDock` | `FIX` | `R7` | Buat navigation contract: destinasi tetap, active state terprediksi, label aksesibel untuk setiap ikon, focus state jelas. |
| **SYS-09** | `P2` | Shared shell | `OverlayHost` <br> tap interception, focus, background scrolling | `src/components/ui/sheet.tsx` <br> `SheetOverlay` | `FIX` | `R2` | Uji hit-testing, click-through, scroll-lock, escape/back, outside-click, keyboard focus, overscroll. |
| **SYS-10** | `P2` | Shared shell | `StickyHeader / ScrollSurface` <br> heading clipped vs content scroll | `src/components/chrome/header.tsx` <br> `Header` | `FIX` | `R6` | Define semantic truncation budget for title/subtitle, ensure full important label discoverability and eliminate gratuitous clipping. |
| **SYS-11** | `P1` | Shared shell | `BottomDock / ExpandedOverlay` <br> raised overlay above bottom nav | `src/app/globals.css` <br> `--z-takeover / --z-modal` | `QA_REQUIRED` | `R2` | QA overlay stack: dock below active modal, pointer/focus confined where appropriate, background scroll contract. |

### Area 2: Shared UI Primitives (Button, Dropdown, Toast, Modal, Typography)
| ID | Pri | Route / Page | Component & Element | Source File & Symbol | Disp | RC | Proposed Remediation & Target Criteria |
|---|---|---|---|---|---|---|---|
| **SYS-03** | `P2` | Shared shell | `PageHeader / Filters` <br> long title, subtitle, selected value | `src/components/chrome/header.tsx` <br> `Header` | `FIX` | `R6` | Periksa actual text rendering; aturan 1/2 baris yang konsisten dan disclosure full label saat fokus; singkatkan copy sebelum truncating nilai penting. |
| **SYS-04** | `P2` | Shared shell | `PageContainer / SectionStack` <br> section, card, row padding | `src/components/ui/page-container.tsx` <br> `PageContainer` | `FIX` | `R6` | Tetapkan spacing scale menurut level: page, section, card, row, control, inline text. Gunakan satu layout token system, jangan patch margin acak. |
| **SYS-05** | `P2` | Shared shell | `SelectPopover` <br> source / sort menu dimensions & anchor | `src/components/ui/dropdown-menu.tsx` <br> `DropdownMenuContent` | `FIX` | `R2` | Gunakan family menu/combobox yang konsisten; menu harus tetap dalam viewport dan mempunyai max-height scroll. |
| **SYS-07** | `P2` | Shared shell | `InteractiveStates` <br> bookmark, active, destructive, loading | `src/components/ui/button.tsx` <br> `buttonVariants` | `FIX` | `R7` | Definisikan state dan semantics pada design tokens: active, selected, bookmarked, success, info, destructive, disabled, loading. |

### Area 3: Reader Engine, History Integrity, Chapter Navigation, Reader Settings
| ID | Pri | Route / Page | Component & Element | Source File & Symbol | Disp | RC | Proposed Remediation & Target Criteria |
|---|---|---|---|---|---|---|---|
| **RDR-01** | `P1` | Reader | `ReaderDock` <br> image arrows vs chapter arrows | `src/components/reader/reader-page-scrubber.tsx` <br> `ReaderPageScrubber` | `FIX` | `R3` | Bedakan fungsi melalui label/pengelompokan atau reorganisasi; tidak ada chapter skip yang mudah terjadi karena salah tekan. |
| **RDR-02** | `P1` | Reader | `ReaderProgress` <br> Hal. asset index vs scroll percent | `src/components/reader/continuous-vertical-reader.tsx` <br> `ContinuousVerticalReader` | `PRODUCT_DECISION` | `R3` | Mode vertikal menonjolkan `xx% dibaca`, bila perlu `Gambar x dari y` sebagai metadata. Paged mode boleh menampilkan `Halaman x/y`. Jangan klasifikasi mode hanya dari negara komik. |
| **RDR-03** | `P2` | Reader | `ReaderDock` <br> Progress label and inset | `src/components/reader/reader-shell.tsx` <br> `ReaderShell` | `FIX` | `R6` | Tambah internal padding, konsisten top/bottom rhythm, pisahkan progress text dan interactive control. |
| **RDR-04** | `P2` | Reader | `ReaderDock` <br> Daftar chapter button weight | `src/components/reader/reader-shell.tsx` <br> `ReaderShell` | `FIX` | `R3` | Kurangi visual weight; progress/resume jadi prioritas; daftar chapter tetap mudah ditemukan, namun tidak mendominasi keseluruhan dock. |
| **RDR-05** | `P2` | Reader | `ReaderMinimalMode` <br> arrow-to-top and percent badge | `src/components/reader/reader-view.tsx` <br> `ReaderView` | `FIX` | `R3` | Uji apakah tap badge interaktif; sediakan accessible name dan visibility preference sesuai kebutuhannya. |
| **RDR-06** | `P2` | Reader | `ReaderStatusBarOverlay` <br> top gradient over comic artwork | `src/components/reader/reader-shell.tsx` <br> `ReaderShell` | `QA_REQUIRED` | `R3` | Pastikan perlindungan status bar tidak mengurangi keterbacaan panel/teks komik; uji di artwork cerah dan gelap. |
| **RDR-07** | `P2` | Reader | `ReaderToast` <br> bookmark add/remove notification | `src/components/reader/reader-view.tsx` <br> `ReaderView` | `FIX` | `R2` | Kontrak toast compact dengan level info/success/error yang jelas dan copy objek `Judul disimpan`/`Dihapus dari simpanan`. |
| **RDR-08** | `P1` | Reader | `HistoryRestore` <br> resume toast vs image position | `src/shared/store/history-store.ts` <br> `useHistoryStore` | `QA_REQUIRED` | `R4` | Reproduksi setelah seluruh gambar dimuat, verifikasi progress scroll, image index, history; jangan menyatakan bug sebelum tes. |
| **RDR-09** | `P1` | Reader | `ReaderImageLayout` <br> lazy load + scroll anchor restoration | `src/components/reader/continuous-vertical-reader.tsx` <br> `ContinuousVerticalReader` | `QA_REQUIRED` | `R4` | Uji position stability setelah reload/orientation/quality change/network slow; catat apakah lokasi baca kembali dengan presisi yang diterima. |
| **RDR-10** | `P2` | Reader | `ReaderScrubber` <br> image navigation vs continuous progress | `src/components/reader/reader-page-scrubber.tsx` <br> `ReaderPageScrubber` | `PRODUCT_DECISION` | `R3` | Pertimbangkan scrub progress yang kontinu untuk vertical-scroll mode, sedangkan gambar hanya fallback; memerlukan keputusan owner. |
| **CHP-01** | `P2` | Reader / Chapter picker | `ChapterSheet` <br> heading, current chapter, grid | `src/components/reader/reader-chapter-drawer.tsx` <br> `ReaderChapterDrawer` | `FIX` | `R3` | Header `Daftar chapter`, jumlah, posisi aktif, dan urutan sort jelas. Grid numerik boleh tetap dipakai. |
| **CHP-02** | `P1` | Reader / Chapter picker | `ChapterSheet` <br> initial anchor and active item | `src/components/reader/reader-chapter-drawer.tsx` <br> `ReaderChapterDrawer` | `QA_REQUIRED` | `R3` | Saat membuka dari Reader, pastikan user mudah menuju chapter aktif; tes initial scroll dan sort. |
| **CHP-03** | `P2` | Reader / Chapter picker | `ChapterSheet` <br> sort icon + search field | `src/components/reader/reader-chapter-drawer.tsx` <br> `ReaderChapterDrawer` | `FIX` | `R3` | Label urutan aktif, sort state terdeskripsi; query chapter numerik, desimal, dan special episode bila dataset mendukung. |
| **CHP-04** | `P2` | Reader / Chapter picker | `ReaderSettings / ThemeChoice` <br> Sesuai Siste... option | `src/components/reader/reader-settings-drawer.tsx` <br> `ReaderSettingsDrawer` | `FIX` | `R6` | Singkat `Ikuti sistem` dan hindari truncation selected setting. |
| **CHP-05** | `P2` | Reader / Chapter picker | `ReaderSettings / ImageSize` <br> Lebar Penuh vs Proporsional | `src/components/reader/reader-settings-drawer.tsx` <br> `ReaderSettingsDrawer` | `PRODUCT_DECISION` | `R8` | Definisikan objek skala (`fit width`, `fit screen`, `original size`) berdasar perilaku sebenarnya, jangan sekadar mengganti label. |
| **CHP-06** | `P2` | Reader / Chapter picker | `ReaderSettings / GapAndProgress` <br> Jarak Antar Halaman / Progres halaman | `src/components/reader/reader-settings-drawer.tsx` <br> `ReaderSettingsDrawer` | `FIX` | `R8` | Ganti berdasarkan mode: `Jarak antar gambar`, `Tampilkan progres baca`, tetap mode-dependent. |
| **CHP-07** | `P1` | Reader / Chapter picker | `ReaderSettings / Direction` <br> Kiri ke Kanan vs Kanan ke Kiri | `src/components/reader/reader-settings-drawer.tsx` <br> `ReaderSettingsDrawer` | `PRODUCT_DECISION` | `R8` | Konfirmasi apakah paged reading memang ada; hide/disable setting tidak relevan dalam vertical-only reader. |
| **CHP-08** | `P1` | Reader / Chapter picker | `ReaderSettings / ScopeAndReset` <br> per-title vs all, reset, override indicator | `src/components/reader/reader-settings-drawer.tsx` <br> `ReaderSettingsDrawer` | `PRODUCT_DECISION` | `R5` | Uji per-title/global precedence, reset scope, kapan data disimpan, dan visible override indicators. |
| **CHP-09** | `P2` | Reader / Chapter picker | `ReaderSettings / Preload` <br> Ringan / Normal / Maksimal options | `src/components/reader/reader-settings-drawer.tsx` <br> `ReaderSettingsDrawer` | `PRODUCT_DECISION` | `R5` | Label/description yang menjelaskan jumlah preload, pemakaian RAM/data, bila itu behavior sebenarnya. |
| **RDR-11** | `P2` | Reader | `ResumeToast` <br> truncated resume message | `src/components/reader/reader-view.tsx` <br> `ReaderView` | `FIX` | `R2` | Use clear, concise resume state; no truncated actionable instruction, never obstruct header. |
| **RDR-12** | `P1` | Reader | `Reader / HistoryLink` <br> history 0% vs reader nonzero | `src/shared/store/history-store.ts` <br> `useHistoryStore` | `QA_REQUIRED` | `R4` | Reproduce by reading, leaving, reopening, reloading; compare persisted % and restored scroll; do not claim mismatch from screenshots alone. |
| **CHP-10** | `P2` | Chapter picker | `ChapterSheet / LongList` <br> search and sort interaction with large chapter count | `src/components/reader/reader-chapter-drawer.tsx` <br> `ReaderChapterDrawer` | `QA_REQUIRED` | `R3` | Test open at active chapter, sort flip, search, dismiss and reopen; no unexpected reset of reader scroll. |

### Area 4: Home, Explore, Search, Popular, Library
| ID | Pri | Route / Page | Component & Element | Source File & Symbol | Disp | RC | Proposed Remediation & Target Criteria |
|---|---|---|---|---|---|---|---|
| **HOM-01** | `P2` | Home | `Home / ContinueReading` <br> continue reading cards and % | `src/components/home/home-view.tsx` <br> `HomeView` | `FIX` | `R9` | Hierarki berdasarkan tugas utama: continue reading, discover/update, search. Jangan mengulang CTA yang tidak perlu. |
| **HOM-02** | `P2` | Home | `Home / QuickSearchCard` <br> search entry vs global search | `src/components/home/home-hero.tsx` <br> `HomeHero` | `PRODUCT_DECISION` | `R9` | Tetapkan tinggi adaptif dan teks yang wrap benar; jangan sampai CTA carousel tertutup dock. |
| **HOM-03** | `P2` | Home | `Home / SpotlightCarousel` <br> feature CTA, arrows, card dimensions | `src/components/home/editorial-spotlight.tsx` <br> `EditorialSpotlight` | `FIX` | `R6` | Popover capped-height dan posisi adaptif; hindari menutupi aksi primer selama menu aktif. |
| **HOM-04** | `P2` | Home | `Home / RecentUpdates` <br> new update semantics and missing chapters | `src/components/home/home-feed-client.tsx` <br> `HomeFeedClient` | `FIX` | `R8` | Tegaskan apa arti diperbarui (metadata, katalog, chapter); pisahkan item yang tidak memiliki chapter dari update chapter. |
| **HOM-05** | `P2` | Home | `Home / SourceRanking` <br> source sort and top-5 list | `src/components/home/unified-feed.tsx` <br> `UnifiedFeed` | `FIX` | `R9` | Gunakan satu pola `view all` yang konsisten, tidak mengorbankan ruang discovery tanpa alasan. |
| **DSC-01** | `P2` | Explore / Search | `Explore / Search` <br> duplicate entry points and source semantics | `src/components/search/search-page-view.tsx` <br> `SearchPageView` | `FIX` | `R9` | Hierarki `Sumber → Cari → Filter/sort → Hasil`, tampilkan applied filter state. |
| **DSC-02** | `P2` | Explore / Search | `ExploreFilters` <br> source, format, sort, grid/list | `src/components/search/search-source-rail.tsx` <br> `SearchSourceRail` | `FIX` | `R2` | Capped-height, scroll internal, indicator selected, klik di luar untuk menutup; uji interaksi. |
| **DSC-03** | `P2` | Explore / Search | `ExploreSourceSelect` <br> popover anchor / overflow | `src/components/search/search-toolbar.tsx` <br> `SearchToolbar` | `FIX` | `R2` | Jelaskan beda scope search lintas sumber vs jelajah per sumber; selaraskan terminology/filter. |
| **DSC-04** | `P2` | Explore / Search | `Search / ProviderChips` <br> selected provider filter scroll | `src/components/search/search-tag-input.tsx` <br> `SearchTagInput` | `FIX` | `R6` | Gunakan microcopy pendek; jelaskan horizontal scroll dengan partial next chip, tanpa memotong kata utama yang penting. |
| **DSC-05** | `P2` | Explore / Search | `SearchResultCard` <br> chapter missing, synopsis snippet, bookmark | `src/components/search/search-results.tsx` <br> `SearchResults` | `FIX` | `R6` | Putuskan minimum metadata dan default text clamp; bedakan status gagal dimuat dari `Chapter belum tersedia`. |
| **LIB-01** | `P2` | Library | `Library / SavedTabs` <br> saved count vs automatic bucket count | `src/components/library/library-page-view.tsx` <br> `LibraryPageView` | `PRODUCT_DECISION` | `R8` | Jelaskan denominator/count scope (misalnya koleksi sistem vs manual). Jangan anggap bug angka hingga diverifikasi. |
| **LIB-02** | `P2` | Library | `Library / FilterRow` <br> truncated source/sort dropdown value | `src/components/library/library-toolbar.tsx` <br> `LibraryToolbar` | `FIX` | `R6` | Istilah lebih pendek (`Sumber`, `Terbaru`) dan value tersaji penuh melalui menu/label pendamping. |
| **LIB-03** | `P2` | Library | `Library / SmartCategoryChips` <br> horizontal scroll clipped edge | `src/components/library/library-status-rail.tsx` <br> `LibraryStatusRail` | `FIX` | `R6` | Jaga visible scroll affordance; snap/padding; tetap memungkinkan seluruh chip diakses. |
| **LIB-04** | `P2` | Library | `Library / CollectionGroups` <br> System 2 category and collections | `src/components/library/library-collection-rail.tsx` <br> `LibraryCollectionRail` | `PRODUCT_DECISION` | `R8` | Perjelas grouping otomatis/custom dan metadata collection. |
| **LIB-05** | `P2` | Library | `Library / SavedCoverCard` <br> bookmark overlay and fixed nav overlap | `src/components/library/library-results.tsx` <br> `LibraryResults` | `FIX` | `R7` | Satukan state saved dan interaction; reserve nav area. |
| **LIB-06** | `P1` | Library | `Library / CollectionMenu` <br> create collection / multi-select | `src/components/library/library-collection-rail.tsx` <br> `LibraryCollectionRail` | `QA_REQUIRED` | `R5` | QA create/edit/delete collection, multi-select, revert, modal confirmation, sync collision. |
| **LIB-07** | `P2` | Library | `Library / HistoryCard` <br> chapter, percentage, Lanjut button | `src/components/library/library-results.tsx` <br> `LibraryResults` | `FIX` | `R7` | Konsisten tampilkan `Ch. n · xx% dibaca` dan jelas beda history vs bookmarked. |
| **POP-01** | `P2` | Popular | `Popular / RankingMethod` <br> internal vs source-rank semantics | `src/components/popular/popular-page-view.tsx` <br> `PopularPageView` | `PRODUCT_DECISION` | `R8` | Gunakan copy yang tidak mengisyaratkan metrik pembaca internal jika itu bukan metodenya. Paparkan metodologi singkat + tanggal refresh. |
| **POP-02** | `P2` | Popular | `Popular / RankingCard` <br> density, badges, rating, bookmark | `src/components/popular/popular-page-view.tsx` <br> `PopularPageView` | `FIX` | `R6` | Tetapkan metadata prioritas; title clamp 2 baris; mempertahankan rank dan primary title; sisanya dipindah ke detail. |
| **POP-03** | `P2` | Popular | `Popular / SourceChips` <br> source selected/count and scroll | `src/components/popular/popular-page-view.tsx` <br> `PopularPageView` | `FIX` | `R6` | Pertahankan chips, perjelas scroll affordance dan relasi dengan tab utama. |
| **POP-04** | `P2` | Popular | `Popular / MALLeaderboard` <br> member metric, snapshot and source link | `src/components/popular/mal-popular-section.tsx` <br> `MalPopularSection` | `FIX` | `R8` | Pertahankan provenance, tanggal snapshot, dan sumber; buat CTA `Cari sumber bacaan` tidak menjanjikan availability. |
| **HOM-06** | `P2` | Home | `Home / FeaturedCard` <br> carousel navigation clearance | `src/components/home/editorial-spotlight.tsx` <br> `EditorialSpotlight` | `FIX` | `R1` | At rest and during scroll, ensure carousel actions do not sit beneath global dock; include scroll-limit test. |
| **DSC-06** | `P2` | Search | `Search / SourceSelection` <br> multi-source count with horizontal crop | `src/components/search/search-source-rail.tsx` <br> `SearchSourceRail` | `FIX` | `R6` | Maintain visible selected count and discoverable horizontal source list; no loss of filter state. |
| **LIB-08** | `P2` | Library | `Library / ScopeCounter` <br> saved count reconciliation | `src/shared/lib/smart-collections.ts` <br> `getSmartCollectionCount` | `QA_REQUIRED` | `R4` | Document exact set semantics and compare to data; only fix counts if mismatch is reproduced. |
| **LIB-09** | `P3` | Library / Explore | `SourceLabel` <br> Shinigami vs shinigami casing | `src/shared/sources/source-registry.ts` <br> `getSourceDisplayName` | `FIX` | `R8` | Create canonical display name mapping, preserve underlying source ID unchanged. |
| **POP-05** | `P2` | Popular | `Ranking / AvailabilityCTA` <br> MAL ranking CTA find reading source | `src/components/popular/mal-popular-section.tsx` <br> `MalPopularSection` | `QA_REQUIRED` | `R9` | Test no-match outcomes and source handoff; never promise availability. |

### Area 5: Detail Komik, Chapter Lists, Weekly Schedule
| ID | Pri | Route / Page | Component & Element | Source File & Symbol | Disp | RC | Proposed Remediation & Target Criteria |
|---|---|---|---|---|---|---|---|
| **DET-01** | `P2` | Comic detail | `ComicHero / ActionGrid` <br> continue, saved, rating, status, collections | `src/components/komik/manga-actions.tsx` <br> `MangaActions` | `FIX` | `R9` | Prioritaskan `Lanjutkan/Mulai membaca`, lalu bookmark/collection sebagai aksi sekunder. Jelaskan label `Status` (status baca vs status publikasi). |
| **DET-02** | `P2` | Comic detail | `ComicSynopsis` <br> expand/collapse and source text rendering | `src/components/komik/manga-detail-view.tsx` <br> `MangaDetailView` | `FIX` | `R6` | Editorial display/line clamp yang menjaga readability, label `Selengkapnya` / `Lebih sedikit` konsisten. Jangan menulis ulang konten sumber diam-diam. |
| **DET-03** | `P2` | Comic detail | `ComicChapterList` <br> new dot, last-read badge, selected row | `src/components/komik/chapter-row.tsx` <br> `ChapterRow` | `FIX` | `R7` | Definisikan unread/new/current/last-read. Gunakan label dan state yang tidak bergantung pada titik merah saja. |
| **DET-04** | `P1` | Comic detail | `ComicChapterList` <br> chapter count vs latest shown | `src/components/komik/manga-detail-view.tsx` <br> `MangaDetailView` | `QA_REQUIRED` | `R4` | Tes hasil urutan, total chapter, chapter tertinggi, chapter khusus, serta sort, sebelum menuduh data mismatch. |
| **DET-05** | `P2` | Comic detail | `ComicRecommendationCarousel` <br> cover cards and horizontal scroll | `src/components/komik/chapter-download-button.tsx` <br> `ChapterDownloadButton` | `QA_REQUIRED` | `R7` | Pastikan progress, completed, retry, dan offline state terkomunikasikan; verifikasi actual behavior. |
| **DET-06** | `P2` | Comic detail | `ComicDetailHeader` <br> back, share, notification, title clamp | `src/components/komik/manga-recommendations.tsx` <br> `MangaRecommendations` | `FIX` | `R6` | Revisi scroll padding, peeking, dan ukuran card agar teks serta aksi tidak tertutup. |
| **SCH-01** | `P2` | Weekly schedule | `WeeklySchedule / DayStrip` <br> today star, count, selected day | `src/components/updates/updates-list.tsx` <br> `UpdatesList` | `FIX` | `R9` | Pertahankan days segmented, tetapi render selected, today, count, dan scroll affordance berbeda secara jelas. |
| **SCH-02** | `P2` | Weekly schedule | `WeeklySchedule / ScheduleCard` <br> Otomatis day, Baca/Lanjut CTA | `src/components/updates/updates-list.tsx` <br> `UpdatesList` | `PRODUCT_DECISION` | `R8` | Jelaskan arti otomatis (perkiraan/terdeteksi/manual override) dan beda `Baca` vs `Lanjut`. |
| **SCH-03** | `P1` | Weekly schedule | `WeeklySchedule / HistoryEntry` <br> latest chapter vs resume destination | `src/components/updates/updates-list.tsx` <br> `UpdatesList` | `QA_REQUIRED` | `R4` | Uji CTA memilih lanjut terakhir vs buka latest; jangan menyatakan chapter yang ditampilkan sebagai history jika bukan. |
| **SCH-04** | `P2` | Weekly schedule | `WeeklySchedule / CardStack` <br> bottom dock and card clipping | `src/components/updates/updates-list.tsx` <br> `UpdatesList` | `FIX` | `R1` | Perbaiki line clamp, CTA anchor, card density, dan scroll reserve. |
| **DET-07** | `P2` | Comic detail | `ComicMetadata / DataProvenance` <br> chapter 173 count vs visible chapter 155 / reader 172 | `src/components/komik/manga-detail-view.tsx` <br> `MangaDetailView` | `QA_REQUIRED` | `R4` | Trace data source, sort, pagination, hidden entries and cross-source identity before declaring inconsistency. |
| **SCH-05** | `P2` | Weekly schedule | `WeeklySchedule / DayAssignment` <br> semantics of automatic estimated day | `src/shared/lib/schedule-policy.ts` <br> `predictReleaseDay` | `PRODUCT_DECISION` | `R8` | Confirm data provenance; copy and status distinguish estimated/custom and actual published chapter. |

### Area 6: Application Settings, Onboarding, Notifications, Help
| ID | Pri | Route / Page | Component & Element | Source File & Symbol | Disp | RC | Proposed Remediation & Target Criteria |
|---|---|---|---|---|---|---|---|
| **NTF-01** | `P2` | Global overlays | `NotificationPopover` <br> last row, scroll and footer | `src/components/chrome/header-actions.tsx` <br> `HeaderActions` | `FIX` | `R2` | Buat scroll region yang jelas, footer fixed tanpa menutup item, semantics unread/new. |
| **NTF-02** | `P2` | Global overlays | `AccountPopover` <br> account information, menu items, logout | `src/components/chrome/header-actions.tsx` <br> `HeaderActions` | `FIX` | `R2` | Satukan popover family, pemisahan destructive logout, dan visible focus. |
| **NTF-03** | `P2` | Global overlays | `GlobalToast` <br> onboarding information toast | `src/components/overlays/onboarding-overlay.tsx` <br> `OnboardingOverlay` | `FIX` | `R2` | Gunakan toast ringkas dengan konteks; bila langkah berikut penting, tampilkan inline guidance di lokasi relevan. |
| **HLP-01** | `P2` | Help center | `HelpCenter / FAQBody` <br> technical 403/429 explanation | `src/app/(web)/help/page.tsx` <br> `HelpPage` | `FIX` | `R8` | Mulai dengan langkah sederhana dan berurutan; detail teknis dapat di-expand sebagai advanced info. |
| **HLP-02** | `P2` | Help center | `HelpCenter / AccordionList` <br> expanded state and nav clearance | `src/app/(web)/help/page.tsx` <br> `HelpPage` | `FIX` | `R1` | Gunakan content inset di bagian akhir, tes expanded state dan focus restoration. |
| **SET-01** | `P2` | App settings | `AppSettings / SettingsRow` <br> icon/title/description/control grid | `src/app/(web)/settings/components/settings-ui.tsx` <br> `SettingsUI` | `FIX` | `R6` | Standardize SettingsRow: icon + title + description + trailing control, dengan sub-control inline hanya bila perlu. |
| **SET-02** | `P2` | App settings | `AppSettings / UpdateCheck` <br> on-open toggle + periodic interval | `src/app/(web)/settings/components/settings-ui.tsx` <br> `SettingsUI` | `PRODUCT_DECISION` | `R5` | Definisikan apakah periodic background atau tiap pembukaan; copy mengikuti perilaku sesungguhnya. |
| **SET-03** | `P1` | App settings | `AppSettings / KeepAwake` <br> screen wake lock during reading/downloading | `src/shared/store/settings-store.ts` <br> `useSettingsStore` | `PRODUCT_DECISION` | `R5` | Verifikasi kapan wake lock aktif/dilepas; copy harus memaparkan scope. |
| **SET-04** | `P2` | App settings | `AppSettings / StorageMetrics` <br> total bytes vs shown buckets | `src/app/(web)/settings/components/settings-ui.tsx` <br> `SettingsUI` | `QA_REQUIRED` | `R4` | Tampilkan kategori lain bila bermakna atau jelaskan total mencakup metadata/data lain. Gunakan satu istilah unit (`bab`, `berkas`, `gambar`) sesuai konteks. |
| **SET-05** | `P1` | App settings | `AppSettings / DestructiveActions` <br> delete local history/save vs clear device | `src/components/settings/settings-view.tsx` <br> `SettingsView` | `PRODUCT_DECISION` | `R5` | Destructive confirmation menjelaskan data apa yang terhapus, data cloud yang tetap ada, unduhan yang dihapus; cegah accidental taps. Perilaku actual perlu QA. |
| **SET-06** | `P2` | App settings | `AppSettings / OfflineAndHelp` <br> disabled clear-offline + onboarding | `src/app/(web)/settings/components/settings-ui.tsx` <br> `SettingsUI` | `FIX` | `R7` | Disabled state dengan reason (`Belum ada unduhan`), dan penempatan bantuan yang mudah ditemukan. |
| **SET-07** | `P2` | App settings | `AppSettings / NSFWPreference` <br> state vs default copy | `src/app/(web)/settings/components/settings-ui.tsx` <br> `SettingsUI` | `FIX` | `R8` | Copy membedakan current state vs default; legal/age restrictions harus diverifikasi secara terpisah. |
| **SET-08** | `P2` | App settings | `AppSettings / AppThemeVsReaderTheme` <br> global theme vs reader surface choice | `src/app/(web)/settings/components/settings-ui.tsx` <br> `SettingsUI` | `PRODUCT_DECISION` | `R5` | Jelaskan tema aplikasi vs tema/warna canvas pembaca dan cara inheritance bekerja. |
| **NTF-04** | `P2` | Global overlays | `NotificationBell / Unread` <br> badge 5 and card list | `src/components/overlays/updates-bell.tsx` <br> `UpdatesBell` | `QA_REQUIRED` | `R2` | Verify semantics of count, timestamp and read state; no duplicate/unreachable notifications. |
| **SET-09** | `P2` | App settings | `Preferences / DisabledAction` <br> disabled offline action without reason | `src/app/(web)/settings/components/settings-ui.tsx` <br> `SettingsUI` | `FIX` | `R7` | Label disabled state with reason grounded in actual data and ensure assistive technology can convey it. |
| **SET-10** | `P2` | App settings | `Settings / DenseDestructiveRows` <br> destructive text squeezed between icon and CTA | `src/app/(web)/settings/components/settings-ui.tsx` <br> `SettingsUI` | `FIX` | `R6` | Use responsive stacked row layout for long descriptions and destructive action; keep full description readable. |
| **HLP-03** | `P2` | Help center | `FAQ / SupportInstructions` <br> bottom instructions obscured | `src/app/(web)/help/page.tsx` <br> `HelpPage` | `FIX` | `R1` | Ensure bottom text can scroll fully clear of fixed dock; preserve focus after accordion expansion. |

### Area 7: Accessibility, Responsive Behavior, Performance, Regression Testing
| ID | Pri | Route / Page | Component & Element | Source File & Symbol | Disp | RC | Proposed Remediation & Target Criteria |
|---|---|---|---|---|---|---|---|
| **SYS-08** | `P1` | Shared shell | `TextScaling / A11y` <br> large text and hit targets | `src/app/globals.css` <br> `@theme text-*` | `QA_REQUIRED` | `R6` | Uji text scaling, orientasi, iPhone kecil, VoiceOver, target tap, focused content, browser zoom. |

## 4. Root-Cause Clusters (R1–R9) & Shared Blast Radius
- **R1: Shell Content Obstruction (7 tiket):** `SYS-01`, `HOM-06`, `SCH-04`, `HLP-02`, `HLP-03`, `LIB-05`, `DET-05`. Unified bottom dock clearance contract via `PageContainer` padding reserve.
- **R2: Overlay Layering & Priority (9 tiket):** `SYS-02`, `SYS-05`, `SYS-09`, `SYS-11`, `RDR-07`, `RDR-11`, `NTF-01..04`, `DSC-03`. Sonner toast z-index, dropdown popover capped height, sheet modal containment.
- **R3: Reader Navigation Semantics (9 tiket):** `RDR-01..06`, `RDR-10`, `CHP-01..03`, `CHP-10`. Chevron distinction (image vs chapter), active chapter anchor, search filter.
- **R4: History & State Integrity (8 tiket):** `RDR-08..09`, `RDR-12`, `DET-04`, `DET-07`, `SCH-03`, `LIB-08`, `SET-04`. Mandatory QA reproduction before any store mutation.
- **R5: Destructive Actions & Scope (6 tiket):** `SET-02..03`, `SET-05`, `SET-08`, `CHP-08..09`, `LIB-06`. Safety dialogs, clear scope warning, zero silent deletion.
- **R6: Component Geometry & Text Resilience (17 tiket):** `SYS-03..04`, `SYS-10`, `RDR-03`, `CHP-04`, `DET-02`, `DET-06`, `HOM-03`, `DSC-04..06`, `LIB-02..03`, `POP-02..03`, `SET-01`, `SET-10`. Line clamp 2 baris, flex min-w-0, zero text ellipsis on critical actionable labels.
- **R7: Component State Semantics (7 tiket):** `SYS-06..07`, `DET-03`, `DET-05`, `LIB-05`, `LIB-07`, `SET-06`, `SET-09`. Shared active/saved/disabled/destructive visual tokens.
- **R8: Content Model & Neutral Copy (13 tiket):** `RDR-02`, `CHP-05..07`, `HOM-04`, `LIB-01`, `LIB-04`, `LIB-09`, `SCH-02`, `SCH-05`, `POP-01`, `POP-04`, `HLP-01`, `SET-07`. Elimination of third-party trademarks ("webtoon"), provider-neutral terminology.
- **R9: Information Architecture (12 tiket):** `DET-01`, `HOM-01..02`, `HOM-05`, `DSC-01`, `SCH-01`, `POP-05`. Hierarchy alignment, single primary CTA per card, no competing buttons.

## 5. Consolidated Owner Decisions (Grillme)
Berikut 6 keputusan strategis yang memerlukan arahan owner:
1. **Reader Modes (`RDR-02`, `CHP-07`):** Apakah Yomirra mendukung mode paged horizontal (`Kiri ke Kanan`/`Kanan ke Kiri`), atau fokus pada continuous vertical scroll? *(Rekomendasi: Dukung continuous vertical scroll sebagai default utama, pertahankan opsi paged reader di drawer pembaca tanpa menyebut merek pihak ketiga)*.
2. **Reader Scrubber Slider (`RDR-01`, `RDR-10`):** Apakah slider reader mengontrol navigasi index gambar (Hal. x/y) atau chapter percentage? *(Rekomendasi: Pertahankan navigasi gambar pada slider, bedakan ikon chevron gambar dengan chapter)*.
3. **Library Saved vs Smart Chips Formula (`LIB-01`, `LIB-08`):** `Tersimpan (138)` vs `Semua 136`. Apakah 2 judul selisih merupakan koleksi sistem atau status tersembunyi? *(Rekomendasi: Verifikasi dataset IndexedDB di runtime; selaraskan rumus hitung)*.
4. **Detail Chapter Count Provenance (`DET-04`, `DET-07`):** Total 173 chapter sementara chapter tertinggi 172. *(Rekomendasi: Trace apakah index 0 adalah prologue/special chapter; jangan diubah sebelum data diverifikasi)*.
5. **Destructive Wipe Actions (`SET-05`):** Batasan aksi "Bersihkan perangkat" vs "Hapus riwayat lokal". *(Rekomendasi: Tambahkan modal konfirmasi ganda dengan rincian data yang akan dihapus)*.
6. **Jadwal Rilis Mingguan (`SCH-02`, `SCH-05`):** Arti label "Otomatis · Senin". *(Rekomendasi: Beri label `Perkiraan otomatis` berdasarkan pola rilis sumber, bedakan dengan rilis terkonfirmasi)*.

## 6. Dependency-Based Execution Waves
- **Wave 1: Shared Foundation & Mobile Onboarding Geometry (13 tiket)**
  - Bottom dock clearance contract (`SYS-01`, `HOM-06`, `SCH-04`, `HLP-02`, `HLP-03`, `LIB-05`, `DET-05`).
  - Mobile onboarding viewport lock, 0 clipping, keyboard hint suppression, copywriting neutralisation.
  - Header actions active state fix (`header-actions.tsx`).
- **Wave 2: Shared UI Primitives & Text Resilience (11 tiket)**
  - Dropdown popovers, select menu heights, button states, Sonner toast collision contract (`SYS-02..05`, `SYS-07`, `LIB-02`, `DSC-02`, `POP-02`).
- **Wave 3: Reader Engine & Navigation Semantics (22 tiket)**
  - Chevrons differentiation, chapter drawer scroll anchor, reader settings drawer copy (`RDR-01..12`, `CHP-01..10`).
- **Wave 4: Discovery, Catalog & Library Surfaces (26 tiket)**
  - Home feed, search rail, popular rankings with MAL provenance, library tabs & smart chips (`HOM-01..05`, `DSC-01..06`, `POP-01..05`, `LIB-01..09`).
- **Wave 5: Detail, Schedule & Settings Surfaces (15 tiket)**
  - Comic detail hero, chapter row indicators, schedule day strip, settings categories & safety dialogs (`DET-01..07`, `SCH-01..05`, `SET-01..10`, `HLP-01`).
- **Wave 6: Performance Streaming & Verification (Full Suite)**
  - Streaming Suspense for catalog pages, Playwright responsive test matrix (360/400/768/1440px), token ratchet verification (`check-design-tokens.mjs`).

## 7. Autonomous Execution Gate
> **AUTONOMY: OFF. STRICT READ-ONLY GATE ENFORCED.**
> Tidak ada file kode, konfigurasi, atau database yang diubah pada fase ini.
> Implementasi Wave 1 akan segera dimulai setelah owner memberikan konfirmasi/persetujuan konsolidasi.