# Yomirra

Yomirra adalah web reader multi-source untuk manga, manhwa, dan manhua. Tujuannya sederhana: pencarian, library, progress baca, dan reader tetap berada di satu aplikasi walaupun sumber kontennya berbeda-beda atau berubah.

**Aplikasi:** https://www.yomirra.web.id/

> Yomirra masih aktif dikembangkan. Ketersediaan judul dan source mengikuti layanan pihak ketiga yang dipakai.

## Yang sudah tersedia

### Multi-source search

Search berjalan ke beberapa source dan menggabungkan hasil yang terdeteksi sebagai judul yang sama.

Fitur search saat ini mencakup:

- canonical title matching lintas source;
- alternate/original title matching;
- `#tag` untuk genre, format, dan status;
- alias Indonesia/English untuk tag;
- typo handling dan lexical/fuzzy ranking;
- filter mapping ke nilai yang dimengerti masing-masing source;
- optional semantic ranking bila `GEMINI_API_KEY` tersedia.

Search global tidak mengikuti toggle source di Library/Populer. Source yang benar-benar unavailable tetap dikeluarkan dari pencarian.

### Library, Rak Buku, dan progress

Judul yang disimpan memakai identitas yang tidak bergantung pada satu source saja. Satu judul dapat memiliki primary source dan linked source, sehingga relink atau migrasi source tidak harus memutus library dan progress baca.

Rak Buku menyediakan:

- sedang dibaca dan riwayat;
- bookmark;
- koleksi buatan user;
- Smart Collections yang dihitung dari state lokal, seperti Lanjut Dibaca, Belum Dibaca, Baru Ditambahkan, Rating Tinggi, dan Lama Tidak Dibuka.

Smart Collections tidak membuat salinan membership baru. Isinya dihitung dari Library dan reading history.

### Rekomendasi

Rekomendasi utama bersifat deterministic dan tidak membutuhkan AI. Ranking menggunakan sinyal yang sudah ada, seperti source, format, rating user, status, dan riwayat baca.

Judul yang sedang dibuka, sudah disimpan, atau sudah dibaca tidak diprioritaskan sebagai rekomendasi baru.

### Source recovery

Jika source utama bermasalah, Yomirra dapat mencari source alternatif untuk judul yang sama. Relink tidak dilakukan secara agresif untuk match yang ambigu, dan progress lama tetap dipertahankan bila chapter tidak bisa dipetakan dengan aman.

### Reader dan offline

Reader mendukung chapter berbasis gambar, progress baca, chapter navigator, preferensi reader, serta download/offline flow pada browser yang mendukung.

Offline dan PWA bergantung pada kemampuan browser, Service Worker, dan storage perangkat.

## Source bawaan

Saat ini registry bawaan berisi:

- Shinigami
- Komikindo
- MangaDex
- Komiku
- Komiku II
- Asura Scans
- KomikNesia

Source dapat berubah status atau berhenti bekerja tanpa perubahan di Yomirra.

## Search intelligence dan AI

AI bukan dependency untuk fungsi utama Yomirra.

Tanpa `GEMINI_API_KEY`, search tetap menyediakan tag parsing, canonical filters, typo handling, lexical ranking, dan multi-source search biasa.

Jika `GEMINI_API_KEY` tersedia, Yomirra dapat menggunakan embedding untuk semantic ranking. Catalog semantic hanya menyimpan metadata manga publik yang ditemukan saat penggunaan normal; library, history, progress baca, dan data akun tidak dimasukkan ke catalog tersebut.

## Menjalankan secara lokal

Butuh Node.js yang kompatibel dengan Next.js 16 dan pnpm.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Verifikasi penuh:

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

Lihat [Developer Guide](docs/README_DEV.md) untuk struktur project dan [Adding a Source](docs/ADDING_A_SOURCE.md) untuk integrasi source.

## Dokumentasi

- [Architecture](docs/ARCHITECTURE.md)
- [Components](docs/COMPONENTS.md)
- [Design](docs/DESIGN.md)
- [Identity](docs/IDENTITY.md)
- [Schema](docs/SCHEMA.md)
- [Stack](docs/STACK.md)
- [Testing](docs/TESTING.md)
- [Adding a Source](docs/ADDING_A_SOURCE.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Disclaimer

Yomirra adalah reader interface independen. Konten, artwork, manga, manhwa, dan manhua yang ditampilkan berasal dari layanan pihak ketiga dan tetap menjadi milik pemegang hak masing-masing.

Penggunaan source pihak ketiga mengikuti aturan dan ketersediaan layanan tersebut. Yomirra tidak menjamin source tertentu akan selalu tersedia.
