# Cached content safety follow-up — 31 October 2026

A final source review found two additional P0 paths after the initial API safety change: the related-title client cache omitted content preference from its key and discarded the server candidate's rating during conversion; mounted detail/Reader content could retain opted-in SSR/cache data after the user enabled safety without reloading.

Recommendations now key by safe-content/discovery eligibility state, preserve classification evidence, and filter both incoming candidates and displayed cached candidates. Provider-specific fallback skips disabled sources. The metadata source remains separate from chapter identity; this adds no mapping or automatic chapter fallback.

Detail and Reader share a client content boundary. Safe mode blocks adult-only provider metadata or restricted title classification before child components mount, so their request/history/image effects do not run. Re-enabling safety unmounts opted-in content and uses existing child cleanup paths. The blocked state contains no title/cover and links back to Jelajah. This display gate complements the server policy; it is not an authentication boundary or a migration of unknown legacy records.

Focused tests cover default blocking, safe mixed-provider content, unrated titles on known adult-only sources, opt-out without reload, recommendation cache separation and disabled-provider display. Existing Reader offline lifecycle, paged completion and detail behavior tests are run alongside them. No completion, history retention, Firebase, download deletion or backup contract is changed.

Physical-device acceptance, mixed-provider legacy classification and live MangaDex chapter/image validation remain release gates. A passing fixture cannot establish upstream availability.
