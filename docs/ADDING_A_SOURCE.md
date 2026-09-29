# Adding a Source

Yomirra punya dua jalur source:

1. built-in TypeScript adapter;
2. dynamic JSON manifest untuk API yang sudah mengembalikan normalized Yomirra shapes.

Gunakan built-in adapter jika perlu HTML parsing, custom headers, referer, normalization, filter mapping, atau response shape khusus.

## Sebelum mulai

Pastikan:

- integrasi source diperbolehkan;
- tidak membutuhkan credential/cookie private yang harus dikomit;
- request mengikuti access policy source;
- rate limit dan terms dipahami;
- manga/chapter memiliki stable IDs.

## Built-in adapter

Lokasi:

```text
src/server/lib/sources/adapters/<source>/
```

Implement `MangaSource` dari `src/shared/sources/source-types.ts`:

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

Optional capability seperti `getRelated` atau `resolveDomain` hanya dipakai jika source memang mendukungnya.

## Normalize di boundary

Remote type tetap lokal di adapter. Generic UI hanya menerima shared Yomirra type.

Jangan memakai array index sebagai manga/chapter/page ID.

Sanitasi error upstream sebelum dikirim ke client.

## Pagination

Kembalikan:

```ts
{
  mangas: MangaItem[];
  hasNextPage: boolean;
}
```

Gunakan pagination metadata upstream bila tersedia.

## Search filters

Canonical keys:

```text
genre[]
format[]
status
sort
```

`getFilters()` hanya mengiklankan value yang benar-benar didukung source.

`search()` memetakan canonical value ke parameter upstream. Untuk explicit hard filter, jangan mengabaikan filter lalu mengembalikan hasil longgar.

Jika upstream tidak mendukung filter tertentu tetapi metadata result cukup untuk local enforcement, lakukan filtering deterministik setelah response. Jika tidak bisa menjamin filter, capability/value tersebut jangan diiklankan.

## Chapters

Return order harus stable. Reader/update logic tidak boleh bergantung pada kebetulan urutan response upstream.

Locked/early-access chapter dapat memakai `isLocked`.

## Pages dan referer

```ts
{
  chapterId,
  pages: [
    {
      index: 0,
      url: "https://cdn.example/page.jpg",
      referer: "https://example.com"
    }
  ]
}
```

`referer` hanya diisi jika dibutuhkan. Jangan masukkan cookie/token/authorization header ke `PageItem`.

## Register adapter

Tambahkan adapter ke:

```text
src/server/lib/sources/adapters/index.ts
```

Metadata public juga harus konsisten dengan registry source.

Source ID harus unique dan stable.

## Tests

Minimum coverage:

- metadata/capabilities;
- popular/latest normalization;
- pagination;
- text search;
- canonical filter mapping;
- detail;
- chapters;
- pages;
- empty/malformed response;
- important upstream failure.

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

Lalu smoke-test discovery → search → detail → chapter → reader.

## Dynamic manifest

Dynamic manifest cocok untuk trusted JSON API yang sudah normalized. Ia bukan tempat menjalankan arbitrary parser code.

Manifest mendefinisikan source metadata dan endpoint seperti:

```json
{
  "id": "example-api",
  "name": "Example API",
  "baseUrl": "https://api.example.com",
  "lang": "en",
  "version": "1.0.0",
  "capabilities": ["popular", "latest", "search", "detail", "chapters", "pages"],
  "endpoints": {
    "popular": "/popular?page={page}",
    "latest": "/latest?page={page}",
    "search": "/search?q={q}&page={page}",
    "detail": "/manga/{id}",
    "chapters": "/manga/{id}/chapters",
    "pages": "/chapter/{id}/pages"
  },
  "nsfw": false
}
```

Dynamic source harus berasal dari publisher/API yang dipercaya. Untuk source yang perlu transform/parsing custom, gunakan built-in adapter.

## PR checklist

- [ ] integrasi source diperbolehkan;
- [ ] tidak ada secret/private cookie;
- [ ] stable source/manga/chapter IDs;
- [ ] normalized output;
- [ ] pagination benar;
- [ ] filter capability jujur;
- [ ] failure terisolasi;
- [ ] focused tests + full verification lulus;
- [ ] browser flow diverifikasi;
- [ ] docs/changelog diperbarui bila public behavior berubah.
