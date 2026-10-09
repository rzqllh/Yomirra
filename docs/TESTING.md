# Testing

Yomirra memakai Vitest + Testing Library untuk automated tests dan browser/device verification untuk behavior yang tidak bisa dibuktikan di jsdom.

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
git diff --check
```

Untuk loop cepat:

```bash
pnpm vitest run path/to/file.test.ts
```

## Apa yang wajib dites

Prioritaskan boundary yang kalau rusak dapat merusak data atau banyak feature:

- source parsing/normalization;
- pagination/filter mapping;
- canonical matching dan source recovery;
- search tag/filter behavior;
- validation dan request signing;
- persistent store migration;
- Cloud Sync deletion tombstone, equal-timestamp precedence, dan lifecycle per UID;
- backup/restore;
- download lifecycle;
- recommendation ranking;
- Smart Collections derivation;
- partial source failure;
- admin authentication/session boundaries;
- server-only credential configuration and missing-config isolation;
- rate-limit namespace, fail-open/fail-closed behavior, rejection status, dan response headers;
- log redaction untuk token/cookie/authorization/signed URL;
- CSP report-only directives dan browser/PWA asset/connect compatibility;
- generic error surfaces tidak merender raw internal exception/upstream detail;
- reduced-motion fallback untuk motion primitives;
- navigation intent duplicate suppression dan pending cleanup;
- fast navigation tidak menampilkan delayed feedback, slow navigation menampilkannya;
- overlay tanpa trigger eksplisit mengembalikan focus saat ditutup.

## UI tests

Test primitive/feature bila ia memiliki behavior atau accessibility contract.

Contoh:

- `FilterChip` selection semantics;
- drawer Apply/Reset;
- Rak Buku collection filtering;
- active chapter selection;
- shared header actions.

Wrapper yang hanya meneruskan props/class tanpa behavior biasanya tidak butuh test khusus.

## Source adapters

Gunakan fixture/mocked HTTP response. Unit suite tidak boleh bergantung pada third-party site yang sedang online.

Cover setidaknya:

- metadata/capabilities;
- normalization;
- pagination;
- filter mapping;
- detail;
- chapter order;
- pages/referer;
- malformed/empty response;
- bounded retry bila ada.

Live source health adalah verification layer yang berbeda.

## Security boundaries

Untuk rate limiting, cover minimal:

- namespace/key identity yang diharapkan;
- limit/remaining/reset headers;
- 429 saat bucket habis;
- 503 saat policy fail-closed tidak dapat mengakses limiter;
- fail-open hanya pada route yang memang availability-first;
- trusted proxy-chain identity agar client tidak bisa memilih bucket sendiri lewat forwarded header palsu.

Untuk Redis cold-start dan limiter, gunakan `src/server/lib/cache/__tests__/redis-readiness.test.ts` dan `src/server/lib/security/__tests__/rate-limit.test.ts`. Cover `wait`, `connecting`, `reconnecting`, `end`, late rejection, 2.500 ms bounded deadline, shared initial connection, fail-closed 503, serta bypass fail-open yang tidak tertahan saat Redis down.

Untuk Cloud Sync, uji delete/tombstone Library/History, precedence pada timestamp sama, re-add/progress baru, perubahan realtime `libraryV2` `removed`, propagasi error manual sync, dan pergantian UID. Untuk unduhan, uji antrian idle tanpa timer berulang, pause/resume/cancel, concurrency, cached pages, dan URL legacy yang tetap melalui signed proxy.

Untuk credential server-only, test harus memastikan missing/malformed configuration gagal sebelum upstream request dilakukan tanpa membuat registry source lain gagal diinisialisasi.

Untuk CSP/error disclosure:

- static regression test memastikan baseline directive tidak hilang tanpa review;
- preview deployment harus menunjukkan header `Content-Security-Policy-Report-Only`;
- manifest, Service Worker, self-hosted Next chunks, Firebase auth host, HTTPS asset/API, dan WebSocket requirement harus tetap tercakup;
- raw exception/upstream message tidak boleh muncul pada generic public error surface.

## Search dan recommendation

Untuk search intelligence:

- exact/canonical title tetap deterministic;
- explicit tag tetap hard filter;
- unsupported explicit filter tidak berubah menjadi loose search;
- client payload tidak mencemari shared catalog;
- embedding failure tidak memblokir normal search.

Untuk recommendation:

- current/saved/read title tidak diprioritaskan sebagai recommendation baru;
- ranking stable saat score tie;
- core recommendation lulus tanpa AI configuration.

## Persistent state

Reset store global antar test.

Perubahan schema harus memiliki fixture dari bentuk lama yang masih didukung.

## Browser smoke test

Automated test tidak cukup untuk:

- fixed mobile header/safe area;
- filter drawer geometry dan snap behavior;
- route transition dan delayed navigation feedback;
- browser Back/Forward state + scroll restoration;
- keyboard/pointer focus continuity setelah overlay;
- reader overlays;
- chapter drawer auto-position;
- PWA installation;
- Service Worker/cache storage;
- offline reading;
- actual source WAF/rate-limit behavior.
- Redis serverless cold/warm/concurrent requests, outage dan recovery pada environment terkonfigurasi;
- profiling CPU/timer antrian unduhan idle dan pemeriksaan URL legacy pada Safari;
- sinkronisasi dua perangkat dengan penghapusan, re-add, dan account switch.

Catat browser/device/deployment environment saat melaporkan hasil manual.

## Saat test lama gagal

Bedakan:

1. regression implementasi — fix code;
2. contract memang berubah — update code + test + docs;
3. assertion test stale — update test setelah memastikan public behavior benar.

Jangan melemahkan assertion hanya supaya suite hijau.

## Completion gate

Jangan menyatakan task selesai dari diff atau lint saja. Fresh verification harus dijalankan setelah tree terakhir berubah.

Untuk motion/navigation, gate minimal mencakup typecheck, lint, full test suite, production build, preview deployment, reduced-motion regression, dan browser smoke untuk Back/Forward scroll. iOS/PWA behavior tidak boleh dinyatakan lulus hanya dari jsdom atau static source inspection.
