# Architecture Overview

Yomirra is a Next.js App Router application with a client-facing reader, server API routes, pluggable source adapters, persistent browser state, and optional cloud synchronization.

## High-Level Flow

```mermaid
flowchart LR
    UI[React UI] --> RQ[TanStack Query]
    UI --> ZS[Zustand Stores]
    RQ --> API[Next.js API Routes]
    API --> SM[Source Manager]
    SM --> BA[Built-in Adapters]
    SM --> DA[Dynamic Adapter]
    BA --> EXT[Third-party Sources]
    DA --> EXT
    API --> RC[Redis Cache]
    ZS --> LS[Browser Storage]
    ZS --> FB[Firebase Sync]
    UI --> SW[Service Worker and Cache Storage]
```

## Layers

### User Interface

User-facing routes live under `src/app/(web)/`.

Responsibilities include:

- Discovery and source browsing.
- Multi-source search.
- Library and bookmark management.
- Manga detail and chapter navigation.
- Reader controls.
- Download management.
- Settings and source configuration.

Shared UI lives under `src/components/`. Pages should reuse established primitives instead of recreating styling and interaction patterns.

### Client State

Zustand stores under `src/shared/store/` hold persistent client state such as:

- Library and bookmarks.
- Reading history.
- Reader preferences.
- Search filters.
- Download queue and downloaded chapter metadata.

Server data and request state belong in TanStack Query rather than long-lived Zustand state.

### API Client and Routes

The browser uses a shared API client to call Next.js routes under `src/app/api/`.

Source routes follow this shape:

```text
/api/sources
/api/sources/[sourceId]/popular
/api/sources/[sourceId]/latest
/api/sources/[sourceId]/search
/api/sources/[sourceId]/filters
/api/sources/[sourceId]/manga/[mangaId]
/api/sources/[sourceId]/manga/[mangaId]/chapters
/api/sources/[sourceId]/manga/[mangaId]/chapters/[chapterId]/pages
```

Routes validate parameters, enforce rate limits where configured, resolve the source through `SourceManager`, and cache suitable responses.

### Source Layer

`MangaSource` is the normalized contract shared by all sources. A source adapter is responsible for:

- Remote request construction.
- Source-specific headers.
- API or HTML parsing.
- Data normalization.
- Pagination semantics.
- Search-filter mapping.
- Page referer metadata when required.

Built-in adapters are registered in:

```text
src/server/lib/sources/adapters/index.ts
```

Dynamic manifests are resolved by `SourceManager` and handled by `DynamicSourceAdapter`.

### Caching

Server responses use Redis through `withCache`.

The cache:

- Returns fresh cached values when valid.
- Fetches and stores a new value when needed.
- Can fall back to a stale value if the upstream source fails.
- Uses route-specific TTL values.

Cache availability should improve reliability, not become a requirement for correctness. Upstream source failures must still be handled explicitly.

### Offline Reading

Chapter downloads use browser Cache Storage and service-worker routes. Offline reading depends on:

- The service worker controlling the page.
- Browser storage quota.
- Cached chapter metadata and images remaining available.
- The browser's PWA and background-storage behavior.

Code-level and unit-test verification must not be described as complete device-level offline verification.

### Authentication and Synchronization

Firebase provides authentication and cloud synchronization for supported user data. Local state remains important because the application must tolerate offline sessions and temporary sync failures.

Synchronization must avoid replacing meaningful local data with an empty remote state.

## Multi-Source Search

Search source selection is independent from the global Source Config state.

For each active source:

1. Fetch its filter capabilities.
2. Build a payload containing only filters that source supports.
3. Execute a source-specific search request.
4. Keep unsupported sources in the search with unsupported filters omitted.
5. Merge results in the client.
6. Preserve source identity in keys and navigation.

A failed source must not automatically erase successful results from another source.

## Error Handling

Errors are expected at source boundaries. Adapters and API routes should provide:

- Timeouts.
- Predictable normalized errors.
- Independent failure handling in multi-source views.
- Empty and retry states.
- No accidental leakage of remote secrets or raw private responses.

## Architectural Rules

- Normalize source data before it reaches shared UI.
- Keep server secrets out of client bundles.
- Keep query keys complete and deterministic.
- Avoid destructive state updates when capability data is loading or incomplete.
- Prefer small, focused changes over broad migrations.
- Treat runtime, automated-test, and code-inspection evidence as different levels of verification.
