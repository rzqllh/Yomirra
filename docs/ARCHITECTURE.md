# Architecture

Yomirra adalah Next.js App Router application dengan source adapters di server, state membaca yang local-first di browser, Redis untuk cache/catalog, dan optional Firebase sync.

## 1. Runtime layers

```text
Browser
  ↓
App Router + feature views
  ↓
shared hooks / Zustand / TanStack Query
  ↓
API client
  ↓
Next.js API routes
  ↓
source manager / search services / cache
  ↓
external manga sources
```

Source-specific response tidak boleh bocor langsung ke generic UI.

## 2. App Router dan feature boundary

Route kompleks dibuat tipis. Composition dan orchestration berada di feature view/hook.

```text
route
→ page view
→ feature components
→ controller hook
→ stores / queries / API client
```

Search, Library, dan Rak Buku sudah memakai pola ini.

## 3. Source layer

Built-in adapters ada di `src/server/lib/sources/adapters/`. Adapter bertugas:

- request ke upstream;
- parsing/normalization;
- pagination;
- canonical filter mapping;
- chapter/page normalization;
- source-specific referer/header handling.

Shared contract ada di `src/shared/sources/source-types.ts`.

Satu source gagal tidak boleh menggagalkan hasil source lain.

## 4. Multi-source identity

Saved title memakai identity yang terpisah dari physical source reference.

Satu title dapat memiliki:

- primary source;
- linked sources;
- collection membership;
- update state;
- history yang tetap menyimpan provenance source/chapter.

Recovery hanya memindahkan source saat match cukup aman atau sudah dikonfirmasi user.

Detail ada di [IDENTITY.md](IDENTITY.md).

## 5. Search flow

Global Search bersifat multi-source dan independen dari Library/Popular source toggle.

```text
query
→ parse text + #tags
→ discover source capabilities
→ map canonical filters per source
→ parallel source search
→ normalize
→ canonical clustering/dedupe
→ lexical/fuzzy ranking
→ optional semantic ranking
→ UI
```

Jika explicit filter tidak bisa dipenuhi source, source tersebut tidak boleh di-query secara longgar seolah filter tidak ada.

### Search catalog

Redis menyimpan metadata manga publik yang ditemukan dari trusted server-side source flow.

Catalog tidak menyimpan user library, history, progress, account data, atau raw client payload.

Embedding dengan Gemini optional. Normal search tetap berjalan tanpa embedding.

## 6. Recommendation

Recommendation utama deterministic:

```text
candidate source results
+ current manga
+ local Library signals
+ reading history
→ score
→ exclude seen/saved/current
→ ranked recommendations
```

Tidak ada dependency AI untuk recommendation core.

## 7. Smart Collections

Smart Collections adalah derived state dari Library + History.

Ia tidak menulis automatic membership ke persisted collection store. Koleksi buatan user dan Smart Collections adalah dua domain berbeda di UI Rak Buku.

## 8. State ownership

### Zustand

Dipakai untuk persistent/local application state, misalnya:

- Library;
- History;
- Reader preferences;
- Downloads;
- Settings;
- source preferences;
- collections;
- updates.

### TanStack Query

Dipakai untuk remote request state, caching di browser, dan request lifecycle.

Jangan memindahkan query state ke Zustand hanya untuk mengurangi jumlah hook.

## 9. Cache dan Redis

Server dapat memakai Redis untuk:

- cached source responses;
- stale fallback pada failure tertentu;
- search catalog;
- operational state yang memang server-side.

Redis failure tidak boleh membuat normal source search gagal hanya karena semantic/catalog layer tidak tersedia.

## 10. Reader dan offline

Offline chapter menggunakan browser storage/Cache Storage dan Service Worker melalui Serwist.

Reader dapat memakai local/blob-backed URL untuk cached page. Object URL sementara harus dibersihkan dengan benar.

PWA/offline behavior harus diverifikasi di browser/device, bukan hanya unit test.

## 11. Image handling

Normal cover dirender melalui shared `MangaCover`.

Source/reader flow tertentu dapat memakai signed image proxy. Jika `IMAGE_PROXY_SECRET` tidak tersedia, direct image URL dapat dipakai sebagai fallback; jangan membuat weak default secret.

## 12. Firebase sync

Firebase memperluas state local-first untuk account/sync flow. Normal reading tidak seharusnya menunggu cloud round trip.

Authentication tidak menggantikan Firestore authorization rules.

## 13. Operational reporting

Telegram ops bersifat deterministic. Error/stage diubah menjadi report yang membantu diagnosis, tetapi tidak menjalankan AI diagnosis, auto-fix, atau auto-deploy.

## 14. Boundary yang sengaja dipertahankan

- Search/Library filter drawer: Vaul.
- Reader panel: Motion.
- Source adapter: server-only.
- User-created collections: persisted.
- Smart Collections: derived.
- Recommendation core: deterministic.
- Semantic search: optional.
