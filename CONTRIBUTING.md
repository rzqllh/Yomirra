# Contributing to Yomirra

Kontribusi sebaiknya kecil, jelas, dan bisa diverifikasi tanpa membawa cleanup yang tidak berhubungan.

## Sebelum mulai

1. Cek issue dan pull request yang sudah ada.
2. Branch dari `main` terbaru.
3. Baca dokumen yang sesuai:
   - [Architecture](docs/ARCHITECTURE.md)
   - [Components](docs/COMPONENTS.md)
   - [Design](docs/DESIGN.md)
   - [Testing](docs/TESTING.md)
   - [Adding a Source](docs/ADDING_A_SOURCE.md)
4. Untuk perubahan contract publik atau arsitektur besar, jelaskan scope sebelum implementasi.

Contoh nama branch:

```text
feat/source-example
fix/search-pagination
docs/release-notes
refactor/filter-controller
```

## Setup lokal

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Prinsip perubahan

- Satu PR menyelesaikan satu masalah yang koheren.
- Jangan format ulang file yang tidak perlu.
- Reuse primitive, helper, dan contract yang sudah ada sebelum membuat abstraksi baru.
- Source-specific behavior tetap di adapter/server boundary.
- Client tidak boleh import implementasi dari `src/server/`.
- Zustand dipakai untuk state lokal/persisted yang sudah established; TanStack Query untuk remote request state.
- Jangan menambah dependency hanya untuk mengganti util kecil yang sudah bisa ditangani platform atau dependency existing.
- Perubahan schema persisted/backup harus menjaga backward compatibility secara sengaja.
- Jangan mencampur refactor struktural dengan redesign besar kecuali memang satu scope.

## UI

Gunakan primitive canonical sebelum membuat komponen baru, misalnya:

- `PageHeader`
- `SearchInput`
- `FilterChip`
- `FilterDrawerShell`
- `MangaCover`
- `ReadingProgress`
- `MangaGrid`
- `ReaderPanelShell`

Gunakan token desain Yomirra; jangan menambah raw color/glow/gradient baru tanpa alasan. Detail desain ada di [DESIGN.md](docs/DESIGN.md).

## Source adapter

Adapter harus:

- mengembalikan type Yomirra yang sudah dinormalisasi;
- punya stable manga/chapter IDs;
- memetakan filter canonical ke parameter source;
- gagal secara terisolasi tanpa memutus source lain;
- tidak menyimpan credential/cookie private;
- punya focused tests untuk parsing, pagination, filter, dan failure penting.

## Verification

Untuk perubahan broad atau release-sensitive:

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
git diff --check
```

UI yang menyentuh responsive layout, overlay, navigation, PWA, atau reader tetap membutuhkan browser/device smoke test bila behavior tersebut tidak bisa dibuktikan oleh jsdom.

Jangan menyebut perubahan “aman” atau “tanpa behavior change” hanya karena typecheck/lint lulus.

## Commit dan PR

Gunakan commit message yang menjelaskan perubahan:

```text
feat(search): add canonical tag filters
fix(reader): keep active chapter visible
docs(schema): update SavedTitle identity
test(source): cover filter mapping
```

PR sebaiknya menjelaskan:

- masalah yang diselesaikan;
- scope yang sengaja disentuh dan tidak disentuh;
- verification yang benar-benar dijalankan;
- screenshot untuk perubahan visual penting;
- known limitation/follow-up bila ada.

Jangan commit `.env`, token, cookie, credential source, worktree, atau scratch artifact.

## Dokumentasi

Update public docs bila perubahan menyentuh setup, environment variable, route/behavior, architecture boundary, component contract, source contract, schema, security assumption, atau testing requirement.

Tambahkan perubahan penting ke `CHANGELOG.md`.

## Lisensi dan konten pihak ketiga

Kontribusi mengikuti Apache License 2.0. Jangan mengirim source code, credential, atau konten berhak cipta yang tidak boleh didistribusikan.
