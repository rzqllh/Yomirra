# Matriks Kapabilitas Fitur Yomirra (Web & PWA)

Dokumen ini memetakan kapabilitas fitur, arsitektur teknis, batasan platform web/PWA, serta status implementasi nyata di dalam repository Yomirra.

Yomirra adalah *web-first comic reader interface* modern yang dirancang untuk memberikan pengalaman membaca yang cepat, adaptif, dan mandiri di berbagai perangkat.

---

## 1. Arsitektur & Fondasi Platform

| Aspek | Spesifikasi Teknis Yomirra |
|---|---|
| **Platform Target** | Web Browser Modern & PWA Standalone (Cross-Platform: Windows, macOS, Linux, Android, iOS) |
| **Runtime Engine** | Next.js (React 19), TypeScript, Web Workers, Serwist Service Worker |
| **Penyimpanan Data** | LocalStorage, IndexedDB / Cache Storage (Client), Upstash Redis (Server Caching) |
| **Integrasi Sumber** | API Sumber Terpusat, Dynamic Manifest Terisolasi (tanpa eksekusi kode arbitrer di perangkat client) |
| **Penyimpanan Gambar Offline** | Cache Storage API (PWA Standalone) / Unduhan Berkas ZIP (Browser Biasa) |
| **Sinkronisasi Data** | Cloud Sync berbasis akun opsional + Ekspor/Pulihkan JSON Lokal |

---

## 2. Matriks Kapabilitas Fitur

### 2.1 Penemuan & Penjelajahan Katalog (Discovery & Browse)

| Kemampuan | Status | Catatan & Implementasi Teknis |
|---|---|---|
| **Pencarian Global Lintas Sumber** | **Tersedia** | Menjalankan kueri pencarian konkuren ke seluruh sumber aktif dengan pembatalan request (*AbortController*). |
| **Sticky Search & Morphing** | **Tersedia** | Transisi halus *spring morphing* 200ms saat search bar Beranda ter-scroll keluar layar, baik di Desktop (`TopNav`) maupun Mobile (`PageHeader`). |
| **Pencarian Sumber Tunggal** | **Tersedia** | Navigasi katalog per sumber dengan dukungan paginasi, filter genre, tipe (Manga/Manhwa/Manhua), dan status rilis. |
| **Penyaringan Tag & Judul Alternatif** | **Tersedia** | Mendukung awalan `#tag` untuk filter spesifik dan indexing nama judul alternatif. |
| **Jadwal Rilis Mingguan** | **Tersedia** | Visualisasi kalender rilis chapter mingguan berbasis metadata hari pembaruan. |
| **Peringkat & Editorial Spotlight** | **Tersedia** | Carousel editorial spotlight dengan auto-advance, indikator aksesibel, dan leaderboard komik terpopuler. |

---

### 2.2 Rak Buku & Manajemen Koleksi (Library Management)

| Kemampuan | Status | Catatan & Implementasi Teknis |
|---|---|---|
| **Penyimpanan Bookmark** | **Tersedia** | Satu klik untuk menyimpan ke Rak Buku pribadi tanpa memicu rating publik. |
| **Koleksi Kustom (Custom Categories)** | **Tersedia** | Pengguna dapat membuat, mengubah nama, dan mengorganisasi komik ke dalam folder koleksi dinamis. |
| **Smart Collections** | **Tersedia** | Koleksi terhitung otomatis: *Lanjut Dibaca*, *Belum Dibaca*, dan *Selesai*. |
| **Persentase Progres Seri** | **Tersedia** | Dihitung proporsional terhadap total chapter komik yang tersedia dan divisualisasikan dengan progress bar. |
| **Mode Tampilan Katalog** | **Tersedia** | Toggle tampilan Grid Normal, Grid Padat, dan Baris List dengan geometri terstandarisasi. |
| **Pengurutan & Filter Fleksibel** | **Tersedia** | Filter chip dan dropdown terpadu untuk sumber, format, status rilis, dan urutan pembaruan. |

---

### 2.3 Pengalaman Membaca (Reader Engine)

| Kemampuan | Status | Catatan & Implementasi Teknis |
|---|---|---|
| **Mode Webtoon (Continuous Vertical)** | **Tersedia** | Rendering vertikal mulus dengan lazy loading gambar via `IntersectionObserver` dan penyesuaian jarak antar-halaman. |
| **Mode Berhalaman (LTR & RTL)** | **Tersedia** | Transisi halaman horisontal dengan navigasi sentuh, keyboard, atau tombol dock. |
| **Navigasi Drawer Chapter Cepat** | **Tersedia** | Drawer daftar chapter langsung melompat (*auto-scroll*) ke chapter yang sedang atau terakhir dibaca saat dibuka. |
| **Kontrol Reader Otomatis (Proximity & Scroll)** | **Tersedia** | Kontrol dock muncul otomatis saat scroll naik, kursor mouse mendekati tepi atas/bawah layar pada Desktop, atau tombol navigasi keyboard ditekan. |
| **Scrubber Halaman Interaktif** | **Tersedia** | PWA/Web scrubber slider responsif untuk melompat langsung ke halaman target. |
| **Pengaturan Tampilan Khusus per Judul** | **Tersedia** | Preferensi arah baca dan zoom dapat dikunci khusus untuk judul tertentu atau berlaku global. |
| **Tema Latar Belakang Pembaca** | **Tersedia** | Pilihan latar belakang OLED Pure Black, Washi Dark, Netral, dan Terang. |

---

### 2.4 Sumber & Migrasi (Source Health & Migration)

| Kemampuan | Status | Catatan & Implementasi Teknis |
|---|---|---|
| **Manajemen Sumber Aktif** | **Tersedia** | Toggle aktivasi sumber untuk mengatur keterlibatan dalam katalog Beranda, Library, dan Populer. |
| **Deteksi Status Layanan (Health Check)** | **Tersedia** | Indikator visual real-time untuk sumber yang beroperasi normal atau sedang dalam perawatan (*Under Maintenance*). |
| **Migrasi Sumber Otomatis (Relink)** | **Tersedia** | Fitur *Cari Sumber Alternatif* pada halaman pemulihan judul yang mati atau gagal muat, memetakan kembali riwayat baca ke sumber pengganti. |
| **Isolasi Keamanan Sumber** | **Tersedia** | Sumber dijalankan di lapisan backend/API terisolasi tanpa eksekusi kode pihak ketiga di peramban pengguna. |

---

### 2.5 Unduhan & Membaca Offline (Downloads & Offline)

| Kemampuan | Status | Catatan & Implementasi Teknis |
|---|---|---|
| **PWA Standalone Offline Reading** | **Tersedia** | Unduhan disimpan langsung ke penyimpanan browser (Cache Storage API) dan dapat dibaca tanpa sambungan internet. |
| **Ekspor Unduhan ZIP (Web Standard)** | **Tersedia** | Untuk pengguna browser biasa, chapter diunduh langsung dalam bentuk arsip ZIP berformat gambar terurut. |
| **Antrean & Manajemen Unduhan** | **Tersedia** | Halaman monitoring unduhan aktif dengan kemampuan jeda, batalkan, dan bersihkan berkas. |
| **Batasan Kapasitas Penyimpanan** | **Dibatasi Platform** | Mengikuti kuota penyimpanan Cache Storage / IndexedDB browser (dapat dibersihkan oleh OS jika memori perangkat penuh). |

---

### 2.6 Data, Cadangan & Sinkronisasi (Backup & Sync)

| Kemampuan | Status | Catatan & Implementasi Teknis |
|---|---|---|
| **Ekspor Cadangan JSON Lokal** | **Tersedia** | Ekspor berkas cadangan terenkripsi/tervalidasi skema v1–v3 yang mencakup riwayat, bookmark, preferensi, dan koleksi. |
| **Pemulihan Cadangan (Restore)** | **Tersedia** | Opsi penggabungan cerdas (*Merge*) atau penimpaan penuh (*Replace*) dengan pratinjau validasi berkas. |
| **Sinkronisasi Cloud Multidevice** | **Tersedia (Opsional)** | Sinkronisasi nirkabel via akun Google/Firebase untuk bookmark, riwayat baca, dan preferensi lintas perangkat. |
| **Pembersihan Perangkat Bersama** | **Tersedia** | Fitur satu-klik untuk membersihkan seluruh jejak cache, akun, bookmark, dan riwayat saat menggunakan perangkat umum. |

---

## 3. Komitmen Etika & Keterbatasan Platform

1. **Bukan Penerbit Konten**: Yomirra tidak memiliki server hosting konten komik mandiri. Ketersediaan chapter, mutu terjemahan, dan resolusi gambar sepenuhnya bergantung pada layanan penyedia sumber pihak ketiga.
2. **Kepatuhan Privasi**: Yomirra tidak menyematkan pelacak iklan pihak ketiga, analitik invasif, atau pengumpulan data pribadi tanpa persetujuan. Berkas cadangan tidak menyertakan kredensial pengguna.
