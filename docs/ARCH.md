# ARCH — Yomirra Architecture

---

## 1. High-Level Overview

```
Browser (PWA)
├── Next.js App Router
│   ├── Server Components        ← data fetching, layouts
│   ├── Client Components        ← UI, interactivity, stores
│   └── API Routes               ← source proxy, image proxy
│
├── Service Worker (Serwist)     ← offline shell, cache
│
└── Firebase SDK (client-only)   ← Auth + Firestore sync
    
Server (Vercel / Node.js)
├── API Routes
│   ├── /api/sources/**          ← source adapter proxy
│   └── /api/proxy/image         ← HMAC-signed image proxy
│
├── Source Manager               ← resolves adapter by sourceId
├── Source Adapters              ← per-site scraping logic
└── Redis Cache (Upstash)        ← API response caching
```

---

## 2. Directory Structure

```
src/
├── app/
│   ├── (web)/                   ← Route group: main app
│   │   ├── layout.tsx           ← Root layout (providers, shell)
│   │   ├── globals.css          ← Design tokens + Tailwind @theme
│   │   ├── page.tsx             ← Home
│   │   ├── manga/[sourceId]/[mangaId]/
│   │   │   ├── page.tsx         ← Manga detail (Server Component)
│   │   │   └── read/[chapterId]/page.tsx  ← Reader (Client Component)
│   │   ├── search/              ← Search page
│   │   ├── library/             ← Library page
│   │   ├── downloads/           ← Downloads page
│   │   ├── sources/             ← Sources browser
│   │   ├── updates/             ← Update feed
│   │   ├── bookmark/            ← Bookmarks
│   │   ├── popular/             ← Popular page
│   │   └── settings/            ← Settings page
│   │
│   ├── api/
│   │   ├── sources/
│   │   │   ├── route.ts         ← GET /api/sources (list all)
│   │   │   ├── health/          ← Source health checks
│   │   │   ├── search/          ← Cross-source search
│   │   │   ├── private/         ← Private source injection
│   │   │   └── [sourceId]/      ← Per-source endpoints
│   │   │       ├── popular/     ← GET popular manga
│   │   │       ├── latest/      ← GET latest manga
│   │   │       ├── search/      ← GET search results
│   │   │       ├── filters/     ← GET available filters
│   │   │       └── manga/[mangaId]/
│   │   │           ├── route.ts ← GET manga detail
│   │   │           └── chapters/
│   │   │               ├── route.ts  ← GET chapter list
│   │   │               └── [chapterId]/pages/route.ts  ← GET page URLs
│   │   └── proxy/image/route.ts ← HMAC-verified image proxy
│   │
│   ├── manifest.ts              ← PWA manifest
│   └── sw.ts                    ← Service worker entry
│
├── components/
│   ├── app/                     ← App-level shell components
│   ├── manga/                   ← Manga-specific UI (cards, detail, chapters)
│   ├── reader/                  ← Reader-specific UI
│   ├── search/                  ← Search UI
│   ├── history/                 ← History UI
│   ├── source/                  ← Source browser UI
│   ├── downloads/               ← Downloads UI
│   ├── skeletons/               ← Loading skeletons
│   ├── states/                  ← Empty/error state components
│   ├── ui/                      ← Base design system components (Button, Badge, etc.)
│   ├── providers/               ← React context providers
│   └── motion/                  ← Motion-wrapped primitives
│
├── server/
│   └── lib/
│       ├── sources/
│       │   ├── adapters/        ← Per-source scrapers
│       │   ├── source-manager.ts
│       │   └── server-manifest.ts
│       ├── cache/               ← Redis cache wrapper
│       ├── security/            ← Rate limiting
│       ├── sign-proxy-url.ts    ← HMAC signing
│       └── validation/          ← API input validation
│
└── shared/
    ├── api-client.ts            ← Typed fetch client (client-side)
    ├── hooks/                   ← Custom React hooks
    ├── lib/                     ← Shared utilities
    │   ├── firebase.ts          ← Firebase init (CLIENT ONLY)
    │   ├── motion/              ← Animation tokens + variants
    │   ├── download-engine.ts   ← Offline download logic
    │   └── sync-utils.ts        ← Firestore sync helpers
    ├── sources/                 ← Shared source types + registry
    ├── store/                   ← Zustand stores
    ├── types/                   ← TypeScript types
    └── utils/                   ← Pure utility functions
```

---

## 3. Layer Separation Rules

This is the **most important architecture rule**. Violations WILL break the app.

### Layer 1: Server-Only (`src/server/`)
- Runs on Vercel Node.js runtime
- Has access to: `env.ts`, Redis, source adapters, scraping
- MUST NOT be imported by client components
- MUST NOT import from `src/shared/lib/firebase.ts`

### Layer 2: API Routes (`src/app/api/`)
- Bridge between server layer and client
- Validates input with `src/server/lib/validation/api.ts`
- Returns `{ data: T }` on success, `{ error: { code, message } }` on failure
- Uses `sourceManager` from Layer 1

### Layer 3: Shared (`src/shared/`)
- Can be imported by BOTH server and client
- Exception: `src/shared/lib/firebase.ts` is **client-only** (has `window` check guard)
- `src/shared/api-client.ts` is client-only (uses `fetch` without server context)

### Layer 4: Client Components (`src/components/`, client pages)
- Uses `"use client"` directive
- Reads from Zustand stores
- Fetches via `ApiClient` (never calls source adapters directly)
- Accesses Firebase via `src/shared/lib/firebase.ts` (guarded)

### Violation Examples

```tsx
// ❌ WRONG — importing server adapter in client component
import { SampleAdapter } from "@/server/lib/sources/adapters/sample-adapter";

// ❌ WRONG — importing firebase in API route
import { initFirebase } from "@/shared/lib/firebase"; // in /app/api/**

// ❌ WRONG — calling API route logic directly in client
import { sourceManager } from "@/server/lib/sources/source-manager"; // in component

// ✅ CORRECT — client fetches via API route through ApiClient
import { apiClient } from "@/shared/api-client";
const result = await apiClient.getPopular(sourceId);
```

---

## 4. Data Flow

### Reading a Manga Chapter

```
User taps chapter
      ↓
Reader page.tsx (Client Component)
      ↓
useQuery → ApiClient.getPages(sourceId, mangaId, chapterId)
      ↓
GET /api/sources/[sourceId]/manga/[mangaId]/chapters/[chapterId]/pages
      ↓
sourceManager.getSource(sourceId, manifestUrl?)
      ↓
adapter.getPages(chapterId) → PageItem[]
      ↓ (each image URL is HMAC-signed)
sign-proxy-url.ts → /api/proxy/image?url=...&sig=...
      ↓
Reader renders images via <ReaderImage src="/api/proxy/image?..." />
```

### Library Sync Flow

```
User adds manga to library
      ↓
useLibraryStore.addToLibrary(item)
      ↓ (Zustand persist → localStorage)
      ↓ (background)
sync-utils.pushLibraryItem(item)
      ↓
Firebase Firestore → users/{uid}/library/{id}
      ↓ (on other devices via use-sync.ts)
Firestore listener → useLibraryStore.syncWithCloud(items)
```

### Offline Download Flow

```
User triggers download
      ↓
useDownloadStore.addDownload(...)
      ↓
download-engine.processDownloadQueue()
      ↓
fetch each page via /api/proxy/image
      ↓
JSZip.generateAsync() → Blob
      ↓
Cache API: caches.open(CACHE_NAME) → cache.put(offlineUrl, response)
      ↓
download-store marks chapter as 'downloaded'
Reader detects offline → serves from Cache API
```

---

## 5. Routing

All routes are under `src/app/(web)/` route group.

| Route | Component | Type |
|-------|-----------|------|
| `/` | `page.tsx` → `HomeView` | Client |
| `/manga/[sourceId]/[mangaId]` | `MangaDetailView` | Client |
| `/manga/[sourceId]/[mangaId]/read/[chapterId]` | `ReaderShell` | Client |
| `/search` | Search page | Client |
| `/library` | Library page | Client |
| `/sources` | Sources browser | Client |
| `/sources/[sourceId]` | Source detail | Client |
| `/popular` | Popular feed | Client |
| `/updates` | Updates feed | Client |
| `/downloads` | Downloads list | Client |
| `/bookmark` | Bookmarks | Client |
| `/settings` | Settings | Client |
| `/browse` | → 301 redirect to `/sources` | — |

---

## 6. Navigation

Bottom dock navigation (mobile): `src/components/app/bottom-dock.tsx`
Config: `src/shared/config/nav.ts`
5 tabs: Home, Browse/Sources, Library, Updates, Downloads

View transitions are applied via CSS class names on `<Link transitionTypes={[...]}/>`:
- `nav-forward` — navigating deeper
- `nav-back` — navigating back
- `fade-in` / `fade-out` — general transitions
- `morph` — shared element transition (manga cover)

---

## 7. State Architecture

All global state lives in Zustand stores with `persist` middleware (localStorage).
Firebase sync augments (does not replace) local-first state.

```
localStorage (zustand persist)
    ↕ sync
Firestore (library + history)
```

Stores do NOT communicate directly with each other. Cross-store logic goes in hooks.

---

## 8. Image Proxy

All external images MUST be served through `/api/proxy/image`.

Signing: `src/server/lib/sign-proxy-url.ts`
Verification: `src/app/api/proxy/image/route.ts`

```typescript
// Generate signed URL
const signedUrl = signProxyUrl(originalImageUrl);
// Result: /api/proxy/image?url=<encoded>&sig=<hmac>
```

Bypasses source hotlink protection via `Referer` header injection.
