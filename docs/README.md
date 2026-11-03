# Dokumentasi Yomirra

Untuk perilaku penyimpanan pengguna, mulai dari [Riwayat, sinkronisasi, dan cadangan](READING_DATA.md).

Folder ini berisi dokumentasi publik untuk contributor dan maintainer. Untuk overview produk, mulai dari [README](../README.md).

## Peta dokumen

- [Architecture](ARCHITECTURE.md) — boundary runtime, data flow, source flow, cache, search, dan state ownership.
- [Components](COMPONENTS.md) — reusable UI contract dan feature boundary.
- [Design](DESIGN.md) — design system, layout, typography, motion, dan overlay rules.
- [Identity](IDENTITY.md) — SavedTitle, linked source, history, dan source migration.
- [Schema](SCHEMA.md) — domain types, stores, API contract, dan persistence notes.
- [Stack](STACK.md) — package dan runtime choices.
- [Testing](TESTING.md) — verification gate dan risk-based testing.
- [Adding a Source](ADDING_A_SOURCE.md) — built-in adapter dan dynamic source.
- [Reading Data](READING_DATA.md) — retensi data lokal, backup engine, dan sinkronisasi.
- [Developer Guide](README_DEV.md) — onboarding developer.
- [Reference & Licensing](REFERENCE_LICENSING_REVIEW.md) — referensi independen dan batas lisensi.
- [Contributing](../CONTRIBUTING.md)
- [Security](../SECURITY.md)
- [Laporan hak konten](CONTENT_RIGHTS_REPORTING.md)
- [Changelog](../CHANGELOG.md)

## Source of truth

Jika docs dan repository berbeda, urutan prioritasnya:

1. implementation + tests terbaru;
2. `package.json` dan runtime config;
3. `docs/DESIGN.md` untuk design contract;
4. public docs lain.

Jangan mempertahankan dokumentasi yang sudah tidak sesuai hanya karena pernah benar.

## Prinsip dokumentasi

- Dokumentasikan behavior yang benar-benar ada.
- Bedakan feature yang deterministic, optional, source-dependent, dan experimental.
- Jangan klaim browser/PWA behavior hanya dari unit test.
- Jangan tulis credential, private URL, cookie, token, atau secret header.
- Update docs dalam PR yang sama saat public contract berubah.
