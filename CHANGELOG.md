# Changelog

Perubahan penting Yomirra dicatat di sini. Changelog hanya memuat fitur dan perubahan yang sudah masuk ke repository; eksperimen internal dan rencana masa depan tidak diperlakukan sebagai fitur rilis.

## [Unreleased]

### Public Reader UX Stability

- Menyatukan header dan bottom dock mobile pada surface blurred-glass tanpa inset/shadow, memakai sticky/safe-area token bersama, serta mempertahankan native browser Back/Forward.
- Menstabilkan geometry Spotlight dan card saat synopsis, rating, chapter, atau metadata opsional tidak tersedia; fallback reader-facing tidak menampilkan raw exception, source ID, atau enum internal.
- Halaman Populer memakai mode `Gabungan` sebagai default dengan deduplikasi konservatif dan reciprocal-rank aggregation; mode `Per Sumber` mempertahankan urutan native masing-masing source.
- Jadwal Mingguan mengecualikan status selesai/dibatalkan sebelum manual release-day diterapkan, menandai hiatus dengan jelas, dan menjadikan `Baca/Lanjut` aksi utama.
- Detail komik menampilkan title header berdasarkan posisi hero melalui `IntersectionObserver`, memakai action rail empat item, serta membuka daftar chapter di sekitar chapter terakhir yang relevan.
- Pagination Library/Search disimpan pada URL sementara payload tetap berada di TanStack Query cache; filter Library tetap session-scoped sehingga Back kembali ke konteks sebelumnya tanpa menjadikan localStorage cache response besar.
- Halaman Sumber memisahkan health sistem dari preferensi penjelajahan dan memindahkan capability teknis ke detail sekunder.

### Home Editorial Opening Revamp

- **Compact Home Hero**:
  - Mengubah pembuka Beranda menjadi surface ringkas dengan heading `Mau baca apa hari ini?`, shared global-search entry, dan collage cover dekoratif yang stabil selama browser session.
  - Artwork Hero tidak memiliki skeleton dan kegagalannya tidak menghalangi heading/search.
- **Sorotan terbaru**:
  - Mengganti label kurasi yang menyesatkan menjadi `SOROTAN TERBARU` karena data berasal dari latest feed.
  - Memilih maksimal lima item dengan diversity pass satu item per sumber lebih dulu serta dedupe lintas sumber yang konservatif.
  - Menjaga card container stabil; autoplay 6 detik berhenti saat hover/focus/touch/document hidden dan nonaktif pada reduced motion.
- **Source-scoped Top 5**:
  - Menjaga ranking per sumber, menggunakan display name, memberi emphasis ringan pada rank #1, dan mempertahankan source context pada `Lihat semua`.
- **Home Loading Geometry**:
  - Menyatukan route loading, nested Suspense fallback, dan client hydration pada urutan Hero → Sorotan & peringkat → Lanjut Baca → Baru diperbarui.

### Page Frame & Discovery Consistency

- Menyatukan Beranda, Library, Rak Buku, Populer, Cari, Sumber, Unduhan, dan Pengaturan pada outer page frame/gutter yang sama; management/focused width dipindahkan menjadi inner `ContentLane` agar canvas tidak berubah ukuran antar-route.
- Menghapus desktop title banner yang redundan pada Sumber, Unduhan, dan Pengaturan sambil mempertahankan shared fixed mobile header.
- Mengganti CSS multi-column Pengaturan dengan dua stack desktop yang eksplisit dan hierarchy yang tetap deterministik saat collapse ke mobile.
- Menyatukan policy partisipasi sumber untuk Beranda/Library/Populer, memilih default Library dari sumber eligible pertama, dan mempertahankan Search sebagai scope independen.
- Search tetap mengabaikan toggle penjelajahan pengguna, tetapi tidak menawarkan sumber yang runtime-disabled, belum terpasang, tidak mendukung Search, unavailable, sedang diperbaiki, atau masih dalam pengembangan.
- Populer tidak lagi menghilangkan sumber pilihan secara diam-diam ketika feed gagal/empty; status sumber tetap terlihat secara compact.
- Loading state Sumber, Unduhan, Pengaturan, dan Populer mengikuti frame/column geometry final agar pergantian skeleton ke konten tidak mengubah lebar atau jumlah kolom utama.
- Merapikan safe inset collage Hero, sparse Spotlight composition, dan bottom density Top 5 tanpa menambah dependency visual baru.

### Accessibility Hardening

- Onboarding kini memakai modal semantics, focus containment, focus return pada seluruh exit path, serta reduced-motion handling yang eksplisit.
- Close/reset controls pada shared overlays, sheet, filter drawer, dan reader error mempertahankan baseline target sentuh 44px serta focus-visible styling yang konsisten.
- Contract test kontras diperluas untuk metadata dan semantic status pada tema gelap/terang dengan ambang WCAG AA untuk small text.
- Implementasi card-detail enrichment yang lebih baru di `main` tetap dipertahankan: request dibatasi, abort-aware, dan tidak digantikan oleh queue lama dari branch accessibility.

### Motion & Navigation Foundation

- **Semantic Motion System** (`src/shared/lib/motion/`, `src/components/motion/`):
  - Mengonsolidasikan duration, easing, spring, press feedback, layout transition, page transition, dan navigation-feedback timing ke semantic tokens bersama.
  - Menambahkan `AnimatedStateIcon` dan `PageTransition` dengan fallback `prefers-reduced-motion`.
  - Menambahkan boundary tunggal `MorphIcon` untuk Morphicons dan membatasi pasangan awal ke bookmark, grid/list, disclosure, dan playback tanpa mengganti identitas icon route/navigation.
- **Seamless Navigation Feedback** (`src/components/app/app-shell.tsx`, `src/shared/lib/navigation-intent.ts`):
  - Mempertahankan optimistic dock/rail selection saat intent dimulai, tetapi menunda progress bar 180 ms agar route cepat tidak mem-flash loading state.
  - Menghapus full-screen pending skeleton milik AppShell sehingga skeleton hanya dimiliki route `loading.tsx`, mencegah blank frame/double skeleton.
  - Menjadikan pathname completion sebagai cleanup utama; timeout 12 detik hanya recovery fallback.
- **Native Back/Forward & Focus Continuity** (`src/components/app/header.tsx`, `src/components/app/command-menu.tsx`):
  - Menghapus pathname-only manual scroll restoration agar browser/Next dapat memulihkan scroll Back/Forward secara native.
  - PageHeader memprioritaskan native history Back, sementara fallback tanpa history memakai replace.
  - Global search overlay yang tidak memiliki Radix trigger eksplisit mengembalikan focus ke elemen pemicu saat ditutup tanpa navigasi.
- **Route-shaped Loading Boundaries**:
  - Menyelaraskan Home loading state dengan hero/spotlight/continue-reading geometry dan menambahkan loading boundary untuk Account, Sources, serta Source Detail.
- **PWA/CSP Deployment Verification**:
  - Production Home/Account terverifikasi mengirim CSP report-only; public manifest dan Service Worker terlayani dengan content type yang benar.
  - Interactive Firebase popup + installed-PWA/iOS Safari smoke tetap menjadi gate terpisah sebelum CSP dapat dipertimbangkan untuk enforcement.

### P4 Backend, Entitlement, Admin Hardening, and AI (Phase 6)

- **Admin Auth & Security Hardening** (`src/server/lib/auth/admin-auth.ts`, `src/app/api/admin/session/route.ts`, `src/shared/__tests__/logger-security.test.ts`):
  - Menghapus fallback credential privileged dan hard-coded privileged identity dari production path; missing admin configuration sekarang fail-closed.
  - Browser admin menukar passkey dengan signed HttpOnly session berumur pendek, sementara raw passkey tidak disimpan di browser storage; mutation berbasis session memvalidasi same-origin request.
  - Menstandardisasi server-side authorization di seluruh admin API dan menambahkan redaction logger untuk authorization header, cookie, token, secret, passkey/password, API key, signature, dan signed URL.
- **Server Credential Isolation & Route Rate Limiting** (`src/server/lib/security/rate-limit.ts`, `src/app/api/sources/search/route.ts`, `src/app/api/proxy/image/route.ts`):
  - Memindahkan reusable privileged upstream credential ke konfigurasi server-only tanpa fallback literal; missing optional configuration gagal tertutup ketika request upstream dijalankan tanpa menggagalkan konstruksi registry source lain.
  - Menambahkan policy rate-limit bernamespace untuk admin mutation, admin operation mahal, public search, search intelligence, signed image proxy, dan laporan pengguna.
  - Mutation admin dan optional expensive compute fail-closed saat limiter tidak tersedia; public search dan image delivery memakai policy fail-open untuk menjaga availability.
  - Menambahkan response limit/reset headers, `Retry-After` pada rejection, trusted proxy-chain identity, serta regression test untuk 429/503 dan limiter availability behavior.
- **Browser Security & Error Disclosure** (`next.config.ts`, `src/components/ui/error-boundary.tsx`, `src/shared/__tests__/security-surface.test.ts`):
  - Menambahkan baseline `Content-Security-Policy-Report-Only` untuk Next.js, Firebase auth, HTTPS assets/connect, WebSocket, manifest, dan Service Worker sebelum policy diterapkan secara enforced.
  - Menghapus raw exception/upstream message dari generic public error surfaces serta generic admin API failure; detail diagnosis tetap disimpan melalui logging server yang disanitasi.
  - Mempertahankan digest/error-name/pathname yang tidak sensitif sebagai correlation signal dan menambahkan regression contract untuk CSP serta error-disclosure boundary.
- **Entitlement Foundation (Task 02)** (`src/shared/lib/entitlement.ts`):
  - Mengimplementasikan model kapabilitas Free vs Pro dengan proteksi ketat agar fitur gratis (membaca tanpa batas, pencarian penuh, multi-source switch, perpustakaan offline, sinkronisasi riwayat) selalu aktif dan tidak dapat didegradasi atau dikunci secara tidak sengaja.
  - Menyediakan gateway fitur Pro yang aman untuk fitur tambahan berbasis AI dan prioritas bandwidth.
- **Feature Flags Framework** (`src/shared/lib/feature-flags.ts`):
  - Menyediakan flag fitur modular dengan default aman dan dukungan override lingkungan server.
- **AI Infrastructure & Resilient Guardrails** (`src/server/lib/search/gemini-embeddings.ts`):
  - Mengunci penggunaan kunci API AI secara ketat di sisi server (tidak ada exposure di client bundle browser), dengan timeout jaringan 8 detik, caching hasil di Redis selama 7 hari, dan degradasi anggun (graceful non-AI fallback) saat kuota atau jaringan terputus.

### P3 Advanced Discovery (Phase 5)

- **Related Titles Discovery — Lexical & Metadata Baseline** (`src/server/lib/search/search-intelligence-service.ts`, `src/app/api/search/related/route.ts`):
  - Mengimplementasikan `metadataRelatedScore` berbasis author matching (bobot 0.35), format similarity (0.15), Jaccard genre overlap (0.35), dan lexical title similarity (0.25) sebagai baseline deterministik tanpa dependensi wajib pada model AI eksternal.
  - Endpoint `/api/search/related` diamankan dengan rate-limiting ketat (12 req/menit) dan input schema validation via Zod.
- **Smart Collections Engine** (`src/shared/lib/smart-collections.ts`, `src/shared/lib/__tests__/smart-collections.test.ts`):
  - Menyediakan derivasi koleksi pintar yang transparan dan berbasis aturan: `continue-reading`, `unread`, `recently-added`, `highly-rated`, `stale`, dan grouping format (`Manga`, `Manhwa`, `Manhua`) tanpa dependensi semantik hitam.
  - Memperhitungkan provenance `linkedSources` sehingga riwayat baca dari sumber sekunder tetap terakumulasi ke judul tersimpan.
- **Progressive Indexing & Vector Catalog Invalidation** (`src/server/lib/search/semantic-catalog.ts`, `src/server/lib/search/__tests__/semantic-catalog.test.ts`):
  - Penyimpanan katalog kanonikal persisten di Redis (`yomirra:search:catalog:record:*` dan index set `yomirra:search:catalog:index`) dengan TTL 90 hari.
  - Invalidation otomatis berbasis `embeddingTextHash` (SHA-256): jika metadata teks komik berubah, vektor embedding secara otomatis diperbarui.
  - Bounded resource cap: indeks dibatasi maksimal 1.200 record dengan eviction otomatis record terlama untuk mencegah kebocoran memori Redis.
  - Fail-safe resilience: seluruh operasi katalog Redis dibungkus safe try-catch sehingga kegagalan koneksi atau timeout Redis tidak pernah menggagalkan fungsi pencarian ataupun SSR.
- **Hybrid Lexical + Semantic Search Ranking** (`src/shared/lib/search-intelligence.ts`, `src/server/lib/search/search-intelligence-service.ts`):
  - Memastikan pencocokan leksikal yang tepat (exact/prefix match) selalu mempertahankan keunggulan mutlak atas recall semantik fuzzy.
  - Batas batching semantik serverless: maksimal 6 missing embeddings per query untuk membatasi konsumsi resource dan latensi komputasi.
- **Recommendation System Baseline** (`src/shared/lib/recommendations.ts`, `src/shared/lib/__tests__/recommendations.test.ts`):
  - Membangun profil rekomendasi pengguna berbasis bobot preferensi sumber dan format dari riwayat baca aktif, mengecualikan judul yang sudah pernah dibaca atau di-bookmark secara deterministik.

### P2 Search Intelligence Foundation (Phase 4)

- **Search Tag Parser & Filter Chips with Include/Exclude Semantics** (`src/shared/lib/search-intelligence.ts`, `src/components/search/search-tag-input.tsx`):
  - Menambahkan dukungan operator include (`#tag` / `+#tag`) dan exclude (`-#tag` / `!#tag`) pada ekspresi pencarian.
  - Memperbarui `candidateMatchesTags` sehingga tag dengan operator exclude menolak kandidat komik yang memiliki genre, format, atau status yang dikecualikan.
  - Menampilkan chip tag yang dapat dihapus (`removable chips`) dengan styling visual berbeda untuk tag pengecualian (merah/destructive) di `SearchTagInput`.
  - Plain-text resilience: tag yang tidak dikenali tetap dipertahankan sebagai teks pencarian biasa tanpa merusak input query.
- **Alias & Title Normalization Hardening** (`src/shared/lib/title-matcher.ts`):
  - Normalisasi otomatis untuk tag kurung sumber dan bahasa seperti `[Bahasa Indonesia]`, `(ID)`, `[Warna]`, `[Raw]`.
  - Normalisasi otomatis nomor season romawi (misal `Season II` -> `Season 2`) untuk mencocokkan sekuel secara deterministik.
  - Menjaga canonical identity (`canonicalKey`) tetap stabil dan terpisah dari fuzzy ranking.
- **Typo Tolerance & Short Query Bounded Protection** (`src/shared/lib/search-intelligence.ts`):
  - Penegakan aturan bahwa exact dan prefix match selalu mendominasi skor hybrid.
  - Perlindungan query pendek (<= 3 karakter) dari ledakan fuzzy edit distance ke kata-kata acak yang tidak berhubungan.
  - Resolusi typo tag otomatis (`#fantasi`, `#fantassy` -> `fantasy`) dengan penolakan prefix pendek yang ambigu (`#act`, `#rom`).
- **Persistent Canonical Catalog & Durable Migration** (`src/shared/lib/canonical-migration.ts`, `src/shared/lib/__tests__/canonical-migration.test.ts`):
  - Menyediakan eksekusi migrasi kanonikal deterministik (`executeCanonicalMigration`) yang melakukan backfill riwayat baca dan penggabungan koleksi legacy secara aditif ke ID kanonikal.
  - Menjaga kontinuitas progress membaca dan bookmark pengguna tanpa risiko korupsi state.
- **Search & Ranking Quality Regression Suite** (`src/shared/lib/__tests__/search-ranking-quality.test.ts`):
  - Memperluas suite pengujian regresi 18 test cases mencakup ranking exact vs prefix vs substring, normalisasi alias/angka romawi, proteksi typo, include/exclude tags, isolasi kill-switch admin vs browsing toggle pengguna, penanganan sumber down/unavailable, partisipasi runtime custom sources, serta chapter fallback presisi.

### P1 Core Reading Experience (Phase 3)

- **Explicit Bookmark Semantics & Rating Isolation** (`src/shared/store/library-store.ts`, `src/components/manga/manga-rating.tsx`, `src/shared/hooks/use-bookmark-collection.ts`, `src/components/bookmark/bookmark-page-view.tsx`):
  - Penegakan aturan produk bahwa Bookmark bersifat eksplisit: memberi rating tidak lagi otomatis memasukkan manga ke Library/Rak Buku ataupun memicu toast "Disimpan ke Koleksi".
  - `LibraryItem` kini dilengkapi field `isBookmarked?: boolean`, sehingga data rating dapat tersimpan secara lokal dan aman tanpa mengotori daftar bookmark aktif.
  - Menghapus manga dari Library tetap menjaga nilai rating yang sudah diberikan pengguna (`isBookmarked: false`), mencegah hilangnya preferensi rating saat komik dikeluarkan dari bookmark.
- **Scoped Reusable UI Consolidation** (`src/components/ui/section-heading.tsx`, `src/components/ui/layout.tsx`):
  - Mengonsolidasikan primitif `SectionHeading` standar dengan dukungan aksi, subtitle, dan badge yang selaras dengan `PageContainer` dan `PageToolbar`.
- **Reader Navigation & Chapter Drawer Polish** (`src/components/reader/reader-chapter-drawer.tsx`):
  - Chapter drawer secara otomatis melakukan auto-centering ke chapter yang sedang aktif saat dibuka, menggunakan chip kompak terstruktur, dan memicu intent navigasi instan.
- **Adapter Reliability & Canonical Multi-Source Hardening** (`src/server/lib/sources/adapters/`, `src/shared/lib/__tests__/canonical-search.test.ts`):
  - Mengaudit dan memvalidasi dua adapter bawaan prioritas (18 dan 73 regression tests) tanpa kompromi pada outbound policy `safeFetch`.
  - Memverifikasi kontinuitas canonical identity, chapter mapping presisi, dan reading progress saat beralih sumber.
- **Regression Testing** (`src/shared/lib/__tests__/phase3-reading-experience.test.ts`):
  - Menambahkan suite pengujian terfokus untuk isolasi rating, preservasi unbookmark, dan navigasi chapter.

### P0 Core Stability (Phase 2)

- **Reader History Semantics & Back Navigation** (`src/components/manga/manga-detail-view.tsx`, `src/components/reader/reader-shell.tsx`, `src/shared/lib/routes.ts`):
  - Detail → reader sekarang mengganti slot route detail alih-alih menumpuk reader route baru, sementara chapter switch tetap memakai replace semantics.
  - Parent page dibawa melalui `returnTo` yang tervalidasi sebagai internal route, sehingga Reader → Detail → Back kembali ke halaman asal dan tidak masuk lagi ke reader.
  - Reader footer/fallback detail links mengikuti kontrak yang sama, dan direct continue-reading menyimpan parent page untuk alur kembali yang konsisten.
  - Menambahkan regression coverage untuk logical parent, safe return target, dan reader back replacement.
- **Test Contract Repair**:
  - Menambahkan QueryClient test harness untuk CompactCard dan menyelaraskan fixture/expectation adapter dengan shared synopsis normalizer yang berlaku.

- **Navigation Perceived-Performance Foundation** (`src/components/app/desktop-rail.tsx`, `src/components/app/app-shell.tsx`):
  - Menambahkan dukungan `pendingHref` ke `DesktopRail` sehingga transisi navigasi di desktop memiliki indikator aktif seketika dan progress bar top nav sama seperti `BottomDock` mobile.
  - Mencegah duplikasi event navigasi pada tujuan yang sama dan menjaga konsistensi state tanpa toast berisik saat navigasi rutin.
- **Single Scroll Owner & Page Hierarchy Cleanup** (`src/app/(web)/popular/page.tsx`):
  - Menyelaraskan hierarki header `PopularPage` dengan `hideDesktop` dan `<h1 className="sr-only">Populer</h1>`, menghilangkan duplikasi banner desktop di bawah `TopNav` dan menyelaraskan struktur shell dengan Home, Library, Bookmark, dan Search.
- **Source Registry & Search-State Reconciliation** (`src/shared/hooks/use-search-catalog.ts`, `src/app/(web)/popular/page.tsx`):
  - `useSearchCatalog` secara otomatis membersihkan ID sumber usang dari penyimpanan persisten: jika pilihan custom pengguna menghasilkan 0 sumber valid, sistem otomatis pulih ke seluruh sumber yang dapat dicari.
  - Halaman `PopularPage` kini mematuhi cookie preferensi browsing `yomirra-disabled-sources`, sementara `Search` tetap dapat mencari semua sumber yang aktif secara runtime dan diizinkan admin.
- **Reader FIFO Image Scheduling & Deadlock Prevention** (`src/components/reader/continuous-vertical-reader.tsx`, `src/shared/lib/reader-load-order.ts`):
  - Menegakkan penjadwalan pemuatan halaman reader top-to-bottom dengan controlled concurrency window sebesar 2.
  - Menambahkan re-anchoring otomatis saat pengguna melakukan scroll cepat ke bawah agar viewport langsung memuat halaman aktif tanpa tertahan antrean halaman jauh di atas.
  - Memverifikasi pencegahan deadlock antrean saat terjadi kegagalan permanen gambar sehingga sisa chapter tetap dapat dibaca.
- **Regression Testing** (`src/shared/lib/__tests__/phase2-stability.test.ts`):
  - Menambahkan suite pengujian regresi menyeluruh untuk intent navigasi, sanitasi sumber usang, isolasi toggle browsing vs search, dan FIFO lifecycle reader.

### P0 Admin Runtime Source Overrides & Public Frontend Wiring (Phase 1)

- **Runtime Source Merger Service** (`src/server/lib/sources/runtime-sources.ts`): Menyediakan resolver server-side `getRuntimeSources()` yang menggabungkan baseline hardcoded `sourceRegistry` dengan runtime overrides (`getCoreSourceOverrides`) dan custom sources (`getCustomSources`) dari Redis. Dilengkapi fallback fail-safe seketika ke baseline statis jika Redis down atau cold start.
- **Admin Kill-Switch Enforcement**: `SourceManager.getSource()` kini mematuhi kill-switch admin dengan structured error `SOURCE_DISABLED: Source '<id>' is currently disabled by administrator.` untuk seluruh pembaca publik, dengan opsi bypass eksplisit `{ allowDisabled: true }` khusus untuk diagnostic probe ops admin.
- **Public API & SSR Wiring**:
  - `GET /api/sources` beralih ke `getRuntimeSources()`, mengekspos metadata efektif secara dinamis.
  - `HomePage` (`src/app/(web)/page.tsx`) dan `PopularPage` (`src/app/(web)/popular/page.tsx`) mengonsumsi runtime sources sehingga toggle enable/disable dan perubahan domain dari admin langsung berefek ke feed publik.
- **Client Security Boundary**: Audit dan regression test statis memastikan tidak ada default passkey atau kredensial privileged yang masuk ke client bundle browser (`src/components/admin/__tests__/admin-security-bundle.test.ts`).
- **Dev Performance Optimization**: Mem-bypass `@serwist/next` di dev mode dan membatasi `onDemandEntries` memory buffer di `next.config.ts` untuk meringankan beban memori dan lag laptop lokal saat menjalankan `pnpm dev`.

### Admin Portal & Ops (v2.3.0 preview)

- **Admin portal** (`/admin`) dengan passkey gate, sidebar navigasi 6 tab, dan layout responsif.
- **Source Engine tab** — health matrix real-time, probe per-source, toggle aktif/nonaktif, override URL, dan flush cache. Probe per-source tidak lagi menguji semua source sekaligus; tombol "Probe All" di header tetap tersedia untuk uji menyeluruh.
- **Laporan Reader tab** — inbox laporan pengguna dalam format ticket: type icon (chapter error, gambar rusak, source bermasalah), status badge (pending/investigating/resolved), judul manga, ticket ID pendek, timestamp WIB, dan detail collapsible. Action tersedia per tiket: Investigasi, Selesaikan, Flush Cache, Probe Source.
- `mangaTitle` kini disimpan bersama laporan sehingga tiket menampilkan judul manga yang readable, bukan ID mentah.
- **Situs & Banner tab** — kontrol banner pengumuman publik (teks, tipe tampilan, link opsional, toggle aktif/nonaktif) dan mode pemeliharaan dengan pesan kustom.
- **Telemetri & Redis tab** — status koneksi Redis, penggunaan memori, uptime, dan uji notifikasi Telegram dengan ringkasan health matrix live.
- **Search Simulator** — fallback ke metadata source registry bila Redis search catalog kosong, sehingga simulator tetap bisa dijalankan meskipun catalog belum diisi.
- Banner pengumuman dipindah ke luar `BootGate` sehingga tampil langsung tanpa menunggu splash screen.
- `announcement.id` hanya diperbarui saat simpan (bukan setiap keystroke), sehingga dismiss tracking di `sessionStorage` tidak terus reset saat mengetik.
- Telegram test route kini mengembalikan ringkasan health matrix live (jumlah healthy/degraded/down dan rata-rata latensi).
- Probe all vs. single-source probe mengembalikan format response yang berbeda dan sesuai.

### Changed

- **Feature Flags** di admin portal dinonaktifkan sementara karena belum terhubung ke runtime. Semua 4 flag (Semantic Search, Auto Fallback, Telegram Alerts, Data Saver) tersimpan di konfigurasi tapi tidak mengubah perilaku sistem. Akan diaktifkan bertahap setelah implementasi guard di masing-masing service.

### Rekonsiliasi dan eksekusi roadmap (Phase 0)

- Local main di-fast-forward ke `origin/main` (`8a20262`) — 33 commit cloud/Codex berhasil diintegrasikan.
- Execution branch `feat/yomirra-master-roadmap` dibuat dari base yang authoritative.
- Audit previous work: navigasi perceived-perf (PR #22), FIFO reader (PR #22), source registry/search-state (PR #15,16), canonical multi-source (PR #15), hybrid search (PR #16), deterministic recommendations + smart collections (PR #19) semua VERIFIED/DONE.
- Baseline: typecheck PASS, lint PASS (0 error), tests 822/822 PASS, production build PASS.
- Deferred: P4 admin/auth/entitlement/AI (roadmap explicit).
- `docs/yomirra-master-execution-roadmap.md` ditambahkan sebagai single source of truth.

### P0 Core Stability & P1 Core Reading Experience (Phase 1 & 2)

- Audit & hardening salah satu adapter bawaan: defensive handling saat response payload `null`/`undefined` pada `getPopular`, `getLatest`, `getChapters`, dan `getPages`, pembatasan outbound host allowlist, standarisasi metadata Source Engine V1 (`upstreamDomain`, `adapterVersion`, `supportedLanguages`), serta constructor dependency injection untuk pengujian terisolasi.
- PagedReader image priority & controlled concurrency predictive preloading: halaman aktif dimuat dengan `priority={true}` dan `fetchPriority="high"`, sementara 1–3 halaman berikutnya (berdasarkan `preloadIntensity` dan `dataSaver`) di-preload secara background dalam hidden container dengan `fetchPriority="low"`, mencegah delay dan blank screen saat navigasi halaman.
- Regression test suite untuk adapter bawaan yang diaudit (18 tests PASS) dan PagedReader (`src/components/reader/__tests__/paged-reader.test.tsx`, 8 tests PASS).
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
