# 00 — Kontrak Refactor UI dan Gate Eksekusi

| Metadata | Nilai |
|---|---|
| Tanggal | 2026-11-04 |
| Yomirra | `rzqllh/Yomirra` `preview` @ `62b9d40` (audit baseline `e102fbc`) |
| Yoru | `rzqllh/Yoru` `main` @ `464e7a7c46f869675a07c4f2bbf27b8e541bb3af` |
| Status | **RECONCILED - APPROVED FOR YOM-01** |
| Banner | **Local checkout verified. Typecheck, lint, and build PASS. Source drift reconciled (PR #137).** |

**Metode angka:** hitungan source = lexical match pada source commit terpin; nilai token dan delta = pembacaan deklarasi CSS / perhitungan rancangan, bukan computed CSS. `VERIFIED` = terbukti di source dan environment; `UNVERIFIED` = belum dapat dibuktikan atau perlu browser/checkout lanjutan.

## 1. Status akses dan blocker eksekusi

| Kapabilitas / persyaratan | Status | Bukti / gate berikutnya |
|---|---|---|
| Baca source kedua repo via GitHub API | **VERIFIED** | Fetch pada SHA metadata; read-only |
| Checkout lokal Yomirra | **VERIFIED** | Tersedia di worktree lokal; source drift reconciled ke `62b9d40` |
| Checkout lokal Yoru | **DEFERRED** | Hanya scope Yomirra pada stream ini; Yoru tidak disentuh |
| Shell umum | **VERIFIED** | PowerShell, environment teruji |
| Dependency proyek terpasang | **VERIFIED** | pnpm 10.20.0, node v24.22.1, frozen lockfile valid |
| `tsc`, lint, build pada repo | **VERIFIED** | `tsc --noEmit` exit 0; `pnpm lint` 0 error; `pnpm build` exit 0 |
| Browser & screenshot baseline | **IN PROGRESS** | Playwright test harness untuk capture Fase 2 390px/1440px |
| `@playwright/test` untuk Yoru | **DEFERRED** | Hanya scope Yomirra; Yoru tidak disentuh |
| Fixture/mock data eksternal | **VERIFIED** | Deterministic fixtures untuk 7 view utama |
| Inventory yang disebut pada path tujuan | **VERIFIED** | `docs/internal/` files terverifikasi di checkout |
| Rekonsiliasi ID matrix | **VERIFIED lexical** | **147 YOM template ID**; mapping 1:1 tetap utuh setelah PR #137 |
| Audit runtime dan computed style per ID | **IN PROGRESS** | Fase 2 baseline pada 390px dan 1440px |

**Prasyarat Fase 2:** checkout kedua repo; dependency terkunci/terpasang; tooling browser siap; `YOR-00` terpisah; fixture/mock Yoru; auth/state/locale/timezone/fallback gambar dikunci; rute reader dan player punya data deterministik. Tidak menganggap approval tooling sebagai perintah memasang sekarang.

## 2. Keputusan final owner (1–5; dipertahankan)

1. Strict parity dulu (token, primitive, halaman tanpa perubahan visual). Normalisasi jadi batch WAJIB sebelum final audit (YOM-09 / YOR-09), bukan "future". Catat setiap alias legacy beserta jumlah pemakaiannya; semuanya harus habis di batch itu. Sebelum batch itu, ajukan skala final (radius, blur, alpha overlay, tinggi kontrol) dengan delta px/pt per nilai untuk gue approve per nilai.
2. Exceptions boleh, hanya kalau tercatat di docs/internal/token-exceptions.md (nilai, lokasi, alasan). Hardcode di luar daftar = pelanggaran.
3. Naming: file kebab-case primitive Yomirra tetap, jangan rename. Compound primitive tetap satu file family. Komponen layar/fitur = satu komponen satu file. Yoru: PascalCase mengikuti Player.tsx dan WatchGuide.tsx.
4. Yoru: typed variant-to-class map tanpa dependency baru. Jangan tambah cva.
5. Lab Yomirra di luar scope (read-only). Yoru: approve @playwright/test sebagai devDependency (hanya Yoru, commit terpisah YOR-00). ESLint Yoru ditunda. Gate Yoru = typecheck + build + screenshot diff.

**Revisi tambahan yang mengikat:** dekomposisi `App.tsx` Yoru adalah pure-move setelah `YOR-02` sebelum `YOR-03`, screenshot diff **0** (persyaratan acceptance, bukan hasil tes); router/state/data layer tidak disentuh. Normalisasi wajib sebelum final audit. **Semua pekerjaan implementasi DITUNDA** hingga checkout/environment; tugas sekarang dokumen saja, tanpa commit.

## 3. Delapan aturan target dan penyesuaian

| # | Aturan target | Penyesuaian kontrak |
|---|---|---|
| 1 | Satu komponen = satu file; nama file = nama komponen | Yomirra primitive tetap kebab-case; Yoru feature PascalCase; compound family satu file |
| 2 | Wajib pakai `Button`, `IconButton`, `Chip`, `Tabs/SegmentedControl`, `Select`, `SearchInput`, `Badge`, `Dialog/Sheet`, `Toggle`, `Surface`; larang native control ber-style kustom jika primitive cocok | Native `<select>` boleh **di dalam** wrapper `Select`, bukan call site ber-style bebas; semantik native harus terjaga |
| 3 | `className`, `...props` ke root, `variant`/`size` (`cva`); variant bernama bila digunakan 2+ tempat atau bermakna | Yomirra `cn()` + `cva`; Yoru typed variant-to-class map, **tanpa cva/dependency baru** |
| 4 | Struktur/perilaku berbeda = wrapper komponen baru di atas primitive | `TransportButton`, `PlayerSeekBar`, `EpisodeButton`, `ReaderControl`, `NavItem` sesuai kontrak |
| 5 | Visual values melalui token: radius, alpha, blur, saturate, shadow, tinggi, spacing, duration, z-index | Batch 01 hanya alias exact-value; Batch 09 normalisasi setelah persetujuan tiap delta |
| 6 | Satu Surface/utility glass sebagai pemilik `backdrop-filter`, membaca blur+saturate+alpha+border | `YOM-01`/`YOR-01` memperkenalkan layer **tanpa consumer**, sehingga efek existing belum dimigrasikan |
| 7 | Dilarang arbitrary value dan hex/rgb(a) di komponen/page kecuali exception tertulis | `token-exceptions.md` hanya **rencana draft**, belum dibuat dalam repo. `data-[state=*]` bukan magic visual |
| 8 | Override call site hanya layout; beda visual memakai variant | Jangan ubah tampilan/behavior ketika memigrasikan call site |

**Batas lain:** jangan Glisse; jangan menyentuh admin Yomirra, UI Lab, root folder, dependency tak disetujui, router/state/data layer; preserve status episode Yoru (`registered`, `candidate`, `torrent`, `error`, `unavailable`) dan reader image Yomirra tanpa glass/refraction.

## 4. Batch final yang mengikat / proposed gate

| Batch | Scope | Gate sebelum commit (setelah environment ada) |
|---|---|---|
| `YOR-00` | Pasang `@playwright/test` devDependency **khusus Yoru**, commit terpisah | Lockfile review, install provenance, typecheck/build; **belum dikerjakan** |
| `Fase 2` | Baseline sebelum perubahan: Yomirra Home/Jelajah/Library/detail/webtoon/paged/settings; Yoru Beranda/Jelajahi/Koleksi/detail/player toolbar/subtitle/settings | 390px + 1440px; fixture/mock Yoru; manifest computed CSS per ID; exact SHA, state, screenshot assets |
| `YOM-01` / `YOR-01` | Token alias exact + glass utility/layer, **tanpa consumer** | YOM typecheck/lint/build/diff; YOR typecheck/build/diff; screenshots delta 0 |
| `YOM-02` / `YOR-02` | Primitive API/variants; call-site migration **tidak** dalam batch ini kecuali diperlukan untuk tes primitive | Gate sesuai repo + state/focus/accessibility parity |
| `YOR-02A` | Pure-move pecah `App.tsx` ke screen/component files; **di antara 02 dan 03** | Typecheck + build; screenshot diff **0**; state/router/data behavior identik |
| `YOM-03` / `YOR-03` | Nav/header/menus/dock/sidebar | Gate sesuai repo + route, focus, touch |
| `YOM-04` / `YOR-04` | Home/discovery/browse/search/cards | Gate sesuai repo + data & layout snapshots |
| `YOM-05` / `YOR-05` | Library, bookmark, koleksi, detail, source actions | Gate sesuai repo + persisted state |
| `YOM-06` | Reader controls/panels/scrubber saja; image content dilindungi | Typecheck/lint/build + screenshot webtoon/paged dan gesture regression |
| `YOR-06` | Player transport, quality, subtitles; episode states tetap semantik | Typecheck/build + player screenshots + behavioral checks |
| `YOM-07` / `YOR-07` | Settings, akun, system overlays | Gate sesuai repo + dialog/focus/error states |
| `YOM-08` / `YOR-08` | Sisa call-site parity, cleanup tanpa normalisasi nilai | Gate sesuai repo + grep sementara + diff 0 |
| `YOM-09` / `YOR-09` **WAJIB** | Normalisasi radius/blur/alpha/tinggi **hanya dari skala per-nilai yang disetujui owner**; habiskan seluruh alias legacy | Gate sesuai repo; screenshot delta **hanya** yang disetujui; alias usage 0 |
| Final audit (setelah 09) | Grep, exception reconciliation, visual diff, daftar perubahan | Per-repo proof output + before/after unique values + alias 0 |

**Satu batch = satu commit per repo**, setelah eksekusi diizinkan. Tidak ada commit dari dokumen ini. `YOR-02A` ialah nama batch usulan untuk pure-move; identitas final dapat dikonfirmasi sebelum implementasi.

## 5. Definition of Done

| Kriteria | Bukti wajib |
|---|---|
| Audit source sesudah normalisasi | Grep seluruh scope publik; hitung *lexical matches* dan klasifikasi, bukan sekadar jumlah string |
| Alias legacy | Setiap alias tercatat dengan source usages sebelum `09`, lalu **0 consumer** sesudah `09`; token definisi legacy juga dihapus |
| Hardcode/arbitrary | **0** nilai visual di luar exception register; semua pengecualian memuat nilai/lokasi/alasan dan approval |
| Radius/blur/alpha | Tabel **jumlah nilai unik** source dan manifest computed CSS, sebelum vs sesudah; hindari menghitung prefixed CSS sebagai dua efek visual |
| Behavior | Tidak mengubah route, native video controls, HLS, subtitle, reader gestures, data persistence, episode statuses |
| Visual parity | Diff 0 pada batch non-normalisasi; delta visual batch 09 harus approved per nilai dan diverifikasi |
| Gates | YOM: `tsc --noEmit`, ESLint, build, screenshot; YOR: typecheck, build, screenshot; stdout/stderr/exit code asli |
| Scope | Admin dan Lab Yomirra tidak disentuh; Glisse tidak diinstal; tidak ada arsitektur/root folder change |

## 6. Template laporan per batch

| Field | Yang harus ditempel |
|---|---|
| Repo / branch / SHA before → after | Nilai asli dari Git, bukan asumsi |
| Batch / commit SHA | Satu commit setelah gate terpenuhi |
| Changed files | Daftar path dan alasan; file yang tak berhubungan = blokir |
| Commands | Perintah exact dan working directory |
| stdout | **Output asli lengkap** atau tautan log artefak yang inspectable |
| stderr | **Output asli lengkap**; tandai jika kosong dan terverifikasi |
| Exit code | Angka hasil proses untuk tiap command; tidak boleh mengklaim PASS jika tidak dijalankan |
| Screenshot before/after | Route, viewport 390/1440, seed/fixture, theme/state, lokasi asset |
| Screenshot diff | Pixel difference dan threshold **yang disepakati**, khusus `YOR-02A` wajib 0 |
| Computed-style manifest | ID → border-radius, color alpha, blur, saturation, shadow, dimensions, spacing, duration, z-index |
| Delta visual | Old → new, delta px/pt/percentage-points, approval ID, hasil diff |
| Legacy + exception | Alias usages awal/akhir, hardcode residual, file exception |
| Result | PASS / FAIL / BLOCKED / UNVERIFIED, jelas per gate |

## Open items

| ID | Item | Status |
|---|---|---|
| O-01 | Checkout dan dependency kedua repo agar Fase 2 dapat berjalan | BLOCKED |
| O-02 | `YOR-00` Playwright dan fixture/mock deterministik | APPROVED, DEFERRED / UNVERIFIED fixture |
| O-03 | Tabel skala final setiap delta sebelum `YOM-09` / `YOR-09` | PENDING APPROVAL PER NILAI |
| O-04 | Daftar exception yang disetujui untuk draft register | PENDING APPROVAL |
| O-05 | Computed-style baseline serta screenshot state/viewport per ID | UNVERIFIED |
