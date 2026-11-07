# 01 — Token Catalogue, Distribusi, Magic Numbers, Legacy Tracker

| Metadata | Nilai |
|---|---|
| Tanggal | 2026-11-04 |
| Yomirra | `rzqllh/Yomirra` `preview` @ `62b9d40` (audit baseline `e102fbc`) |
| Yoru | `rzqllh/Yoru` `main` @ `464e7a7c46f869675a07c4f2bbf27b8e541bb3af` |
| Status | **RECONCILED - APPROVED FOR YOM-01** |
| Banner | **Local checkout verified. Typecheck, lint, and build PASS. Source drift reconciled (PR #137).** |

**Metode angka:** hitungan source = lexical match pada source commit terpin, bukan DOM/runtime; nilai token dan delta = pembacaan deklarasi CSS / perhitungan rancangan, bukan computed CSS. `VERIFIED` = terbukti di source yang dibaca; `UNVERIFIED` = belum dapat dibuktikan atau perlu browser/checkout. Draft dibuat di luar repo.

## 1. Scope dan metode

| Repository | Corpus yang dihitung | Kepercayaan |
|---|---|---|
| Yomirra | **193** TSX/CSS berkas UI publik pada snapshot; admin dan test dikecualikan, Lab **terikut pada angka lexical lama tetapi read-only** | VERIFIED source-count; runtime UNVERIFIED |
| Yoru | `App.tsx`, `Player.tsx`, `WatchGuide.tsx`, `styles.css`, `main.tsx`, `index.html` | VERIFIED source-count; runtime UNVERIFIED |
| Hitungan | Regex lexical terhadap deklarasi/utility/tag; CSS prefixed dan media/override dihitung terpisah | Bukan instance DOM, uniqueness computed CSS, atau jumlah pelanggaran |
| Distribusi sampel | Beberapa nilai Yomirra belum dihitung per-value menyeluruh; `UNVERIFIED` daripada menebak | Perlu grep ulang dari checkout sebelum Fase 2 |

## 2. Distribusi aggregate kedua repo

| Kategori | Yomirra (lexical) | Yoru (lexical) | Contoh source |
|---|---:|---:|---|
| Radius | **805** `rounded-*` | **124** deklarasi `border-radius` | YOM `manga-card`, YOR `styles.css` |
| Glass blur | **69** `backdrop-blur-*` + **8** deklarasi filter CSS | **15** deklarasi backdrop-filter | YOM `globals.css`, YOR `styles.css` |
| Alpha surface/overlay | **366** `bg-*/NN` (mencakup accent/status) | **122** fungsi rgb/rgba (mencakup non-overlay) | YOM controls/overlay, YOR CSS + inline TSX |
| Shadow | **276** `shadow-*` | **16** deklarasi `box-shadow` | YOM global/reader, YOR styles |
| Height/size control dan layout | **754** `h-*`, `min-h-*`, `size-*` | **111** strict CSS `height`/`min-height` | YOM Button/reader, YOR `.btn`/toolbar |
| Spacing | **2.113** utility gap/padding/margin | **374** CSS gap/padding/margin lexical | YOM Tailwind, YOR CSS |
| Z-index | **128** `z-*` | **18** `z-index` | overlays, player |
| Duration | **87** `duration-*` | **21** transition/duration declarations | Motion/CSS transitions |
| Borders | **773** `border-*` | **296** border-family CSS declarations | controls, modal, media |
| Arbitrary / literals | **889** `-[...]`; **79** hex; **126** rgb(a) | **217** hex; **122** rgb(a) | Bukan semua pelanggaran |

**Aturan audit:** hitungan di atas mempertahankan metode audit Fase 1; **bukan** computed CSS. Nilai Yomirra belum dikeluarkan dari baseline Lab secara terpisah, sehingga baseline produksi final **UNVERIFIED**.

## 3. Radius Yoru lengkap — distribusi 124 deklarasi

Hitungan hasil lexical regex `border-radius\s*:\s*([^;}]+)` atas `frontend/src/styles.css` pada SHA metadata. Setiap deklarasi termasuk override, default/desktop/mobile, bukan computed style.

| Nilai | Jumlah | Lokasi contoh | Status sumber |
|---|---:|---|---|
| `var(--radius-sm)` | 30 | Nav/filter/guide; `styles.css` | existing token; VERIFIED lexical |
| `var(--radius-md)` | 23 | `.btn`, nav, browse/library | existing token; VERIFIED lexical |
| `50%` | 12 | Avatar, thumb, round indicators | semantic shape; VERIFIED lexical |
| `12px` | 11 | `.btn,.icon-button,.setting-action`, player | hardcode; VERIFIED lexical |
| `var(--radius-lg)` | 8 | Hero, browse, library | existing token; VERIFIED lexical |
| `8px` | 5 | Player, subtitle, control | hardcode; VERIFIED lexical |
| `10px` | 5 | Browse and player control | hardcode; VERIFIED lexical |
| `0` | 4 | Reset/flat control | semantic reset; VERIFIED lexical |
| `999px` | 3 | Pill/navigation badge | hardcode; VERIFIED lexical |
| `14px` | 3 | Topbar discover, player extra | hardcode; VERIFIED lexical |
| `20px` | 3 | Library panel/highlight | hardcode; VERIFIED lexical |
| `4px` | 2 | Small decoration | hardcode; VERIFIED lexical |
| `var(--radius-xl)` | 2 | Hero/modal | existing token; VERIFIED lexical |
| `13px` | 2 | Transport button | hardcode; VERIFIED lexical |
| `16px` | 2 | Panel/player | hardcode; VERIFIED lexical |
| `2px` | 1 | Fine indicator | hardcode; VERIFIED lexical |
| `6px` | 1 | UI detail | hardcode; VERIFIED lexical |
| `7px` | 1 | UI detail | hardcode; VERIFIED lexical |
| `17px` | 1 | Card art | hardcode; VERIFIED lexical |
| `99px` | 1 | Range pill | hardcode; VERIFIED lexical |
| `11px` | 1 | Setting select | hardcode; VERIFIED lexical |
| `9px` | 1 | Minor control | hardcode; VERIFIED lexical |
| `16px 16px 0 0` | 1 | Mobile sheet rounded top | hardcode compound; VERIFIED lexical |
| `3px` | 1 | Small decorative element | hardcode; VERIFIED lexical |
| **TOTAL** | **124** | **24 bentuk nilai**; `unclassified = 0` (lexical) | VERIFIED |

### Radius Yomirra — nilai deklarasi token, pemakaian per nilai belum dicensus penuh

| Nilai deklarasi existing | Jumlah definisi token (lexical) | Jumlah pemakaian utility | Lokasi contoh | Kategori |
|---|---:|---|---|---|
| `--radius-xs:6px` | 1 | UNVERIFIED | `globals.css` | existing token |
| `--radius-sm:10px` | 1 | UNVERIFIED | `globals.css`, Button | existing token |
| `--radius-md:14px` | 1 | UNVERIFIED | `globals.css`, card | existing token |
| `--radius-lg:18px` | 1 | UNVERIFIED | `globals.css`, detail | existing token |
| `--radius-xl:22px` | 1 | UNVERIFIED | `globals.css`, dock | existing token |
| `--radius-2xl:28px` | 1 | UNVERIFIED | `globals.css`, overlay | existing token |
| `--radius-3xl:32px` | 1 | UNVERIFIED | `globals.css` | existing token |
| `--radius-sheet:20px` | 1 | UNVERIFIED | `globals.css`, sheet | existing token |
| `--radius-full:9999px` | 1 | UNVERIFIED | `globals.css`, pill | existing token |

Jumlah definisi token ini **lexical count pada `@theme`**, bukan frekuensi `rounded-*`. **805** penggunaan `rounded-*` mencakup kelas responsive/variant/unknown; distribusi per nilai semantik perlu census lanjutan dan tetap **UNVERIFIED**.

## 4. Radius efektif Yoru — pembacaan cascade

| Token | `:root` awal | `:root` glass layer | `:root` akhir bertajuk "Mobile HIG" | Runtime desktop/mobile |
|---|---:|---:|---:|---|
| `--radius-sm` | 6px | 10px | **8px** | UNVERIFIED computed |
| `--radius-md` | 10px | 15px | **12px** | UNVERIFIED computed |
| `--radius-lg` | 14px | 22px | **16px** | UNVERIFIED computed |
| `--radius-xl` | 18px | 26px | **20px** | UNVERIFIED computed |

**VERIFIED source:** deklarasi ketiga berada pada selector `:root` di sekitar baris **2650**, bukan di dalam media query. Secara aturan cascade, nilai terakhir menjadi kandidat efektif di semua viewport bila tidak ada deklarasi berkekuatan lebih tinggi; **berlaku aktual pada desktop dan computed CSS tetap UNVERIFIED**.

## 5. Distribusi nilai representatif: blur, alpha, shadow, height, spacing, z, motion

### Yomirra (nilai utility blur dapat direkonsiliasi)

| Nilai | Jumlah lexical | Lokasi contoh | Token / hardcode |
|---|---:|---|---|
| `backdrop-blur-md` | 37 | Header, cards, SearchInput | Tailwind utility, belum central glass |
| `backdrop-blur-xl` | 13 | Reader, Sheet, overlays | Tailwind utility, belum central glass |
| `backdrop-blur-2xl` | 7 | Dialog-like, profile/reader overlay | Tailwind utility |
| `backdrop-blur-[2px]` | 4 | ReaderPanel, cards | Arbitrary hardcode |
| `backdrop-blur-sm` | 3 | Sheet, error page | Tailwind utility |
| `backdrop-blur-xs` | 2 | Merge dialog | Tailwind utility |
| `backdrop-blur-lg` | 1 | UI Lab (read-only) | Utility |
| `backdrop-blur-none` | 1 | Header | Utility reset |
| `backdrop-blur-[5px]` | 1 | Dialog | Arbitrary hardcode |
| **Jumlah** | **69** | Per-pattern lexical matches | VERIFIED aggregate |
| `.yomirra-chrome` `blur(16px)` | 2 CSS filter declarations (`-webkit-` dan standard) | `globals.css` | CSS hardcode |
| `.liquid-glass` `blur(24px) saturate(190%)` | 4 CSS filter declarations | `globals.css` | CSS hardcode |
| Sonner `blur(24px) saturate(180%)` | 2 CSS filter declarations | `globals.css` | CSS hardcode |
| `bg-surface-overlay/95` | UNVERIFIED exact count | Header popover, network status | Call-site alpha hardcode |
| `bg-surface-base/80` | UNVERIFIED exact count | Reader / home | Call-site alpha hardcode |
| `shadow-xs`, `shadow-sm`, `shadow-glass` | UNVERIFIED counts per token | UI primitives, reader, toast | Existing + legacy |
| `min-h-11` (44px nominal Tailwind spacing) | UNVERIFIED exact count | Controls, reader | Control geometry |
| `--spacing-{1,2,3,4,5,6,8,10,12,16}` | 10 token definitions (lexical token list) | `globals.css` | Existing values 4,8,12,16,20,24,32,40,48,64px |
| `--z-{base,raised,dropdown,sticky,drawer,overlay,popover,toast}` | 8 token definitions (lexical token list) | `globals.css` | Existing 0,10,40,50,60,70,80,100000 |
| `motionDuration.{instant,fast,normal,slow,page}` | 5 TS token definitions | `shared/lib/motion/tokens.ts` | 80,140,200,320,180ms |

### Yoru (per-value counts = exact lexical matches, bukan computed)

| Nilai | Jumlah | Lokasi contoh | Token / hardcode |
|---|---:|---|---|
| `blur(24px) saturate(145%)` | 4 | Mobile bottom nav, prefixed/unprefixed pairs | Hardcode; 2 rules x 2 prefix |
| `blur(20px)` | 3 | Topbar older, player toolbar | Hardcode |
| `blur(12px)` | 2 | Modal backdrop / hero badge | Hardcode |
| `blur(6px)`, `blur(10px)`, `blur(15px)`, `blur(16px)`, `blur(22px)`, `blur(24px)` | **1 masing-masing** | Card overlay, `.glass`, center play, player topbar, topbar, sidebar | Hardcode |
| **Total blur declarations** | **15** | Semua CSS prefixed+standard | VERIFIED |
| `rgba(198, 245, 106, 0.4)` | 5 | Status/border accents | Hardcode |
| `rgba(0, 0, 0, 0.6)` | 3 | Shadow/overlay | Hardcode |
| `rgba(199,246,140,.4)` | 3 | Accent border | Hardcode; literal format berbeda |
| Lainnya alpha | UNVERIFIED per-value count | CSS gradients, overlays, inline TSX | Total fungsi rgb(a) 122 termasuk non-alpha surface |
| `box-shadow:none` | 6 | Corrective CSS | Existing reset |
| Shadow selain `none` | 10 | Hero, modal, progress, cards | CSS literal; 16 total |
| `min-height:44px` | 21 | Filters, tabs, player | CSS hardcode |
| `min-height:40px` | 7 | Player / toolbar | CSS hardcode |
| `min-height:42px` | 5 | Search and settings | CSS hardcode |
| `height:40px` | 3 | `.btn`, controls | CSS hardcode |
| `height:36px` | 3 | `.icon-button`, controls | CSS hardcode |
| `gap/padding:12px` | 42 | Browse/player/settings | CSS hardcode |
| `gap/padding:8px` | 32 | Controls and cards | CSS hardcode |
| `gap/padding:10px` | 25 | Navigation, player | CSS hardcode |
| `gap/padding:6px` | 21 | Controls | CSS hardcode |
| `gap/padding:7px` | 12 | Player / guide | CSS hardcode |
| `z-index:30` | 2 | Mobile nav/layer | CSS hardcode |
| `z-index:1`, `z-index:5` | 2 masing-masing | Local stacking | CSS hardcode |
| Other z-index | 12 declarations | Nav, modal, player | 18 total; exact values in source |
| `transition: ...0.15s` | UNVERIFIED per-value total | Buttons/cards | CSS literal |
| `transition: ...0.16/0.2/0.22/0.3s` | UNVERIFIED per-value total | Animation | CSS literal; 21 declarations aggregate |

## 6. Alias exact-parity Batch 01 (tanpa consumer)

| Nilai lama | Nama token usulan | Delta Batch 01 | Evidence |
|---|---|---|---|
| YOM radius 6/10/14/18/20/22/28/32px | `--radius-*` existing + `--radius-role-*` exact aliases | **0px** | Existing `@theme` source |
| YOM chrome blur16, statusbar blur20, liquid blur24 | `--glass-blur-{chrome,statusbar,liquid}` | **0px** | Source CSS/tsx |
| YOM liquid saturate190, toast saturate180 | `--glass-saturate-{liquid,toast}` | **0 percentage-point** | Source CSS |
| YOM overlay /75 /80 /90 /95 /96 | `--glass-alpha-*` exact role aliases | **0 percentage-point** | Source util literals; per-value frequency UNVERIFIED |
| YOR effective token radius 8/12/16/20 | `--radius-{sm,md,lg,xl}` preserved, semantic roles added | **0px** | Source cascade; computed UNVERIFIED |
| YOR other radius hardcodes | `--radius-legacy-{value}` exact alias | **0px** | Radius 124 declarations verified |
| YOR blur 6/10/12/15/16/20/22/24 | `--glass-blur-legacy-{value}` exact aliases | **0px** | 15 blur declarations verified |
| YOR nav saturation145% | `--glass-saturate-nav` | **0 percentage-point** | Source CSS |
| YOR `.btn` 40, `.icon-button` 36, selects 42/44px | `--control-height-exact-*` | **0px** | Source selector / final cascade UNVERIFIED |
| YOR CSS alpha per role | `--surface-alpha-*` / `--overlay-alpha-*` exact aliases | **0 percentage-point** | Per-value usage UNVERIFIED |

**Catatan:** Batch 01 hanya **mendefinisikan** token/glass layer baru tanpa mengubah consumer; karenanya visual delta 0 adalah **rancangan/gate**, bukan hasil screenshot. Nama alias usulan belum ada di repo. Jumlah consumer aktual setelah batch 01 **UNVERIFIED** sampai ada checkout.

## 7. Kandidat normalisasi Batch 09 — belum approved

Konversi tabel: 1 CSS px = 0,75 CSS pt (unit definisional); tidak menyatakan ukuran fisik pixel perangkat. Semua target di bawah **PROPOSED: pending approval per nilai**.

| Repo / nilai | Target kandidat | Delta px | Delta pt | Status |
|---|---|---:|---:|---|
| YOM radius 6px | `6px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOM radius 10px | `10px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOM radius 14px | `14px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOM radius 18px | `14px` | -4 | -3 | **PENDING APPROVAL PER NILAI** |
| YOM radius 20px | `22px` | +2 | 1.5 | **PENDING APPROVAL PER NILAI** |
| YOM radius 22px | `22px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOM radius 28px | `22px` | -6 | -4.5 | **PENDING APPROVAL PER NILAI** |
| YOM radius 32px | `22px` | -10 | -7.5 | **PENDING APPROVAL PER NILAI** |
| YOM blur 2px | `5px` | +3 | 2.25 | **PENDING APPROVAL PER NILAI** |
| YOM blur 5px | `5px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOM blur 16px | `16px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOM blur 20px | `24px` | +4 | 3 | **PENDING APPROVAL PER NILAI** |
| YOM blur 24px | `24px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOR radius 2px | `8px` | +6 | 4.5 | **PENDING APPROVAL PER NILAI** |
| YOR radius 3px | `8px` | +5 | 3.75 | **PENDING APPROVAL PER NILAI** |
| YOR radius 4px | `8px` | +4 | 3 | **PENDING APPROVAL PER NILAI** |
| YOR radius 6px | `8px` | +2 | 1.5 | **PENDING APPROVAL PER NILAI** |
| YOR radius 7px | `8px` | +1 | 0.75 | **PENDING APPROVAL PER NILAI** |
| YOR radius 8px | `8px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOR radius 9px | `8px` | -1 | -0.75 | **PENDING APPROVAL PER NILAI** |
| YOR radius 10px | `12px` | +2 | 1.5 | **PENDING APPROVAL PER NILAI** |
| YOR radius 11px | `12px` | +1 | 0.75 | **PENDING APPROVAL PER NILAI** |
| YOR radius 12px | `12px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOR radius 13px | `12px` | -1 | -0.75 | **PENDING APPROVAL PER NILAI** |
| YOR radius 14px | `12px` | -2 | -1.5 | **PENDING APPROVAL PER NILAI** |
| YOR radius 16px | `16px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOR radius 17px | `16px` | -1 | -0.75 | **PENDING APPROVAL PER NILAI** |
| YOR radius 20px | `20px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOR blur 6px | `10px` | +4 | 3 | **PENDING APPROVAL PER NILAI** |
| YOR blur 10px | `10px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOR blur 12px | `10px` | -2 | -1.5 | **PENDING APPROVAL PER NILAI** |
| YOR blur 15px | `16px` | +1 | 0.75 | **PENDING APPROVAL PER NILAI** |
| YOR blur 16px | `16px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOR blur 20px | `24px` | +4 | 3 | **PENDING APPROVAL PER NILAI** |
| YOR blur 22px | `24px` | +2 | 1.5 | **PENDING APPROVAL PER NILAI** |
| YOR blur 24px | `24px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |
| YOR button height 40px | `44px` | +4 | 3 | **PENDING APPROVAL PER NILAI** |
| YOR icon size 36px | `44px` | +8 | 6 | **PENDING APPROVAL PER NILAI** |
| YOR select min-height 42px | `44px` | +2 | 1.5 | **PENDING APPROVAL PER NILAI** |
| YOR select 44px | `44px` | +0 | 0 | **PENDING APPROVAL PER NILAI** |

**Di luar tabel delta linier:** YOR `0`/`50%` dipertahankan; `99px`/`999px` sebagai pill semantics memerlukan peninjauan dimensi elemen (delta efektif **UNVERIFIED**). Compound `16px 16px 0 0` tetap shape-specific; normalisasi harus memperoleh approval. Nilai `--radius-*` tidak dapat dianggap berubah per-use tanpa computed audit. YOM saturation toast 180% → kandidat 190% = **+10 percentage-point** (PENDING APPROVAL); YOR saturate145% dipertahankan. YOM overlay alpha 95% → kandidat 90% = **−5 percentage-point** dan 96% → 95% = **−1 percentage-point**; **ini perubahan visual, belum approved**.

## 8. Legacy alias tracker (alias belum dibuat)

**Kolom jumlah = baseline lexical match yang berpotensi dimigrasikan, BUKAN jumlah actual consumer alias.** `UNVERIFIED` berarti belum ada per-value census. Setelah `01`, setiap alias wajib dicatat penggunaan aktualnya; pada batch `09` penggunaan dan definisi alias harus **0**.

| Alias legacy usulan | Nilai exact | Baseline matches | Actual alias consumers setelah 01 | Wajib habis |
|---|---|---:|---|---|
| `--radius-legacy-2` (YOR) | `2px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-3` (YOR) | `3px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-4` (YOR) | `4px` | 2 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-6` (YOR) | `6px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-7` (YOR) | `7px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-9` (YOR) | `9px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-10` (YOR) | `10px` | 5 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-11` (YOR) | `11px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-13` (YOR) | `13px` | 2 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-14` (YOR) | `14px` | 3 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-17` (YOR) | `17px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-99` (YOR) | `99px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-legacy-999` (YOR) | `999px` | 3 | UNVERIFIED (belum ada) | `YOR-09` |
| `--glass-blur-legacy-6` (YOR) | `6px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--glass-blur-legacy-12` (YOR) | `12px` | 2 | UNVERIFIED (belum ada) | `YOR-09` |
| `--glass-blur-legacy-15` (YOR) | `15px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--glass-blur-legacy-20` (YOR) | `20px` | 3 | UNVERIFIED (belum ada) | `YOR-09` |
| `--glass-blur-legacy-22` (YOR) | `22px` | 1 | UNVERIFIED (belum ada) | `YOR-09` |
| `--radius-compat-18` (YOM) | `18px` | UNVERIFIED | UNVERIFIED (belum ada) | `YOM-09` |
| `--radius-compat-20` (YOM) | `20px` | UNVERIFIED | UNVERIFIED (belum ada) | `YOM-09` |
| `--radius-compat-28` (YOM) | `28px` | UNVERIFIED | UNVERIFIED (belum ada) | `YOM-09` |
| `--radius-compat-32` (YOM) | `32px` | UNVERIFIED | UNVERIFIED (belum ada) | `YOM-09` |
| `--glass-compat-dialog` (YOM) | `blur(5px)` | UNVERIFIED | UNVERIFIED (belum ada) | `YOM-09` |
| `--glass-compat-statusbar` (YOM) | `blur(20px)` | UNVERIFIED | UNVERIFIED (belum ada) | `YOM-09` |
| **Seluruh alias legacy** | Exact-value only | **UNVERIFIED final census** | **0 diwajibkan sesudah `09`** | `YOM-09` / `YOR-09` |

## 9. Konstanta behavior — jangan jadikan visual token

| Repo | Nilai source | Lokasi dan perilaku | Status |
|---|---|---|---|
| YOM | 180px | `top-nav.tsx` search pill muncul setelah scroll | VERIFIED source |
| YOM | 1200px | `reader-shell.tsx` Back to Top | VERIFIED source |
| YOM | 80px | `reader-shell.tsx` akumulasi arah scroll overlay | VERIFIED source |
| YOM | 300px | `reader-shell.tsx` near-end auto-dismiss | VERIFIED source |
| YOM | ≤10px dan ≤250ms | Reader gesture contract; hook harus diperiksa sebelum perubahan | UNVERIFIED implementation |
| YOM | 180ms, 12000ms | `motion/tokens.ts` navigation feedback/recovery timeout | VERIFIED source |
| YOR | 8000ms | `App.tsx` hero rotation, suspend hover/focus/touch/reduced-motion | VERIFIED source |
| YOR | 8 detik | Player auto-next countdown | VERIFIED source |
| YOR | ±10 detik | Player jump transport | VERIFIED source |
| YOR | ±0.1 / ±0.5 detik | Player subtitle offset controls | VERIFIED source |
| YOR | ±30 detik | Stored subtitle offset validation bounds | VERIFIED source |
| YOR | 10000ms, max 6 kandidat | App native stream health check | VERIFIED source |

## 10. Kandidat exception register — belum approved

**Target dokumen setelah approval:** `docs/internal/token-exceptions.md` di **masing-masing repo**. Belum dibuat di repo. Pengecualian hanya sah jika lokasi dan alasan disetujui secara tertulis.

| Nilai / kategori | Lokasi contoh | Alasan candidate | Status |
|---|---|---|---|
| `aspect-[2/3]` | YOM manga-card, skeleton | Rasio media content, bukan control styling | PENDING APPROVAL |
| `env(safe-area-inset-*)`, `calc(...)` | YOM chrome/reader; YOR mobile nav/modal | Device-safe-area dan geometry responsive | PENDING APPROVAL |
| `#000000`, `#f9f9fb`, `#003135` | YOM `reader-shell.tsx` | Pilihan warna bacaan semantic; kandidat token lebih baik daripada exception | PENDING APPROVAL |
| Caption native API/geometry | YOR `Player.tsx` | Browser-controlled rendering, native subtitle constraints | PENDING APPROVAL |
| Warna status registered/candidate/torrent/error/unavailable | YOR `styles.css` | Semantic source truthfulness; tetap pertahankan status berbeda | PENDING APPROVAL |
| `50%` radius | YOR controls/avatar/indicators | Bentuk lingkaran responsive | PENDING APPROVAL |
| `0` radius / reset | YOR CSS controls/panels | Reset styling; boleh token `none` | PENDING APPROVAL |
| CSS `data-[state=*]` selectors | YOM Radix primitives | Selector state, bukan arbitrary visual value | KLASIFIKASI, bukan exception otomatis |
| Reader image dimensions / transform | YOM reader image | Zoom/performance controls; semantic geometry | PENDING APPROVAL |

## Open items

| ID | Task | Status |
|---|---|---|
| TOK-O-01 | Selesaikan YOM per-value census radius/alpha/shadow/spacing tanpa Lab pada checkout | UNVERIFIED |
| TOK-O-02 | Ukur computed height, effective token cascade pada kedua viewport | UNVERIFIED |
| TOK-O-03 | Owner approve final canonical scale dan setiap nilai/delta sebelum `09` | PENDING APPROVAL |
| TOK-O-04 | Isi jumlah consumer alias nyata setelah `01` dan pastikan 0 sesudah `09` | UNVERIFIED |
| TOK-O-05 | Review exception register per lokasi/nilai/alasan | PENDING APPROVAL |
