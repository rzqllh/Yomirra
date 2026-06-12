# Yomirra — Full Codebase Audit

**Date:** 2026-06-12  
**Auditor:** Claude (Senior Technical Reviewer)  
**Scope:** Full codebase — architecture, security, state, design system, API, UX, accessibility, performance, DevOps  
**Method:** Static analysis + cross-file correlation of all source files

---

## Severity Legend

| Level | Tag | Meaning |
|---|---|---|
| Critical | `[P0]` | Broken/data-loss/security exploit in production |
| High | `[P1]` | Significant bug, data race, or bad UX that actively harms the user |
| Medium | `[P2]` | Quality issue, inconsistency, or suboptimal pattern |
| Low | `[P3]` | Tech debt, dead code, polish, minor DX improvement |

---

## Part 1 — Critical `[P0]`

### P0-1 · Download Store: Wrong API Endpoint (Broken Feature)

**File:** `src/shared/store/download-store.ts:L156`

```ts
const res = await fetch(`/api/sources/${item.sourceId}/read/${item.chapterId}`);
```

**Problem:** This route does not exist. The correct endpoint for chapter pages is:
```
/api/sources/[sourceId]/manga/[mangaId]/chapters/[chapterId]/pages
```

The download `processQueue` function is calling a dead URL. Every download attempt will fail with a 404. The `mangaId` is also not stored in `DownloadItem`, so even after fixing the URL, you can't reconstruct the full path without adding `mangaId` to the `DownloadItem` type.

**Fix:**
1. Add `mangaId: string` field to `DownloadItem` interface.
2. Fix the URL to `/api/sources/${item.sourceId}/manga/${item.mangaId}/chapters/${item.chapterId}/pages`.
3. The route returns `data.pages: PageItem[]` (array of objects with `url`), not `string[]` — update the type assertion accordingly.

---

### P0-2 · Sync Loop: `addToLibrary` Writes Back to Firestore on Remote Pull

**Files:** `src/shared/store/library-store.ts`, `src/shared/hooks/use-sync.ts`

`addToLibrary()` always calls `pushLibraryItem(item)` (a Firestore write). The real-time `onSnapshot` listener in `use-sync.ts` calls `addToLibrary(data)` when a remote change arrives:

```ts
// use-sync.ts — real-time listener
unsubLibrary = onSnapshot(..., (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added" || change.type === "modified") {
      useLibraryStore.getState().addToLibrary(data); // ← triggers pushLibraryItem AGAIN
    }
  });
});
```

Flow: Remote write → onSnapshot fires → `addToLibrary` → `pushLibraryItem` → Firestore write → onSnapshot fires again → … This is a potential **Firestore write storm** and will burn through your free quota. The same pattern exists for `upsertHistory`.

**Fix:** Introduce a `_setItemLocal` action (no sync side-effect) for use by the sync layer:

```ts
// library-store.ts
_setItemLocal: (item) => set((state) => {
  const id = getLibraryId(item.sourceId, item.mangaId);
  return { items: { ...state.items, [id]: item } };
}),
```

Use `_setItemLocal` in all sync-pull operations, and `addToLibrary` only for user-initiated actions.

---

### P0-3 · NSFW Filter Not Applied in Global Search (Server-Side)

**Files:** `src/shared/api-client.ts`, `src/app/api/sources/search/route.ts`

The client correctly adds NSFW genre exclusions to the global search URL:
```ts
url += `&genre[]=-adult&genre[]=-mature&...`;
```

But the server handler ignores them entirely:
```ts
// route.ts — global search
const searchResult = await source.search(q, 1); // ← no filters parameter
```

NSFW content will slip through on global multi-source searches regardless of the user's `hideNsfw` setting.

**Fix:** Extract genre filter params from `searchParams` and pass them to `source.search(q, 1, filters)` — same pattern already implemented in the per-source search route.

---

## Part 2 — High Priority `[P1]`

### P1-1 · Security: Timing Attack in HMAC Image Proxy Verification

**File:** `src/server/lib/image.ts:L30`

```ts
return signature === expectedSignature;
```

String equality in JavaScript is not constant-time. An attacker can brute-force the HMAC signature bit by bit via timing differences. Impacts the image proxy security (SSRF prevention).

**Fix:**
```ts
import { timingSafeEqual } from "crypto";
return timingSafeEqual(
  Buffer.from(signature, "hex"),
  Buffer.from(expectedSignature, "hex")
);
```

---

### P1-2 · Security: IP Spoofing in Rate Limiter

**File:** `src/server/lib/security/rate-limit.ts:L11`

```ts
const ip = request.headers.get("x-forwarded-for") || "unknown";
```

`x-forwarded-for` can be set to any value by the client. Behind a proxy it can contain multiple IPs (`"1.2.3.4, proxy-ip"`). An attacker can rotate spoofed IPs to bypass rate limiting entirely.

**Fix:**
```ts
// Take only the last "trusted" IP in the chain, or use request.ip if the platform provides it
const forwarded = request.headers.get("x-forwarded-for");
const ip = forwarded ? forwarded.split(",").at(-1)!.trim() : "unknown";
```

For Vercel, use `request.headers.get("x-real-ip")` as primary.

---

### P1-3 · `tokens.css` Is Orphaned — Reader CSS Variables Are Undefined

**File:** `src/styles/tokens.css`

`tokens.css` defines critical CSS custom properties including `--reader-bg`, `--motion-fast`, `--ease-standard`, `--ease-emphasized`, `--z-reader-page`, `--z-reader-chrome`, `--shadow-floating`, `--card-aspect-ratio`, and the full motion token system.

**It is imported nowhere.** `layout.tsx` imports only `globals.css`, and `globals.css` only has `@import "tailwindcss"`. There is no `@import` of `tokens.css` anywhere in the entire project.

This file is pure dead code. Verify that no component depends on these specific var names at runtime — if any component does use `var(--reader-bg)` in inline styles or non-Tailwind CSS, it will silently resolve to `unset`/`inherit`.

**Fix:** Either:
- Add `@import "../../styles/tokens.css";` at the top of `globals.css` **and** reconcile the conflicts listed in P2-1, or
- Delete `tokens.css` and confirm all values are covered by `globals.css`.

---

### P1-4 · Library Page: Fundamental Naming/Architecture Confusion

**File:** `src/app/(web)/library/page.tsx`

The `/library` route is labeled "Library" in all navigation, but it is actually a **source catalog browser** — it calls `apiClient.search()` against Shinigami with `activeSourceId = "shinigami"` hardcoded. It has nothing to do with the user's personal saved manga.

The user's actual followed/bookmarked manga live in `useLibraryStore` (`yomirra-library` in localStorage), and that store is **never rendered anywhere as a list**.

Tachiyomi convention (your stated target):
- **Library** = user's followed/saved manga
- **Browse** / **Sources** = catalog discovery

The current mapping is inverted. Users who follow manga and come back to "Library" expecting to see their collection will find a generic catalog instead.

**Fix:** Decide on naming and stick to it across the full app:
- Rename current `/library` → `/browse` or keep as `/library` but implement the user's saved items
- Implement a proper user library view that reads from `useLibraryStore`
- Update all nav labels (`SideNav`, `BottomNav`, `routes.ts`, page titles)

---

### P1-5 · Double Sync on Login: `use-auth` + `use-sync` Both Run Full Sync

**Files:** `src/shared/hooks/use-auth.ts`, `src/shared/hooks/use-sync.ts`

On `onAuthStateChanged` with a signed-in user, `use-auth.ts` immediately runs:
```ts
Promise.all([pullLibraryData(), pullHistoryData()])
  .then(([libData, histData]) => {
    useLibraryStore.getState().syncWithCloud(libData);
    useHistoryStore.getState().syncWithCloud(histData);
  });
```

Then `use-sync.ts` also triggers `runFullSync()` on mount/user change. These run concurrently and both perform full Firestore reads + local merges + potential writes. There is no mutex or deduplication between them. On slow networks this can cause interleaved writes with inconsistent state.

**Fix:** Remove the sync-on-auth in `use-auth.ts` entirely and let `use-sync.ts` be the single sync authority. `use-auth.ts` should only manage authentication state.

---

### P1-6 · History Store: Unbounded Growth (localStorage Overflow Risk)

**File:** `src/shared/store/history-store.ts`

Every chapter ever read is stored as a separate entry in `yomirra-history` (localStorage). For a heavy reader reading 100+ chapters/day over months, this can easily hit the browser's localStorage quota (~5–10MB), causing silent write failures and potentially corrupting all other persisted stores on the same origin.

The `items` object is also iterated fully in `getContinueReading` on every render that calls it.

**Fix:**
```ts
// Implement a max-items cap with automatic pruning
const MAX_HISTORY_ITEMS = 1000;

upsertHistory: (item) => set((state) => {
  // ... normal upsert logic ...
  const allItems = Object.entries(newItems);
  if (allItems.length > MAX_HISTORY_ITEMS) {
    allItems.sort((a, b) => new Date(b[1].readAt).getTime() - new Date(a[1].readAt).getTime());
    return { items: Object.fromEntries(allItems.slice(0, MAX_HISTORY_ITEMS)) };
  }
  return { items: newItems };
}),
```

---

### P1-7 · SideNav Missing `/sources` Route

**File:** `src/components/app/side-nav.tsx`

Navigation links in `SideNav`: Beranda, Library, Readlist, Riwayat, Pengaturan. The `/sources` page (which is the actual "browse sources" entry point, and where `/browse` redirects to) is completely absent from the desktop navigation. Users on desktop have no direct nav entry to browse sources.

**Fix:** Add a Sources/Browse link to both `SideNav` and `BottomNav` nav arrays.

---

### P1-8 · `useSync` Has Stale Object Reference in useEffect Dependencies

**File:** `src/shared/hooks/use-sync.ts:L16`

```ts
useEffect(() => { ... }, [user, libraryItems, historyItems, addToLibrary, upsertHistory]);
```

`libraryItems` and `historyItems` are `Record<string, ...>` objects. Zustand creates a new object reference on every store mutation. Even though `hasSyncedInitial.current` prevents `runFullSync` from re-executing, the effect re-subscribes its `handleOnline` listener on every store update, which means rapid successive reads can attach multiple `online` listeners before they are cleaned up.

**Fix:** Only depend on `user?.uid`:
```ts
useEffect(() => { ... }, [user?.uid]);
```

---

### P1-9 · `userScalable: false` Breaks Accessibility

**File:** `src/app/(web)/layout.tsx`

```ts
export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
};
```

This is a blanket viewport setting that **prevents all zooming** across the entire app. WCAG 2.1 SC 1.4.4 (Level AA) requires content to be resizable up to 200%. Disabling zoom breaks this for users who need it.

**Fix:** Remove `userScalable: false` and `maximumScale: 1` from the layout viewport. If the reader itself needs to intercept pinch gestures, handle that locally in the reader component via touch event handlers — not globally.

---

### P1-10 · Settings: `confirm()` and `alert()` for Destructive Actions

**File:** `src/app/(web)/settings/page.tsx`

```ts
if (confirm("Yakin ingin menghapus semua Riwayat...")) {
  clearHistory();
  clearLibrary();
  alert("Data lokal berhasil dibersihkan.");
}
```

Native browser dialogs are synchronous, block the event loop, can be suppressed by browsers, look completely off-brand, and don't respect the app's dark theme. You already have `sonner` installed.

**Fix:** Use a proper confirmation modal (`Dialog` from `@radix-ui/react-dialog` is already in your deps) and a `sonner` toast for feedback.

---

## Part 3 — Medium Priority `[P2]`

### P2-1 · Design System: Two Conflicting Token Files

**Files:** `src/styles/tokens.css`, `src/app/(web)/globals.css`

These files define different values for the same conceptual tokens:

| Token | `tokens.css` | `globals.css @theme` |
|---|---|---|
| `--accent` | `#ef4444` (Red 500) | `#E8343A` (custom) |
| `--radius-sm` | `6px` | `8px` |
| `--radius-md` | `8px` | `12px` |
| `--radius-lg` | `12px` | `16px` |
| `--radius-xl` | `16px` | `24px` |

Since `tokens.css` is not imported (P1-3), `globals.css` wins. But if it ever gets imported, these conflicts will cause visual regressions. The duplication also adds maintenance overhead — designers and agents will be confused about which file to edit.

**Fix:** Single source of truth. Either merge all tokens into `globals.css` (preferred, since it's the active Tailwind v4 `@theme`) or use `tokens.css` as the base and import it at the top of `globals.css`.

---

### P2-2 · Design System: Invalid CSS in `tokens.css`

**File:** `src/styles/tokens.css:L95`

```css
.dark {
  --text-difference: mix-blend-mode: difference;
}
```

This is invalid CSS. A custom property value cannot contain a colon followed by a property name. CSS custom properties store values (e.g., `difference`), not declarations. This will silently fail.

**Fix:**
```css
--blend-mode-text: difference; /* then apply: mix-blend-mode: var(--blend-mode-text); */
```

---

### P2-3 · Font Loading: `--font-sans` Never Used, Inter Loaded Twice

**Files:** `src/app/(web)/layout.tsx`, `src/app/(web)/globals.css`

`layout.tsx` loads Inter via `next/font` and binds it to `--font-sans`:
```ts
const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
// Applied to: <html className={inter.variable}>
```

But `globals.css` uses `--font-ui` for the body font:
```css
--font-ui: "Inter Variable", "Inter", system-ui, ...;
body { font-family: var(--font-ui); }
```

The `--font-sans` variable is never referenced. The app is actually loading Inter as a fallback from the font stack string in `--font-ui` — not from the optimized Next.js `next/font` build (no font preloading, no LCP optimization, potential FOUT).

**Fix:**
```ts
// layout.tsx
const inter = Inter({ variable: "--font-ui", subsets: ["latin"] });
```
Remove the `"Inter Variable", "Inter"` strings from the `--font-ui` definition in `globals.css` — the variable will already be set by Next.js font.

---

### P2-4 · HTML `lang` Attribute: English Set, Content Is Indonesian

**File:** `src/app/(web)/layout.tsx`

```tsx
<html lang="en" ...>
```

All UI copy is in Indonesian (`"Beranda"`, `"Lanjut Baca"`, `"Sinkronisasi cloud belum aktif sepenuhnya"`, etc.). Incorrect `lang` attribute causes screen readers to use wrong pronunciation, breaks spell-check, and is a WCAG SC 3.1.1 violation.

**Fix:** `<html lang="id" ...>`

---

### P2-5 · Icon Inconsistency Between SideNav and BottomNav

**Files:** `src/components/app/side-nav.tsx`, `src/components/app/bottom-nav.tsx`

- **SideNav** history icon: `Clock`
- **BottomNav** history icon: `ClockCounterClockwise`

These are different icons for the same route. Pick one and be consistent across all nav surfaces.

---

### P2-6 · Missing Security Headers: No CSP, HSTS, Referrer-Policy

**File:** `next.config.ts`

Current headers added globally: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`. Missing:

```ts
{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
// Content-Security-Policy (build this carefully to not break Firebase/Cloudinary)
```

`X-XSS-Protection` is also deprecated in modern browsers (CSP supersedes it).

---

### P2-7 · API Cache Key: Unbounded Length with Complex Filters

**File:** `src/app/api/sources/[sourceId]/search/route.ts`

```ts
const filterKey = Object.keys(filters).length > 0 
  ? `:${JSON.stringify(filters)}`
  : "";
const cacheKey = `source:${sourceId}:search:${q}:${page}${filterKey}`;
```

A user with 15+ genres selected + format + status filters creates a very long JSON blob as the cache key. Redis recommends keys under 1KB. This also makes cache inspection hard.

**Fix:** Hash the filters:
```ts
import { createHash } from "crypto";
const filterKey = Object.keys(filters).length > 0
  ? `:${createHash("md5").update(JSON.stringify(filters)).digest("hex").slice(0, 8)}`
  : "";
```

---

### P2-8 · `apply-rate-limit.ts` at Project Root (Wrong Location)

**File:** `apply-rate-limit.ts` (project root)

This is a one-off script for bulk-injecting rate limiting into API routes. It belongs in `scripts/` or similar, not at the project root where it could be confused for config, or accidentally imported. It should also be excluded from TypeScript compilation via `tsconfig.json` `exclude`.

---

### P2-9 · `next.config.ts`: `localPatterns` Misuse

**File:** `next.config.ts`

```ts
localPatterns: [
  { pathname: "/api/proxy/image" },
],
```

`localPatterns` is for static assets served from the filesystem (e.g., images in `/public` or `src`). It has no effect on API routes that return image data. This config entry does nothing and is misleading.

**Fix:** Remove it. The proxy endpoint already returns proper `Content-Type` and `Cache-Control` headers.

---

### P2-10 · No `ErrorBoundary` — Client Errors Crash the Whole Page

No `ErrorBoundary` component exists in the project. A single throw in any Client Component cascades to a blank screen. Given the app makes external network calls (Shinigami API, Firebase), failures are expected.

**Fix:** Wrap feature sections with error boundaries:
```tsx
// src/components/ui/error-boundary.tsx
class ErrorBoundary extends React.Component<...> { ... }
```

At minimum, wrap `AppShell` children and each page's main content section.

---

### P2-11 · `ThemeProvider` Defaulting to Dark but Applying via `class`

**File:** `src/components/providers.tsx`

```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
```

`next-themes` sets `class` on `<html>`. But `globals.css` uses:
```css
:root, .dark { /* dark values */ }
.light { /* light values */ }
```

This means `:root` ALWAYS applies dark values, and `.light` only overrides when `.light` class is present. Light mode works correctly, but if a user's system preference is `light` and `enableSystem` is true, there's a brief flash of dark before hydration applies the `.light` class (because `:root` defaults dark).

**Fix:** Either:
- Remove the `:root` base defaults from `@layer base` and only use `.dark` for dark values, or
- Use `defaultTheme="system"` instead of hardcoded `"dark"`, and set the `<html>` `data-theme` accordingly

---

### P2-12 · Global Search: No Server-Side Caching

**File:** `src/app/api/sources/search/route.ts` (global search)

The per-source search route uses `swrCache` with `CACHE_TTL.SEARCH` (1 hour). The global multi-source search route has **no caching at all** — every identical query fans out to all sources fresh.

**Fix:** Apply the same `swrCache` pattern with a composite cache key.

---

### P2-13 · Download Store: Potential Race Condition in `processQueue`

**File:** `src/shared/store/download-store.ts`

If `addDownload` is called multiple times in rapid succession before the first `processQueue` execution sets `isDownloading: true`, multiple coroutines can simultaneously pass the `if (isDownloading || queue.length === 0) return;` guard. `isDownloading` is read optimistically before the first `set({ isDownloading: true })` call completes.

In practice this only affects concurrent UI interactions, but should be guarded.

**Fix:** Use a module-level `Promise` lock instead of a Zustand flag for the queue processor.

---

## Part 4 — Low Priority / Tech Debt `[P3]`

### P3-1 · `tokens.css`: Entirely Dead Code

**File:** `src/styles/tokens.css`

As established in P1-3, this file is never imported and has no effect. Additionally it contains:
- Conflicting radius values (P2-1)
- Invalid CSS syntax (P2-2)
- Duplicate definitions of everything in `globals.css`

**Fix:** Delete the file. Document all token decisions in `globals.css` comments.

---

### P3-2 · `env.ts`: `DATABASE_URL` + Supabase Variables Declared But Unused

**File:** `src/env.ts`

The schema validates `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. None of these are actually used anywhere in the current codebase. The app uses Firebase (Firestore) for sync, not Supabase or a relational DB.

This:
1. Forces all deployments to set fake values for unused services
2. Confuses new contributors about the actual data stack
3. Bloats the env validation surface

The `pnpm.onlyBuiltDependencies` also lists `"@prisma/engines"` and `"prisma"` — Prisma artifacts from a previous architecture. And `.gitignore` has `/src/generated/prisma` — a leftover Prisma path.

**Fix:** Remove all Supabase/Prisma/DATABASE_URL references from `env.ts`, `package.json` `pnpm` config, and `.gitignore`.

---

### P3-3 · Cloudinary: Installed But Unused

**Files:** `package.json`, `src/server/lib/storage/cloudinary.ts`

`cloudinary` (v2) is in `dependencies` and there's a `cloudinary.ts` adapter in `src/server/lib/storage/`. But no API route or source adapter calls it. It's a dead ~700KB+ dependency.

**Fix:** Either implement it (for cover image hosting) or remove it from `package.json` and delete `cloudinary.ts`.

---

### P3-4 · `firebase-debug.log` Not in `.gitignore`

**File:** `.gitignore`, `firebase-debug.log` (project root)

The Firebase CLI debug log is committed to the repository. It may contain environment paths, auth tokens, or sensitive debug info. 

**Fix:**
```
# In .gitignore
firebase-debug.log
firebase-debug.*.log
```

---

### P3-5 · `.gitignore`: Duplicate `.vercel` Entry with Mixed CRLF

**File:** `.gitignore`

The file has `.vercel` listed twice — once with LF and once with CRLF at the end:
```
.vercel          ← LF
.vercel\r\n      ← CRLF
```

Minor, but indicates a git config issue (`core.autocrlf`). The global search route (`src/app/api/sources/search/route.ts`) also has mixed CRLF/LF line endings.

**Fix:** Run `git config --global core.autocrlf input` and `git add --renormalize .`.

---

### P3-6 · Empty Directories in `src/`

**Folders:** `src/hooks/`, `src/components/layout/`

These folders are empty. All hooks live in `src/shared/hooks/`. These ghost directories add confusion about where to add new hooks/layout components.

**Fix:** Delete both empty folders, or add a `.gitkeep` with a comment explaining intent.

---

### P3-7 · PWA Manifest: Incomplete Icon Set

**File:** `src/app/manifest.ts`

```ts
icons: [
  { src: "/icon.png", sizes: "192x192", type: "image/png" },
  { src: "/icon.png", sizes: "512x512", type: "image/png" },
],
```

Problems:
- Single file used for both sizes (not actually a 512×512 PNG)
- No `purpose: "maskable"` icon for Android adaptive icons
- No `purpose: "any"` variant
- No Apple touch icon meta tag in `layout.tsx`

For a proper PWA install experience, you need separate source files for each size and a maskable variant.

---

### P3-8 · `next.config.ts`: Unnecessary `turbopack: {}`

**File:** `next.config.ts`

```ts
turbopack: {},
```

Empty Turbopack config object has no effect. Turbopack is already the default in Next.js dev mode and doesn't need to be explicitly enabled with an empty config.

---

### P3-9 · Pages Missing `<Metadata>` Exports

**Files:** `src/app/(web)/library/page.tsx`, `src/app/(web)/history/page.tsx`, `src/app/(web)/readlist/page.tsx`, `src/app/(web)/updates/page.tsx`

These client pages don't export `generateMetadata`. They'll all show `"Yomirra"` as the browser tab title with no page-specific context. Only the reader page has proper dynamic metadata.

**Fix:** Add metadata exports to each page. For client pages, use the `metadata` export const pattern (Next.js will use it at the segment level):
```ts
// Non-dynamic pages can use static metadata export
export const metadata: Metadata = {
  title: "Library — Yomirra",
  description: "...",
};
```

---

### P3-10 · NSFW Filter: Client-Side Only, Bypassable, Incomplete

**Files:** `src/shared/api-client.ts`, `src/shared/store/settings-store.ts`

The NSFW filter adds negative genre exclusions to the search query (e.g., `-adult`, `-mature`). This:
1. Is stored in `localStorage` (no auth enforcement)
2. Only applies to search/browse — users can directly navigate to known manga URLs
3. Only covers specific genre IDs, not all mature content
4. Doesn't work at all in global search (P0-3)

This is fine as a "preference" but should not be presented as a safety control. Document it clearly in the UI.

---

### P3-11 · Library Page: `activeSourceId` Hardcoded

**File:** `src/app/(web)/library/page.tsx:L35`

```ts
const activeSourceId = "shinigami";
```

This is a hardcoded constant, not reactive to the source registry. When new sources are added, this page won't reflect them without manual changes.

---

### P3-12 · `src/shared/hooks/use-mounted.ts` Pattern Can Be Replaced

**File:** `src/shared/hooks/use-mounted.ts`

The `useMounted` pattern (setting state to true after mount to avoid hydration mismatch) is used in `home-view.tsx` and `settings/page.tsx`. In Next.js 14+ App Router with `"use client"` and `react 19`, you can often replace this with `React.use(...)` or `useDeferredValue` approaches. Not urgent, but worth reviewing if hydration flicker appears.

---

## Summary Table

| ID | Category | File(s) | Severity | Status |
|---|---|---|---|---|
| P0-1 | Logic | `download-store.ts` | CRITICAL | Wrong API URL |
| P0-2 | State/Firebase | `library-store.ts`, `use-sync.ts` | CRITICAL | Write storm loop |
| P0-3 | API | `api-client.ts`, `search/route.ts` | CRITICAL | NSFW filter ignored |
| P1-1 | Security | `image.ts` | HIGH | Timing attack |
| P1-2 | Security | `rate-limit.ts` | HIGH | IP spoofing |
| P1-3 | CSS/Design | `tokens.css` | HIGH | Orphaned dead code |
| P1-4 | Architecture | `library/page.tsx` | HIGH | Catalog ≠ Library |
| P1-5 | State | `use-auth.ts`, `use-sync.ts` | HIGH | Double sync on login |
| P1-6 | State | `history-store.ts` | HIGH | Unbounded localStorage |
| P1-7 | UX/Nav | `side-nav.tsx` | HIGH | Sources missing from nav |
| P1-8 | React | `use-sync.ts` | HIGH | Stale dep in useEffect |
| P1-9 | A11y | `layout.tsx` | HIGH | Zoom disabled globally |
| P1-10 | UX | `settings/page.tsx` | HIGH | `confirm()`/`alert()` |
| P2-1 | Design System | `tokens.css`, `globals.css` | MEDIUM | Conflicting tokens |
| P2-2 | CSS | `tokens.css` | MEDIUM | Invalid CSS declaration |
| P2-3 | Performance | `layout.tsx`, `globals.css` | MEDIUM | Font var mismatch |
| P2-4 | A11y | `layout.tsx` | MEDIUM | `lang="en"` wrong |
| P2-5 | UX | `side-nav.tsx`, `bottom-nav.tsx` | MEDIUM | Inconsistent icons |
| P2-6 | Security | `next.config.ts` | MEDIUM | Missing CSP/HSTS |
| P2-7 | Performance | `search/route.ts` | MEDIUM | Unbounded cache key |
| P2-8 | DX | `apply-rate-limit.ts` | MEDIUM | Wrong file location |
| P2-9 | Config | `next.config.ts` | MEDIUM | `localPatterns` misuse |
| P2-10 | Reliability | — | MEDIUM | No ErrorBoundary |
| P2-11 | UX/Theme | `globals.css` | MEDIUM | Dark flash on light mode |
| P2-12 | Performance | Global search route | MEDIUM | No server cache |
| P2-13 | Logic | `download-store.ts` | MEDIUM | Queue race condition |
| P3-1 | Tech Debt | `tokens.css` | LOW | Delete entire file |
| P3-2 | Config | `env.ts` | LOW | Dead Supabase/Prisma vars |
| P3-3 | Deps | `package.json` | LOW | Unused Cloudinary dep |
| P3-4 | Git | `.gitignore` | LOW | `firebase-debug.log` committed |
| P3-5 | Git | `.gitignore` | LOW | Duplicate + CRLF |
| P3-6 | DX | `src/hooks/`, `src/components/layout/` | LOW | Empty dirs |
| P3-7 | PWA | `manifest.ts` | LOW | Incomplete icon set |
| P3-8 | Config | `next.config.ts` | LOW | Useless `turbopack: {}` |
| P3-9 | SEO/UX | Multiple pages | LOW | Missing metadata exports |
| P3-10 | UX | `api-client.ts` | LOW | NSFW incomplete filtering |
| P3-11 | Architecture | `library/page.tsx` | LOW | Hardcoded source ID |
| P3-12 | React | Multiple | LOW | `useMounted` pattern review |

---

## Recommended Fix Order

### Immediate (before next deploy)
1. **P0-1** — Fix download URL (broken feature, data model needs `mangaId`)
2. **P0-2** — Add `_setItemLocal` to stores, fix sync loop (Firestore bill risk)
3. **P0-3** — Pass filters through global search server handler
4. **P1-1** — `timingSafeEqual` in image proxy (security)
5. **P1-2** — Fix IP extraction in rate limiter (security)

### This Sprint
6. **P1-3** — Resolve tokens.css fate (delete or integrate)
7. **P2-1** — Reconcile design token conflicts
8. **P1-5** — Remove double sync on login
9. **P1-6** — Add history item cap
10. **P1-9** — Remove global `userScalable: false`
11. **P2-4** — Fix `lang="en"` → `"id"`
12. **P2-3** — Fix font variable name

### Backlog
13. **P1-4** — Implement real user Library view
14. **P1-7** — Add Sources to nav
15. **P2-10** — Add ErrorBoundary
16. **P2-6** — Add HSTS + Referrer-Policy headers
17. **P3-1 through P3-12** — Clean up as sprint allows

---

*Generated by full static analysis of 224 files. Grill session — Yomirra Full Audit, June 2026.*
