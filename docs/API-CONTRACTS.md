# API Contracts

> Extend file — referenced from `AGENTS.md`.
> Baca ini sebelum task apapun yang involve endpoint, fetch call, route handler, atau service function.

---

## Base

**Base URL (dev):** `http://localhost:3000/api`
**Base URL (prod):** Sesuai `NEXT_PUBLIC_APP_URL`
**Auth:** Server-side rate-limit checking via Redis. Authenticated features (Library/History sync) ditangani Firebase Client SDK — bukan melalui API routes ini.
**Content-Type:** `application/json`
**API versioning:** Tidak ada versioning eksplisit. Semua route berada di `/api/` dan merupakan proxy internal ke External Source API.

---

## Response Envelope

> Semua response Next.js API Routes mengikuti shape ini — `ApiClient` di `src/shared/api-client.ts` mengekspektasi format ini.

```ts
// Success
{
  data: T
}

// Error
{
  error: {
    message: string,    // human-readable, untuk user
    code?: string,      // opsional: machine-readable error code
    details?: unknown   // hanya di development: validation errors / stack trace
  }
}
```

---

## Standard Error Codes (HTTP Status)

| HTTP Status | Keterangan                                              |
| :---------: | ------------------------------------------------------- |
| 400         | `Invalid parameters` atau validation error (Zod)        |
| 403         | `Forbidden: Invalid signature` (Image Proxy HMAC fail)  |
| 404         | Resource tidak ditemukan (Manga/Chapter not found)      |
| 429         | `Too Many Requests` (Redis Rate Limit)                  |
| 500         | `Internal Server Error`                                 |

---

## Rate Limiting

**Implementation:** `src/server/lib/security/rate-limit.ts` — menggunakan Redis `INCR` + `EXPIRE`.
**Dev limit:** 1000 req / 60 detik per IP
**Prod limit:** 300 req / 60 detik per IP
**Fallback:** Jika Redis down, rate limit dibypass dengan log warning (fail-open strategy).

**Response headers saat rate limit aktif:**
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 120
X-RateLimit-Reset: 45   (seconds until reset)
```

---

## Endpoints

> Dokumentasi endpoint internal yang membungkus pemanggilan ke Source Eksternal (e.g., Shinigami).
> Semua data konten manga di-fetch dari source eksternal — tidak ada database SQL yang menyimpan manga.
> Semua response di-cache di Redis menggunakan SWR pattern (`src/server/lib/cache/strategies.ts`).

---

### Sources List

#### `GET /api/sources`

**Description:** Mendapatkan daftar sumber manga yang tersedia dan terdaftar di `source-registry.ts`.
**Auth required:** No
**Rate Limit:** ✅
**Cache:** No (data statis dari registry)

**Response `200`:**
```json
{
  "data": [
    {
      "id": "shinigami",
      "name": "Shinigami",
      "description": "Indonesian translation source for manga and manhwa.",
      "language": "id",
      "baseUrl": "https://shngm.id",
      "icon": "https://shngm.id/favicon.ico",
      "version": "1.0.0",
      "isEnabled": true,
      "isInstalled": true,
      "isNsfw": false,
      "status": "online",
      "capabilities": {
        "popular": true, "latest": true, "search": true,
        "detail": true, "chapters": true, "pages": true
      }
    }
  ]
}
```

---

### Source Filters

#### `GET /api/sources/:sourceId/filters`

**Description:** Mendapatkan daftar filter yang didukung source (genre, format, status, sort).
**Auth required:** No
**Rate Limit:** ✅
**Cache:** Opsional per source adapter.

**Response `200`:**
```json
{
  "data": {
    "genres": [{ "id": "action", "name": "Action" }],
    "formats": [{ "id": "manga", "name": "Manga" }],
    "statuses": [{ "id": "ongoing", "name": "Ongoing" }],
    "sorts": [{ "id": "popular", "name": "Popular" }]
  }
}
```

---

### Manga Discovery & Search

#### `GET /api/sources/:sourceId/popular`

**Description:** Mendapatkan daftar manga populer.
**Query params:** `page` (number, default: 1)
**Cache:** Redis SWR (TTL: 30 menit, stored: 7 hari)

**Response `200`:**
```json
{
  "data": {
    "mangas": [{ "id": "...", "title": "...", "coverUrl": "...", "status": "...", "latestChapter": "..." }],
    "hasNextPage": true
  }
}
```

#### `GET /api/sources/:sourceId/latest`

**Description:** Mendapatkan update chapter manga terbaru.
**Query params:** `page` (number, default: 1)
**Cache:** Redis SWR (TTL: 30 menit)

#### `GET /api/sources/:sourceId/search`

**Description:** Mencari manga berdasarkan text query atau filter.
**Query params:**
- `q` (string, required, max 100 char, URL-encoded)
- `page` (number, default: 1)
- `genre[]` (string array, repeatable — prefix `-` untuk exclude, e.g. `genre[]=-adult`)
- Filter dinamis tambahan (format, status, sort) sesuai kemampuan source

**NSFW Filtering:** Dilakukan di `ApiClient.search()` di client. Jika `isNsfwFiltered: true`, tag `-adult`, `-mature`, `-smut`, `-nsfw`, `-ecchi` ditambahkan ke `genre[]` sebelum dikirim ke endpoint ini.
**Cache:** Redis SWR (TTL: 1 jam)

#### `GET /api/sources/search` *(Global Multi-Source)*

**Description:** Mencari manga secara paralel dari beberapa source sekaligus.
**Query params:**
- `q` (string, required)
- `sources` (string, comma-separated source IDs: `shinigami,...`)
- `genre[]` (optional, untuk NSFW filter)

**Response `200`:**
```json
{
  "data": {
    "results": [
      {
        "sourceId": "shinigami",
        "results": [{ "id": "...", "title": "...", "coverUrl": "..." }],
        "hasNextPage": false,
        "error": null
      }
    ]
  }
}
```

---

### Manga Detail & Chapters

#### `GET /api/sources/:sourceId/manga/:mangaId`

**Description:** Detail spesifik manga (metadata, genres, author, status).
**Cache:** Redis SWR (TTL: 24 jam)

**Response `200`:**
```json
{
  "data": {
    "id": "...", "title": "...", "coverUrl": "...",
    "author": "...", "artist": "...",
    "description": "...",
    "genres": ["Action", "Fantasy"],
    "status": "ONGOING",
    "latestChapter": "Chapter 120"
  }
}
```

**Status values:** `"ONGOING"` | `"COMPLETED"` | `"CANCELLED"` | `"UNKNOWN"`

#### `GET /api/sources/:sourceId/manga/:mangaId/chapters`

**Description:** Daftar chapter dari suatu manga (diurutkan oleh source).
**Cache:** Redis SWR (TTL: 30 menit)

**Response `200`:**
```json
{
  "data": [
    {
      "id": "...", "mangaId": "...", "number": 1,
      "title": "Chapter 1", "date": "2024-01-01", "scanlator": "..."
    }
  ]
}
```

#### `GET /api/sources/:sourceId/manga/:mangaId/chapters/:chapterId/pages`

**Description:** Daftar halaman dari suatu chapter. URL gambar sudah di-sign dengan HMAC untuk dipakai via Image Proxy.
**Cache:** Redis SWR (TTL: 7 hari)

**Response `200`:**
```json
{
  "data": {
    "chapterId": "...",
    "pages": [
      {
        "index": 0,
        "url": "/api/proxy/image?url=https%3A%2F%2F...&sig=abc123&ref=...",
        "referer": "https://shngm.id/..."
      }
    ]
  }
}
```

> ⚠️ `url` di response sudah berupa URL proxy yang di-sign. Client tidak perlu sign ulang.

---

### Image Proxy

#### `GET /api/proxy/image`

**Description:** Endpoint proxy gambar untuk membypass hotlink protection external source. Signature diverifikasi menggunakan HMAC-SHA256 dengan `IMAGE_PROXY_SECRET`.
**Rate Limit:** ❌ (tidak ada rate limit — gambar dikontrol oleh signature validity)

**Query params:**
- `url` (required) — Target URL gambar yang di-encode
- `sig` (required) — HMAC-SHA256 signature dari `url` + optional `ref`
- `ref` (optional) — Referer header yang akan diteruskan ke source

**Response `200`:**
- `Content-Type`: sesuai gambar (image/jpeg, image/webp, dst.)
- `Cache-Control`: `public, max-age=31536000, immutable`
- Body: stream langsung dari source (tidak di-buffer)

**Response `403`:** Signature tidak valid.

**Signing:** `src/server/lib/image.ts` — `signImageUrl(url, referer?)` — untuk dipakai di server-side (API routes / source adapters).

---

## ApiClient (Client-Side)

**File:** `src/shared/api-client.ts`
**Instance:** Singleton `apiClient` (di-export)
**Usage:**
```ts
import { apiClient } from "@/shared/api-client";

const sources = await apiClient.getSources();
const detail = await apiClient.getDetail("shinigami", mangaId);
```

**Error handling:** Jika `res.ok === false`, `ApiClient.fetcher()` melempar `Error` dengan pesan dari `data.error.message`. Selalu wrap dalam `try-catch` di consumer.

---

## Cache Strategy Summary

| Endpoint        | SWR TTL   | Redis Storage |
| --------------- | --------- | ------------- |
| popular/latest  | 30 min    | 7 hari        |
| search          | 60 min    | 7 hari        |
| manga detail    | 24 jam    | 7 hari        |
| chapters list   | 30 min    | 7 hari        |
| chapter pages   | 7 hari    | 7 hari        |

**Stale fallback:** Jika fetcher gagal, data stale dari Redis tetap dikembalikan (`swrCache` pattern di `strategies.ts`).

---

*Last updated: 2026-06-17*
