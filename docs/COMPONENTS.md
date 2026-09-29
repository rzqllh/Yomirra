# Components

Dokumen ini mencatat reusable UI seams yang sudah canonical di Yomirra. Tujuannya bukan membuat satu komponen universal untuk semua hal.

## App chrome

### PageHeader

`src/components/app/header.tsx`

Dipakai sebagai header destination page. Ia memiliki responsive mobile/desktop contract sendiri.

Jangan membangun mobile header baru per halaman jika `PageHeader` sudah cukup.

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

Gunakan primitive yang sudah ada sebelum membuat versi lokal.

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
