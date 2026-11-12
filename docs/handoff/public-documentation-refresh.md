# Public documentation refresh — 2026-11-08

Status: documentation authored; independent QA and final validation recorded by the controller separately. No application code, deployment, release, licensing decision, or production configuration change is part of this document refresh.

## Scope and reader outcome

The README now starts with the first reading journey and capability limits. USER_GUIDE covers source selection, bookmarks/collections, Reader settings, recovery, PWA/offline, sync, backup, and device cleanup. TROUBLESHOOTING separates source/chapter/image diagnosis from app bugs and supplies a privacy-conscious report checklist. The index separates reader, contributor, and operations material. Existing developer, architecture, source, stack, testing, data, contribution, and changelog pages receive targeted corrections.

## Observed repository evidence

Baseline supplied and verified by controller: `main` at `3925f1d647c730113ae141e860df25596bb10b6d`. Writer edits on `codex/public-documentation-refresh` after controller confirmation.

| Documentation claim | Inspected implementation/configuration |
| --- | --- |
| Node 22 / pnpm 9 CI majors, frozen install, one-shot tests, docs exclusions | `.github/workflows/ci.yml`, `package.json` |
| Browser build mode, server reuse, emulated devices | `playwright.config.ts` |
| Settings labels and separate cleanup actions | `src/components/settings/settings-view.tsx` |
| Export/import preview, merge/replace labels | `src/components/settings/backup-restore-modal.tsx`, `src/shared/lib/backup-schema.ts`, `src/shared/lib/backup-engine.ts` |
| Account and manual sync labels/diagnostics | `src/app/(web)/account/page.tsx` |
| Per-title/all-title Reader settings | `src/components/reader/reader-settings-drawer.tsx` |
| PWA standalone queue versus browser ZIP | `src/components/komik/chapter-download-button.tsx` |
| Offline classification, missing cache and legacy verification | `src/app/(web)/downloads/page.tsx` |
| Source recovery candidates and user selection | `src/components/komik/dead-source-recovery.tsx`, `src/components/komik/alternate-source-modal.tsx` |
| Adapter methods and per-request options | `src/shared/sources/source-types.ts` |
| Descending chapters and Reader index contract | `src/components/reader/reader-shell.tsx`, `src/components/reader/reader-chapter-drawer.tsx`, MangaDex adapter |
| Dynamic JSON schema and adapter | `src/shared/sources/dynamic-source-registry.ts`, `src/server/lib/sources/adapters/dynamic/index.ts` |
| Active Redis path versus separate REST helper | `src/server/lib/cache/redis.ts`, `src/env.ts`, `src/lib/redis.ts` |
| Versions and removed dependencies | `package.json`, `docs/STACK.md` |

Historical tests under `src/components/app/__tests__/` still exist; those paths were inspected and preserved. No nonexistent replacement paths were invented.

## Dated reconciliation of status

The owner reported clean main, green CI, and new Redis readiness returning 200. Controller/DevOps separately observed the exact baseline CI run [42480109587](https://github.com/rzqllh/Yomirra/actions/runs/42480109587) with five successful jobs and a READY production deployment at the same SHA. Their limited network probes timed out without an HTTP status; these probes neither independently confirm the reported readiness 200 nor establish an outage. No provider resource names, account IDs, tokens, or private quota figures are needed here.

The application cache/readiness still uses `ioredis` and `REDIS_URL`. The separate REST helper and dependency do not prove runtime migration or current end-to-end service health. Evergreen docs now explain the contract instead of asserting a preview/production configuration snapshot.

Earlier incident and handoff reports remain historical evidence, including quota samples, external blockers, and the 18-finding stabilization summary. A past `LOCAL_VERIFIED` label does not establish all acceptance or device/service gates. This refresh does not independently retest them or replace their observations with a blanket green status. Current conclusions require dated evidence for each flow on the relevant SHA/environment.

## Documentation benchmark and original adaptation

Documentation structure informed information architecture and original wording; no external code, wording, logos, screenshots, or assets were copied.

| Documentation pattern | Core structure | Yomirra implementation |
| --- | --- | --- |
| Short first-reading path | Clear onboarding | Four-step README onboarding |
| Task guides and FAQ | Operational walkthroughs | Dedicated guide and troubleshooting/FAQ |
| Platform and storage caveats beside actions | Clear platform bounds | Standalone queue versus ZIP, cache eviction, local setup |
| Diagnose chapter/title/source before escalation | Structured diagnostics | Separate source, image, and app report steps |
| Distinguish backups, media, and sync | Data boundaries | JSON excludes images; local restore versus cloud sync; no cross-app format promise |
| Privacy-aware reports | Safe logging | Public issue redaction guidance without inventing an unverified privacy policy |
| Discoverable contribution/support/change records | Project lifecycle | Audience index, contribution links, support route, changelog |

The existing [licensing review](../REFERENCE_LICENSING_REVIEW.md) and [rights reporting policy](../CONTENT_RIGHTS_REPORTING.md) remain in effect.

## Validation and limitations

Writer validation: an inline local Markdown check inspected 84 relative links/heading anchors across the 13 changed/new Markdown files with fenced code blocks excluded; all resolved. `git diff --check` passed. Commands were inspected against `package.json`, CI and Playwright configuration; no application commands/tests were executed as evidence of runtime behavior. There is no existing dedicated Markdown checker script in the repository. CI excludes docs-only changes; a missing new CI run is not application verification. No production probe, UI test, physical-device test, cloud round trip, or full app suite is claimed by this documentation work. Independent Rinne QA is required before controller marks this deliverable verified.

Potential follow-ups remain outside this refresh: legal/privacy/terms approval, full dependency/asset provenance, actual extension or cross-app backup compatibility, physical iOS/iPadOS acceptance, and live two-device Firebase evidence. No contact email, response SLA, affiliation, certification, or release approval is invented.
