# Yomirra — Restricted Source Intake and Implementation Contract

> Date: 2026-11-10 · Status: **DRAFT / DISABLED / NOT LIVE-TESTED**.
> Scope: Yomirra only. Names are neutral in product documentation and commit history.
> Source baseline: Daily-Tools main ef0e7b52048a856dd39d2b75e11b11e6982e057e (177 JavaScript files).
> Remote starting HEAD: Yomirra main 45438c2dd875ee9b0b3a8fee2092e837325b7c57.
> This document does not approve deployment, upstream credentials, copyright exceptions or activation.

## Product intent and disposition

The owner wants Yomirra-compatible restricted source implementations, **off by default**, with \`isNsfw: true\` and content classification compatible with the existing application. Do not conflate a product reader source with unrelated media downloaders or galleries of unrelated individual posts.

| Alias | Upstream role in source audit | Decision |
| --- | --- | --- |
| RCS-01 | Ordered image gallery that can be mapped to one book/chapter | **Implemented as disabled candidate** on a separate branch; live permission/compatibility UNVERIFIED |
| RCS-02 | Tagged individual image posts, not manga chapters | **EXCLUDED** from MangaSource; adding a separate art/post product would require approval |
| RCS-03 | Episode/video/iframe metadata, not page-reader data | **EXCLUDED**; belongs to video-product analysis, not Yomirra |
| RCS-04 | Mixed illustration source with cookie and external proxy requirements | **EXCLUDED** pending authorized, official API and rights model |

The existing restricted source built into Yomirra is unchanged.

## RCS-01 specification

- Server adapter: \`src/server/lib/sources/adapters/restricted-gallery-01/\`.
- Public source ID/name: \`rcs-01\` / \`Restricted Source 01\`; avoid exposing a third-party brand in the UI.
- \`isInstalled: true\`, \`isEnabled: false\`, \`status: "in-dev"\`, \`isNsfw: true\`.
- All capability flags remain false until real endpoint, moderation, rights, age policy, reader, and security acceptance is verified. Download is false.
- Built-in source is intentionally registered for reproducible QA but excluded from discovery and search by status/enabled gates. Its own methods independently reject while disabled because the SourceManager lookup is not by itself an authorization check.
- Internal transport uses the existing HttpClient/safeFetch, fixed HTTPS host, no third-party mirror/proxy, zero redirects, bounded size and timeout. No secrets, cookies or API-key harvesting.
- Gallery ID and media ID must be strictly validated numeric identifiers; output has a stable synthetic chapter \`<galleryId>-ch1\`, deterministic zero-based page indices and site-controlled URLs.
- No image download or upstream live requests were performed by this workstream. No claim of real image reachability, terms clearance or browser reader support.
- The provided normalizer and API mapping are derived from publicly accessible source-code structure, not a license to redistribute its content or scrape in violation of source terms. No verbatim import of third-party script.
- Restriction preference: content rating always classified as restricted. Current default-hide policy is not proof of age verification or prohibited-content filtering. Before ever activating, independently enforce eligibility across server routes, search, image proxy, cache, recommendation, download and direct reader requests.

## Backlog / acceptance

| ID | Required evidence | Status |
| --- | --- | --- |
| RCS-A0 | Preserve AGY local branch and reconcile it with remote without discarding work | BLOCKED: local workspace not accessible in this GitHub-only pass |
| RCS-A1 | Source terms, rights, age access and prohibited-content moderation | BLOCKED / not verified |
| RCS-A2 | Gallery normalization, stable detail/chapter/page identities | CODED, offline tests authored but NOT RUN |
| RCS-A3 | Search, latest and popular API compatibility and truthful pagination | CODED DRAFT, live NOT VERIFIED, capability off |
| RCS-A4 | Host/IP/redirect/size/timeout safeguards | CODED against existing HttpClient; runtime NOT VERIFIED |
| RCS-A5 | Disabled source cannot request network or appear in discovery | CODED, test authored but NOT RUN |
| RCS-A6 | Consumer and server endpoint access restrictions including direct chapter/page routes | BLOCKED before enabling |
| RCS-A7 | Source error codes, 403/429/timeout, cache and other-source regression | NOT RUN |
| RCS-A8 | Reader/proxy responsive/browser/device checks | NOT RUN |
| RCS-A9 | Release, canary, rollback and explicit owner acceptance | NO-GO |

## AGY local-workspace reconciliation

Do not replace or undo an existing local branch implementing the same candidate. First compare local branch file contents and Git SHAs against this isolated remote branch; preserve local UX fixes, local tests and the new source work. Reuse/refactor only the best verified implementations and avoid duplicated source IDs. Do **not** merge automatically. Never \`git reset --hard\`, force-push, or auto-stash user work. If the current local branch was built on a withdrawn remote PRD, reconcile with the newer remote main before proceeding.

## Validation and rollback

AGY must run typecheck, lint, focused Vitest and full adapters regression suite against a clean worktree at exact SHA; additionally inspect existing source-access, image proxy and NSFW preference route tests. Report command, exit code and complete actual evidence. An authored test is not a PASS. Leave the feature disabled even if deterministic tests pass, until rights, content safety, live authorized source compatibility and owner activation gates are accepted.

Rollback: keep this branch unmerged, or remove only its source registry and adapter registrations in an isolated follow-up commit. Do not alter existing restricted-source settings.
