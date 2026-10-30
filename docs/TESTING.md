# Testing

Yomirra memakai Vitest + Testing Library untuk automated tests dan browser/device verification untuk behavior yang tidak bisa dibuktikan di jsdom.

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
git diff --check
```

Untuk loop cepat:

```bash
pnpm vitest run path/to/file.test.ts
```

## Apa yang wajib dites

Prioritaskan boundary yang kalau rusak dapat merusak data atau banyak feature:

- source parsing/normalization;
- pagination/filter mapping;
- canonical matching dan source recovery;
- search tag/filter behavior;
- validation dan request signing;
- persistent store migration;
- Cloud Sync deletion tombstone, equal-timestamp precedence, dan lifecycle per UID;
- backup/restore;
- download lifecycle;
- recommendation ranking;
- Smart Collections derivation;
- partial source failure;
- admin authentication/session boundaries;
- server-only credential configuration and missing-config isolation;
- rate-limit namespace, fail-open/fail-closed behavior, rejection status, dan response headers;
- log redaction untuk token/cookie/authorization/signed URL;
- CSP report-only directives dan browser/PWA asset/connect compatibility;
- generic error surfaces tidak merender raw internal exception/upstream detail;
- reduced-motion fallback untuk motion primitives;
- navigation intent duplicate suppression dan pending cleanup;
- fast navigation tidak menampilkan delayed feedback, slow navigation menampilkannya;
- overlay tanpa trigger eksplisit mengembalikan focus saat ditutup.

## UI tests

Test primitive/feature bila ia memiliki behavior atau accessibility contract.

Contoh:

- `FilterChip` selection semantics;
- drawer Apply/Reset;
- Rak Buku collection filtering;
- active chapter selection;
- shared header actions.

Wrapper yang hanya meneruskan props/class tanpa behavior biasanya tidak butuh test khusus.

## Source adapters

Gunakan fixture/mocked HTTP response. Unit suite tidak boleh bergantung pada third-party site yang sedang online.

Cover setidaknya:

- metadata/capabilities;
- normalization;
- pagination;
- filter mapping;
- detail;
- chapter order;
- pages/referer;
- malformed/empty response;
- bounded retry bila ada.

Live source health adalah verification layer yang berbeda.

## Security boundaries

Untuk rate limiting, cover minimal:

- namespace/key identity yang diharapkan;
- limit/remaining/reset headers;
- 429 saat bucket habis;
- 503 saat policy fail-closed tidak dapat mengakses limiter;
- fail-open hanya pada route yang memang availability-first;
- trusted proxy-chain identity agar client tidak bisa memilih bucket sendiri lewat forwarded header palsu.

Untuk Redis cold-start dan limiter, gunakan `src/server/lib/cache/__tests__/redis-readiness.test.ts` dan `src/server/lib/security/__tests__/rate-limit.test.ts`. Cover `wait`, `connecting`, `reconnecting`, `end`, late rejection, 2.500 ms bounded deadline, shared initial connection, fail-closed 503, serta bypass fail-open yang tidak tertahan saat Redis down.

Untuk Cloud Sync, uji delete/tombstone Library/History, precedence pada timestamp sama, re-add/progress baru, perubahan realtime `libraryV2` `removed`, propagasi error manual sync, dan pergantian UID. Untuk unduhan, uji antrian idle tanpa timer berulang, pause/resume/cancel, concurrency, cached pages, dan URL legacy yang tetap melalui signed proxy.

Untuk credential server-only, test harus memastikan missing/malformed configuration gagal sebelum upstream request dilakukan tanpa membuat registry source lain gagal diinisialisasi.

Untuk CSP/error disclosure:

- static regression test memastikan baseline directive tidak hilang tanpa review;
- preview deployment harus menunjukkan header `Content-Security-Policy-Report-Only`;
- manifest, Service Worker, self-hosted Next chunks, Firebase auth host, HTTPS asset/API, dan WebSocket requirement harus tetap tercakup;
- raw exception/upstream message tidak boleh muncul pada generic public error surface.

## Search dan recommendation

Untuk search intelligence:

- exact/canonical title tetap deterministic;
- explicit tag tetap hard filter;
- unsupported explicit filter tidak berubah menjadi loose search;
- client payload tidak mencemari shared catalog;
- embedding failure tidak memblokir normal search.

Untuk recommendation:

- current/saved/read title tidak diprioritaskan sebagai recommendation baru;
- ranking stable saat score tie;
- core recommendation lulus tanpa AI configuration.

## Persistent state

Reset store global antar test.

Perubahan schema harus memiliki fixture dari bentuk lama yang masih didukung.

## Browser smoke test

Automated test tidak cukup untuk:

- fixed mobile header/safe area;
- filter drawer geometry dan snap behavior;
- route transition dan delayed navigation feedback;
- browser Back/Forward state + scroll restoration;
- keyboard/pointer focus continuity setelah overlay;
- reader overlays;
- chapter drawer auto-position;
- PWA installation;
- Service Worker/cache storage;
- offline reading;
- actual source WAF/rate-limit behavior.
- Redis serverless cold/warm/concurrent requests, outage dan recovery pada environment terkonfigurasi;
- profiling CPU/timer antrian unduhan idle dan pemeriksaan URL legacy pada Safari;
- sinkronisasi dua perangkat dengan penghapusan, re-add, dan account switch.

Catat browser/device/deployment environment saat melaporkan hasil manual.

## Saat test lama gagal

Bedakan:

1. regression implementasi — fix code;
2. contract memang berubah — update code + test + docs;
3. assertion test stale — update test setelah memastikan public behavior benar.

Jangan melemahkan assertion hanya supaya suite hijau.

## Completion gate

Jangan menyatakan task selesai dari diff atau lint saja. Fresh verification harus dijalankan setelah tree terakhir berubah.

Untuk motion/navigation, gate minimal mencakup typecheck, lint, full test suite, production build, preview deployment, reduced-motion regression, dan browser smoke untuk Back/Forward scroll. iOS/PWA behavior tidak boleh dinyatakan lulus hanya dari jsdom atau static source inspection.

## Regresi keamanan data bacaan

Jalankan `pnpm test -- --run` dan pemeriksaan CI untuk seluruh suite. Regresi khusus berada di `history-retention.test.ts`, `history-store.test.ts`, `sync-utils.test.ts`, `backup-engine.test.ts`, dan `download-integrity.test.ts`.

Skenario wajib: lebih dari 512 detail; ringkasan judul lama tetap ada; reread berbeda dari milestone; akun berubah ketika operasi tertunda; kegagalan cloud tidak menimpa progres baru; ekspor dan restore berulang mempertahankan ID serta koleksi; library di atas 1.000 judul dapat diimpor; dan gambar cache yang hilang diunduh kembali.

Uji otomatis dengan Firebase/cache simulasi bukan pengganti pengujian dua akun pada dua perangkat nyata. Uji iPhone/iPad PWA terpasang, pemutusan jaringan, penutupan paksa aplikasi, batas storage, dan pemulihan Firebase tetap harus dicatat terpisah. Aturan penghapusan setelah tiga bulan belum diimplementasikan.

## Acceptance cleanup dan layanan nyata

Matriks ini mempertahankan skenario dari PR #60 (`b3d383d`) dan memperbarui ekspektasi retensi serta hasil delete parsial. Baseline implementasi konsolidasi ada pada [PR #65](https://github.com/rzqllh/Yomirra/pull/65), masih draft; hasil CI harus sesuai SHA akhir. Semua skenario layanan/perangkat di bawah **belum dijalankan dalam cleanup ini**.

Gunakan dua akun uji A/B dan dua profil atau perangkat terpisah dengan data sintetis. Simpan cadangan sebelum uji destruktif. Gunakan emulator atau proyek staging untuk memaksa gagal tulis; jangan ubah aturan Firebase atau data pengguna nyata. Catat langkah, hasil yang diharapkan/aktual, timestamp, versi aplikasi, SHA, lingkungan dan tautan bukti yang disanitasi. Jangan masukkan token, email, kredensial atau data pribadi ke log.

| Kasus | Langkah | Hasil yang perlu dibuktikan |
| --- | --- | --- |
| A1 Guest dan merge | Simpan judul serta progres sebagai guest, lalu masuk sebagai A | Preview merge eksplisit; tidak ada unggah atau overwrite diam-diam |
| A2 Antrean lintas akun | Tunda tulis history A, lalu ganti ke B sebelum selesai | Operasi lama hanya boleh menyasar A; tidak ada chapter atau tombstone A pada B |
| A3 Migrasi per akun | Pada browser sama, migrasikan data legacy berbeda untuk A dan B | Penanda A tidak melewati migrasi B; periksa juga legacy-only saat canonical sudah berisi data |
| A4 Migrasi gagal | Tolak commit staging, lalu pulihkan izin dan ulangi | Penanda sukses belum tersimpan saat gagal; retry tidak kehilangan atau menggandakan judul |
| A5 Retensi besar | Tambahkan lebih dari 512 detail chapter, dengan posisi terakhir dan milestone berbeda pada judul lama; sync dan reload | Maksimal 512 detail lengkap; resume/milestone tiap judul tetap ada sebagai ringkasan; `_compacted` tidak dianggap delete pengguna atau muncul di UI. Tidak menjanjikan seluruh cursor lama tetap detail |
| A6 Reread | Baca chapter 45, lalu ulang chapter 12 pada perangkat lain dan sync | Lanjut Baca tetap chapter 45; cursor chapter 12 tetap terpisah |
| A7 Konflik perangkat | Edit judul sama secara bersamaan pada dua perangkat | Resolusi konsisten; tidak menghapus atau memunculkan kembali judul lain |
| A8 Tombstone dan re-add | Hapus judul, lalu hubungkan perangkat dengan snapshot lama; ulangi dengan re-add eksplisit yang lebih baru | Snapshot lama tidak membangkitkan data terhapus; re-add baru diperlakukan sesuai timestamp dan identitas |
| A9 Batch dan delete parsial | Buat lebih dari 450 tulis; gagalkan batch pertama dan batch berikutnya secara terpisah; ulangi untuk delete title | Commit berurutan; batch selanjutnya berhenti setelah gagal; sync tidak sukses. Delete yang sudah commit tetap terhapus, sisanya dipulihkan tanpa menimpa progres/intent baru |
| A10 Offline dan restart | Simpan cursor saat offline, tutup/buka aplikasi, lalu sambungkan | Cursor lokal bertahan; status pending/gagal tidak dianggap konfirmasi cloud |
| A11 Domain sync | Gagalkan pembacaan preferensi sumber dan koleksi satu per satu | Diagnostik dan pesan membedakan domain gagal dari sukses |
| A12 Logout | Coba opsi retensi lokal lalu login ulang dengan A/B | Hasil sesuai pilihan pengguna dan batas pemilik; data tidak bocor antar akun |
| A13 Intent delete bertumpuk | Tunda delete, re-add/progres baru, lalu delete lagi; selesaikan permintaan dalam urutan berbeda | Kegagalan operasi lama tidak memulihkan data yang sudah sengaja dihapus atau menimpa data baru |

Tes UI terarah: jalankan `pnpm vitest run src/components/app/__tests__/hero-and-header.test.tsx src/components/app/__tests__/shell-revamp-contract.test.tsx src/components/chrome/__tests__/responsive-visual-hierarchy.test.tsx`. Hero dan header harus membuka command menu lewat tombol dengan petunjuk platform. Tes rail memeriksa komponen nyata, landmark/current destination dan toggle; class reduced-motion hanya membuktikan deklarasi CSS, bukan hasil rendering animasi.

Untuk browser, jalankan `pnpm exec playwright test e2e/user-flows-regression.spec.ts` dengan server/config yang sesuai. Fixture memakai persistence history v2, timestamp numerik, `mangaTitle`, `pageIndex` dan ID per chapter. Periksa guidance tanpa history, judul/chapter pada shelf, tautan reader dan urutan shelf sebelum discovery. Tidak ada peningkatan timeout sebagai pengganti diagnosis.

Acceptance perangkat tetap mencakup Safari dan PWA terpasang pada iPhone/iPad: kunjungan baru, instalasi, safe area/notch, keyboard, orientasi/Split View, Back/Forward, chapter resume, kegagalan gambar/sumber, mode reader, pinch/gesture, airplane mode dan cache hilang, theme, reduced motion, VoiceOver/focus, force-close/relaunch, toast serta judul panjang. Catat model, OS, browser, viewport dan mode standalone. WebKit desktop atau HTML prototype tidak memenuhi bukti perangkat nyata; BrowserStack memerlukan sesi/perangkat dan kredensial yang disediakan pemilik.

Review hak/publikasi masih memerlukan provenance aset/kode/dependency, izin sumber, data flow Firebase/Google/Gemini/log, retention/deletion, kebijakan privasi/terms sesuai perilaku nyata, serta persetujuan manusia yang berwenang. [Formulir hak konten](CONTENT_RIGHTS_REPORTING.md) menyediakan intake publik; formulir itu tidak menetapkan penanggung jawab atau menggantikan persetujuan hukum.

Sebelum menutup gate, catat hasil CI SHA akhir, transkrip Firebase, bukti Safari/PWA, audit per Q dan hasil review hukum beserta reviewer yang benar-benar melakukan pemeriksaan. Jangan isi reviewer atau kelulusan dari asumsi. Tag, perubahan versi dan publikasi mengikuti keputusan rilis terpisah.
