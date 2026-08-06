# Adding a Source

Yomirra supports two source-integration paths:

1. A built-in TypeScript adapter.
2. A dynamic JSON manifest.

Use a built-in adapter when the source requires HTML parsing, custom headers, normalization, filter mapping, referer handling, or non-standard response shapes. Use a dynamic manifest only when the remote API already returns Yomirra's normalized JSON shapes.

## Before You Begin

Confirm that:

- You are allowed to access and integrate the source.
- The source does not require committing credentials or private cookies.
- Requests can be made without bypassing access controls.
- You understand the source's rate limits and terms.
- The source can return stable identifiers for manga and chapters.

Do not submit secrets, authentication tokens, session cookies, or copied proprietary client code.
Do not promise or assume source uptime. Sources can break or become unavailable at any time independently of Yomirra.

# Option A: Built-in Adapter

## 1. Create the Adapter Directory

```text
src/server/lib/sources/adapters/example/
├── index.ts
├── normalizer.ts
├── types.ts
└── __tests__/
    └── example.test.ts
```

The exact supporting files can vary, but keep remote response types and normalization separate when the source is non-trivial.

## 2. Implement `MangaSource`

The contract is defined in:

```text
src/shared/sources/source-types.ts
```

A source must provide metadata and these methods:

```ts
interface MangaSource {
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
  getFilters(): FilterList | Promise<FilterList>;
}
```

Minimal skeleton:

```ts
import type {
  Chapter,
  ChapterPages,
  FilterList,
  MangaDetail,
  MangaPageResult,
  MangaSource,
} from "@/shared/sources/source-types";
import { HttpClient } from "../base/http-client";

export class ExampleSource implements MangaSource {
  id = "example";
  name = "Example";
  description = "Example manga source.";
  language = "en";
  baseUrl = "https://example.com";
  healthCheckUrl = "https://api.example.com/health";
  version = "1.0.0";
  icon = "https://example.com/favicon.ico";

  isEnabled = true;
  isInstalled = true;
  isNsfw = false;
  status = "online" as const;

  capabilities = {
    popular: true,
    latest: true,
    search: true,
    detail: true,
    chapters: true,
    pages: true,
  };

  private client = new HttpClient("https://api.example.com");

  async getPopular(page: number): Promise<MangaPageResult> {
    throw new Error("Not implemented");
  }

  async getLatest(page: number): Promise<MangaPageResult> {
    throw new Error("Not implemented");
  }

  async search(
    query: string,
    page: number,
    filters?: Record<string, string | string[]>
  ): Promise<MangaPageResult> {
    throw new Error("Not implemented");
  }

  async getDetail(mangaId: string): Promise<MangaDetail> {
    throw new Error("Not implemented");
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    throw new Error("Not implemented");
  }

  async getPages(chapterId: string): Promise<ChapterPages> {
    throw new Error("Not implemented");
  }

  getFilters(): FilterList {
    return {
      genres: [],
      formats: [],
      statuses: [],
      sorts: [],
    };
  }
}
```

Set a capability to `false` when the source cannot implement it reliably. Do not advertise a method as supported and then return fabricated data.

## 3. Define Remote Types

Keep source API response types local to the adapter:

```ts
export interface ExampleListResponse {
  items: Array<{
    slug: string;
    title: string;
    cover: string;
  }>;
  pagination: {
    page: number;
    totalPages: number;
  };
}
```

Remote types should not leak into shared components.

## 4. Normalize Responses

Return Yomirra's shared types:

```ts
import type { MangaItem } from "@/shared/sources/source-types";
import type { ExampleListResponse } from "./types";

export function normalizeMangaItem(
  item: ExampleListResponse["items"][number]
): MangaItem {
  return {
    id: item.slug,
    title: item.title,
    coverUrl: item.cover,
  };
}
```

Stable IDs are required. Do not use array indexes as manga, chapter, or page identifiers.
Error messages from upstream APIs should be sanitized before being thrown or returned; do not expose raw HTML or internal paths to the user.

## 5. Implement Pagination Correctly

Every list response returns:

```ts
{
  mangas: MangaItem[];
  hasNextPage: boolean;
}
```

Compute `hasNextPage` from actual upstream metadata when available.

```ts
return {
  mangas: response.items.map(normalizeMangaItem),
  hasNextPage: response.pagination.page < response.pagination.totalPages,
};
```

Do not assume that a full page always means another page exists unless the upstream contract provides no better signal.

## 6. Map Search Filters

Yomirra uses canonical filter categories:

```text
genre[]
format[]
status
sort
```

`getFilters()` exposes the values supported by the source. The adapter's `search()` method maps those canonical values into the source's remote parameter names.

Example:

```ts
if (filters?.["genre[]"]) {
  const genres = Array.isArray(filters["genre[]"])
    ? filters["genre[]"]
    : [filters["genre[]"]];

  params.genres = genres.join(",");
}
```

Rules:

- Only advertise filter values the source supports.
- Ignore unsupported filters rather than breaking the request.
- Do not silently reinterpret unrelated canonical values.
- Keep mapping logic inside the adapter.
- Dynamic or scraped filter data should be cached when appropriate.

## 7. Handle Chapter Ordering

When returning chapters, do not assume they are naturally ordered by the source API. Yomirra's `UpdateChecker` and Reader both rely on reliable chapter sorting. Ensure your adapter returns chapters in a stable order (e.g., descending by number or date).

## 8. Handle Chapter Pages and Referers

Return:

```ts
{
  chapterId,
  pages: [
    {
      index: 0,
      url: "https://cdn.example.com/page-001.jpg",
      referer: "https://example.com",
    },
  ],
}
```

`referer` is optional and should only be included when the source requires it. Never include cookies, tokens, or authorization headers in `PageItem`.

## 9. Register the Source

Edit:

```text
src/server/lib/sources/adapters/index.ts
```

```ts
import { ExampleSource } from "./example";

export const sources: MangaSource[] = [
  // Existing sources...
  new ExampleSource(),
];
```

Source IDs must be unique and stable.

## 10. Test the Adapter

At minimum, cover:

- Metadata and capabilities.
- List normalization.
- `hasNextPage` behavior.
- Search query mapping.
- Supported and unsupported filters.
- Detail normalization.
- Chapter ordering and IDs.
- Page URLs and optional referer.
- Empty responses.
- Upstream error behavior.

Run:

```bash
pnpm typecheck
pnpm test --run path/to/example.test.ts
pnpm build
git diff --check
```

Browser-test the source through discovery, search, detail, chapter list, and reader flows before claiming complete integration.

## 11. Known Limitations

- **AbortSignal**: Upstream request cancellation is not yet fully propagated to adapters. Do not assume `AbortSignal` will immediately terminate a heavy fetch.
- **Source Health Diagnostics**: A source's health status should be exposed via the `healthCheckUrl` if available to isolate failures effectively without affecting the rest of the application.
- **Source Failure Isolation**: A failure in one source during a global search or library update scan must not break or halt processing for other sources.

# Option B: Dynamic Manifest

A dynamic source is appropriate for a trusted API that already returns Yomirra's normalized types.

## Manifest Example

```json
{
  "id": "example-api",
  "name": "Example API",
  "baseUrl": "https://api.example.com",
  "lang": "en",
  "version": "1.0.0",
  "capabilities": [
    "popular",
    "latest",
    "search",
    "detail",
    "chapters",
    "pages"
  ],
  "endpoints": {
    "popular": "/popular?page={page}",
    "latest": "/latest?page={page}",
    "search": "/search?q={q}&page={page}",
    "detail": "/manga/{id}",
    "chapters": "/manga/{id}/chapters",
    "pages": "/chapter/{id}/pages"
  },
  "nsfw": false,
  "icon": "https://example.com/icon.png"
}
```

Host the manifest at a public HTTPS URL, then install it through Yomirra's source-management interface.

## Required Response Shapes

### Popular, Latest, and Search

```json
{
  "mangas": [
    {
      "id": "series-id",
      "title": "Series Title",
      "coverUrl": "https://example.com/cover.jpg"
    }
  ],
  "hasNextPage": false
}
```

### Detail

```json
{
  "id": "series-id",
  "title": "Series Title",
  "coverUrl": "https://example.com/cover.jpg",
  "description": "Description",
  "genres": ["Action"],
  "status": "ONGOING"
}
```

Allowed normalized status values:

```text
ONGOING
COMPLETED
CANCELLED
UNKNOWN
```

### Chapters

```json
[
  {
    "id": "chapter-id",
    "mangaId": "series-id",
    "number": 1,
    "title": "Chapter 1",
    "date": "2026-08-06"
  }
]
```

### Pages

```json
{
  "chapterId": "chapter-id",
  "pages": [
    {
      "index": 0,
      "url": "https://example.com/page-1.jpg"
    }
  ]
}
```

## Dynamic Manifest Limitations

The current dynamic adapter:

- Performs placeholder replacement for `{page}`, `{q}`, and `{id}`.
- Expects normalized JSON responses.
- Does not run arbitrary transformation code.
- Returns empty filter capability lists.
- Appends search filters as query parameters when supplied.
- Must only be used with trusted manifest URLs.

A source requiring custom parsing or normalization should use a built-in adapter.

# Pull Request Checklist

- [ ] Source use is permitted.
- [ ] No secrets or private cookies are committed.
- [ ] Source ID is unique and stable.
- [ ] All returned data is normalized.
- [ ] Pagination is correct.
- [ ] Filters are accurately advertised and mapped.
- [ ] One source failure does not break unrelated sources.
- [ ] Typecheck and focused tests pass.
- [ ] Production build passes.
- [ ] Browser flows were verified.
- [ ] Public documentation and changelog were updated.
