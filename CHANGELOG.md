# Changelog

Perubahan penting Yomirra dicatat di sini. Changelog hanya memuat fitur dan perubahan yang sudah masuk ke repository; eksperimen internal dan rencana masa depan tidak diperlakukan sebagai fitur rilis.

## [Unreleased]

### Rekonsiliasi dan eksekusi roadmap (Phase 0)

- Local main di-fast-forward ke `origin/main` (`8a20262`) — 33 commit cloud/Codex berhasil diintegrasikan.
- Execution branch `feat/yomirra-master-roadmap` dibuat dari base yang authoritative.
- Audit previous work: navigasi perceived-perf (PR #22), FIFO reader (PR #22), source registry/search-state (PR #15,16), canonical multi-source (PR #15), hybrid search (PR #16), deterministic recommendations + smart collections (PR #19) semua VERIFIED/DONE.
- Baseline: typecheck PASS, lint PASS (0 error), tests 822/822 PASS, production build PASS.
- Deferred: P4 admin/auth/entitlement/AI (roadmap explicit).
- `docs/yomirra-master-execution-roadmap.md` ditambahkan sebagai single source of truth.

### P0 Core Stability & P1 Core Reading Experience (Phase 1 & 2)

- Audit & hardening Shinigami adapter: defensive handling saat response payload `null`/`undefined` pada `getPopular`, `getLatest`, `getChapters`, dan `getPages`, pembatasan `allowedHosts: ["api.shngm.io"]`, standarisasi metadata Source Engine V1 (`upstreamDomain`, `adapterVersion`, `supportedLanguages`), serta constructor dependency injection untuk pengujian terisolasi.
- PagedReader image priority & controlled concurrency predictive preloading: halaman aktif dimuat dengan `priority={true}` dan `fetchPriority="high"`, sementara 1–3 halaman berikutnya (berdasarkan `preloadIntensity` dan `dataSaver`) di-preload secara background dalam hidden container dengan `fetchPriority="low"`, mencegah delay dan blank screen saat navigasi halaman.
- Regression test suite untuk Shinigami adapter (`src/server/lib/sources/adapters/shinigami/__tests__/adapter.test.ts`, 18 tests PASS) dan PagedReader (`src/components/reader/__tests__/paged-reader.test.tsx`, 8 tests PASS).
- Verifikasi penuh Phase 2 Gate: 124 test file (849 tests) PASS, typecheck PASS (0 error), lint PASS (0 error), production build (`next build --webpack`) PASS.

### P2 Search Intelligence Foundation (Phase 3)

- Pembuatan regression test suite terpadu untuk kualitas search dan ranking (`src/shared/lib/__tests__/search-ranking-quality.test.ts`, 13 tests PASS).
- Verifikasi komprehensif: exact title dominance over prefix/contains, alternate/alias title normalization, toleransi typo berbatas dengan proteksi prefix pendek, pemisahan query teks dan hard-tag filter (#genre, #status), isolasi kapabilitas source terhadap hard tags, deduplikasi multi-source, serta fallback chapter aman saat nomor chapter target tidak persis ada.

### P3 Advanced Discovery (Phase 4)

- Non-AI metadata baseline untuk related titles (`metadataRelatedScore` dan `findRelatedSearchTitles` di `src/server/lib/search/search-intelligence-service.ts`): menghitung relevansi berdasarkan author, format, Jaccard genre overlap, dan title similarity saat embedding Gemini tidak dikonfigurasi atau sedang offline.
- Hybrid discovery: saat embedding tersedia, skor embedding diintegrasikan ke metadata baseline untuk memperluas semantic recall tanpa mengorbankan ketepatan metadata.
- Unit test coverage untuk related titles metadata baseline di `src/server/lib/search/__tests__/search-intelligence-service.test.ts`.

## [2.2.0] — 2026-09-29

Rilis ini berfokus pada search lintas source, rekomendasi yang lebih berguna, Rak Buku, dan perapihan runtime.

### Search dan source

- Search sekarang memahami `#tag`, alias Indonesia/English, typo ringan, dan lexical/fuzzy matching.
- Filter canonical dipetakan ke nilai yang didukung masing-masing source, lalu tetap diperlakukan sebagai hard filter.
- Hasil dari source berbeda dapat digabung ke satu identitas canonical ketika match cukup kuat.
- Search global tetap independen dari toggle source di Library/Populer; source yang unavailable tetap dikeluarkan.
- Optional semantic ranking tersedia melalui Gemini embedding. Tanpa API key, search biasa tetap berfungsi.
- Catalog search di Redis hanya diisi dari metadata source yang dipercaya dan tidak menerima data private user.
- Post-merge hardening memperbaiki negative genre token, unresolved hashtag, current-title exclusion, dan batas endpoint embedding.

### Rekomendasi dan Rak Buku

- Rekomendasi utama sekarang deterministic dan tidak membutuhkan Gemini/GPT.
- Ranking mempertimbangkan source, format, rating, status, dan reading history yang sudah ada.
- Judul yang sedang dibuka, sudah disimpan, atau sudah dibaca tidak diprioritaskan sebagai rekomendasi baru.
- Rak Buku mendapat Smart Collections berbasis derived state: Lanjut Dibaca, Belum Dibaca, Baru Ditambahkan, Rating Tinggi, Lama Tidak Dibuka, Tamat tapi Belum Selesai, Manga, Manhwa, dan Manhua.
- Smart Collections tidak membuat membership baru di storage dan tetap memahami linked source dari judul yang sama.
- Filter otomatis dipisahkan dari koleksi buatan user agar keduanya tidak saling membingungkan.

### UI, reader, dan navigasi

- Header mobile dan chrome utama dibuat lebih konsisten antar halaman.
- Search dan Library memakai filter drawer yang sama secara visual, dengan snap point compact sebelum diperluas.
- Reader header/dock diselaraskan dengan bahasa visual aplikasi.
- Chapter drawer dibuat lebih compact dan membuka posisi chapter yang sedang dibaca.
- Status-bar blur dan progress layer dirapikan agar tidak bocor ke konten.
- Notification bell membuka quick dropdown sebelum menuju halaman Pembaruan.
- Cache/query defaults dan route transition disesuaikan untuk mengurangi refetch yang tidak perlu saat berpindah halaman.

### Operasional dan runtime

- Format laporan Telegram ops dirapikan menjadi masalah, dampak, kemungkinan penyebab, tindakan, lalu detail teknis.
- Health, recovery, daily digest, user report, dan command bot memakai copy Indonesia yang lebih ringkas tanpa AI diagnosis.
- Preview deployment tidak lagi crash hanya karena `IMAGE_PROXY_SECRET` belum diset. Signed proxy tetap digunakan saat secret tersedia; tanpa secret, cover dapat fallback ke direct URL.
- CI tetap menjalankan typecheck, lint, tests, dan production build.

## [2.1.0] — 2026-09-27

Rilis ini menyatukan identitas multi-source dan merapikan struktur navigasi utama.

### Multi-source identity dan recovery

- Judul yang sama dari beberapa source dapat tampil sebagai satu hasil canonical.
- Library, bookmark, history, dan source recovery memakai identitas judul yang lebih tahan terhadap perpindahan source.
- Original title, alternate title, Unicode, dan author dipakai untuk memperkuat matching.
- Source picker hanya menawarkan source yang layak dipakai untuk membaca.
- Relink source mempertahankan progress lama dan tidak memindahkan chapter ambigu secara otomatis.
- Recovery diperluas ke error detail/reader tanpa menganggap semua 404 sebagai source mati.

### UI dan navigasi

- `PageHeader` menjadi pola header utama untuk destination page.
- Settings menjadi route mandiri, bukan modal yang menumpuk di atas halaman lain.
- Search, Library, Rak Buku, Populer, Sources, Downloads, Manga Detail, dan Reader mendapat penyelarasan loading, spacing, dan mobile navigation.
- Notification bell mendapat quick popover dan seen state.
- Route transition dan skeleton route dibuat lebih konsisten.
- Toast dan area yang disentuh mulai dibersihkan dari palette/glow lama.

### Reliability

- Teks dari source disanitasi sebelum masuk ke kartu dan detail.
- Per-source failure di search tidak membatalkan hasil dari source lain.
- Source disabled/unavailable tidak dipakai sebagai kandidat recovery.
- Tidak ada dependency baru untuk canonical multi-source flow.

## [1.1.0] — 2026-09-20

Rilis ini membentuk fondasi reader Yomirra yang sekarang.

### Ditambahkan

- multi-source search dan discovery;
- Library, collections, custom reading status, history, dan Continue Reading;
- chapter update tracking;
- Download Manager dan offline reading;
- Backup & Restore;
- source health handling;
- PWA support;
- reader preferences dan reading controls.

### Diperbaiki

- reader mobile dan progress persistence;
- image loading dan URL handling untuk beberapa source;
- handling source yang unavailable atau gagal sebagian;
- lifecycle `blob:` / `data:` image pada offline reader;
- cleanup object URL sementara;
- partial/missing downloaded chapter handling;
- loading, empty, dan error state di beberapa halaman.

### Internal

- source-specific behavior mulai dipisahkan dari UI;
- Library, History, Downloads, dan reader state dibuat local-first;
- state reader dan navigation dikurangi ketergantungannya pada response source langsung.
