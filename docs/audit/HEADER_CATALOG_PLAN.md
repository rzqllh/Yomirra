# Rencana header dan katalog

27 November 2026. Urutan kerja, dependensi, dan bukti ada di [tracker](HEADER_CATALOG_TRACKER.md). Mulai sesi lanjutan dari [handoff](../handoff/HEADER_CATALOG_HANDOFF.md).

## Arah produk dan lingkup

Owner meminta header dalam halaman seperti di gambar hanya tampil di mobile pada semua halaman yang relevan. Gunakan batas `md` sesuai audit. Pertahankan TopNav dan rail desktop, kontrol reader yang independen, serta struktur hero Home, Help, dan detail. Setiap halaman memiliki satu `h1` yang dapat diakses di kedua sisi `md`. Pada halaman dengan hero, judul hero tetap menjadi heading utama. Verifikasi judul route, semantik, dan posisi aksi pada halaman utama, loading, dan kondisi gagal yang relevan.

Wajib mencakup migrasi aksi dan heading sebelum banner desktop dilepas, perapian layout, dan koreksi perilaku katalog di Fase 2. Gunakan komponen dan token yang sudah berlaku. Baca panduan Next.js lokal yang relevan sebelum mengubah kode. Lingkup di luar kedua fase mencakup konten reader, auth dan sync, Turso, rilis, serta perubahan data yang berisiko. Kontras chrome reader ditangani lewat pekerjaan CI terpisah.

### Fase 1 — Header, navigasi, dan layout

Tuntaskan migrasi heading, landmark, aksi, dan navigasi balik sebelum mematikan banner desktop. Konsolidasikan label route dan aturan search pill sesuai keputusan owner. Selaraskan gutter, divider, spasi, dan `ContentLane` pada Settings, Downloads, dan Help. Rapikan kontrol Downloads dan kedua tab Populer. Perbarui kontrak loading dan test yang terdampak, lalu verifikasi navigasi dan layout lintas breakpoint.

#### Kontrak shell bersama untuk HC-10, HC-11, dan HC-15

- TopNav dan DestinationHeader menggunakan label tujuan yang sama. Breadcrumb desktop memberi tautan ke induk yang dikenal dan menandai tujuan aktif. Label umum untuk Help, Catalog, dan detail komik adalah Pusat Bantuan, Katalog, dan Komik.
- Search pill TopNav tersedia pada rute non-reader selain Cari. Di Beranda, pill muncul setelah tombol pencarian hero melewati batas header dan hilang saat tombol hero masuk kembali. Anchor yang tiba setelah loading dipantau saat tersedia.
- DestinationHeader memakai mode desktop compact. PageHeader menyediakan mode ini bagi pemanggil yang memilihnya. Pada desktop, mode compact menampilkan hanya aksi eksplisit dan tombol kembali jika diminta. Tempatkan kontrol ini di ContentLane jika lebar konten dibatasi. Mode compact menyediakan satu H1 sesuai breakpoint secara default. Gunakan `headingOwner="content"` ketika hero atau isi halaman sudah menyajikan H1.
- `e2e/header-catalog-contract.spec.ts` mencakup batas 767/768 px, perilaku search pill dan fokus Quick Search, navigasi kembali dari Akun, serta aksi Hapus Semua dari fixture unduhan. Spesifikasi ini melengkapi matriks verifikasi fase.

#### Skenario browser untuk route Fase 1

- Di Downloads, seed satu unduhan selesai dan satu unduhan dijeda pada penyimpanan IndexedDB `yomirra-downloads`. Fokus tab dengan keyboard, pindah dengan panah, lalu periksa panel aktif. Batalkan dialog Hapus Semua sekali, lalu konfirmasi pada data fixture dan periksa kondisi kosong.
- Di Updates, gunakan Library uji dan respons pemindaian tertunda. Pastikan Perbarui ada di lane desktop, bisa diaktifkan dengan keyboard, lalu nonaktif selama pemindaian. Uji juga kondisi kosong dan mode offline.
- Buka detail sumber langsung dan dari daftar, tunda respons sumber, lalu ulangi dengan respons gagal. Periksa breadcrumb TopNav, nama sumber ketika tersedia, dan tautan kembali ke `/sources`. Buka Backup & Restore dari Settings, periksa fokus pada aksi kembali, lalu periksa fokus kembali ke pemicu semula. Backup tetap berada di `/settings`.
- Periksa heading hero Help serta landmark tunggal Account dan detail simpanan. Untuk detail simpanan, seed satu entri valid pada `yomirra-library` dan kunjungi satu ID yang tidak dikenal. Keduanya menyediakan tautan Library ke `/bookmark`. Cek heading dan status saat hidrasi tertunda.
- Di Populer, seed sumber dengan status `ONGOING`, `COMPLETED`, dan `UNKNOWN`, serta satu sumber gagal. Siapkan feed MAL awal dari fixture route serta respons berhasil, tertunda, dan gagal untuk `/api/metadata/mal/popular?type=…`. Periksa posisi filter setelah judul pada kedua tab, keterbacaan Anggota terbanyak, fokus keyboard, status lokal, serta fallback ke tab sumber. Kembalikan dua respons filter MAL dengan urutan terbalik untuk memeriksa hasil pilihan terbaru.

### Fase 2 — Pencarian, filter, dan konsistensi katalog

Default agregat Search dan Jelajah hanya memakai sumber aktif yang memenuhi syarat. Pilihan manual eksplisit tetap menerima sumber nonaktif yang tersedia, termasuk ketika pilihan tersimpan dipulihkan setelah hidrasi. Selaraskan kontrol filter, pelokalan, preferensi, dan copy katalog. Pertahankan entri Home dengan judul sama selama identitasnya belum terverifikasi. Penggabungan berdasarkan judul saja berada di luar lingkup.

## Matriks route

Inventaris berdasarkan `rg` terhadap `PageHeader` dan `DestinationHeader` di `src`, lalu penelusuran pemanggil view dan skeleton pada baseline tracker. `P` berarti `PageHeader`, `D` berarti `DestinationHeader`. Ulangi pencarian saat mulai implementasi karena pemanggil dapat berubah.

| Route | Pemanggil yang ditemukan dan cakupan verifikasi |
| --- | --- |
| `/` | `HomeView` (P). Pertahankan hero dan heading utamanya. |
| `/search` | Page, `SearchPageView`, dan loading (D). Periksa shell, hasil, loading, dan fokus pencarian. |
| `/library`, `/bookmark` | `LibraryPageView`, `BookmarkPageView`, dan skeleton masing-masing (D), termasuk fallback halaman. Verifikasi heading Jelajah (`/library`) dan Library (`/bookmark`) sesuai tujuan masing-masing. |
| `/updates` | Page dan loading (D). `UpdatesList` memakai `hideHeader`; cek aksi Perbarui. |
| `/sources` | Page dan loading (D). Cek label tujuan. |
| `/sources/[sourceId]` | Page dan loading (P). Cek identitas aktual ketika tersedia, fallback loading, dan navigasi balik. |
| `/popular` | Page dan `PopularPageSkeleton` (D). Cek kedua tab. |
| `/downloads` | Page dan loading (D). Cek Hapus Semua dan semantik tab. |
| `/settings` | `SettingsView` utama (D), tampilan backup (P), dan loading (D). Cek kembali dari backup. |
| `/help` | Page (D). Cek judul pada hero dan `ContentLane`. |
| `/account` | Page dan loading (D). Cek landmark `main`. |
| `/manga/[sourceId]/[mangaId]` | `MangaDetailView`, `MangaDetailSkeleton`, `MangaDetailErrorState`, dan `DeadSourceRecovery` (P). Cek hero, loading, error, dan recovery. |
| `/manga/[sourceId]/[mangaId]/read/[chapterId]` | `DeadSourceRecovery` juga dirujuk oleh page reader. Cek efek perubahan komponen bersama pada fallback. Kontrol dan konten reader tetap di luar implementasi UI ini. |
| `/catalog/saved/[savedTitleId]` | `CanonicalSavedDetailView` masuk lingkup heading, landmark, dan tautan kembali. Pemeriksaan ini terpisah dari daftar pemanggil P/D. |

Cek juga fallback `src/app/(web)/error.tsx` dan error segment reader jika terkena perubahan bersama. Uji label fallback Help/Catalog ketika nama route berasal dari pemetaan umum.

## Verifikasi per fase

Jalankan `pnpm typecheck`, `pnpm lint`, `pnpm exec vitest run`, dan `node scripts/check-design-tokens.mjs` pada akhir setiap fase. Bandingkan ratchet dengan baseline, tanpa kenaikan. Jalankan `pnpm build` untuk smoke produksi atau perubahan kontrak route/loading. Gunakan `pnpm exec playwright test` untuk pemeriksaan browser dan simpan perintah serta exit code yang dipakai.

Gunakan Chromium dan WebKit pada mobile kecil (320 × 568), landscape (667 × 375), dan desktop di sekitar `md` serta `lg`. Ambil lebar tepat di bawah dan pada breakpoint yang dipakai source. Di Fase 1, cek judul dan landmark di accessibility tree, aksi desktop, fokus keyboard dan navigasi balik, loading/error, alignment saat scroll, serta `prefers-reduced-motion` bila ada transisi. Di Fase 2, cek hidrasi/pilihan sumber tersimpan dan manual, filter 30–80 opsi dengan keyboard/scroll, dan layout kontrol pada `md`/`lg`. Perangkat fisik dikecualikan sesuai arahan owner. Catat kombinasi yang dilewati beserta alasannya di tracker.

Gunakan default target sentuh iOS 44 × 44 pt sebagai acuan desain mobile. Untuk web, verifikasi WCAG 2.2 AA pada kontrol yang diubah, termasuk kontras teks biasa minimal 4,5:1 dan kontras visual komponen minimal 3:1 jika kriterianya berlaku. [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
