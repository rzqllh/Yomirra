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
- backup/restore;
- download lifecycle;
- recommendation ranking;
- Smart Collections derivation;
- partial source failure.

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
- route transition;
- browser-back state;
- reader overlays;
- chapter drawer auto-position;
- PWA installation;
- Service Worker/cache storage;
- offline reading;
- actual source WAF/rate-limit behavior.

Catat browser/device/deployment environment saat melaporkan hasil manual.

## Saat test lama gagal

Bedakan:

1. regression implementasi — fix code;
2. contract memang berubah — update code + test + docs;
3. assertion test stale — update test setelah memastikan public behavior benar.

Jangan melemahkan assertion hanya supaya suite hijau.

## Completion gate

Jangan menyatakan task selesai dari diff atau lint saja. Fresh verification harus dijalankan setelah tree terakhir berubah.
