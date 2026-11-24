# Keiyoushi readiness reconciliation

This is a static code inventory, not a live reader verification or rollout approval. It supersedes rollout statements in the historical 22 November porting document. All 31 candidates remain disabled and outside public discovery.

## Evidence and licensing

- Upstream code reference: https://github.com/keiyoushi/extensions-source/tree/582615a352e38380378cb3f3c3001b0fa7897fe9 (Apache-2.0 according to the upstream repository). Upstream commit reference does not prove the owner ZIP was generated from that revision.
- Owner ZIP lineage, per-file attribution and permission to access or redistribute provider content remain unverified. Code licensing does not grant content rights.
- Existing unit fixtures exercise parser contracts; they do not establish live compatibility. Current changes add identity and rollout tests. Live metadata verification is explicit, one approved SFW candidate at a time, outside routine CI.

## Candidate disposition

| Candidate | Implementation | Current disposition |
|---|---|---|
| manhwa-list | shared engine | Historical metadata/reader probe; permission and current live contract unverified |
| izanamiscans | shared engine | Historical metadata/reader probe; permission and current live contract unverified |
| ainzscansid | dedicated API | Historical schema drift; canonical ID normalized; current API contract unverified |
| soul-scans | shared engine | Historical DNS failure; do not infer recovery |
| komikindoid | prototype | Duplicate of built-in Komikindo; no separate rollout |
| manga-plus-by-shueisha | prototype | Restricted access; official authorized integration only |
| mangatoon-limited | prototype | Paywall; official authorized integration only |
| webcomics | prototype | Authentication boundary; official authorized integration only |
| cosmicscans | shared engine | Mixed classification and access permission unverified |
| kiryuu | shared engine | Mixed classification and access permission unverified |
| manhuarm | shared engine | Mixed classification and access permission unverified |
| manhwa-indo | shared engine | Mixed classification and access permission unverified |
| mikoroku | shared engine | Mixed classification and access permission unverified |
| akuma | staged engine | Restricted; disabled, no live content probe or public activation |
| astral-scans | staged engine | Restricted; disabled, no live content probe or public activation |
| crotpedia | staged engine | Restricted; disabled, no live content probe or public activation |
| dojing-net | staged engine | Restricted; disabled, no live content probe or public activation |
| doujinku | staged engine | Restricted; disabled, no live content probe or public activation |
| dreamteams-scans | staged engine | Restricted; disabled, no live content probe or public activation |
| hentai-crot | staged engine | Restricted; disabled, no live content probe or public activation |
| hentaihand | staged engine | Restricted; disabled, no live content probe or public activation |
| kumapoi | staged engine | Restricted; disabled, no live content probe or public activation |
| mangasusu | staged engine | Restricted; disabled, no live content probe or public activation |
| manhwadesu | staged engine | Restricted; disabled, no live content probe or public activation |
| manhwaland-mom | staged engine | Restricted; disabled, no live content probe or public activation |
| mihentai | staged engine | Restricted; disabled, no live content probe or public activation |
| pix-hentai | staged engine | Restricted; disabled, no live content probe or public activation |
| ryukomik | staged engine | Restricted; disabled, no live content probe or public activation |
| sekte-doujin | staged engine | Restricted; disabled, no live content probe or public activation |
| shiro-doujin | staged engine | Restricted; disabled, no live content probe or public activation |
| tooncubus | staged engine | Restricted; disabled, no live content probe or public activation |

## Release acceptance

Every candidate requires identifiable code provenance, permitted access, accurate content classification, independent current functional evidence and owner approval before enabling it. A failure or unsupported operation is not an invitation to bypass access restrictions. No existing source or user data is deleted; conflicting reserved custom identities are prevented from public resolution. Routine health reports must not count staged providers as healthy or broken public sources.
