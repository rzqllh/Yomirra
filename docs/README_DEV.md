# Developer Guide

Panduan singkat untuk bekerja di codebase Yomirra.

## Setup

Gunakan Node.js **22** dan pnpm **9** agar sesuai versi mayor CI. Belum ada pin `engines` atau `packageManager` di `package.json`; jangan menganggap versi lokal contributor sebagai persyaratan baru.

```bash
pnpm install --frozen-lockfile
```

Salin `.env.example` ke `.env`:

```bash
# Bash
cp .env.example .env
```

```powershell
# PowerShell
Copy-Item .env.example .env
```

Tetapkan `NEXT_PUBLIC_APP_URL` ke `http://localhost:3000` dan ganti placeholder `IMAGE_PROXY_SECRET` dengan nilai acak lokal minimal 32 karakter. Jangan menaruh secret pada variabel `NEXT_PUBLIC_*`, memakai nilai contoh untuk production, atau mengomit `.env` ke Git.

```bash
pnpm dev
```

Buka `http://localhost:3000`. Halaman aplikasi harus merespons; hasil sumber masih bergantung pada jaringan dan upstream. `dev` serta `build` memakai Webpack sesuai script repository.

## Konfigurasi berdasarkan fitur

| Kategori | Konfigurasi | Kapan diperlukan |
| --- | --- | --- |
| URL aplikasi/gambar | `NEXT_PUBLIC_APP_URL`, `IMAGE_PROXY_SECRET` | URL lokal dan signed image proxy; tanpa signing, gambar dapat memakai URL langsung dan mengikuti kebijakan upstream |
| Cache dan readiness | `REDIS_URL` | Koneksi Redis yang dipakai runtime cache/server; contoh menunjuk Redis lokal, bukan layanan yang otomatis tersedia |
| Akun/sinkronisasi | `NEXT_PUBLIC_FIREBASE_*` | Proyek Firebase dengan provider Auth dan aturan Firestore sesuai pengguna; public browsing tidak mensyaratkan akun |
| Admin | `ADMIN_KEY` / `ADMIN_SECRET`, `ADMIN_SESSION_SECRET`, `ADMIN_EMAILS` | Fitur admin; ikuti [Security Policy](../SECURITY.md) dan jangan buka admin tanpa konfigurasi/otorisasi yang benar |
| Credential sumber | `RESTRICTED_SOURCE_APP_SECRET` | Hanya sumber yang memerlukannya; kegagalan satu sumber tidak seharusnya memutus registry lain |
| Search intelligence | `GEMINI_API_KEY` | Semantic ranking opsional; pencarian leksikal dan rekomendasi utama tidak bergantung pada AI |
| Otomasi/operasi | Variabel Telegram, cron, dan deployment terkait | Hanya jika mengerjakan integrasi tersebut; tidak perlu diisi untuk mencoba UI publik |

`.env.example` adalah titik awal, bukan daftar setiap variabel seluruh integrasi. Periksa modul fitur dan `src/env.ts` sebelum mengonfigurasi layanan tambahan. Jangan meminta atau menyalin kredensial produksi untuk onboarding.

Tanpa Redis yang tersedia, pembacaan publik mencoba jalur sumber/fallback; itu tidak menjamin semua API berfungsi. Operasi yang memerlukan durability/admission Redis tetap dapat ditolak. `GET /api/health/live` memeriksa respons proses, sedangkan `GET /api/health` memeriksa kesiapan Redis dan dapat mengembalikan 503 walaupun halaman publik merespons.

Cache aktif menggunakan `src/server/lib/cache/redis.ts` (`ioredis`, `REDIS_URL`). Helper REST terpisah di `src/lib/redis.ts` menggunakan `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN`; keberadaannya tidak berarti cache aplikasi sudah beralih ke REST. Jangan mengganti konfigurasi runtime hanya berdasarkan dependency `@upstash/redis`.

## Verifikasi dan build

```bash
pnpm typecheck
pnpm lint
pnpm test -- --run
pnpm build
pnpm start
```

`pnpm test` saja membuka mode watch Vitest; `-- --run` menjalankan satu kali. `pnpm start` melayani hasil build production pada port 3000; hentikan server dev lebih dulu. Untuk browser smoke dan batas perangkat, ikuti [Testing](TESTING.md). Keberhasilan build tidak membuktikan akses sumber, Firebase, atau perangkat nyata.

Package versions dan scripts mengikuti `package.json`; dependency tepatnya mengikuti `pnpm-lock.yaml`.

## Struktur utama

```text
src/
├── app/
│   ├── (web)/        user-facing routes
│   └── api/          server routes
├── components/
│   ├── chrome/       app shell, nav, PageHeader
│   ├── overlays/     cross-page overlays dan boot state
│   ├── home/         Home composition dan feed
│   ├── ui/           canonical UI primitives
│   ├── komik/        cards, detail, recommendation
│   ├── library/      source browsing
│   ├── bookmark/     Rak Buku
│   ├── search/       global search
│   ├── reader/       reader chrome/panels
│   └── updates/      update UI
├── server/
│   └── lib/
│       ├── sources/  adapters + source manager
│       ├── cache/    Redis
│       ├── search/   search intelligence/catalog
│       └── ops/      operational reporting
└── shared/
    ├── api-client.ts
    ├── hooks/
    ├── lib/
    ├── sources/
    ├── store/
    ├── types/
    └── utils/
```

## Boundary penting

### Client vs server

Client component tidak boleh import source adapter atau Redis code dari `src/server/`.

Browser-facing code berjalan melalui API route / `apiClient`.

Client-safe contract lintas boundary berada di `src/shared/types/` atau `src/shared/sources/`. Import production menargetkan module canonical secara langsung; jangan menghidupkan kembali legacy `components/app`, `components/manga`, atau barrel tanpa consumer.

### Source adapters

Setiap source mengubah response upstream menjadi shared Yomirra types. Generic UI tidak seharusnya mengenal bentuk response asli source.

### Local-first state

Zustand memegang state browser yang memang perlu persisted atau dipakai lintas feature, seperti Library, History, Downloads, Settings, dan source preferences.

TanStack Query memegang remote request state.

Untuk akun Firebase, full sync beroperasi per UID, memakai `libraryV2`/History tombstones, dan harus meneruskan kegagalan ke caller. Jangan menulis merge yang menghidupkan kembali item terhapus atau mencampurkan state dua akun. `readingStatusByManga` tetap local-only sampai ada keputusan schema dan migrasi terpisah.

### Route → view → controller

Route kompleks sebaiknya tipis:

```text
App Router route
→ feature page view
→ feature component + controller hook
→ store/query/API client
```

Contoh yang sudah ada: Search, Library, dan Rak Buku.

Grouping internal `components/komik` tidak mengubah nama type/component `Manga*` yang sudah established atau public route `/manga/*`.

## Multi-source identity

Library tidak hanya bergantung pada `sourceId::mangaId`. Saved title dapat memiliki primary source dan linked source.

Jangan membuat feature baru yang menganggap satu title selalu identik dengan satu provider.

Lihat [IDENTITY.md](IDENTITY.md).

## Search

Global Search:

- berjalan ke source yang installed/available;
- tidak mengikuti toggle source untuk Library/Populer;
- dapat menggabungkan hasil menjadi canonical title;
- memakai tag/filter canonical;
- tetap berfungsi tanpa Gemini.

Semantic ranking bersifat optional dan server-side.

## Recommendation dan Smart Collections

Rekomendasi utama deterministic. Ia memakai source/format/rating/history signals dan tidak membutuhkan model AI.

Smart Collections dihitung dari Library + History. Jangan persist membership otomatis ke `collection-store`.

## Reader

Reader punya interaction family sendiri. `ReaderPanelShell` tidak sama dengan Vaul filter drawer.

Reader UI sebaiknya tetap fokus pada reading flow; source recovery, account sync, atau global app concerns tidak perlu dipindahkan ke reader state.

Perubahan antrian unduhan harus menjaga zero-idle-timer, concurrency, pause/resume/cancel, Cache Storage, dan validasi signed proxy untuk URL lama. Jangan menjadikan legacy URL sebagai alasan membuka proxy tanpa signature.

## Motion dan navigation

Gunakan semantic motion layer; jangan menambah spring/duration baru langsung di feature component bila preset yang sesuai sudah ada.

- timing/easing/spring: `src/shared/lib/motion/tokens.ts`;
- press/layout preset: `src/shared/lib/motion/variants.ts`;
- route transition: `src/components/motion/page-transition.tsx`;
- state icon transition: `src/components/motion/animated-state-icon.tsx`;
- path morphing: hanya melalui `src/components/motion/morph-icon.tsx`, bukan import package langsung dari feature code.

Navigation intent harus memberi optimistic state segera, tetapi visible loading feedback baru muncul setelah delay. Jangan menambahkan full-screen pending skeleton ke AppShell; gunakan segment `loading.tsx` yang bentuknya mengikuti final page.

Normal Back/Forward harus membiarkan browser/Next mengelola history dan scroll restoration. Reader progress adalah state terpisah dan tidak boleh bergantung pada page scroll.

## Source reliability

Source adalah external boundary dan dapat berubah tanpa warning.

- failure satu source tidak boleh membatalkan source lain;
- remote response harus dianggap untrusted;
- retry harus bounded;
- public errors tidak boleh membocorkan raw response/secret;
- credential optional harus di-resolve di server pada saat request upstream, bukan dijadikan syarat konstruksi registry source.

## Security route boundary

Gunakan policy bersama di `src/server/lib/security/rate-limit.ts` untuk route sensitif/mahal. Jangan membuat limiter ad-hoc baru bila kebutuhan dapat diekspresikan sebagai namespace/policy yang sudah ada.

- admin mutation/expensive operation: fail-closed;
- public search/image delivery: availability-first sesuai policy;
- Redis readiness: gunakan shared `ensureRedisReady()` untuk jalur fail-closed, bukan inisialisasi `redis.connect()` ad-hoc; jalur fail-open boleh bypass segera ketika Redis belum ready sambil melakukan recovery non-blocking;
- report user: strict fail-closed;
- response rejection harus membawa limit/reset dan `Retry-After`;
- jangan memakai left-most forwarded header secara langsung sebagai identity limiter.

Admin browser auth memakai signed HttpOnly session; jangan menyimpan raw passkey di browser storage.

Browser CSP saat ini sengaja `Report-Only`. Perubahan directive harus diuji pada preview deployment untuk Next.js chunks, Firebase auth, HTTPS assets/API, WebSocket, manifest, dan Service Worker sebelum enforcement. Generic UI error tidak boleh meneruskan raw `error.message`; simpan detail diagnosis di server log melalui shared logger.

## Dokumentasi lanjut

- [Architecture](ARCHITECTURE.md)
- [Components](COMPONENTS.md)
- [Testing](TESTING.md)
- [Adding a Source](ADDING_A_SOURCE.md)

## Perubahan history dan backup

Baca [kontrak data bacaan](READING_DATA.md) sebelum mengubah history atau sync. Gunakan kebijakan `retainHistory` pada semua jalur pemasukan data. Jangan memakai batas 512 untuk menghapus progres judul dari cloud, jangan memulihkan seluruh snapshot history ketika satu write gagal, dan selalu tangkap pemilik operasi sebelum menunggu Firebase.

Backup schema 1 sampai 3 tetap diterima. Perubahan identitas wajib diuji melalui ekspor, validasi schema, merge berulang, dan replace dengan koleksi yang masih terhubung. Batas 10 MB tetap berlaku untuk ekspor dan impor.
