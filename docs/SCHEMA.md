# Schema

Ringkasan contract data utama Yomirra. Untuk detail field terbaru, type source code tetap menjadi source of truth.

## Source contract

Shared source types berada di `src/shared/sources/source-types.ts`.

### SourceMetadata

Metadata penting:

- `id`, `name`, `language`;
- `baseUrl`, `healthCheckUrl`, `upstreamDomain`;
- `isEnabled`, `isInstalled`, `isDynamic`;
- `isNsfw`;
- `capabilities`;
- status: `online | slow | unavailable | unknown | in-dev | in-fix`.

### MangaItem

List/search item dapat membawa:

- `id`, `title`, `coverUrl`;
- `originalTitle`, `alternativeTitles`;
- `author`, `description`;
- `status`, `format`, `language`;
- `latestChapter`, `score`, `rank`.

### Chapter

```ts
interface Chapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  date: string;
  scanlator?: string;
  isLocked?: boolean;
  url?: string;
}
```

### PageItem

```ts
interface PageItem {
  index: number;
  url: string;
  referer?: string;
  width?: number;
  height?: number;
}
```

## Library

`LibraryItem` berada di `src/shared/store/library-store.ts`.

Field identity utama:

```ts
type LibraryItem = {
  id?: string;
  schemaVersion?: 2;
  primarySourceId?: string;
  primaryMangaId?: string;
  linkedSources?: SourceRef[];

  sourceId: string;
  mangaId: string;
  title: string;
  addedAt: string;
  updatedAt: string;

  lastReadChapterId?: string;
  lastReadChapterTitle?: string;
  lastReadAt?: string;
  userRating?: number;
  status?: string;
  format?: string;
};
```

Library dibatasi 1000 item oleh store.

## History

History disimpan per physical chapter dan dapat membawa `savedTitleId` untuk menghubungkan chapter tersebut ke SavedTitle.

Progress dapat mencakup page progress, series progress, chapter index, total chapters, dan `readAt`.

## Collections

Persisted collection state menyimpan:

- `collections`;
- `membershipsByManga`;
- `readingStatusByManga`.

Smart Collections tidak masuk schema persisted ini. `readingStatusByManga` saat ini lokal dan belum termasuk kontrak Cloud Sync.

## Cloud Sync dan tombstone

Canonical Library tersimpan di `users/{uid}/libraryV2/{savedTitleId}`, History di `users/{uid}/history/{historyId}`. Penghapusan disinkronkan sebagai tombstone dengan `_deleted: true` dan `deletedAt` (timestamp numerik); dokumen `users/{uid}/library` legacy menerima penanda penghapusan untuk kompatibilitas.

Saat full/realtime merge, delete menang pada timestamp sama; re-add atau progress eksplisit yang lebih baru dapat menang. Tombstone adalah representasi data sync, bukan field wajib dari `LibraryItem` lokal. Firestore rules per UID tetap wajib. Preferensi sumber dan koleksi buatan user memakai dokumen preference akun yang sesuai.

## Source preferences

Store menyimpan:

- `disabledSources`;
- `hiddenFromHomeSources`.

Global Search tidak memakai disabled-source preference sebagai filter user.

## API response

Normal API route memakai:

```ts
{ data: T }
```

Error public:

```ts
{
  error: {
    code: string;
    message: string;
  }
}
```

## Search filters

Canonical filter keys:

```text
genre[]
format[]
status
sort
```

Adapter bertanggung jawab memetakan canonical value ke parameter upstream.

## Search catalog

Redis catalog dapat menyimpan metadata manga publik yang ditemukan dari trusted source flow, termasuk canonical key, source bindings, title metadata, filter metadata, optional embedding, dan timestamp.

Catalog tidak boleh menyimpan private user state.

## Backup

Current backup schema: **v3**.

v3 menambahkan identity fields Library sambil mempertahankan import compatibility untuk v1/v2 yang didukung.

## Environment

Validated di `src/env.ts`.

Server/runtime variables:

```text
REDIS_URL
IMAGE_PROXY_SECRET
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
TELEGRAM_ALLOWED_CHAT_IDS
OPS_CRON_SECRET
CRON_SECRET
TELEGRAM_WEBHOOK_SECRET
VERCEL_DEPLOY_SECRET
GEMINI_API_KEY
```

Public/browser config menggunakan `NEXT_PUBLIC_*`, termasuk app URL dan Firebase config.

Jika env contract berubah, update `src/env.ts`, `.env.example`, dan dokumen terkait dalam PR yang sama.
