# SCHEMA — Yomirra Types, Stores & API Contracts

---

## 1. Core Domain Types (`src/shared/sources/source-types.ts`)

### `SourceMetadata`
```typescript
interface SourceMetadata {
  id: string;
  name: string;
  description?: string;
  language?: string;
  baseUrl?: string;
  icon?: string;
  version?: string;
  isEnabled: boolean;
  isInstalled: boolean;
  capabilities: SourceCapabilities;
  status?: "online" | "slow" | "unavailable" | "unknown";
  healthStats?: {
    uptime: string;
    latency: string;
    lastChecked: string;
    message?: string;
  };
  isNsfw: boolean;
  manifestUrl?: string;
  healthCheckUrl?: string;
}
```

### `SourceCapabilities`
```typescript
interface SourceCapabilities {
  popular: boolean;
  latest: boolean;
  search: boolean;
  detail: boolean;
  chapters: boolean;
  pages: boolean;
}
```

### `MangaItem` (list/card data)
```typescript
interface MangaItem {
  id: string;
  title: string;
  coverUrl: string;
  status?: string;
  format?: string;
  latestChapter?: string;
  latestChapterTime?: string;
  rank?: number;
  score?: number;
  description?: string;
}
```

### `MangaDetail` (extends MangaItem)
```typescript
interface MangaDetail extends MangaItem {
  author?: string;
  artist?: string;
  description: string;
  genres: string[];
  status: "ONGOING" | "COMPLETED" | "CANCELLED" | "UNKNOWN";
}
```

### `Chapter`
```typescript
interface Chapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  date: string;
  scanlator?: string;
}
```

### `ChapterPages`
```typescript
interface ChapterPages {
  chapterId: string;
  pages: PageItem[];
}
```

### `PageItem`
```typescript
interface PageItem {
  index: number;
  url: string;
  referer?: string; // Required by some sources to bypass hotlink protection
}
```

### `MangaPageResult`
```typescript
interface MangaPageResult {
  mangas: MangaItem[];
  hasNextPage: boolean;
}
```

### `FilterList`
```typescript
interface FilterList {
  genres: SourceFilter[];
  formats: SourceFilter[];
  statuses: SourceFilter[];
  sorts: SourceFilter[];
}

interface SourceFilter {
  id: string;
  name: string;
}
```

---

## 2. Reader Types (`src/shared/types/manga.ts`)

### `ReaderPreferences`
```typescript
interface ReaderPreferences {
  imageFit: 'width' | 'contained';
  pageGap: 'none' | 'small' | 'comfortable';
  background: 'black' | 'deepLagoon' | 'mist';
  toolbarBehavior: 'auto-hide' | 'always-visible';
  preloadIntensity: 'light' | 'balanced' | 'aggressive';
  showPageProgress: boolean;
  readingDirection: 'ltr' | 'rtl';    // NOTE: UI is locked to 'vertical' mode
  readingMode: 'vertical';             // LOCKED — only vertical mode supported
  keepScreenAwake?: boolean;
}
```

---

## 3. Zustand Store Contracts

### `useLibraryStore` (`src/shared/store/library-store.ts`)

**State shape:**
```typescript
interface LibraryItem {
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl?: string;
  author?: string;
  status?: string;
  format?: string;
  sourceName?: string;
  addedAt: string;        // ISO string
  updatedAt: string;      // ISO string
  lastReadChapterId?: string;
  lastReadChapterTitle?: string;
  lastReadAt?: string;    // ISO string
  userRating?: number;    // 1–10, optional
  isNsfw?: boolean;
}

interface LibraryState {
  items: Record<string, LibraryItem>;  // key: `${sourceId}::${mangaId}`
}
```

**Key actions:**
```typescript
addToLibrary(item: LibraryItem): void         // Also triggers Firebase sync
removeFromLibrary(sourceId, mangaId): void
toggleLibrary(item: LibraryItem): void
isInLibrary(sourceId, mangaId): boolean
getLibraryItem(sourceId, mangaId): LibraryItem | undefined
updateLibraryItem(sourceId, mangaId, patch): void
syncWithCloud(cloudItems: LibraryItem[]): void
```

**Cap:** Max 1000 items (LRU eviction by `updatedAt`)

---

### `useHistoryStore` (`src/shared/store/history-store.ts`)

**Key:** Reading history per-chapter with page-level progress.

```typescript
interface HistoryEntry {
  sourceId: string;
  mangaId: string;
  mangaTitle: string;
  coverUrl?: string;
  chapterId: string;
  chapterTitle?: string;
  chapterNumber?: number;
  pageIndex: number;       // Last read page index (0-based)
  totalPages?: number;
  readAt: string;          // ISO string
}
```

---

### `useReaderStore` (`src/shared/store/reader-store.ts`)

**Persisted key:** `"manga-reader-settings"` (legacy migration included)

```typescript
interface ReaderState {
  preferences: ReaderPreferences;
  isOverlayVisible: boolean;
  isDesktopPanelOpen: boolean;
}
```

**Actions:** `updatePreferences`, `toggleOverlay`, `setOverlayVisible`, `toggleDesktopPanel`

---

### `useDownloadStore` (`src/shared/store/download-store.ts`)

```typescript
type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'downloaded' | 'failed';
type DownloadPageStatus = 'pending' | 'downloading' | 'cached' | 'failed';

interface DownloadChapter {
  id: string;            // from getDownloadChapterId()
  sourceId: string;
  mangaId: string;
  mangaTitle: string;
  chapterId: string;
  chapterTitle: string;
  coverUrl?: string;
  status: DownloadStatus;
  progress: number;      // 0–100
  totalPages: number;
  downloadedPages: number;
  pages: DownloadPage[];
  createdAt: number;     // timestamp
  updatedAt: number;     // timestamp
  error?: string;
}

interface DownloadState {
  downloads: Record<string, DownloadChapter>;
  queue: string[];
  activeDownloads: string[];
  maxConcurrency: number;
}
```

Cache name constant: `CACHE_NAME = "yomirra-chapter-cache-v1"`

---

### `useSourcePreferencesStore` (`src/shared/store/source-preferences-store.ts`)

**Persisted key:** `"yomirra-source-preferences"`

Manages which sources are disabled. Syncs to Firebase AND to cookie (`yomirra-disabled-sources`) for server-side filtering.

```typescript
interface SourcePreferencesState {
  disabledSources: string[];

  toggleSource: (sourceId: string) => void;
  isSourceDisabled: (sourceId: string) => boolean;
  syncWithCloud: (cloudDisabledSources: string[]) => void;
}
```

**Cookie sync:** On every toggle and rehydration, writes `yomirra-disabled-sources` cookie (JSON-encoded `string[]`, 1-year TTL). This allows API routes to filter sources server-side without store access.

**Firebase sync:** Calls `pushSourcePreferences()` on toggle. Cloud data stored at `users/{uid}/preferences/sources`.

---

### `useSettingsStore` (`src/shared/store/settings-store.ts`)
### `useSearchFilterStore` (`src/shared/store/search-filter-store.ts`)
### `useRouteStateStore` (`src/shared/store/route-state-store.ts`)

> Refer to source files directly for detailed shapes.

---

## 4. API Response Contract

All API routes return a consistent shape:

**Success:**
```typescript
{ data: T }
```

**Error:**
```typescript
{
  error: {
    code: string;    // e.g. "SOURCE_NOT_FOUND"
    message: string; // human-readable
  }
}
```

**ApiClient** (`src/shared/api-client.ts`) handles unwrapping `data` automatically and throws on error.

---

## 5. Source Adapter Interface (`src/shared/sources/source-types.ts`)

```typescript
interface MangaSource extends SourceMetadata {
  getPopular(page: number): Promise<MangaPageResult>;
  getLatest(page: number): Promise<MangaPageResult>;
  search(
    query: string,
    page: number,
    filters?: Record<string, string | string[]>
  ): Promise<MangaPageResult>;
  getDetail(mangaId: string): Promise<MangaDetail>;
  getChapters(mangaId: string): Promise<Chapter[]>;
  getPages(chapterId: string): Promise<ChapterPages>;
  getFilters(): FilterList;
}
```

---

## 6. Dynamic Source Manifest (Mihon-compatible)

Dynamic sources use a JSON manifest format compatible with Mihon extensions:

```typescript
// Validated with: MihonSourceManifestSchema (Zod)
// Location: src/shared/sources/dynamic-source-registry.ts
{
  id: string;
  name: string;
  baseUrl: string;
  // ... Mihon manifest fields
}
```

---

## 7. Environment Variables

All env vars are validated at runtime via Zod in `src/env.ts`.

**Server-side (never exposed to client):**
```
REDIS_URL              Upstash Redis connection string
IMAGE_PROXY_SECRET     HMAC signing secret (min 32 chars)
SECRET_EXTENSION_SOURCES  JSON array of private source configs
```

**Client-side (`NEXT_PUBLIC_*`):**
```
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

**Adding new env vars:** Add to `src/env.ts` schema + `.env.example`. Never access `process.env.*` directly outside of `src/env.ts`.

---

## 8. Library Key Format

Library items are keyed as: `${sourceId}::${mangaId}`

```typescript
const getLibraryId = (sourceId: string, mangaId: string) =>
  `${sourceId}::${mangaId}`;
```

This same convention is used in Firestore document IDs.
