# Yomirra

Yomirra adalah web reader manga, manhwa, dan manhua dari beberapa sumber. Cari judul, simpan ke Rak Buku, dan lanjutkan bacaan di satu aplikasi.

**[Buka Yomirra](https://www.yomirra.web.id/)** · [Panduan pembaca](docs/USER_GUIDE.md) · [Bantuan](docs/TROUBLESHOOTING.md) · [Dokumentasi](docs/README.md)

Yomirra masih aktif dikembangkan. Katalog, bahasa, kelengkapan chapter, dan ketersediaan gambar mengikuti layanan sumber pihak ketiga.

## Mulai membaca

1. Cari judul dari Beranda atau Search. Coba judul alternatif atau `#tag` untuk mempersempit hasil.
2. Pilih sumber yang tersedia, buka detail komik, lalu pilih chapter.
3. Gunakan tombol bookmark agar judul muncul di **Rak Buku**. Kunjungi **Lanjut Baca** di Beranda untuk meneruskan progres yang tersimpan.
4. Buka **Pengaturan** untuk tema, prioritas bahasa, serta ekspor cadangan. Akun bersifat opsional untuk sinkronisasi yang didukung.

## Kemampuan dan batasnya

| Kebutuhan | Yang tersedia | Batas yang perlu diketahui |
| --- | --- | --- |
| Menemukan bacaan | Pencarian lintas sumber, judul alternatif, tag/filter, discovery, dan rekomendasi tanpa AI | Hasil dan filter mengikuti kemampuan sumber; kecocokan judul dapat ambigu |
| Mengatur koleksi | Bookmark, riwayat, koleksi buatan sendiri, dan Smart Collections dari data lokal | **Library** adalah penjelajahan katalog; **Rak Buku** adalah bacaan pribadi |
| Melanjutkan bacaan | Progres halaman, navigator chapter, arah vertikal/LTR/RTL, preferensi per judul atau semua komik | Perbedaan penomoran chapter antar sumber dapat memerlukan pilihan manual |
| Memulihkan sumber | Status layanan, kelompok **Under Maintenance**, dan pencarian sumber alternatif | Tidak menjamin judul tersedia atau progres dapat dipetakan otomatis |
| Membaca offline | Antrean unduhan pada PWA standalone dan pembacaan unduhan yang memenuhi klasifikasi aman | Browser biasa mengunduh ZIP; cache dapat dibuang perangkat |
| Menjaga data | Penyimpanan lokal, ekspor/pulihkan JSON, dan sinkronisasi Firebase opsional | Gambar unduhan tidak masuk cadangan/cloud sync; status baca masih lokal |

Pilihan penjelajahan di **Sumber** berlaku untuk Beranda, Library, dan Populer. Pencarian global tetap memakai sumber yang tersedia terlepas dari toggle penjelajahan. Status layanan berbeda dari preferensi tersebut.

Progres lokal tetap tersedia saat sinkronisasi gagal. Menghapus data situs atau kehilangan perangkat dapat menghilangkan data yang belum dicadangkan. Baca [data bacaan dan cadangan](docs/READING_DATA.md) sebelum memindahkan perangkat atau membersihkan penyimpanan.

PWA, offline, gestur, dan penyimpanan bergantung pada browser serta perangkat. Implementasi dan tes otomatis tidak menjamin semua alur telah lulus di iPhone/iPad fisik atau dua perangkat dengan Firebase. [Panduan pengujian](docs/TESTING.md) membedakan pemeriksaan otomatis dan manual.

## Bantuan dan laporan

Mulai dari [pemecahan masalah](docs/TROUBLESHOOTING.md) untuk sumber gagal, halaman kosong, unduhan, dan sinkronisasi. Laporkan bug melalui [GitHub Issues](https://github.com/rzqllh/Yomirra/issues) dengan langkah reproduksi dan informasi perangkat yang sudah disanitasi.

Untuk kerentanan, ikuti [Security Policy](SECURITY.md). Untuk dugaan masalah hak konten, gunakan [panduan laporan hak konten](docs/CONTENT_RIGHTS_REPORTING.md). Jangan mengirim token, cookie, cadangan pribadi, atau data akun ke issue publik.

## Menjalankan secara lokal

Gunakan Node.js **22** dan pnpm **9** untuk mengikuti versi mayor di CI. Repository belum menetapkan `engines` atau `packageManager`; dependency mengikuti [package.json](package.json) dan lockfile.

```bash
pnpm install --frozen-lockfile
```

Salin `.env.example` menjadi `.env` (`cp .env.example .env` pada Bash atau `Copy-Item .env.example .env` pada PowerShell). Isi konfigurasi lokal yang diperlukan; ganti placeholder `IMAGE_PROXY_SECRET` dengan secret lokal acak minimal 32 karakter. Jangan memakai kredensial produksi untuk pengembangan.

```bash
pnpm dev
```

Buka `http://localhost:3000`. Public browsing dapat mencoba sumber tanpa Redis; akun/sync, operasi admin, dan layanan opsional memerlukan konfigurasi masing-masing. Detail setup, kategori environment, serta readiness ada di [Developer Guide](docs/README_DEV.md).

Pemeriksaan kode:

```bash
pnpm typecheck
pnpm lint
pnpm test -- --run
pnpm build
```

Lihat [Contributing](CONTRIBUTING.md), [Adding a Source](docs/ADDING_A_SOURCE.md), dan [peta dokumentasi](docs/README.md) untuk pekerjaan berikutnya.

## Referensi dan lisensi

Yomirra adalah reader interface independen yang dibangun dengan standar web-first modern. Yomirra mengutamakan ergonomi baca mandiri, performa offline, dan netralitas katalog. Tinjau [matriks kapabilitas fitur](docs/FEATURE_PARITY.md) untuk perincian kapabilitas platform dan [tinjauan lisensi independen](docs/REFERENCE_LICENSING_REVIEW.md) untuk kepatuhan lisensi serta batasan karya.

Kode yang dicakup [LICENSE](LICENSE) menggunakan Apache-2.0. Lisensi itu tidak memberi hak atas chapter, terjemahan, cover, artwork, logo, atau materi pihak ketiga. Akses dan penggunaan konten mengikuti hak pemilik serta ketentuan layanan sumber. [Changelog](CHANGELOG.md) mencatat perubahan repository; kesiapan perangkat, layanan, dan legal memerlukan bukti terpisah.
