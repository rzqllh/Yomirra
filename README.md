# Yomirra

A modern manga, manhwa, and webtoon reader built around a simple idea: **reading should stay out of your way.**

Yomirra combines multi-source discovery, Library management, reading progress, offline chapters, and a mobile-first reader in one place.

Current release: **v1.18.0**

---

# English

## Read without fighting the reader

Yomirra is built for actually reading, not for filling the screen with controls.

Search across supported sources, save titles to your Library, continue from where you stopped, download chapters when needed, and keep everything organized without turning the app into a dashboard.

### What you can do

* **Read manga, manhwa, and webtoons**

  * Vertical reading for long-strip content.
  * Paged reading for traditional manga layouts.
  * Reader preferences and controls designed around mobile use.

* **Search across multiple sources**

  * Browse different supported catalog sources from one app.
  * Source-specific filters are only shown when they are actually supported.
  * Problems with one source are isolated from the rest of the app where possible.

* **Build your own Library**

  * Save titles you are following.
  * Organize them using Collections.
  * Use reading statuses to separate what you are reading, planning, or already finished.

* **Continue where you stopped**

  * Yomirra keeps track of reading history and progress.
  * Continue Reading gives you a direct way back into your latest chapters.

* **Keep up with new chapters**

  * Library titles can be checked for chapter updates.
  * Updates are surfaced separately so you do not need to manually reopen every series.

* **Read offline**

  * Download chapters to the device.
  * Manage saved chapters from Download Manager.
  * Open downloaded pages directly through the reader without requiring the original source to stay available.

* **Keep your data portable**

  * Backup and restore supported local Yomirra data.
  * Useful when moving devices, reinstalling the app, or keeping a personal copy of your reading data.

* **Use it like an app**

  * Yomirra is PWA-enabled and can be installed on supported browsers and devices.

## Local-first where it matters

Core reading data such as Library state, history, reader preferences, and downloaded content is designed to remain useful locally.

Account features and synchronization extend that experience across devices, but the reader is not designed around requiring a permanent connection for every action.

## Multi-source by design

Yomirra does not treat every source as if it exposes the same catalog or capabilities.

Search, filters, chapter data, images, availability, and other behavior can differ between sources. The application keeps those differences behind its source layer instead of leaking them into the reader experience whenever possible.

Content availability ultimately depends on the configured third-party sources. Yomirra itself is a reader and does not host their catalog content.

## Install as an app

On a supported browser:

1. Open Yomirra.
2. Use the browser's **Add to Home Screen** or **Install App** option.
3. Launch Yomirra from your home screen like a regular application.

PWA capabilities may vary by browser and operating system.

## For developers

This repository also contains the application source and its supporting architecture.

Yomirra is currently built around:

* Next.js
* React
* Zustand-based application state
* Firebase authentication and sync
* Source adapters for external catalogs
* Local-first reading and download state
* PWA support

Development setup, architecture, source adapter behavior, data boundaries, project structure, and contribution notes are documented separately:

**[`docs/README_DEV.md`](docs/README_DEV.md)**

---

# Bahasa Indonesia

## Baca tanpa ribet sama aplikasinya

Yomirra dibuat supaya UI-nya tidak mengganggu hal yang paling penting: baca komik.

Cari judul dari beberapa source, simpan ke Library, lanjut dari progres terakhir, download chapter untuk dibaca offline, dan atur koleksi tanpa membuat reader terasa penuh dengan menu yang tidak perlu.

### Yang bisa dilakukan di Yomirra

* **Baca manga, manhwa, dan webtoon**

  * Vertical reader untuk format long-strip.
  * Paged reader untuk format manga tradisional.
  * Reader preferences dan kontrol yang dirancang terutama untuk penggunaan mobile.

* **Cari dari beberapa source**

  * Jelajahi beberapa catalog source dari satu aplikasi.
  * Filter hanya muncul ketika memang didukung oleh source tersebut.
  * Masalah pada satu source sebisa mungkin tidak mengganggu source lainnya.

* **Atur Library sendiri**

  * Simpan judul yang sedang diikuti.
  * Kelompokkan menggunakan Collections.
  * Gunakan reading status untuk membedakan bacaan aktif, rencana baca, atau yang sudah selesai.

* **Lanjut dari terakhir baca**

  * Yomirra menyimpan history dan reading progress.
  * Continue Reading memberi akses langsung ke bacaan terakhir tanpa perlu mencari chapter lagi.

* **Pantau chapter baru**

  * Judul yang ada di Library dapat diperiksa untuk update chapter.
  * Update ditampilkan terpisah supaya tidak perlu membuka setiap judul satu per satu.

* **Baca secara offline**

  * Download chapter ke perangkat.
  * Kelola chapter tersimpan melalui Download Manager.
  * Chapter yang sudah tersimpan dapat dibuka melalui reader tanpa bergantung pada source saat sedang dibaca.

* **Backup data**

  * Data lokal Yomirra yang didukung dapat dibackup dan direstore.
  * Berguna ketika pindah perangkat, reinstall, atau sekadar ingin menyimpan salinan data baca sendiri.

* **Pasang seperti aplikasi**

  * Yomirra mendukung PWA dan dapat dipasang melalui browser/perangkat yang kompatibel.

## Local-first untuk data yang penting

Library, history, reader preferences, download, dan sebagian besar state membaca dirancang agar tetap berguna secara lokal.

Fitur akun dan sinkronisasi melengkapi pengalaman tersebut untuk penggunaan lintas perangkat, bukan menjadikan koneksi cloud sebagai syarat untuk setiap aktivitas membaca.

## Multi-source dari awal

Setiap source bisa memiliki catalog, filter, struktur chapter, image handling, dan tingkat ketersediaan yang berbeda.

Karena itu Yomirra tidak memaksa semua source mengikuti behavior yang sama. Perbedaan tersebut sebisa mungkin ditangani di source layer agar pengalaman reader tetap konsisten.

Ketersediaan konten tetap bergantung pada source pihak ketiga yang digunakan. Yomirra sendiri berfungsi sebagai reader dan tidak meng-host katalog mereka.

## Pasang sebagai aplikasi

Pada browser yang mendukung:

1. Buka Yomirra.
2. Pilih **Add to Home Screen** atau **Install App** dari browser.
3. Jalankan Yomirra dari home screen seperti aplikasi biasa.

Kemampuan PWA dapat berbeda tergantung browser dan sistem operasi.

## Untuk developer

Repository ini juga berisi source code dan arsitektur aplikasi Yomirra.

Stack utama saat ini mencakup:

* Next.js
* React
* Zustand untuk application state
* Firebase authentication dan sync
* Source adapter untuk external catalog
* Local-first reading dan download state
* PWA support

Setup development, architecture, source adapter, data boundaries, struktur project, dan catatan kontribusi dipisahkan supaya README utama tetap fokus pada pengguna:

**[`docs/README_DEV.md`](docs/README_DEV.md)**
