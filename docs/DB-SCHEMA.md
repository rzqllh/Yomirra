# Database & Schema Architecture

> Extend file — referenced from `AGENTS.md`.
> Baca ini sebelum task apapun yang involve penyimpanan data lokal (IndexedDB) atau sinkronisasi cloud (Firestore).

---

## Storage Strategy

**Konten Manga:** Tidak ada database yang menyimpan konten manga. Semua data manga (detail, chapters, pages) di-fetch on-the-fly dari Source Eksternal dan di-cache di **Redis** (server-side).

**User Data — Lokal:** `IndexedDB` (dikelola oleh `zustand/middleware/persist`). Tersedia offline tanpa login.

**User Data — Cloud:** `Firebase Firestore` (sync dua arah Library & History antar perangkat saat user login).

**Chapter Offline Cache:** `Cache API` (Browser CacheStorage, key: `yomirra-chapter-cache-v1`) — dikelola oleh `download-store.ts`.

---

## Firestore Schema

> Semua document user disematkan dalam hierarki `users/{userId}/...`
> Firebase Auth UID digunakan sebagai `userId`.
> Security Rules di `firestore.rules` memastikan user hanya bisa akses data milik sendiri.

### Collection: `users/{userId}/library`

**Document ID:** `${sourceId}::${mangaId}` (double-colon separator)

**Fields (TypeScript type `LibraryItem`):**
```ts
{
  sourceId: string;       // e.g. "shinigami"
  mangaId: string;        // ID dari source adapter
  title: string;          // Judul manga
  coverUrl?: string;      // URL cover (melalui proxy, tidak di-sign ulang)
  author?: string;
  status?: string;        // Status manga ("ONGOING", "COMPLETED", dst.)
  format?: string;        // Format manga (opsional)
  sourceName?: string;    // Display name dari source
  addedAt: string;        // ISO 8601 timestamp
  updatedAt: string;      // ISO 8601 timestamp — dipakai untuk conflict resolution
  lastReadChapterId?: string;
  lastReadChapterTitle?: string;
  lastReadAt?: string;    // ISO 8601 timestamp
}
```

**Conflict Resolution:** Last-write-wins berbasis `updatedAt`. Jika local lebih baru → push ke cloud. Jika cloud lebih baru → pull ke local.

---

### Collection: `users/{userId}/history`

**Document ID:** `${sourceId}::${mangaId}::${chapterId}` (double-colon separator)

**Fields (TypeScript type `HistoryItem`):**
```ts
{
  sourceId: string;
  mangaId: string;
  chapterId: string;
  mangaTitle: string;
  chapterTitle?: string;
  coverUrl?: string;
  sourceName?: string;
  pageIndex?: number;       // Halaman terakhir dibaca
  totalPages?: number;
  progressPercent?: number; // 0-100 (otomatis 100 jika > 90%)
  seriesProgressPercent?: number;
  scrollPercent?: number;   // Untuk vertical reader (0-100)
  readAt: string;           // ISO 8601 timestamp — dipakai untuk conflict resolution
}
```

**Max items (local):** 1000 item — oldest entries dihapus saat melebihi batas.
**Conflict Resolution:** Last-write-wins berbasis `readAt`.

---

## IndexedDB (Zustand Persist)

> Data di-persist di IndexedDB via `zustand/middleware/persist`. Store name adalah localStorage key.

### Store: `yomirra-library`
**Type:** `{ state: { items: Record<string, LibraryItem> } }`
**Persist key:** `"yomirra-library"`

### Store: `yomirra-history`
**Type:** `{ state: { items: Record<string, HistoryItem> } }`
**Persist key:** `"yomirra-history"`

### Store: `manga-reader-settings`
**Type:** `{ state: { preferences: ReaderPreferences, isDesktopPanelOpen: boolean } }`
**Persist key:** `"manga-reader-settings"`
**Partialize:** Hanya `preferences` dan `isDesktopPanelOpen` yang di-persist (bukan UI transient state).
**Migration:** Mendukung migrasi dari format settings lama (`backgroundColor` → `background`, `padding` → `pageGap`).

```ts
// ReaderPreferences (src/shared/types/manga.ts)
{
  imageFit: 'width' | 'contained';
  pageGap: 'none' | 'small' | 'comfortable';
  background: 'black' | 'deepLagoon' | 'mist';
  toolbarBehavior: 'auto-hide' | 'always-visible';
  preloadIntensity: 'light' | 'balanced' | 'aggressive';
  showPageProgress: boolean;
  readingDirection: 'ltr' | 'rtl';
  readingMode: 'vertical' | 'paged';
  keepScreenAwake?: boolean;
}
```

### Store: `yomirra-settings`
**Type:** `{ state: { dataSaver: boolean, hideNsfw: boolean, lastSyncedAt: string | null } }`
**Persist key:** `"yomirra-settings"`

### Store: `yomirra-downloads`
**Type:** `{ state: { downloads: Record<string, DownloadChapter> } }`
**Persist key:** `"yomirra-downloads"`
**Partialize:** Hanya `downloads` map yang di-persist (bukan `queue` / `activeDownloads` yang bersifat transient).
**On Rehydrate:** Status `"downloading"` dan `"queued"` di-reset ke `"paused"` saat app reload.

```ts
// DownloadChapter key fields:
{
  id: string;             // getDownloadChapterId(sourceId, mangaId, chapterId)
  status: 'queued' | 'downloading' | 'paused' | 'downloaded' | 'failed';
  progress: number;       // 0-100
  pages: DownloadPage[];
}
```

### Store: `reader-progress-store`
**Tipe:** Tergantung implementasi `reader-progress-store.ts`.

---

## Chapter Offline Cache (Cache API)

**Cache Name:** `yomirra-chapter-cache-v1`
**Key format:** `${window.location.origin}/offline-images/${getDownloadChapterId(...)}/{pageIndex}`
**Content:** Binary gambar (image/jpeg, image/webp, dst.)
**Managed by:** `download-store.ts` (`_processQueue`, `removeDownload`)
**Browser API:** `caches.open()` / `cache.put()` / `cache.delete()`

---

## Redis Cache

**Connection:** `src/server/lib/cache/redis.ts` — `ioredis` client, URL dari `env.REDIS_URL`.
**Strategy:** SWR (Stale While Revalidate) — `src/server/lib/cache/strategies.ts`
**Storage format:**
```ts
{
  data: T,
  expiresAt: number  // Unix ms timestamp
}
```
**Physical TTL di Redis:** 7 hari (untuk stale fallback).
**Logical freshness:** Sesuai `CACHE_TTL` constants.

---

## Sync Logic (Local ⇄ Cloud)

**Flow:**

1. **Guest Mode:** Semua data (Library/History) disimpan di IndexedDB. Cloud sync tidak aktif.

2. **On Login:**
   - `useSync({ autoSync: true })` di-mount via Providers.
   - `runFullSync()` dijalankan: fetch semua data cloud, merge dengan lokal (last-write-wins per item).
   - Local items yang tidak ada di cloud di-push ke Firestore (data lokal tidak ditimpa oleh cloud kosong).
   - Real-time Firestore `onSnapshot` listener aktif untuk cross-device sync.

3. **On Online (setelah offline):**
   - `window.addEventListener("online", ...)` di `use-sync.ts` memicu `runFullSync()` di background.

4. **On Mutation (add/remove dari Library atau History):**
   - `pushLibraryItem()` / `deleteLibraryItem()` / `pushHistoryItem()` / `deleteHistoryItem()` di `sync-utils.ts` dipanggil secara background (fire-and-forget dengan error swallow).

5. **Batch Write limit:** Firestore `writeBatch` digunakan untuk sync. Tidak ada explicit chunking — jika > 500 items di-sync sekaligus, bisa melebihi Firestore batch limit. **(Known issue — perlu addressed)**

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // Deny all by default
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

> **Observed:** Hanya user yang auth (Firebase Auth UID match) yang bisa akses data sendiri. Anonymous/guest tidak punya akses ke Firestore.

---

*Last updated: 2026-06-17*
