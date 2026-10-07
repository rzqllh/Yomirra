# Components

Dokumen ini mencatat reusable UI seams yang sudah canonical di Yomirra. Tujuannya bukan membuat satu komponen universal untuk semua hal.

Canonical ownership:

| Folder | Tanggung jawab |
| --- | --- |
| `src/components/chrome/` | app shell, header, dan navigation |
| `src/components/overlays/` | boot state dan overlay lintas halaman |
| `src/components/home/` | composition dan feed Beranda |
| `src/components/komik/` | detail, card, chapter, dan action komik |

Production code mengimpor file pemilik secara langsung. Legacy implementation di `components/app` dan `components/manga` tidak dipertahankan; folder test lama bukan API import. Nama `Manga*` dan public route `/manga/*` tetap dipakai walaupun grouping internal bernama `komik`.

## App chrome

### PageHeader

`src/components/chrome/header.tsx`

Dipakai sebagai header destination page. Ia memiliki responsive mobile/desktop contract sendiri.

Jangan membangun mobile header baru per halaman jika `PageHeader` sudah cukup. Pada route yang desktop context-nya sudah jelas dari TopNav, gunakan `hideDesktop` agar banner judul desktop tidak terduplikasi; mobile header tetap dipertahankan.

### Bottom dock

Bottom navigation memakai shared Yomirra chrome. Reader punya chrome sendiri tetapi mengikuti bahasa visual yang sama.

## Base UI

Komponen penting di `src/components/ui/`:

| Component | Tanggung jawab |
| --- | --- |
| `Button` | action/button variants |
| `IconButton` | icon-only control dengan label aksesibel |
| `SearchInput` | search field + clear behavior |
| `FilterChip` | selectable chip + `aria-pressed` |
| `FilterDrawerShell` | Vaul drawer chrome untuk Search/Library |
| `FilterSection` | section layout di filter drawer |
| `Dialog` | modal/dialog primitives |
| `SegmentedControl` | segmented/tabs control |
| `Skeleton` | loading primitive |
| `Pagination` | shared pagination |
| `ReadingProgress` | semantic progress 0–100 |
| `PageContainer` | canonical outer frame/gutters untuk ordinary destination pages |
| `ContentLane` | optional inner max-width untuk management/focused content tanpa mengubah outer frame |

Gunakan primitive yang sudah ada sebelum membuat versi lokal.

## Motion primitives

Komponen motion canonical berada di `src/components/motion/` dan semantic timing/preset berada di `src/shared/lib/motion/`.

| Component | Tanggung jawab |
| --- | --- |
| `PageTransition` | subtle route transition non-reader + reduced-motion fallback |
| `AnimatedStateIcon` | transisi dua state icon dengan wrapper geometry stabil |
| `MorphIcon` | satu-satunya boundary package Morphicons; feature tidak boleh import package langsung |

Route/navigation identity icon tetap stabil dan tidak dimorph hanya untuk efek visual. Untuk press/layout behavior gunakan shared preset sebelum membuat spring baru secara lokal.

## Home

Home opening sengaja dibagi menurut responsibility, bukan dijadikan satu mega component.

| Component | Tanggung jawab |
| --- | --- |
| `HomeHero` | eyebrow/heading, entry shared global search, decorative session-stable cover collage |
| `EditorialSpotlight` | presentasi satu item Sorotan terbaru, explicit detail targets, restrained content transition |
| `HomeLeaderboardPanel` | selector sumber, source-scoped Top 5, contextual `Lihat semua` |
| `HomeFeedClient` | orchestration, source-aware Spotlight selection, confident dedupe, Hero candidate derivation, carousel state/autoplay |
| `SourceFeedSkeleton` | content-less geometry Home yang mengikuti urutan dan breakpoint final |

`HomeHero` tidak memiliki artwork skeleton. Decorative cover failure tidak boleh mengubah usable Hero.

`EditorialSpotlight` tidak memiliki business logic ranking atau source selection. Container tetap stabil ketika item carousel berubah.

`HomeLeaderboardPanel` tidak membuat ranking global sintetis dari feed beberapa sumber.

Skeleton feature/page harus mengikuti geometry final UI; jangan membuat placeholder layout generik yang diwariskan dari desain lama.

## Filter drawer

Search dan Library share presentation shell, bukan business logic.

`FilterDrawerShell` memiliki:

- Vaul root/overlay/content;
- compact initial snap point;
- expansion saat user scroll/drag;
- header/reset/apply;
- safe-area footer.

Source capabilities dan selected filters tetap milik feature controller.

## Manga presentation

### MangaCover

Menyatukan cover loading/fallback dan `referrerPolicy`.

### MangaGrid

Grid responsive canonical. Skeleton grid memakai breakpoint yang sama.

### Card archetypes

Card berikut sengaja tetap terpisah:

- `ShelfCard`
- `HistoryCard`
- `EditorialCard`
- `LeaderboardRow`

Jangan gabungkan menjadi mega `MangaCard variant=...` bila struktur/interaksinya berbeda.

## Search

Feature utama:

```text
search-page-view
search-toolbar
search-source-rail
search-results
search-filter-drawer
useSearchCatalog
```

Search input/tag logic tetap berada di domain search, bukan di generic input primitive.

## Library

Library adalah browsing per source, bukan personal bookshelf.

```text
library-page-view
library-toolbar
library-status-rail
library-collection-rail
library-results
library-filter-drawer
useLibraryCatalog
```

## Rak Buku

Rak Buku memiliki Reading dan Bookmark/Collection domain.

`useBookmarkCollection` menggabungkan bookmark list dengan:

- user-created collections;
- Smart Collections derived dari Library + History;
- search/sort/pagination;
- selection/bulk actions.

Smart Collections bukan persisted collection dan harus tetap terpisah dari `collection-store`.

## Reader

`ReaderPanelShell` adalah canonical shell untuk chapter/settings panel.

Ia memakai Motion, bukan Vaul, karena interaction/responsive contract berbeda dari filter drawer.

Chapter navigator dan settings drawer menyimpan business state masing-masing.

## Component ownership

Sebelum menambah komponen:

1. Apakah responsibility ini sudah dimiliki primitive existing?
2. Apakah duplication benar-benar identik?
3. Apakah behavior sebenarnya domain-specific?
4. Apakah abstraction baru butuh banyak semantic props yang tidak saling terkait?

Jika jawaban nomor 4 iya, biasanya abstraction itu terlalu besar.

## Hindari

- raw hex/RGB baru untuk normal feature UI;
- duplicate header chrome;
- duplicate cover error handling;
- nested page scroll;
- universal drawer abstraction;
- local copy dari canonical filter/search primitives;
- state baru untuk data yang sudah dimiliki store existing, kecuali draft/transient UI state.


## Page frame ownership

`PageContainer` tidak lagi menentukan lebar route berdasarkan archetype. Semua ordinary destination page memakai outer frame yang sama.

Gunakan `ContentLane variant="management"` atau `ContentLane variant="focused"` hanya untuk blok internal yang memang perlu lebih sempit. Jangan mengembalikan `max-width` berbeda ke level route karena itu membuat canvas bergeser saat navigasi.

Settings desktop memakai dua stack eksplisit, bukan CSS multi-column/masonry flow. Urutan DOM dan hierarchy harus tetap dapat dipahami ketika layout collapse menjadi satu kolom.
