# QA test strategy (66 proposed test cases; currently ALL NOT_RUN)

`TEST_MATRIX.csv` is an editable checklist; no tests have been executed. It is not evidence of software compliance.

## Test matrix fields
- `issue_ids`: related issue(s), not source path.
- `steps`: repeatable action on target build.
- `expected`: **proposed outcome** based on owner-confirmed behavior/UX goals. For ambiguous settings, confirm desired contract first.
- `evidence_baseline`: original screenshot(s) illustrating concern. Not test execution.
- `result`: `NOT_RUN / PASS / FAIL / BLOCKED / N_A` with `tested_at`, tester and runtime screenshot/log.

## Coverage dimensions
- Surfaces: Reader, Reader Settings, chapter picker, comic detail, Home, Explore, Search, Library/History/Bookmarks, Schedule, Popular/MAL, Help, App Settings, notification/profile menus.
- States: open/closed popover, modal active/dismissed, scroll top/middle/end, selected/disabled/error/empty/loading, long text, keyboard visible, light/dark theme.
- Viewports: current user device and additional supported narrow/large mobile sizes; candidate CSS widths 320/375/390/430px **only if supported**. Also test landscape/zoom where supported.
- Accessibility: VoiceOver, dynamic text/zoom, focus/escape, touch targets, selected states, toast announcements, high contrast.
- Data: source unavailable, slow network, offline cached chapter, reading restore during image lazy loading, bookmark/list state, safe data clearing on **test account only**.

## Regression acceptance
- No P1 observable regression; every changed shared component has per-consumer evidence.
- Every associated test is PASS or explicit BLOCKED with justification; owner decides release exceptions.
- Side-by-side screenshots must match device/viewport/state/scroll offset, while preserving Yomirra visual identity.
- Do not interpret `n/a` as passing. Never claim no issue because the screenshot looks good.

## Prohibited QA actions without approval
- Delete real bookmarks/history or shared offline files.
- Change production settings or DB content.
- Install instrumentation or run automated scripts/hooks without authorization.
- Conduct any destructive test on personal account without isolated data.
