# PRD — Yomirra

> **Version:** 1.0 | **Status:** Active Development | **Last Updated:** 2025

---

## 1. Product Overview

**Yomirra** is a mobile-first Progressive Web App (PWA) for reading webtoons and manga, inspired by Tachiyomi/Mihon for Android. It aggregates content from multiple sources via a plugin-based adapter system, with full offline support, cross-device sync, and a premium dark-UI reading experience optimized for vertical scrolling webtoon content.

### Mission Statement
> Deliver the best webtoon reading experience on the web — fast, offline-capable, beautiful, and extensible.

### Core Differentiators
- Plugin-based source adapters (Mihon-compatible manifest format)
- Offline download with CBZ/ZIP packaging
- Cross-device sync via Firebase (library + reading history)
- Webtoon-first vertical continuous reader
- View Transitions API for native-app-like navigation feel

---

## 2. User Personas

### Primary: The Power Reader
- Reads 5+ titles daily from multiple sources
- Expects fast load, offline access on mobile data
- Values: Speed, organized library, progress continuity

### Secondary: The Casual Browser
- Discovers new titles through popular/latest feeds
- Reads occasionally, doesn't manage a library
- Values: Beautiful UI, easy discovery, no friction

### Tertiary: The Private Collector
- Uses private/custom sources (NSFW or paid content)
- Expects source privacy, no data leaks
- Values: Private sources support, NSFW filtering controls

---

## 3. Feature Registry

### ✅ Stable (Production)

| Feature | Description | Key Files |
|---------|-------------|-----------|
| Firebase Auth | Google/Email sign-in | `src/shared/lib/firebase.ts`, `src/shared/hooks/use-auth.ts` |
| Firestore Sync | Cross-device library + history sync | `src/shared/lib/sync-utils.ts`, `src/shared/hooks/use-sync.ts` |
| Source Adapters | Plugin-based manga sources | `src/server/lib/sources/adapters/` |
| Private Sources | `SECRET_EXTENSION_SOURCES` env-injected | `src/server/lib/sources/adapters/project-alpha/` etc. |
| Dynamic Sources | User-added Mihon manifest URLs via cookies | `src/shared/sources/dynamic-source-registry.ts` |
| Offline Downloads | CBZ packaging via JSZip, IndexedDB cache | `src/shared/lib/download-engine.ts`, `src/shared/store/download-store.ts` |
| PWA / Service Worker | Serwist-powered offline shell + caching | `src/app/sw.ts`, `next.config.ts` |
| Continuous Vertical Reader | Webtoon-first scroll reader | `src/components/reader/continuous-vertical-reader.tsx` |
| Image Proxy | HMAC-signed proxy for hotlink bypass | `src/app/api/proxy/image/route.ts`, `src/server/lib/sign-proxy-url.ts` |
| Redis Cache | Upstash-powered API response caching | `src/server/lib/cache/` |
| Library Store | Persistent local + synced library | `src/shared/store/library-store.ts` |
| History Store | Per-chapter page-level progress tracking | `src/shared/store/history-store.ts` |
| Reader Preferences | Persisted per-device reader settings | `src/shared/store/reader-store.ts` |
| Bottom Navigation | Mobile-first 5-tab dock | `src/components/app/bottom-dock.tsx` |
| View Transitions | Native-feel page animations | `next.config.ts` (`experimental.viewTransition`) |

### 🚧 In Progress / Planned

| Feature | Description | Priority |
|---------|-------------|---------|
| Advanced Filter UI | Genre/status/sort drawer for search/browse | P1 |
| Page-Level Tracking Restore | Auto-scroll to last read page on chapter open | P1 |
| Rating System | 1–10 star UI stored in `library-store.ts` | P2 |

---

## 4. Technical Constraints

- **Mobile-first:** All UI MUST work at 375px minimum viewport width
- **PWA requirement:** Core reading flow MUST work fully offline
- **Webtoon-only reader:** `readingMode` is locked to `'vertical'`. LTR/RTL paged mode has been deliberately removed.
- **No SSR for reader:** Reader components are `"use client"` only — server rendering pages would break IndexedDB / store hydration
- **Image proxy required:** All external manga images MUST route through `/api/proxy/image` — direct `<img src>` to third-party domains is forbidden in reader view
- **Firebase client-only:** `src/shared/lib/firebase.ts` MUST NOT be imported in server components or API routes

---

## 5. Success Metrics

- Time-to-first-page < 2s on 4G connection
- Reader scroll FPS ≥ 60fps on mid-range Android
- Offline chapter available within 30s of download trigger
- Zero layout shift (CLS < 0.1) on navigation
