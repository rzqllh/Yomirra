<div align="center">

# Yomirra

### Search across sources. Keep one library. Read comfortably on mobile.

A **mobile-first** manga, manhwa, and webtoon reader built around the actual reading flow: discover, save, continue, read offline, and recover when a source misbehaves.

[**Open Yomirra**](https://yomirra.vercel.app/) · [Bahasa Indonesia](README.md) · [Developer Guide](README-DEV.md)

[![Live](https://img.shields.io/badge/live-yomirra.vercel.app-111111)](https://yomirra.vercel.app/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)

</div>

> [!TIP]
> **Yomirra is best experienced on mobile.** Desktop works too, but the main navigation, touch targets, reader controls, and layout are designed around phone-sized screens. On supported browsers, it can also be added to the home screen as a PWA.

## Why Yomirra?

A manga reader is more useful when it solves more than opening chapter images. Libraries get fragmented, sources change, reading progress gets lost, and many mobile web readers still feel like desktop sites squeezed into a smaller viewport.

Yomirra keeps the flow in one place:

- **Search across multiple sources** — use single-source or multi-source search instead of jumping between sites.
- **One personal shelf** — keep titles, collections, reading status, history, and updates together.
- **A reader focused on reading** — vertical and paged modes, responsive controls, persisted progress, and image failure handling.
- **Offline reading** — download chapters and reopen cached content when available.
- **Source resilience** — one failing source does not have to take down the rest of the experience.
- **Backup and sync** — local backup/restore plus account sync for supported data.

## Built-in sources

| Source | Type | Notes |
| --- | --- | --- |
| MangaDex | API | International catalog with bounded rate-limit handling |
| Shinigami | Web source | Indonesian manga, manhwa, and webtoon source |
| Komiku | Web source | Indonesian manga, manhwa, and webtoon source |
| Komikindo | Web source | Indonesian manga source with stale-cache fallback where available |

Source availability is outside Yomirra's control. A source may become slow, change its structure, or go offline independently of the app.

## Start reading

No installation is required to try it.

### **https://yomirra.vercel.app/**

Open it on your phone, choose a source, find a title, and start reading. If it fits your workflow, add it to your home screen for a more app-like experience.

## Current feature set

Yomirra currently includes:

- Catalog browsing and multi-source search
- Personal shelf, collections, reading status, history, and updates
- Manga detail and chapter lists
- Vertical and paged reader modes
- Downloads and offline reading
- Reading progress and continue reading
- Source health/error handling
- Backup and restore
- Firebase authentication and sync for supported data
- PWA/service worker support
- Responsive mobile and desktop layouts

See [CHANGELOG.md](CHANGELOG.md) for recent changes.

## Content policy

Yomirra is an **independent reader client**. It does not host manga, chapters, or source images. Content is requested from third-party services, and each source may have its own availability and terms.

Use Yomirra responsibly and follow applicable laws and the terms of the sources you use.

## Project links

- [Bahasa Indonesia README](README.md)
- [Developer Guide](README-DEV.md)
- [Documentation](docs/README.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [License](LICENSE)

Licensed under the [Apache License 2.0](LICENSE).
