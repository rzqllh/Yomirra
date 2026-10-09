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

Search global tidak mengikuti toggle penjelajahan di Beranda/Library/Populer. Source yang benar-benar unavailable tetap dikeluarkan dari pencarian. Pada halaman Sumber, status layanan dan preferensi penjelajahan ditampilkan sebagai dua hal yang berbeda: source dapat tetap dipilih pengguna walaupun sementara sedang bermasalah.

### Beranda dan discovery

Beranda memprioritaskan komik, bukan banner dekoratif. Bagian pembuka memakai Hero ringkas dengan pencarian global, lalu `Sorotan terbaru` dan peringkat Top 5 per sumber sebelum Lanjut Baca dan daftar yang baru diperbarui. Toggle penjelajahan pada halaman Sumber berlaku konsisten ke Beranda, Library, dan Populer; Search tetap independen.

Sorotan menjaga variasi sumber lebih dulu, menghindari penggabungan judul lintas sumber bila identitasnya belum cukup pasti, dan menghormati `prefers-reduced-motion`. Top 5 di Beranda tetap source-scoped. Halaman Populer memiliki mode `Gabungan` yang mengagregasi posisi per sumber tanpa membandingkan angka popularity mentah, serta mode `Per Sumber` yang mempertahankan urutan native masing-masing source.

### Library, Rak Buku, dan progress

Judul yang disimpan memakai identitas yang tidak bergantung pada satu source saja. Satu judul dapat memiliki primary source dan linked source, sehingga relink atau migrasi source tidak harus memutus library dan progress baca.

Rak Buku menyediakan:

- sedang dibaca dan riwayat;
- bookmark;
- koleksi buatan user;
- Smart Collections yang dihitung dari state lokal, seperti Lanjut Dibaca, Belum Dibaca, Baru Ditambahkan, Rating Tinggi, dan Lama Tidak Dibuka.

Smart Collections tidak membuat salinan membership baru. Isinya dihitung dari Library dan reading history.

**Cloud Sync (opsional)** memakai Firebase untuk menyelaraskan Library, riwayat baca, preferensi sumber, dan koleksi buatan pengguna saat akun tersedia. Penghapusan Library dan riwayat memakai penanda penghapusan (*tombstone*) agar data lama tidak muncul kembali dari perangkat lain. Kegagalan sync manual dilaporkan sebagai kegagalan, bukan keberhasilan.

Bookmark hanya ditambahkan lewat tindakan menyimpan yang eksplisit; rating atau koleksi tidak otomatis membuat bookmark. Status baca `readingStatusByManga` masih lokal, bukan bagian dari Cloud Sync. Sinkronisasi dua perangkat nyata tetap memerlukan uji manual.

### Rekomendasi

Rekomendasi utama bersifat deterministic dan tidak membutuhkan AI. Ranking menggunakan sinyal yang sudah ada, seperti source, format, rating user, status, dan riwayat baca.

Judul yang sedang dibuka, sudah disimpan, atau sudah dibaca tidak diprioritaskan sebagai rekomendasi baru.

### Source recovery

Jika source utama bermasalah, Yomirra dapat mencari source alternatif untuk judul yang sama. Relink tidak dilakukan secara agresif untuk match yang ambigu, dan progress lama tetap dipertahankan bila chapter tidak bisa dipetakan dengan aman.

### Reader dan offline

Reader mendukung chapter berbasis gambar, progress baca, chapter navigator, preferensi reader, serta download/offline flow pada browser yang mendukung.

Navigasi reader menjaga parent page secara eksplisit: perpindahan detail → reader dan antar-chapter tidak meninggalkan reader route lama di belakang tombol kembali, sehingga keluar ke detail lalu kembali lagi mengarah ke halaman asal, bukan ke reader sebelumnya.

Offline dan PWA bergantung pada kemampuan browser, Service Worker, dan storage perangkat.

Unduhan eksplisit tidak terus menjadwalkan pemrosesan saat antrian kosong. Untuk unduhan lama dengan URL gambar tanpa tanda tangan, engine dapat mencoba mengambil ulang URL resmi dari endpoint halaman sumber tanpa membuang halaman yang sudah di-cache. Pemulihan bergantung pada ketersediaan sumber dan tidak melemahkan validasi signed image proxy. Profiling timer browser dan smoke Safari masih merupakan verifikasi manual.

### Motion dan navigasi

Motion memakai semantic tokens bersama untuk page transition, layout spring, press feedback, dan delayed navigation feedback. Fast route transition tidak memunculkan loader sesaat; bila navigasi cukup lama, progress tipis baru muncul setelah delay singkat sementara skeleton tetap dimiliki route `loading.tsx`.

Back/Forward tidak dioverride dengan scroll restoration custom. Browser history tetap menjadi sumber utama untuk scroll restoration, sedangkan reader progress disimpan terpisah dari scroll halaman aplikasi.

Stateful icon morphing dibatasi melalui wrapper internal yang menghormati `prefers-reduced-motion`; package animasi tidak diimport langsung dari feature components dan tidak dipakai untuk identitas route/navigation yang harus stabil.

## Arsitektur internal

UI utama dipisahkan menurut ownership: `chrome` untuk shell/navigation, `overlays` untuk overlay lintas halaman, `home` untuk Beranda, dan `komik` untuk presentasi manga/manhwa/manhua. Nama internal `Manga*` yang sudah menjadi contract tetap dipertahankan, begitu juga public route `/manga/*` agar deep link dan bookmark tidak berubah.

Client code hanya memakai contract browser-safe dari `src/shared/`; adapter, Redis, credential, dan service privileged tetap berada di `src/server/`. Import production mengarah langsung ke module pemiliknya sehingga tidak bergantung pada legacy folder atau barrel tanpa consumer.

## Source bawaan

Yomirra memiliki beberapa adapter source bawaan dan mendukung konfigurasi source runtime. Daftar source, status availability, dan kemampuan masing-masing source ditampilkan oleh aplikasi pada saat runtime agar dokumentasi publik tidak bergantung pada nama provider yang dapat berubah.

Source dapat berubah status atau berhenti bekerja tanpa perubahan di Yomirra.

## Search intelligence dan AI

AI bukan dependency untuk fungsi utama Yomirra.

Tanpa `GEMINI_API_KEY`, search tetap menyediakan tag parsing, canonical filters, typo handling, lexical ranking, dan multi-source search biasa.

Jika `GEMINI_API_KEY` tersedia, Yomirra dapat menggunakan embedding untuk semantic ranking. Catalog semantic hanya menyimpan metadata manga publik yang ditemukan saat penggunaan normal; library, history, progress baca, dan data akun tidak dimasukkan ke catalog tersebut.

## Security dan reliability

Boundary privileged tetap berada di server:

- admin API memakai authorization server-side dan browser admin memakai session bertanda tangan, HttpOnly, dan berumur pendek; raw passkey tidak disimpan di browser storage;
- reusable upstream credential dibaca dari environment server-only dan konfigurasi yang hilang gagal tertutup pada saat request upstream tanpa menjatuhkan registry source lain;
- route yang mahal atau sensitif memakai rate-limit namespace terpisah: mutation admin dan optional expensive compute gagal tertutup bila limiter tidak tersedia, sedangkan public search/image delivery mempertahankan availability dengan policy fail-open;
- rate limiting yang fail-closed menunggu readiness Redis secara terbatas pada cold-start; policy fail-open publik tidak menunggu saat Redis belum siap, lalu kembali menghitung limit normal setelah client siap;
- browser response memakai baseline Content Security Policy dalam mode report-only untuk mengamati compatibility Next.js, Firebase, remote assets, dan PWA sebelum enforcement;
- generic public error surfaces tidak menampilkan raw exception/upstream error; detail diagnosis tetap dicatat melalui jalur server/log yang disanitasi;
- logger men-sanitasi authorization header, cookie, token, secret, API key, signature, signed URL, dan field sensitif lain sebelum ditulis ke log.

Detail threat boundary dan aturan implementasi ada di [Security Policy](SECURITY.md).

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
- [Execution Roadmap](docs/yomirra-master-execution-roadmap.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Disclaimer

Yomirra adalah reader interface independen. Konten, artwork, manga, manhwa, dan manhua yang ditampilkan berasal dari layanan pihak ketiga dan tetap menjadi milik pemegang hak masing-masing.

Penggunaan source pihak ketiga mengikuti aturan dan ketersediaan layanan tersebut. Yomirra tidak menjamin source tertentu akan selalu tersedia.
