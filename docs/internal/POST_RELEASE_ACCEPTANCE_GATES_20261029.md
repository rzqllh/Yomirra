# Yomirra — Post-release acceptance gates

**Captured:** 2026-10-29  
**Baseline:** main `6cc9e07`, merged code PR #59 `e82ab45`; production READY is deployment status only.  
**Patch:** Draft PR #60, **not merged**.  
**Owner:** project maintainer / designated tester. **Never use real user data for destructive tests.**

## A. Production Firebase data safety — NOT RUN

Use **two newly created disposable Firebase test accounts**, A and B, in isolated browser profiles. Keep the test data export and capture sanitized timestamps/expected-vs-actual outcomes. Do not share access tokens, production records, email addresses, or secrets in logs.

| Test | Reproduction | PASS criteria |
|---|---|---|
| A1 — local-only guest | Without login, add a saved title and read a chapter; later sign in as A | Guest data appears in explicit merge preview; nothing silently uploads or overwrites |
| A2 — cross-account queued history | While A is signed in, trigger history update, switch to B before any deferred write settles | Only A's path is eligible; B never receives A's chapter or tombstone |
| A3 — migration owner scope | On same browser, migrate a legacy record in A, log out, migrate distinct legacy data in B | Each account's V2 data is migrated once; no browser-global marker skips B |
| A4 — failed migration commit | Block the commit/deny write access for a disposable test record and retry after restoring access | Failure leaves migration pending; retry can complete without duplicate/lost titles |
| A5 — 1,001 chapters | Import/generate 1,001 distinct synthetic chapter cursors in a test account | Chapter 1 and chapter 1,001 persist locally and after sync; no automatic cloud tombstone |
| A6 — highest milestone | Mark chapter 45 completed, then reread chapter 12 on another device and sync | Continue Reading still reflects chapter 45; chapter 12 keeps separate actual cursor |
| A7 — two device concurrent edit | Create concurrent edits to one title across two disposable devices | Deterministic winner and no deletion/resurrection of unrelated saved titles |
| A8 — explicit deletion | Delete one title on A, bring a previously offline profile online | Tombstone wins against stale data, unless there was explicit newer re-add |
| A9 — partial batch merge | In disposable data, stage >400 writes and force a later batch failure | No success message; review refresh required before another attempt; no silent partial overwrite |
| A10 — offline and refresh | Start offline, update one chapter cursor, close/reopen tab and reconnect | Cursor stays locally durable; cloud status reflects pending/failed, then confirmed writes |
| A11 — sync domains | Force source-preference and collection read failures independently | User-facing diagnostics do not count failed domains as confirmed success |
| A12 — account logout | Logout with both local retention options and re-login | Files/history isolation matches user choice; no data from previous account crosses profiles |

Do not run A9 or destructive Firebase rule changes against any real account or shared production data. Use a dedicated Firebase emulator/staging project if available.

## B. Real Apple device / standalone PWA — NOT RUN (Q21)

Use an actual supported iPhone and iPad. Record OS, browser, model, viewport and whether Safari tab or standalone Home Screen mode. Playwright WebKit does **not** satisfy this gate.

1. Fresh Safari visit: first-time discovery, search, scroll, Back/Forward, orientation change and installed-PWA guidance.
2. Add to Home Screen; launch standalone, verify viewport, safe areas, notch/dynamic island, bottom dock, keyboard and touch targets.
3. Resume chapter 12 and 45, source failure, image retry, page/vertical mode change, zoom and gesture arbitration.
4. Turn on airplane mode: retained downloads open while uncached content shows truthful offline state; reconnect and resume.
5. Verify theme switch and status-bar color, reduced-motion, VoiceOver element order and modal focus restoration.
6. Force-close/relaunch standalone: local history, saved titles, downloads, login/merge state and settings persist as documented.
7. Inspect toast location at bottom safe area, no clipped reader title, and no accidental horizontal scrolling at small widths.
8. If available, execute dedicated BrowserStack/W3C run using owner-provisioned credentials via environment only. Keep credential values out of commits, logs and screenshots.

**Result:** Until actual device evidence is attached and signed off, Q21 remains BLOCKED / NOT TESTED.

## C. Legal, privacy and rights — NOT CLEARED (Q165–Q175, especially Q172)

A qualified reviewer should verify, with evidence:

- Every shipped third-party cover, icon, font, screenshot, translation, scan image and reused code snippet has identified provenance and suitable rights.
- Dependency and transitive license notices match actual installed package versions and distribution form.
- Providers' access/redistribution conditions and content rights are not assumed from the application's Apache-2.0 source license.
- Current Firebase/Google sign-in, optional Gemini, IP logs, storage, retention, deletion, transfer and access controls are documented truthfully in draft Privacy and Terms.
- Actual monitored rights-holder reporting/contact and incident handling are in place; no invented contact/SLA.
- Public copy says independent reader; does not imply Mihon, Aidoku, Tachiyomi or Tachimanga affiliation or endorsement.
- An authorized human/legal reviewer approves the final publication text. Do not use AI-generated legal assertions as clearance.

`docs/REFERENCE_LICENSING_REVIEW.md` documents comparison risks but **is not** proof of code/asset provenance or legal sign-off.

## D. Documentation & release

- Restore missing parity reference with explicit provenance (`docs/PARITY_GAP_AUDIT.md`).
- Audit every Q1–Q175 against direct behavior; do not promote any status solely because tests pass.
- Confirm PR #60 GitHub Actions typecheck/lint/Vitest/build for its **exact final SHA**, review failures and fix them.
- Document all blockers. Keep product version 2.3.1 unless a separate release decision is approved.
- Do not merge, tag or deploy from this draft PR without owner review. Do not delete local user-owned Windows worktrees or stashes from remote tooling.

## E. Closure signatures

| Gate | Current state | Recorded evidence | Reviewer |
|---|---|---|---|
| PR #60 CI | PENDING | GitHub Actions run URL for final SHA | — |
| Cross-account Firebase | NOT RUN | Disposable-account test transcript | — |
| Real iOS Safari standalone | BLOCKED | Physical device screenshots/video | — |
| BrowserStack iOS | BLOCKED | External credentials/device session | — |
| Q1–Q175 independent review | NOT COMPLETE | Per-Q implementation plus behavioral matrix | — |
| Legal/content rights | NOT CLEARED | Provenance + approved publication policies | — |
| Release tag/version | NOT AUTHORIZED | Owner release decision | — |
