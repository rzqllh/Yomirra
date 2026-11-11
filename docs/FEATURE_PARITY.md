# Matriks Kesetaraan Fitur (Feature Parity)

Dokumen ini memetakan kemampuan Yomirra terhadap referensi industri reader komik modern (seperti **Mihon**, **Tachimanga**, dan **Suwayomi**), batasan platform web/PWA, serta status implementasi nyata di dalam repository.

Yomirra adalah *web-first reader interface* independen. Mihon dan reader lainnya dijadikan referensi standar pengalaman pengguna (*user experience standards*); penyebutan ini tidak menyatakan afiliasi, lisensi bersama, atau kesetaraan biner tanpa pembuktian teknis.

---

## 1. Perbandingan Arsitektur & Platform

| Aspek | Mihon (Android Native) | Tachimanga (iOS Native) | Yomirra (Web & PWA) |
|---|---|---|---|
| **Platform Target** | Android 8.0+ (APK) | iOS / iPadOS 14.0+ (App Store) | Web Browser Modern & PWA Standalone (Cross-Platform: Windows, macOS, Linux, Android, iOS) |
| **Runtime Engine** | Kotlin + Android Runtime (ART) | Swift + iOS Native UIKit | Next.js (React 19), TypeScript, Web Workers, Serwist Service Worker |
| **Penyimpanan Data** | SQLite Lokal (Room DB) | CoreData / SQLite Lokal | LocalStorage, IndexedDB / OPFS (Client), Upstash Redis (Server Caching) |
| **Ekstensi Sumber** | APK Ekstensi Terpisah (DEX) | Ekstensi In-App | API Sumber Terpusat, Dynamic Manifest Terisolasi (tanpa eksekusi kode arbitrer di perangkat client) |
| **Penyimpanan Gambar Offline** | Sistem Berkas Android Lokal | Sandbox Penyimpanan iOS | Cache Storage API (PWA Standalone) / Unduhan Berkas ZIP (Browser Biasa) |
| **Sinkronisasi Antar Perangkat** | Ekspor/Impor Manual, Sync eksternal | iCloud Sync / Manual | Cloud Sync berbasis akun opsional + Ekspor/Pulihkan JSON Lokal |

---

## 2. Matriks Fitur Lengkap

### 2.1 Penemuan & Penjelajahan Katalog (Discovery & Browse)

| Kemampuan | Referensi Mihon | Status Yomirra | Catatan & Implementasi Yomirra |
|---|---|---|---|
| **Pencarian Global Lintas Sumber** | Ya (Global Search) | **Tersedia** | Menjalankan kueri pencarian konkuren ke seluruh sumber aktif dengan pembatalan request (*AbortController*). |
| **Sticky Search & Morphing** | Ya (Top App Bar Collapse) | **Tersedia** | Transisi halus *spring morphing* 200ms saat search bar Beranda ter-scroll keluar layar, baik di Desktop (`TopNav`) maupun Mobile (`PageHeader`). |
| **Pencarian Sumber Tunggal** | Ya (Source Catalog) | **Tersedia** | Navigasi katalog per sumber dengan dukungan paginasi, filter genre, tipe (Manga/Manhwa/Manhua), dan status rilis. |
| **Penyaringan Tag & Judul Alternatif** | Ya | **Tersedia** | Mendukung awalan `#tag` untuk filter spesifik dan indexing nama judul alternatif. |
| **Jadwal Rilis Mingguan** | Tidak (Plugin/Fork) | **Tersedia** | Visualisasi kalender rilis chapter mingguan berbasis metadata hari pembaruan. |
| **Peringkat & Editorial Spotlight** | Parsial (Popular List) | **Tersedia** | Carousel editorial spotlight dengan auto-advance, indikator aksesibel, dan leaderboard komik terpopuler. |

---

### 2.2 Rak Buku & Manajemen Koleksi (Library Management)

| Kemampuan | Referensi Mihon | Status Yomirra | Catatan & Implementasi Yomirra |
|---|---|---|---|
| **Penyimpanan Bookmark** | Ya (Library Add) | **Tersedia** | Satu klik untuk menyimpan ke Rak Buku pribadi tanpa memicu rating publik. |
| **Koleksi Kustom (Custom Categories)** | Ya (Categories) | **Tersedia** | Pengguna dapat membuat, mengubah nama, dan mengorganisasi komik ke dalam folder koleksi dinamis. |
| **Smart Collections** | Parsial (Default Filters) | **Tersedia** | Koleksi terhitung otomatis: *Lanjut Dibaca*, *Belum Dibaca*, dan *Selesai*. |
| **Persentase Progres Seri** | Ya | **Tersedia** | Dihitung proporsional terhadap total chapter komik yang tersedia ($\frac{\text{readCount}}{\text{totalChapters}} \times 100\%$) dan divisualisasikan dengan progress bar. |
| **Mode Tampilan Katalog** | Ya (Grid / Compact / List) | **Tersedia** | Toggle tampilan Grid Normal, Grid Padat, dan Baris List dengan geometri terstandarisasi. |
| **Pengurutan & Filter Fleksibel** | Ya (Title, Last Read, etc.) | **Tersedia** | Filter chip dan dropdown terpadu untuk sumber, format, status rilis, dan urutan pembaruan. |

---

### 2.3 Pengalaman Membaca (Reader Engine)

| Kemampuan | Referensi Mihon | Status Yomirra | Catatan & Implementasi Yomirra |
|---|---|---|---|
| **Mode Webtoon (Continuous Vertical)** | Ya (Webtoon Mode) | **Tersedia** | Rendering vertikal mulus dengan lazy loading gambar via `IntersectionObserver` dan penyesuaian jarak antar-halaman. |
| **Mode Berhalaman (LTR & RTL)** | Ya (Paged LTR / RTL) | **Tersedia** | Transisi halaman horisontal dengan navigasi sentuh, keyboard, atau tombol dock. |
| **Navigasi Drawer Chapter Cepat** | Ya (Chapter Drawer) | **Tersedia** | Drawer daftar chapter langsung melompat (*auto-scroll*) ke chapter yang sedang atau terakhir dibaca saat dibuka. |
| **Kontrol Reader Otomatis (Proximity & Scroll)** | Parsial (Tap Screen) | **Tersedia** | Kontrol dock muncul otomatis saat scroll naik, kursor mouse mendekati tepi atas/bawah layar pada Desktop, atau tombol navigasi keyboard ditekan. |
| **Scrubber Halaman Interaktif** | Ya (Slider) | **Tersedia** | PWA/Web scrubber slider responsif untuk melompat langsung ke halaman target. |
| **Pengaturan Tampilan Khusus per Judul** | Ya (Per-Manga Settings) | **Tersedia** | Preferensi arah baca dan zoom dapat dikunci khusus untuk judul tertentu atau berlaku global. |
| **Tema Latar Belakang Pembaca** | Ya (Black, Gray, White) | **Tersedia** | Pilihan latar belakang OLED Pure Black, Washi Dark, Netral, dan Terang. |

---

### 2.4 Sumber & Migrasi (Source Health & Migration)

| Kemampuan | Referensi Mihon | Status Yomirra | Catatan & Implementasi Yomirra |
|---|---|---|---|
| **Manajemen Sumber Aktif** | Ya (Sources Tab) | **Tersedia** | Toggle aktivasi sumber untuk mengatur keterlibatan dalam katalog Beranda, Library, dan Populer. |
| **Deteksi Status Layanan (Health Check)** | Parsial (Manual Error) | **Tersedia** | Indikator visual real-time untuk sumber yang beroperasi normal atau sedang dalam perawatan (*Under Maintenance*). |
| **Migrasi Sumber Otomatis (Relink)** | Ya (Source Migration) | **Tersedia** | Fitur *Cari Sumber Alternatif* pada halaman pemulihan judul yang mati atau gagal muat, memetakan kembali riwayat baca ke sumber pengganti. |
| **Isolasi Keamanan Sumber** | Ya (Android Sandbox) | **Tersedia** | Sumber dijalankan di lapisan backend/API terisolasi tanpa eksekusi kode pihak ketiga di peramban pengguna. |

---

### 2.5 Unduhan & Membaca Offline (Downloads & Offline)

| Kemampuan | Referensi Mihon | Status Yomirra | Catatan & Implementasi Yomirra |
|---|---|---|---|
| **PWA Standalone Offline Reading** | Tidak (Aplikasi Web) | **Tersedia** | Unduhan disimpan langsung ke penyimpanan browser (Cache Storage API) dan dapat dibaca tanpa sambungan internet. |
| **Ekspor Unduhan ZIP (Web Standard)** | Tidak | **Tersedia** | Untuk pengguna browser biasa, chapter diunduh langsung dalam bentuk arsip ZIP berformat gambar terurut. |
| **Antrean & Manajemen Unduhan** | Ya (Download Queue) | **Tersedia** | Halaman monitoring unduhan aktif dengan kemampuan jeda, batalkan, dan bersihkan berkas. |
| **Batasan Kapasitas Penyimpanan** | Tidak (Kapasitas Disk) | **Dibatasi Platform** | Mengikuti kuota kuota penyimpanan Cache Storage / IndexedDB browser (dapat dibersihkan oleh OS jika memori penuh). |

---

### 2.6 Data, Cadangan & Sinkronisasi (Backup & Sync)

| Kemampuan | Referensi Mihon | Status Yomirra | Catatan & Implementasi Yomirra |
|---|---|---|---|
| **Ekspor Cadangan JSON Lokal** | Ya (Protobuf Backup) | **Tersedia** | Ekspor berkas cadangan terenkripsi/tervalidasi skema v1–v3 yang mencakup riwayat, bookmark, preferensi, dan koleksi. |
| **Pemulihan Cadangan (Restore)** | Ya | **Tersedia** | Opsi penggabungan cerdas (*Merge*) atau penimpaan penuh (*Replace*) dengan pratinjau validasi berkas. |
| **Sinkronisasi Cloud Multidevice** | Fork (Syncyomi / Suwayomi) | **Tersedia (Opsional)** | Sinkronisasi nirkabel via akun Google/Firebase untuk bookmark, riwayat baca, dan preferensi lintas perangkat. |
| **Pembersihan Perangkat Bersama** | Parsial | **Tersedia** | Fitur satu-klik untuk membersihkan seluruh jejak cache, akun, bookmark, dan riwayat saat menggunakan perangkat umum. |

---

## 3. Komitmen Etika & Keterbatasan Platform

1. **Bukan Penerbit Konten**: Yomirra tidak memiliki server hosting konten komik mandiri. Ketersediaan chapter, mutu terjemahan, dan resolusi gambar sepenuhnya bergantung pada layanan penyedia sumber pihak ketiga.
2. **Kepatuhan Privasi**: Yomirra tidak menyematkan pelacak iklan pihak ketiga, analitik invasif, atau pengumpulan data pribadi tanpa persetujuan. Berkas cadangan tidak menyertakan kredensial pengguna.
3. **Integritas Desain**: Seluruh antarmuka Yomirra tunduk pada kontrak *design token* kanonikal (skala radius konsentris, palet semantik Washi/Hanko, Phosphor icons, dan kepatuhan kontras WCAG AA).
