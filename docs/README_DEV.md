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
│   ├── app/          app shell, nav, PageHeader
│   ├── ui/           canonical UI primitives
│   ├── manga/        cards, detail, recommendation
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

### Source adapters

Setiap source mengubah response upstream menjadi shared Yomirra types. Generic UI tidak seharusnya mengenal bentuk response asli source.

### Local-first state

Zustand memegang state browser yang memang perlu persisted atau dipakai lintas feature, seperti Library, History, Downloads, Settings, dan source preferences.

TanStack Query memegang remote request state.

### Route → view → controller

Route kompleks sebaiknya tipis:

```text
App Router route
→ feature page view
→ feature component + controller hook
→ store/query/API client
```

Contoh yang sudah ada: Search, Library, dan Rak Buku.

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

## Source reliability

Source adalah external boundary dan dapat berubah tanpa warning.

- failure satu source tidak boleh membatalkan source lain;
- remote response harus dianggap untrusted;
- retry harus bounded;
- public errors tidak boleh membocorkan raw response/secret.

## Dokumentasi lanjut

- [Architecture](ARCHITECTURE.md)
- [Components](COMPONENTS.md)
- [Testing](TESTING.md)
- [Adding a Source](ADDING_A_SOURCE.md)
