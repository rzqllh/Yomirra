# Dokumentasi Yomirra

Mulai dari [README proyek](../README.md) untuk gambaran produk. Pilih panduan berdasarkan pekerjaan berikutnya.

## Untuk pembaca

| Tujuan | Panduan |
| --- | --- |
| Cari judul, baca, simpan, pindah sumber, atau pasang PWA | [Panduan pembaca](USER_GUIDE.md) |
| Sumber/gambar gagal, offline bermasalah, atau perlu melaporkan bug | [Bantuan dan FAQ](TROUBLESHOOTING.md) |
| Pindah perangkat, ekspor/pulihkan, atau memahami cloud sync | [Data bacaan dan cadangan](READING_DATA.md) |
| Laporkan kerentanan atau masalah hak konten | [Security](../SECURITY.md) · [Hak konten](CONTENT_RIGHTS_REPORTING.md) |

## Untuk contributor

Mulai dari [Developer Guide](README_DEV.md), [Contributing](../CONTRIBUTING.md), dan [Testing](TESTING.md).

- [Architecture](ARCHITECTURE.md) — runtime, client/server boundary, sumber, cache, dan state.
- [Adding a Source](ADDING_A_SOURCE.md) — adapter, manifest, normalisasi, dan pengujian sumber.
- [Identity](IDENTITY.md) — identitas judul, linked source, riwayat, dan migrasi.
- [Schema](SCHEMA.md) — types, store, persistence, dan kontrak API.
- [Stack](STACK.md) — dependency dan perannya.
- [Components](COMPONENTS.md) · [Design](DESIGN.md) — komponen, layout, motion, dan overlay.
- [Feature Parity](FEATURE_PARITY.md) — matriks kesetaraan fitur dengan Mihon/Tachimanga, batasan PWA/web, dan status implementasi.
- [Reference & Licensing](REFERENCE_LICENSING_REVIEW.md) — referensi produk dan batas penggunaan ulang.
- [Changelog](../CHANGELOG.md) — perubahan repository dan batas verifikasi yang dicatat saat perubahan.

## Untuk maintainer dan operasi

[Architecture: cache dan Redis](ARCHITECTURE.md#9-cache-dan-redis) menjelaskan liveness versus readiness. [Testing](TESTING.md) memuat pemeriksaan Redis, sumber, browser, dan perangkat. Ikuti instruksi environment terisolasi sebelum menjalankan pemeriksaan yang melakukan mutasi.

Folder `ops/`, `handoff/`, `internal/`, dan catatan bertanggal menyimpan bukti atau konteks pekerjaan tertentu. Status insiden, draft PR, dan gate di dalamnya adalah catatan pada waktunya, bukan status layanan saat ini atau panduan pembaca. Bukti baru dicatat terpisah; riwayat tidak dihapus untuk membuat status terlihat hijau.

## Source of truth

Jika docs dan repository berbeda, urutan prioritasnya:

1. implementation + tests terbaru;
2. `package.json` dan runtime config;
3. `docs/DESIGN.md` untuk design contract;
4. public docs lain.

Jangan mempertahankan dokumentasi yang sudah tidak sesuai hanya karena pernah benar.

## Prinsip dokumentasi

- Dokumentasikan behavior yang benar-benar ada.
- Bedakan feature yang deterministic, optional, source-dependent, dan experimental.
- Jangan klaim browser/PWA behavior hanya dari unit test.
- Jangan tulis credential, private URL, cookie, token, atau secret header.
- Update docs dalam PR yang sama saat public contract berubah.
