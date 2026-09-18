# Changelog

All notable changes to Yomirra are documented here.

---

## [1.18.0] — 2026-09-18

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
