# Handoff header dan katalog

Mulai dari [tracker](../audit/HEADER_CATALOG_TRACKER.md) untuk status, dependensi, bukti, dan keputusan owner. Buka [plan](../audit/HEADER_CATALOG_PLAN.md) untuk lingkup, matriks route, dan verifikasi per fase.

Tujuan produk adalah header dalam halaman hanya pada mobile dengan batas `md`, sambil menjaga TopNav/rail desktop, hero, dan kontrol reader independen. Izin eksekusi diterima setelah checkpoint QA dokumentasi HC-04. Default kerja UX dan progres per aktivitas ada di tracker.

## Posisi terakhir

- Baseline kerja `9fc48841cebed1eac7430172533021539ca51049`. Seluruh pekerjaan lokal **Fase 1 (`HC-10`–`HC-19`)**, **Fase 2 (`HC-20`–`HC-26`)**, dan **perbaikan kontras reader (`HC-CI1`–`HC-CI2`)** sudah selesai di working tree dan terverifikasi (`typecheck` 0, `eslint` 0 error, `check-design-tokens` pass dengan `inline_styles` turun `34 -> 33`, `pnpm build` pass, Playwright `54 passed, 6 Redis-gated skipped`, serta QA independen Rinne `PASS_WITH_LIMITATIONS` untuk Fase 1 dan Fase 2).
- `HC-CI2` tinggal menunggu izin eksplisit owner untuk `git commit` & `git push` ke PR `#177` agar `CI Pipeline` (khususnya `e2e/reader-chrome-contrast.spec.ts` dan 6 test Redis-gated) berjalan pada head PR baru, lalu ditautkan ke `REL-06` di ledger rilis.

## Pulihkan konteks sebelum bekerja

1. Dari root repo, jalankan `git status --short --branch`, `git rev-parse HEAD`, `git diff --stat`, dan `git diff --cached --stat`. Periksa diff dan berkas untracked yang relevan. Cocokkan dengan baseline dan checkpoint terakhir di tracker. Pertahankan perubahan pengguna yang muncul sejak sesi sebelumnya.
2. Periksa kembali PR #177, status draft, head SHA, check terbaru, dan detail job yang gagal. Cocokkan SHA sebelum memakai bukti CI. Data historis exact-head dan tautan job ada di HC-02. Jika failure berbeda, rekam temuan baru di tracker dan gunakan hasil saat ini untuk menentukan tindak lanjut pekerjaan CI.
3. Baca default kerja HC-D1–HC-D3 dan pakai cursor tracker untuk memilih tugas yang dependensinya terpenuhi. Baca panduan Next.js lokal yang relevan sebelum mengubah source. Bila ada blocker, simpan bukti dan posisi lanjut di tracker.
4. Saat satu tugas selesai, simpan checkpoint dan set ID berikutnya di tracker. Saat harus berhenti atau pindah sesi, catat ID aktif, sisa acceptance, SHA/diff, dan cek terakhir. Sesi baru mengulang langkah 1 sebelum lanjut.

Status rilis mengikuti [Master Release Ledger 64](../porting/MASTER_RELEASE_LEDGER_64.md) dan [Complete Release Gate 2026-11-24](../porting/COMPLETE_RELEASE_GATE_2026-11-24.md). Status PR saat baseline adalah terbuka dan draft. Temuan cache/SW dev pada tracker adalah konteks historis yang terpisah dari hasil CI.
