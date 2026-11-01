# Settings and iconography audit — 31 October 2026

This is a source audit plus the named automated checks, not a claim that every control passed on real devices or a live Firebase account.

## Settings controls

| Control | Wiring/effect | Change or limit |
| --- | --- | --- |
| Account/sync | Auth state and `/account` | Label is `Akun terhubung`; sign-in alone is not backend-health evidence |
| Reading time | stats-store totalReadingTimeMs | Existing measurement retained; Reader progress correctness remains separately gated |
| Check on app start | settings-store -> useUpdateChecker -> scanLibraryUpdates | Existing cooldown/startup behavior retained |
| Check interval | persisted minutes -> scan cooldown | Native disabled state when automatic checking is off; value retained |
| Update marker | notifyForAllLibraryItems -> unread count / updates bell | Existing badge behavior retained |
| Sources | `/sources` management -> discovery source preferences | Entry explains that Cari has its own selection |
| Automatic source routing | Persisted routingMode + pure resolver | No production call site for resolveSourceRoute was found; inert dropdown removed from UI, stored value retained. Implementing fallback requires verified title/chapter identity and its own scope |
| Main language | settings-store -> request/cookie options -> MangaDex chapter filtering | Honest source-support description; priority order retained |
| Theme | next-themes | Available on desktop and mobile; persistence tested |
| Data saver | settings-store -> read options -> MangaDex at-home quality | Available where provider supports it; no universal compression claim |
| Download screen wake lock | settings-store -> useWakeLock -> DownloadManager | Turning off releases an acquired or pending-granted lock; does not change Reader's separate preference |
| Adult content | safe default hideNsfw -> shared policy/server requests | Explicit prior opt-in retained; no bulk legacy record reclassification |
| Backup/restore | existing backup engine v1–v3 contracts | Existing tests run; no user backup imported or exported in this task |
| Clear temporary cache | reading-buffer cache cleanup | Browser quota is an estimate for origin storage, not free device capacity |
| Clear local history/bookmarks | existing confirmation -> store clearing | Behavior retained; not exercised on real user data. Authenticated cloud propagation requires dedicated staging acceptance |
| Shared-device cleanup | logout + local-data-cleanup confirmation | Behavior retained; not exercised on real user data |
| Version | package.json | Replaces stale hard-coded display version |

Provider health uses actual probe timestamps when supplied. Without a probe result it says `Belum diperiksa`; old persisted client observations expire after five minutes. Browser connectivity is not a Firebase reachability guarantee.

The browser preference regression checks safe defaults, data-saver and language persistence after reload, theme, automatic-check disable semantics and the source-management link. Wake-lock tests use a mock browser capability; hardware/browser policy remains unverified. Advanced routing is omitted until it has a functioning consumer, rather than appearing as an active placeholder.

## Iconography contract

Phosphor is the existing UI family. No dependency is added or removed. See `ICONOGRAPHY_INVENTORY_20261031.md` for every direct JSX consumer, including Admin and Reader.

| Meaning / previous usage | Contract |
| --- | --- |
| Discovery formerly called Library | Compass, label Jelajah |
| Personal shelf formerly Rak Buku | Books, label Library |
| Save title | BookmarkSimple; fill for saved state |
| Default actions formerly bold/small duotone | regular |
| Selected navigation or toggled state | fill when it conveys state, with label/pressed semantics |
| Large empty/error illustration | duotone allowed; accompanying text explains status |
| Source/provider brand | Existing brand/custom mark retained |
| Animated source-detail icon | Existing MorphIcon wrapper retained; reducedMotion="user" |

Use existing semantic tokens; UI glyphs normally 16–20 px, navigation/page symbols 20–24 px, illustrations 32–48 px. An icon's size is distinct from its touch target. Shared IconButton has a minimum 44x44 CSS px target; direct icon-only controls still require screen-by-screen optical/target acceptance. Keep text labels for ambiguous actions, hide decorative icons from assistive technology where appropriate, and convey status with words. Do not infer health from icon color.

Morphicons has one feature consumer in MangaDetailView via the shared wrapper. It remains a deliberate motion exception. Brand icons, custom cover placeholders and the Morphicon paths are not grounds for adding another UI icon family. The inventory proves syntax coverage; it does not prove every glyph's optical alignment, VoiceOver reading order or all-screen visual acceptance.
