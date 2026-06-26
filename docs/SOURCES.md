# SOURCES — Yomirra Source Adapter System

---

## 1. Overview

Yomirra uses a plugin-based source adapter system inspired by Mihon/Tachiyomi. Each source is a TypeScript class that implements the `MangaSource` interface. Sources run **server-side only** inside API routes.

**Three types of sources:**
1. **Built-in adapters** — compiled TypeScript in `src/server/lib/sources/adapters/`
2. **Private/secret sources** — injected via `SECRET_EXTENSION_SOURCES` env var
3. **Dynamic sources** — user-added via Mihon manifest URL (stored in cookie)

---

## 2. MangaSource Interface

Every source adapter MUST implement:

```typescript
// src/shared/sources/source-types.ts
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

**Capabilities flag:** Set `capabilities` in `SourceMetadata` to indicate which methods are implemented:
```typescript
capabilities: {
  popular: true,
  latest: true,
  search: true,
  detail: true,
  chapters: true,
  pages: true,
}
```

---

## 3. Built-in Adapters

Location: `src/server/lib/sources/adapters/`

| Adapter | Source ID | Language | NSFW | Notes |
|---------|-----------|----------|------|-------|
| `shinigami` | `shinigami` | ID | No | Primary Indonesian source. Has custom normalizer. |
| `komikindo` | `komikindo` | ID | No | Indonesian manga |
| `komiku` | `komiku` | ID | No | Indonesian manga |
| `komikuasia` | `komikuasia` | ID | No | Indonesian manga |
| `westmanga` | `westmanga` | ID | No | Indonesian manga |
| `manhwadesu` | `manhwadesu` | ID | No | Indonesian manhwa |
| `project-alpha` | `project-alpha` | — | — | Private source |
| `project-beta` | `project-beta` | — | — | Private source |
| `project-gamma` | `project-gamma` | — | — | Private source |

---

## 4. Private Sources (Secret Extension Sources)

Private sources are injected via the `SECRET_EXTENSION_SOURCES` environment variable (server-side only, never exposed to client).

**Format:** JSON array of source config objects
```json
[
  {
    "id": "project-omega",
    "name": "Project Omega",
    "description": "Extension Source",
    "baseUrl": "https://example.com",
    "icon": "https://example.com/favicon.ico",
    "isNsfw": false,
    "isEnabled": true,
    "isInstalled": true,
    "capabilities": {
      "search": true,
      "popular": true,
      "latest": true
    }
  }
]
```

**How they work:**
- Parsed in `src/app/api/sources/private/route.ts`
- Registered at runtime alongside built-in adapters
- Never exposed in the public `/api/sources` list (private endpoint only)
- Client accesses via `src/components/providers/private-sources-provider.tsx`

---

## 5. Dynamic Sources (Mihon Manifest)

Users can add custom sources by providing a Mihon-compatible manifest URL.

**Storage:** Cookie `yomirra_dynamic_sources_urls` (JSON: `{ [sourceId]: manifestUrl }`)

**Flow:**
1. User provides manifest URL in Source settings
2. Stored in `dynamicSourceRegistry` (`src/shared/sources/dynamic-source-registry.ts`)
3. Client-side registry serializes to cookie
4. API routes read cookie via `getManifestUrlFromCookie()` (`src/server/lib/sources/server-manifest.ts`)
5. `SourceManager.getSource(id, manifestUrl)` fetches + validates manifest
6. `DynamicSourceAdapter` (`src/server/lib/sources/adapters/dynamic/`) handles the request

**Manifest validation:** Uses `MihonSourceManifestSchema` (Zod) in `dynamic-source-registry.ts`

---

## 6. Source Manager

```typescript
// src/server/lib/sources/source-manager.ts
class SourceManager {
  getSource(id: string, manifestUrl?: string | null): Promise<MangaSource>
  getAllSources(): MangaSource[]
  getEnabledSources(enabledIds: string[]): MangaSource[]
}

export const sourceManager = new SourceManager();
```

**Usage in API routes:**
```typescript
import { sourceManager } from "@/server/lib/sources/source-manager";
import { getManifestUrlFromCookie } from "@/server/lib/sources/server-manifest";

const manifestUrl = await getManifestUrlFromCookie(sourceId);
const source = await sourceManager.getSource(sourceId, manifestUrl);
const result = await source.getPopular(page);
```

---

## 7. HTTP Client for Adapters

`src/server/lib/sources/adapters/base/http-client.ts`

All adapters MUST use this base HTTP client for scraping. It handles:
- Rate limiting
- Retry logic
- Cloudflare bypass headers
- Referrer injection

---

## 8. Redis Caching

API responses are cached via `src/server/lib/cache/redis-cache.ts`.

```typescript
// Pattern: cache key = `source:${sourceId}:${method}:${params}`
// TTL: varies by content type (popular = longer, chapters = shorter)
```

Cache is **Upstash Redis** (`REDIS_URL` env var). Uses `ioredis` client.

---

## 9. Source Health Checks

`GET /api/sources/health` — returns health status for all sources.

Health stats returned:
```typescript
{
  uptime: string;
  latency: string;
  lastChecked: string;
  message?: string;
}
```

Status values: `"online" | "slow" | "unavailable" | "unknown"`

---

## 10. Adding a New Built-in Source

1. Create directory: `src/server/lib/sources/adapters/[source-name]/`
2. Create `index.ts` implementing `MangaSource`
3. Use `HttpClient` from base for all HTTP calls
4. Register in `src/server/lib/sources/adapters/index.ts`
5. Add to adapter map in source-manager's `sourceMap`
6. Add source metadata to `SourceMetadata` config
7. Write tests in `__tests__/` subdirectory

---

## 11. NSFW Handling

Sources with `isNsfw: true` (e.g., `project-alpha`):
- Are hidden by default in source browser
- Require explicit NSFW filter enable in settings
- `useSettingsStore` controls NSFW visibility
- Library items inherit `isNsfw` from source when added
- Search automatically appends NSFW exclusion tags when NSFW filter is active

```typescript
// In ApiClient.search():
if (isNsfwFiltered) {
  const nsfwTags = ["-adult", "-mature", "-smut", "-nsfw", "-ecchi"];
  // appended to filter params
}
```
