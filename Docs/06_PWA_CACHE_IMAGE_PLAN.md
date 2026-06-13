# PWA, Image Cache, and Metadata Cache Plan

This plan should be integrated into the roadmap after the UI shell/design language is stable.

## Direction

Treat Service Worker as the foundation of Yomirra’s future PWA/offline mode, not as a one-off image optimization hack.

Goals:

- reduce repeated image loading
- make covers and current chapter images feel instant after first load
- prepare future offline/download chapter mode
- avoid unbounded storage growth
- avoid open proxy/security issues
- handle third-party manga image constraints

## 1. Service Worker setup must be explicit

Audit and choose one approach for Next.js App Router:

- `next-pwa`
- custom Service Worker + Workbox
- Serwist/Workbox style setup

Before implementation, verify:

- App Router compatibility
- Vercel compatibility
- production-only registration if safest
- cache versioning strategy
- update/registration lifecycle
- no conflict with Next build/static assets

Do not implement blindly.

## 2. Separate cache types

### A. React Query cache

React Query cache is runtime/server-state cache.

Use for:

- avoiding duplicate fetches in-session
- smoother route transitions
- loading/error state management

It is not the main persistent cache by default.

### B. Persistent metadata cache

For metadata:

- manga detail
- chapter list
- source list
- selected search results
- supporting bookmark/history metadata

Use:

- IndexedDB
- persist adapter if using TanStack Query persistence
- versioned schema
- TTL/staleness policy
- migration/cleanup strategy

### C. Image/binary cache

For covers and reader images:

- Service Worker
- Cache API
- Workbox runtime caching

Never store images in localStorage.

## 3. Image proxy is almost certainly required

Assume proxy is required until proven otherwise.

Reasons:

- anti-hotlink
- referer requirement
- CORS limitation
- opaque responses
- unstable image host
- blocked remote optimization
- unsafe arbitrary domains
- inconsistent cache headers

Required proxy design:

- `/api/image-proxy` or equivalent
- strict source allowlist
- validate source IDs and known image URL patterns
- no arbitrary open URL proxy
- normalize cache keys
- protect against SSRF/open redirect
- respect content-type/image only
- set safe cache headers if response is valid
- fail gracefully

## 4. Cache cleanup is mandatory

Use one of:

- Workbox `ExpirationPlugin`
- custom LRU cache manager

Minimum policies:

- max entries for cover cache
- max entries for reader image cache
- max age for covers
- max age for reader pages
- cache versioning
- cleanup on version/source change
- manual “clear cache” action in Settings later
- storage pressure awareness where possible

Never cache all chapters without limits.

## 5. Recommended strategy

### App shell/static assets

- precache safe static assets
- stale-while-revalidate where appropriate

### API/metadata

- React Query runtime cache
- IndexedDB persistence for selected metadata
- stale-while-revalidate for source/detail/chapter list
- network-first for data that must be fresh

### Manga covers

- cache-first with expiration
- fallback to network/proxy
- background refresh if needed

### Reader images

- cache-first with expiration/LRU
- cache current chapter progressively
- prefetch only a few next images
- optional prefetch first image of next chapter near chapter end

## 6. Implementation boundary

Do not build full offline mode yet.

Phase scope:

1. Audit current image/metadata flow.
2. Choose SW setup.
3. Create cache architecture doc.
4. Implement limited runtime image caching for covers + reader.
5. Implement cleanup policy.
6. Add development cache diagnostics/logging.
7. Do not alter UI/UX broadly.
8. Do not alter route/data contracts.
9. Do not force `next/image` if incompatible.
10. Do not create an open image proxy.

## 7. Required output before coding

Before implementing, report:

- selected SW approach and why
- metadata cache boundary
- image cache boundary
- proxy design
- cleanup policy
- cache key strategy
- iOS Safari/storage eviction risks
- files to modify
- risks and rollback plan

## 8. Acceptance criteria

Done only if:

- cover image cache reuses previously loaded covers
- reader current chapter images can reuse cache
- cache has expiration/limits
- no unbounded storage growth
- no open proxy vulnerability
- reader navigation not broken
- image rendering not broken
- lint/typecheck/build pass
- known limitations documented
