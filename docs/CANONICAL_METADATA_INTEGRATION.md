# Metadata-assisted catalog integration

Status: implementation candidate in PR #173; no production activation or live acceptance claimed.

## Contract
- MangaBaka v2 match and detail endpoints, documented at https://mangabaka.org/developers/guides/map-your-ids and https://mangabaka.org/developers/guides/first-request.
- Explicitly opt in only where the intended usage, attribution and ShareAlike obligations are permitted: YOMIRRA_MANGABAKA_METADATA=permitted. No API token required. No nested third-party data imported, no artwork or synopsis copied from metadata provider.
- Cache successful query resolutions for one day, pace requests, respect 429 Retry-After, no bulk harvesting. API failures leave source results unchanged. Full dumps, if licensed and required later, are a separate ingestion concern.
- Search projection groups exact normalized aliases only with compatible known comic type, unique candidate, distinct providers and no known conflicting authors. It is reversible and does not write bookmarks, chapter history or shared work identities.
- Display attribution in Search and Help. Keep existing MAL integration unchanged.

## Required before enabling
- Review https://mangabaka.org/about/data-license for non-commercial use, third-party rights and redistribution conditions. If commercial, secure appropriate license first. Do not assume free public API means unlimited use rights.
- Verify live v2 response against the documented schema (mock fixtures are not live evidence). Confirm actual provider coverage and rate limits.
- Run an authorized representative 300-title benchmark using actual catalog samples, measuring coverage, false matches, alias recall and request cost. Do not crawl the API for bulk datasets.

## Remaining product acceptance
- A durable Yomirra-owned work registry with provider ID aliases and merge/split audit, and canonical work detail for unsaved works.
- Link Home, Jelajah, Populer, Library and History to the same identity resolver; persistent per-source cursor and canonical bookmark semantics.
- External ID bridge and MangaUpdates fallback subject to their individual terms, live contract and coverage tests.
- Canonical metadata from appropriately licensed sources; provider metadata remains the fallback.
- Full UI, account and release verification. Do not label this as global catalog completion.
