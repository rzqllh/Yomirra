# Yomirra — Parity Gap Audit (re-established index, 2026-10-29)

> **Provenance:** This is a new evidence index replacing a broken documentation link. The original `docs/PARITY_GAP_AUDIT.md` referenced by the 2026-10-25 grill ledger was **not available** in the inspected remote main, PR #58 branch, or the known remote reconciliation branch. This document does not impersonate or reconstruct its unseen contents.
>
> **Scope:** Gap classification grounded in `docs/GRILL_FINAL_LEDGER.md`, `docs/GRILL_DECISIONS.md`, `docs/YOMIRRA_FULL_PARITY_EXECUTION.md`, and inspected source files on main as of `6cc9e07`. Source inspection is not hardware QA, independent legal clearance, or a substitute for executing tests.

## Source-of-truth hierarchy

1. Owner's approved Q1–Q175 decisions in `GRILL_FINAL_LEDGER.md` and `GRILL_DECISIONS.md`, including revised Q52/Q63, define requirements.
2. The execution tracker records *project-reported* statuses and test references. Its 167 `VERIFIED` labels have **not** been independently reproduced requirement by requirement.
3. Production PR #59 CI (run #468, successful on commit `01157ae`) attests to 217 Vitest files / 1,436 passing tests, TypeScript, lint (508 warnings), and build, not to 167 individual product acceptance decisions.
4. Physical Safari/standalone, production Firebase account journeys and content/licensing decisions require separate evidence.

## Open and intentionally deferred scope (7 PARTIAL + 1 BLOCKED)

| ID | Approved domain and project-report state | Verified limitation and acceptance gate |
|---|---|---|
| Q21 | Physical iOS/iPadOS validation — BLOCKED | Run manual real-device standalone PWA and BrowserStack tests. Desktop Playwright WebKit is not a device test |
| Q58 | Local CBZ/ZIP import and reading — PARTIAL | Not implemented to the approved depth; a browser PWA can use user-selected File/Blob APIs. Treat as a deferred **feature**, not an impossible browser capability |
| Q130 | Non-blocking AI reader actions — PARTIAL | Search embedding implementation does not itself prove opt-in reader AI toolbar behavior |
| Q140 | Secure archive ingestion — PARTIAL | ZIP bomb/path traversal/size enforcement must precede any future archive importer; no zip-reader ingestion claim |
| Q148 | External tracker interop — PARTIAL | AniList/MAL integration is deferred; web PWA form alone is not proof of infeasibility; OAuth/API and scope/consent decisions remain |
| Q149 | One-way external progress sync — PARTIAL | Deferred with Q148; must be opt-in and idempotent before activation |
| Q153 | In-browser local archive reader — PARTIAL | Deferred with Q58/Q140; do not claim support for reading imported archives |
| Q162 | On-device OCR dictionary — PARTIAL | Server OCR API availability does not demonstrate local/on-device OCR dictionary reader integration |

The owner may maintain documented product deferrals; do not reclassify them as completed or blocked simply to raise a completion percentage.

## Additional source-confirmed acceptance gaps

| Item | Finding from inspected main | Consequence / next proof |
|---|---|---|
| Legacy Library V2 migration | `use-sync.ts` used browser-global `yomirra-libraryV2-migrated` and marked completion before batch commit | Review draft PR #60 per-UID, commit-confirmed migration patch and verify with two real accounts |
| History preservation | `history-store.ts` dropped the oldest chapter past 1,000 entries and created a cloud tombstone | Draft PR #60 removes loss of stored per-chapter cursors; verify large real saves and restore |
| Deferred history ownership | History cloud helpers captured the *current* user only when a queued timer executed | Draft PR #60 binds mutations to account owner and avoids guest-to-account leakage; requires live Firebase proof |
| Q55 | Tracker asserts highest milestone durability across Firestore; `use-sync.ts` primarily compares `updatedAt/readAt` timestamps, not explicit milestone rank when overwriting a local library item | Independent two-device milestone regression is required; do not infer from local reading-store tests |
| Q97 | Tracker cites `use-sync.ts` for cross-device reader settings, but inspected sync function pulls *source* preferences and custom collections; reader-store itself uses local Zustand persist | Locate any independent reader-settings sync mechanism, otherwise reclassify and implement |
| Q138 | Tracker says IndexedDB durable pending sync queue; cited `use-sync.ts` includes in-flight Promise dedup, but that is not proof of persistent queue after browser termination | Demonstrate durable pending-ops storage/replay or reclassify |
| Q146 | Tracker says exponential retry for full background sync; cited hook initiates on first mount/online event, but no clear bounded exponential retry loop was established from that source | Demonstrate and test retry schedule or reclassify |
| Q147 | Tracker says **strict CSP**; `next.config.ts` explicitly emits `Content-Security-Policy-Report-Only`, not enforcing CSP | Reclassify enforcement claim; enforcing CSP requires compatible production monitoring and security review |
| Q172 | Public privacy/terms and counsel sign-off | The legal/reference review expressly withholds clearance. Do not publish unverified data-flow promises or represent counsel approval |
| Public documentation | `PARITY_GAP_AUDIT.md` link previously 404 in main | This new transparent index restores navigability without inventing the lost original |

## Evidence expected before an enterprise-release claim

- Requirements: each Q ID should be mapped to exact code behavior, assertion, result, relevant browser proof, and acknowledged limitation; a filename alone does not qualify.
- Firebase: two disposable accounts and two devices; deterministic conflict, tombstone, offline, failed batch, resume and cross-account isolation test evidence.
- UI: comparable before/after states on iPhone, iPad and desktop, screen-reader focus, reduced motion, safe areas, gesture and install/offline behavior.
- Legal: traceable source/asset licenses, rights-holder channel, truthful privacy processors/retention/deletion and suitable human legal sign-off.

See `docs/internal/POST_RELEASE_ACCEPTANCE_GATES_20261029.md` for exact reproducible acceptance cases.

**Release rule:** Any unresolved high-impact data-loss, cross-account mutation, or legal-content issue stays explicitly open. A CI-green PR is not proof of those external gates.
