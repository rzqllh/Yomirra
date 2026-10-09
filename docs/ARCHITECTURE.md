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

Ownership komponen lintas feature saat ini:

```text
src/components/chrome/    shell, header, dan navigation
src/components/overlays/  overlay lintas halaman dan boot state
src/components/home/      composition dan feed Beranda
src/components/komik/     detail, card, chapter, dan action komik
```

Folder lama `src/components/app/` dan `src/components/manga/` bukan production boundary. Test contract lama masih dapat berada di folder test asal, tetapi import-nya harus menargetkan module canonical. Import production memakai path module langsung; barrel tanpa consumer tidak dipertahankan.

`komik` adalah nama grouping UI untuk manga, manhwa, dan manhua. Existing type/component `Manga*` serta public route `/manga/[sourceId]/[mangaId]` dan `/manga/[sourceId]/[mangaId]/read/[chapterId]` tetap menjadi contract.

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

Health runtime dan preferensi user adalah dua domain terpisah. Health menjelaskan apakah source saat ini dapat digunakan; preference menjelaskan apakah source ikut Beranda/Library/Populer. Recovery source tidak boleh menghapus preference user.

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

### Popular aggregation

Mode Populer gabungan tidak membandingkan raw view/popularity metric antar-provider. Feed per source dinormalisasi, judul hanya digabung saat identitas title/alias aman dan author tidak bertentangan, lalu setiap source memberi kontribusi reciprocal-rank `1 / (K + rank)`. Mode per-source selalu mempertahankan urutan native provider.

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

Catalog query key harus memuat context yang mengubah hasil, seperti source, query, filter, sort, page, dan policy konten. Revisit memakai cache yang masih valid/previous data tanpa menyimpan response besar ke localStorage. Pagination disimpan di URL dan filter Library yang perlu bertahan selama Back navigation disimpan secara session-scoped.

Jangan memindahkan query state ke Zustand hanya untuk mengurangi jumlah hook.

## 9. Cache dan Redis

Server dapat memakai Redis untuk:

- cached source responses;
- stale fallback pada failure tertentu;
- search catalog;
- operational state yang memang server-side.

Redis failure tidak boleh membuat normal source search gagal hanya karena semantic/catalog layer tidak tersedia.

### Readiness Redis pada rate limiting

`src/server/lib/cache/redis.ts` menyediakan `ensureRedisReady()` dan `isRedisReady()`. Client memakai lazy connection; request fail-closed menunggu readiness melalui in-flight promise bersama, bukan memanggil `INCR` sebelum Redis siap. Penantian dibatasi 2.500 ms pada jalur cold-start maupun reconnect, termasuk ketika ioredis masih melakukan retry.

`src/server/lib/security/rate-limit.ts` mempertahankan dua kebijakan yang berbeda: fail-closed menunggu readiness atau menghasilkan unavailable (503), sedangkan fail-open publik melewati Redis dengan cepat saat client belum ready sambil memulai recovery non-blocking. Ketika Redis ready, counter/TTL kembali digunakan dan limit exhaustion dapat menghasilkan 429. Konsumen Redis lain belum otomatis memiliki jaminan readiness atau durabilitas yang sama.

## 10. Reader dan offline

Offline chapter menggunakan browser storage/Cache Storage dan Service Worker melalui Serwist.

Reader dapat memakai local/blob-backed URL untuk cached page. Object URL sementara harus dibersihkan dengan benar.

PWA/offline behavior harus diverifikasi di browser/device, bukan hanya unit test.

Antrian unduhan eksplisit berhenti membuat follow-up timer ketika tidak ada pekerjaan eligible; proses pause/cancel/clear juga melepas timer terkait. Untuk unduhan lama dengan URL proxy tanpa signature, engine dapat mengambil ulang daftar halaman dari API sumber dan menggunakan URL baru tanpa mengunduh ulang gambar yang sudah berstatus `cached`. Gagal mengambil halaman dari upstream tidak membenarkan bypass signing atau SSRF protection.

## 11. Image handling

Normal cover dirender melalui shared `MangaCover`.

Source/reader flow tertentu dapat memakai signed image proxy. Jika `IMAGE_PROXY_SECRET` tidak tersedia, direct image URL dapat dipakai sebagai fallback; jangan membuat weak default secret.

## 12. Firebase sync

Firebase memperluas state local-first untuk account/sync flow. Normal reading tidak seharusnya menunggu cloud round trip.

Authentication tidak menggantikan Firestore authorization rules.

Full/realtime sync memakai canonical `users/{uid}/libraryV2` dan `users/{uid}/history`. Penghapusan dicatat dengan `_deleted` dan `deletedAt`; pada timestamp sama tombstone menang, tetapi re-add/progress eksplisit yang lebih baru bisa dipertahankan. Listener `removed` dan full sync harus menghormati penghapusan agar item lama tidak hidup kembali. Operasi full sync dikoordinasikan per UID; kegagalan manual sync tidak boleh ditutupi.

Custom collection dan membership didukung pada sinkronisasi akun; `readingStatusByManga` masih local-only. Jangan mengklaim semua state Rak Buku sudah cloud-synced.

## 13. Motion dan navigation boundary

Route-level continuity dimiliki AppShell dan semantic motion layer, bukan feature page individual.

- semantic timing/spring ada di `src/shared/lib/motion/`;
- `PageTransition` adalah route transition owner untuk non-reader pages;
- route `loading.tsx` adalah satu-satunya owner skeleton saat segment menunggu, sehingga AppShell tidak menumpuk pending skeleton kedua;
- `pendingHref` tetap aktif seketika untuk optimistic dock/rail state, sedangkan visible progress feedback ditunda agar navigasi cepat tidak berkedip;
- pathname completion membersihkan navigation intent; timeout hanya recovery fallback;
- normal Back/Forward memakai browser history restoration, bukan pathname-only sessionStorage scroll restore;
- reader progress tetap domain reader dan tidak digabungkan dengan page scroll restoration;
- package-specific morphing hanya boleh masuk melalui `src/components/motion/morph-icon.tsx` dan harus menghormati reduced motion.

## 14. Security boundary

Privileged behavior tetap server-side:

- admin authorization memakai common server guard; browser admin memakai short-lived signed HttpOnly session;
- reusable upstream credential di-resolve hanya saat adapter benar-benar melakukan request, sehingga missing optional configuration gagal tertutup tanpa merusak konstruksi registry source lain;
- `src/server/lib/security/rate-limit.ts` menjadi policy boundary tunggal untuk namespace, limit, fail-open/fail-closed, dan response headers pada route yang sensitif/mahal;
- public search dan image proxy dipisahkan dari admin mutation/expensive operation agar availability policy tidak tercampur;
- browser security header memakai CSP report-only lebih dulu untuk mengobservasi kebutuhan Next.js/Firebase/PWA sebelum enforcement;
- generic public error tidak meneruskan raw exception/upstream detail; digest/correlation signal yang aman boleh dipertahankan;
- logger shared melakukan redaction credential-bearing fields sebelum data masuk ke server log.

## 15. Operational reporting

Telegram ops bersifat deterministic. Error/stage diubah menjadi report yang membantu diagnosis, tetapi tidak menjalankan AI diagnosis, auto-fix, atau auto-deploy.

## 16. Boundary yang sengaja dipertahankan

- Search/Library filter drawer: Vaul.
- Reader panel: Motion.
- Source adapter: server-only.
- User-created collections: persisted.
- Smart Collections: derived.
- Recommendation core: deterministic.
- Semantic search: optional.
