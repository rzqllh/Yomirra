# Yomirra — Developer Guide

Developer documentation for Yomirra.

For the product overview and user-facing documentation, see [`../README.md`](../README.md).

---

# English

## Overview

Yomirra is a mobile-first manga, manhwa, and webtoon reader with a multi-source architecture.

The application is designed around four main concerns:

1. Keep the reader experience independent from individual catalog sources.
2. Keep important reading state available locally.
3. Allow cloud synchronization without making it the only source of truth for normal reading.
4. Treat external sources as unreliable boundaries rather than trusted internal APIs.

## Core stack

The application currently uses:

* **Next.js** for the web application and routing.
* **React** for the UI.
* **Zustand** for client-side application state.
* **Firebase** for authentication and supported synchronization flows.
* **PWA capabilities** for installable/mobile usage.
* **Source adapters** to normalize different external catalog providers.

Implementation details may evolve. The repository itself should remain the source of truth for exact package versions and available scripts.

## Product areas

The application is currently organized around several user-facing domains:

* Home
* Search
* Library
* Collections
* Updates
* Downloads
* Sources
* Manga Detail
* Reader
* Settings
* Authentication and sync

These areas should share domain state where appropriate, but should not directly depend on provider-specific response structures.

## Architecture principles

### 1. Source-specific behavior stays behind adapters

External sources are not expected to provide identical capabilities.

A source may support:

* search,
* discovery,
* filters,
* manga metadata,
* chapter lists,
* page retrieval,
* or only a subset of those capabilities.

The UI should consume normalized application contracts rather than assuming every source supports every operation.

Do not add source-specific checks throughout generic screens when the behavior can be represented by the source adapter or capability contract instead.

### 2. One broken source should not break Yomirra

Network failures, changed endpoints, invalid responses, missing images, or temporary source downtime are expected conditions.

Prefer:

* explicit unavailable states,
* isolated source errors,
* capability checks,
* defensive parsing,
* and recoverable UI states.

Avoid treating a third-party response as guaranteed application state.

### 3. Reading is local-first

Normal reading should not depend on a successful cloud round trip.

Local state is important for areas such as:

* Library,
* reading history,
* reading progress,
* reader preferences,
* Downloads,
* and other device-level reading state.

Authentication and synchronization should extend the local experience instead of blocking it.

### 4. Reader state should remain reader-focused

The Reader should not become responsible for resolving unrelated application concerns.

Keep responsibilities such as:

* source resolution,
* Library management,
* global navigation,
* update checking,
* and account synchronization

outside the core reading flow whenever possible.

Reader-specific settings should remain accessible from the Reader instead of being duplicated into unrelated global settings.

### 5. Navigation must preserve context

A manga can be opened from multiple places:

* Search,
* Library,
* Collections,
* Updates,
* History / Continue Reading,
* Downloads,
* or another discovery surface.

Navigation changes should not assume a single entry point.

When modifying Manga Detail or Reader behavior, verify back navigation and source context from the major entry paths.

## Multi-source model

The source layer exists to convert provider-specific behavior into contracts that the rest of Yomirra can understand.

Conceptually, a source may expose capabilities such as:

```text
search
discover
getManga
getChapters
getPages
filters
health
```

Not every source is required to implement every capability.

UI controls should be derived from supported capabilities rather than being hardcoded globally.

## Reader

Yomirra supports different reading styles, including:

* vertical / long-strip reading,
* paged reading,
* locally downloaded chapters,
* and source-provided chapter images.

Changes to the Reader should be checked against:

* light and dark comic pages,
* mobile viewport and safe areas,
* long chapters,
* failed images,
* offline pages,
* chapter navigation,
* progress persistence,
* and application background/resume behavior.

Avoid visual controls that permanently reduce the usable comic area when they can be transient instead.

## Downloads and offline reading

Downloaded chapters are part of the device-local experience.

Code touching Downloads should account for:

* incomplete downloads,
* deleted local files,
* stale metadata,
* partial cleanup,
* object URL lifecycle,
* and chapter data that is no longer available from the original source.

Local `blob:` and `data:` resources should not be routed through remote image optimization paths that expect public URLs.

## Library and Updates

Library state and chapter update tracking are related but separate concerns.

Saving a title should not require the update checker to succeed.

Likewise, a temporary update-check failure must not make the title unusable in the Library.

Collections and reading statuses are organizational metadata and should remain independent from source availability.

## Backup & Restore

Backup is different from account synchronization.

Backup exists to create a portable representation of supported Yomirra data.

When changing the backup schema:

* version the format,
* preserve migration compatibility when practical,
* validate imported data,
* do not blindly trust an imported payload,
* and avoid silently discarding unsupported fields.

Existing V1 backups should continue to be considered when changing the current backup implementation.

## Authentication and sync

Firebase handles authentication and supported synchronization flows.

Authentication should not unnecessarily block local-only functionality.

When changing sync behavior, explicitly consider:

* local state,
* remote state,
* first login,
* logout,
* reconnect,
* conflict handling,
* and partial sync failures.

Do not make destructive conflict resolution implicit.

## PWA

Yomirra supports installation as a Progressive Web App.

Changes affecting navigation, caching, offline behavior, install prompts, or application lifecycle should be checked in both:

* regular browser mode,
* installed / standalone mode.

Mobile Safari and other browsers may behave differently, especially around PWA lifecycle and background state.

## Development workflow

Use the package manager and scripts defined by the repository.

Before merging a meaningful change, run the relevant available checks from `package.json`, typically covering:

```text
lint
typecheck
test
build
```

Do not assume a script exists purely because it appears in this guide. `package.json` is authoritative.

For source or reader changes, also perform a manual smoke test through the affected user flow.

## Change checklist

Before considering a change complete, check the relevant items:

* Does it work on a mobile viewport?
* Does it introduce source-specific logic into generic UI?
* What happens if the source is unavailable?
* Does local state remain valid?
* Does navigation still work from different entry points?
* Does the Reader work with online and downloaded pages?
* Are loading, empty, and error states covered?
* Can the change break existing backup data?
* Does it behave correctly in standalone PWA mode?
* Does the production build still pass?

Not every change needs every check, but these are common regression areas in Yomirra.

## Release notes

Public release notes belong in [`../CHANGELOG.md`](../CHANGELOG.md).

Use release notes for observable changes:

* Added
* Changed
* Fixed
* Removed
* Security

Avoid implementation noise unless it materially affects reliability, compatibility, or maintainability.

---

# Bahasa Indonesia

## Gambaran umum

Yomirra adalah reader manga, manhwa, dan webtoon yang mobile-first dengan arsitektur multi-source.

Pengembangannya mengikuti empat prinsip utama:

1. Reader tidak bergantung langsung pada satu source tertentu.
2. Data penting untuk membaca tetap bisa digunakan secara lokal.
3. Cloud sync melengkapi local state, bukan menjadi satu-satunya sumber data untuk aktivitas baca.
4. External source dianggap sebagai boundary yang bisa gagal kapan saja, bukan internal API yang selalu stabil.

## Stack utama

Yomirra saat ini menggunakan:

* **Next.js** untuk aplikasi web dan routing.
* **React** untuk UI.
* **Zustand** untuk client-side application state.
* **Firebase** untuk authentication dan flow sinkronisasi yang didukung.
* **PWA capabilities** untuk penggunaan installable/mobile.
* **Source adapter** untuk menormalkan perbedaan antar external catalog.

Detail implementasi dapat berubah. Untuk versi package dan script yang benar-benar tersedia, repository tetap menjadi source of truth.

## Area utama aplikasi

Saat ini Yomirra memiliki beberapa domain utama:

* Home
* Search
* Library
* Collections
* Updates
* Downloads
* Sources
* Manga Detail
* Reader
* Settings
* Authentication dan sync

State antar area boleh digunakan bersama jika memang satu domain, tetapi screen umum tidak boleh bergantung langsung pada bentuk response dari provider tertentu.

## Prinsip arsitektur

### 1. Perbedaan source ditangani di adapter

Tidak semua source memiliki kemampuan yang sama.

Sebuah source bisa mendukung:

* search,
* discovery,
* filter,
* metadata manga,
* chapter list,
* page retrieval,
* atau hanya sebagian dari kemampuan tersebut.

UI harus menggunakan application contract yang sudah dinormalisasi.

Hindari menambahkan pengecekan nama source di banyak screen ketika behavior tersebut sebenarnya bisa ditangani melalui adapter atau capability contract.

### 2. Satu source bermasalah tidak boleh menjatuhkan Yomirra

Network error, endpoint berubah, response invalid, gambar hilang, atau source sementara down adalah kondisi yang harus dianggap normal.

Utamakan:

* unavailable state yang jelas,
* error yang terisolasi per source,
* capability check,
* defensive parsing,
* dan UI yang masih bisa direcover.

Jangan menganggap response pihak ketiga selalu valid.

### 3. Reading tetap local-first

Aktivitas baca normal tidak seharusnya menunggu cloud round trip.

Local state penting untuk:

* Library,
* history,
* reading progress,
* reader preferences,
* Downloads,
* dan state baca lainnya di perangkat.

Authentication dan sync seharusnya memperluas pengalaman lokal, bukan menguncinya.

### 4. Reader fokus pada aktivitas membaca

Reader jangan dijadikan tempat menyelesaikan semua urusan aplikasi.

Logic seperti:

* source resolution,
* Library management,
* global navigation,
* update checking,
* dan account synchronization

sebisa mungkin tetap berada di luar core reading flow.

Setting yang spesifik untuk membaca sebaiknya tetap tersedia dari Reader dan tidak diduplikasi ke global Settings tanpa alasan yang jelas.

### 5. Navigation harus menjaga context

Manga dapat dibuka dari:

* Search,
* Library,
* Collections,
* Updates,
* History / Continue Reading,
* Downloads,
* atau discovery surface lainnya.

Karena itu perubahan pada Manga Detail dan Reader tidak boleh berasumsi bahwa user selalu datang dari satu halaman tertentu.

Back navigation dan source context perlu dicek dari entry point utama.

## Model multi-source

Source layer mengubah behavior khusus masing-masing provider menjadi contract yang dipahami aplikasi.

Secara konsep, source dapat memiliki capability seperti:

```text
search
discover
getManga
getChapters
getPages
filters
health
```

Tidak semua source wajib mendukung semuanya.

UI harus mengikuti capability source, bukan memaksakan kontrol yang sama secara global.

## Reader

Yomirra mendukung beberapa pola membaca, termasuk:

* vertical / long-strip,
* paged reader,
* chapter hasil download,
* dan chapter image dari source.

Perubahan Reader perlu dicek terhadap:

* halaman komik terang dan gelap,
* mobile viewport dan safe area,
* chapter panjang,
* failed image,
* offline pages,
* chapter navigation,
* progress persistence,
* serta background/resume aplikasi.

Hindari kontrol permanen yang memakan area baca jika kontrol tersebut bisa dibuat transient.

## Downloads dan offline reading

Chapter hasil download merupakan bagian dari device-local experience.

Perubahan di area Downloads harus mempertimbangkan:

* download tidak lengkap,
* local file yang terhapus,
* stale metadata,
* partial cleanup,
* lifecycle object URL,
* dan chapter yang sudah tidak tersedia dari source asal.

Resource lokal seperti `blob:` dan `data:` tidak boleh dipaksa melewati remote image optimization yang mengharapkan public URL.

## Library dan Updates

Library dan update checker saling berhubungan tetapi merupakan concern yang berbeda.

Menyimpan judul ke Library tidak boleh bergantung pada keberhasilan update checker.

Sebaliknya, kegagalan sementara saat mengecek update tidak boleh membuat manga di Library menjadi tidak bisa digunakan.

Collections dan reading status adalah metadata organisasi dan sebaiknya tidak bergantung pada availability source.

## Backup & Restore

Backup berbeda dari account synchronization.

Backup digunakan untuk membuat representasi portable dari data Yomirra yang didukung.

Ketika mengubah backup schema:

* gunakan versioning,
* pertahankan migration compatibility jika masuk akal,
* validasi data import,
* jangan langsung percaya pada payload hasil import,
* dan jangan membuang field yang tidak dikenal secara diam-diam.

Compatibility dengan backup V1 tetap perlu dipertimbangkan saat mengubah implementasi format saat ini.

## Authentication dan sync

Firebase digunakan untuk authentication dan flow sinkronisasi yang didukung.

Authentication tidak seharusnya memblokir fitur lokal yang sebenarnya tidak membutuhkan akun.

Saat mengubah behavior sync, pertimbangkan secara eksplisit:

* local state,
* remote state,
* first login,
* logout,
* reconnect,
* conflict handling,
* dan partial sync failure.

Hindari conflict resolution yang destruktif tanpa behavior yang jelas.

## PWA

Yomirra dapat digunakan sebagai Progressive Web App.

Perubahan pada navigation, caching, offline behavior, install flow, atau lifecycle aplikasi perlu diuji pada:

* browser biasa,
* installed / standalone mode.

Mobile Safari dan browser lain dapat memiliki behavior PWA yang berbeda, terutama terkait lifecycle dan background state.

## Workflow development

Gunakan package manager dan scripts yang memang tersedia di repository.

Sebelum merge perubahan yang cukup besar, jalankan check relevan dari `package.json`, biasanya mencakup:

```text
lint
typecheck
test
build
```

Jangan menganggap script tersedia hanya karena disebut di dokumen ini. `package.json` tetap menjadi referensi utama.

Untuk perubahan pada source atau Reader, lakukan juga smoke test manual pada user flow yang terdampak.

## Checklist perubahan

Sebelum sebuah perubahan dianggap selesai, cek bagian yang relevan:

* Apakah berjalan baik di mobile viewport?
* Apakah ada source-specific logic yang bocor ke generic UI?
* Apa yang terjadi ketika source down?
* Apakah local state tetap aman?
* Apakah navigation masih benar dari berbagai entry point?
* Apakah Reader bekerja untuk online dan downloaded pages?
* Apakah loading, empty, dan error state sudah ditangani?
* Apakah perubahan bisa merusak format backup lama?
* Apakah tetap bekerja pada standalone PWA?
* Apakah production build tetap lolos?

Tidak semua perubahan membutuhkan seluruh checklist, tetapi area di atas termasuk sumber regression yang paling umum di Yomirra.

## Release notes

Perubahan yang terlihat oleh user dicatat di [`../CHANGELOG.md`](../CHANGELOG.md).

Gunakan kategori release yang jelas:

* Added
* Changed
* Fixed
* Removed
* Security

Hindari memasukkan detail implementasi yang tidak berdampak pada user, reliability, compatibility, atau maintainability.
