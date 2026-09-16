<div align="center">

# Yomirra

### Cari dari banyak source. Simpan di satu rak. Baca nyaman di HP.

Reader manga, manhwa, dan webtoon yang dibuat **mobile-first**.  
Cari judul lintas source, simpan progres, baca offline, lalu lanjut dari tempat terakhir tanpa harus ngurus banyak tab atau bookmark situs.

[**Buka Yomirra**](https://yomirra.vercel.app/) · [English](README-EN.md) · [Developer Guide](README-DEV.md)

[![Live](https://img.shields.io/badge/live-yomirra.vercel.app-111111)](https://yomirra.vercel.app/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)

</div>

> [!TIP]
> **Paling enak dipakai di mobile.** Yomirra tetap mendukung desktop, tetapi navigasi, touch target, reader controls, dan layout utamanya dirancang untuk layar HP. Di browser yang mendukung, Yomirra juga bisa ditambahkan ke home screen sebagai PWA.

## Kenapa Yomirra?

Masalah manga reader biasanya bukan sekadar “bisa buka chapter atau tidak”. Library tersebar, source bisa berubah, progres gampang hilang, dan pengalaman mobile sering terasa seperti website yang dipaksa jadi aplikasi.

Yomirra mencoba menyederhanakan itu menjadi satu alur:

- **Cari lintas source** — gunakan single-source atau multi-source search tanpa membuka banyak situs satu per satu.
- **Satu Rak Buku** — simpan manga, koleksi, status baca, riwayat, dan update dalam satu tempat.
- **Reader yang memang dibuat untuk baca** — mode vertical dan paged, kontrol responsif, progres tersimpan, dan penanganan image failure.
- **Baca offline** — download chapter dan buka kembali dari cache saat tersedia.
- **Tidak bergantung pada satu source** — kegagalan satu source tidak harus mematikan seluruh pencarian atau koleksi.
- **Backup dan sync** — backup/restore data lokal serta sinkronisasi akun untuk data yang didukung.

## Source bawaan

| Source | Jenis | Catatan |
| --- | --- | --- |
| MangaDex | API | Source internasional dengan rate-limit handling |
| Shinigami | Web source | Manga, manhwa, dan webtoon Indonesia |
| Komiku | Web source | Manga, manhwa, dan webtoon Indonesia |
| Komikindo | Web source | Manga Indonesia dengan stale-cache fallback jika tersedia |

Ketersediaan source berada di luar kontrol Yomirra. Source dapat berubah, lambat, atau offline sewaktu-waktu.

## Mulai baca

Tidak perlu install untuk mencoba.

### **https://yomirra.vercel.app/**

Buka dari browser HP, pilih source, cari judul, lalu baca. Kalau cocok, tambahkan ke home screen agar terasa lebih seperti aplikasi native.

## Yang ada sekarang

Yomirra saat ini mencakup:

- Jelajah katalog dan pencarian multi-source
- Rak Buku, koleksi, status baca, riwayat, dan update
- Manga detail dan chapter list
- Vertical reader dan paged reader
- Download dan offline reading
- Reading progress dan continue reading
- Source health/error handling
- Backup dan restore
- Firebase authentication dan sync untuk data yang didukung
- PWA/service worker support
- Responsive mobile dan desktop layout

Perubahan terbaru ada di [CHANGELOG.md](CHANGELOG.md).

## Tentang konten

Yomirra adalah **reader client independen**. Yomirra tidak meng-host manga, chapter, atau gambar source. Konten diminta dari layanan pihak ketiga yang tersedia, dan masing-masing source dapat memiliki aturan serta ketersediaan sendiri.

Gunakan Yomirra sesuai hukum yang berlaku dan ketentuan source yang digunakan.

## Project links

- [English README](README-EN.md)
- [Developer Guide](README-DEV.md)
- [Documentation](docs/README.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [License](LICENSE)

Licensed under the [Apache License 2.0](LICENSE).
