# Developer Guide

Panduan singkat untuk bekerja di codebase Yomirra.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Verification penuh:

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

Package versions dan scripts selalu mengikuti `package.json`.

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
