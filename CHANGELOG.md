# Changelog

All notable changes to Yomirra are documented here.

---

## [1.1.0] — 2026-09-27

### English

This release delivers the Discovery Surfaces & Navigation Revamp, standardizing page headers, routing transitions, responsive settings, and visual hierarchy across all main destinations.

#### Added

* **Canonical PageHeader**: Unified `<PageHeader>` component across Beranda, Popular, Sources, Downloads, and Settings with consistent icon container, title scale, subtitle styling, and actions slot.
* **Routed Settings Destination**: `/settings` is now an authentic routed page with full responsive shell, removing intercepting modal overlays for consistent direct URL access and in-app navigation.
* **Shape-Matched Route Skeletons**: Structural loading states for Popular, Search, Library, Bookmark, and Manga Detail pages to prevent layout shift.
* **Route Transitions**: Smooth directional cross-fade page transition honoring `prefers-reduced-motion`.
* **Notification Bell Popover**: Header updates bell now reveals a quick-glance dropdown with recent updates and seen-state tracking.
* **Editorial Rank Escalation**: Gold, Silver, and Bronze badge hierarchy for top 3 manga on Popular feed with WCAG AA compliance.

#### Changed

* **Detail Page Scrim**: Streamlined manga detail hero overlay into smooth dual-gradient scrims for optimal cover art visibility and text legibility.
* **Home Feed Typography**: Standardized section titles to Plus Jakarta Sans for consistent typographic rhythm.
* **Downloads View Parity**: Integrated Downloads action buttons and storage indicator into the canonical page header and design tokens.
* **Dropdown Scroll Behavior**: Dropdown menus now default to non-modal interaction, preventing background scroll blocking.

#### Fixed

* **Data & Entity Sanitization**: Global `stripHtml` sanitization across feed cards, search results, and detail synopses, eliminating dirty HTML entities and bracketed scrapings.
* **Mobile Header Drift**: Resolved title/subtitle duplication between mobile app bar and page content across Sources, Downloads, and Beranda.
* **Author Formatting**: Prefixed author attribution cleanly and gracefully omitted missing author metadata.

---

### Bahasa Indonesia

Rilis ini menghadirkan Discovery Surfaces & Navigation Revamp, menyelaraskan header halaman, transisi rute, halaman pengaturan responsif, dan hierarki visual di seluruh destinasi utama.

#### Ditambahkan

* **Canonical PageHeader**: Komponen `<PageHeader>` terpadu untuk Beranda, Populer, Sumber, Unduhan, dan Pengaturan dengan wadah ikon, skala judul, tipografi subtitle, dan slot aksi yang konsisten.
* **Halaman Pengaturan Mandiri**: Rute `/settings` kini merupakan halaman penuh mandiri berbasis shell standar, menggantikan modal overlay untuk navigasi internal maupun akses URL langsung yang stabil.
* **Skeleton Rute Presisi**: Loading skeleton berstruktur layout presisi untuk halaman Populer, Pencarian, Library, Rak Buku, dan Detail Komik guna mencegah pergeseran tata letak (CLS).
* **Transisi Rute**: Efek transisi cross-fade halaman yang halus serta ramah aksesibilitas (`prefers-reduced-motion`).
* **Dropdown Lonceng Notifikasi**: Ikon lonceng header kini membuka dropdown intip cepat pembaruan komik dengan pelacakan status terbaca.
* **Eskalasi Peringkat Editorial**: Peringkat 1-3 di halaman Populer menggunakan badge visual berjenjang Emas, Perak, dan Perunggu dengan kontras rasio WCAG AA.

#### Diubah

* **Gradient Scrim Detail Komik**: Penyederhanaan lapisan gradien cover hero komik menjadi scrim transparan dua arah yang menjaga keindahan artwork sekaligus keterbacaan teks.
* **Penyelarasan Font Bagian Beranda**: Mengubah font judul seksi di Beranda ke Plus Jakarta Sans agar selaras dengan halaman lainnya.
* **Standardisasi Halaman Unduhan**: Menyatukan tombol aksi dan indikator penyimpanan ke dalam header kanonikal dan token desain Yomirra.
* **Perilaku Scroll Dropdown**: Menghapus scroll-lock bawaan pada menu dropdown agar halaman tetap nyaman digulir.

#### Diperbaiki

* **Sanitasi Entitas dan Data**: Normalisasi teks global dengan `stripHtml` pada kartu feed, hasil pencarian, dan sinopsis detail untuk membersihkan tag kotor dan entitas HTML.
* **Redundansi Header Mobile**: Mengatasi duplikasi judul/subtitle antara mobile app bar dan konten halaman di Sumber, Unduhan, dan Beranda.
* **Format Nama Penulis**: Penulisan atribusi nama penulis lebih rapi dan menyembunyikan baris bila data penulis kosong.

---

## [1.0.0] — 2026-09-20

### English

This release brings the current Yomirra experience together into a more complete reader, with major work across reading, library management, multi-source discovery, offline access, and general reliability.

#### Added

* Multi-source search and discovery.
* Collections and custom reading statuses for Library management.
* Chapter update tracking for titles saved in the Library.
* Download Manager and offline chapter reading.
* Backup & Restore with the current backup format and compatibility handling for older backups.
* Source health handling to better surface unavailable or degraded sources.
* PWA support for an app-like experience on supported devices.
* Additional reader preferences and reading controls.
* Toast Revamp Lab (`/showcase/toast-demo`) featuring 10 distinct designs, 10 motion transitions, slow-motion scrubber, and a simulated Dynamic Island aperture.
* Reader End Deck Showcase Lab (`/showcase/reader-end-demo`) for visual experimentation with chapter-end transitions.

#### Changed

* Reworked the mobile reader UI with cleaner top and bottom controls.
* Redesigned the continuous vertical reader chapter-end deck with a seamless gradient fader, ambient aura glow, and squircle action buttons.
* Rebranded application toast notifications to **Dynamic Island Liquid Glass** capsules with top-center placement, specular rim lighting, and Apple HIG spring dynamics.
* Improved reading progress visibility across light and dark comic pages.
* Improved transitions and auto-hide behavior for reader controls.
* Refined Home, Search, Library, Collections, Updates, Downloads, Sources, Manga Detail, Reader, and Settings.
* Improved Continue Reading behavior using the latest saved reading progress.
* Search filters now respect the capabilities of the active source instead of assuming every source supports the same options.
* Improved navigation between Search, Library, Updates, Manga Detail, and Reader.
* Updated PWA behavior and install flow.

#### Fixed

* Fixed several image-loading and source URL handling cases.
* Fixed comic detail navigation from the reader end deck to route directly to the manga page.
* Replaced third-party report links with prefilled direct email reporting for broken chapters.
* Improved handling of unavailable or partially failing sources.
* Fixed reader lifecycle issues around local `blob:` and `data:` images.
* Improved cleanup of temporary object URLs used during offline reading.
* Improved reading-progress persistence when the app moves to the background.
* Improved handling of partial or missing downloaded chapter data.
* Fixed several inconsistent loading, empty, and error states across the app.

#### Internal

* Continued separating source-specific behavior from the rest of the application.
* Improved local-first data handling for Library, History, Downloads, and reader state.
* Reduced coupling between reader state, navigation, and source-specific data.
* General cleanup and reliability improvements across the application.

---

### Bahasa Indonesia

Rilis ini merapikan fitur-fitur utama Yomirra menjadi reader yang lebih lengkap, terutama di area membaca, Library, pencarian multi-source, offline reading, dan stabilitas aplikasi.

#### Ditambahkan

* Pencarian dan discovery dari beberapa source.
* Collections dan custom reading status untuk mengatur Library.
* Pengecekan update chapter untuk judul yang tersimpan di Library.
* Download Manager dan dukungan membaca chapter secara offline.
* Backup & Restore dengan format backup terbaru serta compatibility handling untuk backup lama.
* Source health handling untuk membantu mendeteksi source yang sedang tidak tersedia atau bermasalah.
* Dukungan PWA untuk penggunaan seperti aplikasi di perangkat yang mendukung.
* Tambahan preferensi dan kontrol pada reader.
* Toast Revamp Lab (`/showcase/toast-demo`) dengan 10 konsep desain, 10 transisi masuk/keluar, dan simulasi Dynamic Island notch morphing.
* Reader End Deck Showcase Lab (`/showcase/reader-end-demo`) untuk eksplorasi transisi akhir chapter komik.

#### Diubah

* Reader mobile diperbarui dengan kontrol atas dan bawah yang lebih ringkas.
* Redesign total tampilan akhir chapter pada vertical reader dengan transisi gradient halus, ambient aura glow, dan tombol squircle ("Sebelumnya", "Selanjutnya", "Detail Komik", "Laporkan").
* Rebrand sistem toast notifikasi aplikasi menjadi kapsul **Dynamic Island Liquid Glass** di posisi top-center dengan specular rim highlight dan fisika spring iOS.
* Indikator reading progress dibuat lebih jelas pada halaman terang maupun gelap.
* Transisi dan auto-hide reader controls diperbaiki.
* Home, Search, Library, Collections, Updates, Downloads, Sources, Manga Detail, Reader, dan Settings dirapikan agar lebih konsisten.
* Continue Reading sekarang menggunakan progres baca terakhir yang tersimpan.
* Search filter mengikuti kemampuan source aktif dan tidak lagi menganggap semua source memiliki filter yang sama.
* Navigasi antara Search, Library, Updates, Manga Detail, dan Reader diperbaiki.
* Flow penggunaan dan instalasi PWA diperbarui.

#### Diperbaiki

* Memperbaiki sejumlah kasus image loading dan handling URL dari source.
* Tombol "Detail Komik" di akhir chapter kini langsung mengarah ke halaman detail komik yang tepat.
* Tombol "Laporkan" sekarang membuka email dengan detail chapter dan manga yang sudah terisi otomatis.
* Memperbaiki handling ketika salah satu source sedang tidak tersedia atau gagal sebagian.
* Memperbaiki lifecycle image lokal `blob:` dan `data:` di reader.
* Memperbaiki cleanup object URL sementara pada offline reader.
* Memperbaiki penyimpanan reading progress saat aplikasi berpindah ke background.
* Memperbaiki handling chapter download yang tidak lengkap atau file lokal yang sudah tidak tersedia.
* Merapikan loading, empty, dan error state di berbagai halaman.

#### Internal

* Melanjutkan pemisahan logic masing-masing source dari aplikasi utama.
* Memperbaiki pendekatan local-first untuk Library, History, Downloads, dan reader state.
* Mengurangi coupling antara reader state, navigation, dan data source.
* Cleanup dan reliability improvement di berbagai bagian aplikasi.
