# POST-RELEASE DATA SAFETY FOLLOW-UP — 2026-10-29 (Draft PR #60)

This section takes precedence over prior historical "GOAL_COMPLETE" statements.

- **Working mode:** GitHub connector remote branch only; Windows main worktree, staged files and stashes were **not accessible or modified**.
- **Draft PR:** https://github.com/rzqllh/Yomirra/pull/60, from production \`main\` at \`6cc9e07\`, isolated branch \`fix/yomirra-postrelease-sync-gates-20261029\`. The branch is **not merged or deployed**.
- **Implemented:** Per-UID legacy Library V2 migration marker set after confirmed Firestore writes; strict legacy import fails closed on missing auth or unexpected UID; remove destructive 1,000-history cap/tombstones; action-owner guarded history writes/deletes; retain local progress on network failure; granular rollback for explicit history deletion. Relevant new Vitest tests are included.
- **Documentation:** Reintroduced missing \`docs/PARITY_GAP_AUDIT.md\` explicitly as a new evidence index (not the unavailable original); documented disposable-account Firebase QA, physical Apple PWA QA and legal rights checks in \`docs/internal/POST_RELEASE_ACCEPTANCE_GATES_20261029.md\`.
- **Q1–Q175 source-based tracker:** 160 **previously/project-reported** VERIFIED (not independently retested per item), 14 PARTIAL (original 7 plus Q55 Q97 Q138 Q146 Q147 Q172 Q174 evidence inconsistencies), 1 BLOCKED (Q21), total 175. The 160 are not an enterprise acceptance sign-off.
- **Verified CI on earlier branch SHA:** GitHub Actions run #476 completed **SUCCESS** for SHA \`857eb9a\` with typecheck/lint/Vitest/build; CI for newer strict-auth fix needs exact final SHA revalidation. Latest before this checkpoint: run #480 on SHA \`92d5e6c\` had TypeScript and lint PASS, Vitest in progress. Never transplant #476's pass to newer SHA.
- **Production ground truth:** PR #59 already merged to \`main\`, Vercel deployment READY. PR #60 does not modify that deployment.
- **External gates (NOT RUN):** two real/test Firebase accounts and cross-device conflict/migration/recovery; actual iPhone/iPad Add-to-HomeScreen standalone; BrowserStack credentials; owner-approved privacy/terms, rights-holder channel, assets/dependency provenance and legal counsel. Full independent per-Q sign-off still pending.
- **Next exact executable steps:** (1) inspect the newest PR #60 head SHA + associated GitHub CI, fix concrete failures; (2) review diff and impact on auth/guest/history; (3) run staging/emulator Firebase acceptance; (4) arrange owner-managed physical Apple and legal clearance. No merge, tag, deploy, or package bump until separately approved.

---

# Latest release state — 2026-10-29

**STATUS: PR #59 MERGED; VERCEL PRODUCTION DEPLOYMENT READY.** This section supersedes the older execution restrictions below, which are retained as historical evidence.

- PR: https://github.com/rzqllh/Yomirra/pull/59 (MERGED, not Draft).
- Merged code SHA: `e82ab45ce47645f1ffbbb2433ae565e01163bed0`.
- Last verified code CI: https://github.com/rzqllh/Yomirra/actions/runs/40822090749 (run #468, SUCCESS): TypeScript PASS; lint 0 errors/508 warnings; Vitest 217/217 files and 1436/1436 tests PASS; production build PASS.
- Vercel production deployment: `dpl_3DvZGwncV6zDcZi75yK3AQxeZ2J3` READY, matched merged SHA, aliases `www.yomirra.web.id`, `yomirra.web.id` and `yomirra.vercel.app`.
- Both custom domains verified by Vercel; apex redirects via 308 to `www`.
- Vercel runtime error clusters: none reported for a 30-minute observation window at release check (absence of error logs is not end-to-end behavior proof).
- Local Windows worktrees, parent staged files, and untracked files: NOT accessed or modified during the GitHub-connected release.
- Remaining external gates: Q21 real iOS/iPadOS installed PWA and BrowserStack hardware, live Firebase cross-device/recovery flow, independent per-Q verification of Q1–Q175, content-rights and legal/publication review. These are NOT TESTED or NOT CLEARED, and must not be reclassified as VERIFIED from CI alone.
- No release tag or package-version increment was created; package version remains 2.3.1.
- Do not infer live service correctness from the successful build. Retain the prior 30-minute log evidence as a limited observation and investigate any future production incidents from Vercel runtime logs.

## Historical execution checkpoint (before merge)

## Resume here
This record is a durable handoff, not proof of release readiness. The last known GitHub work was performed via the GitHub connector, because the local Windows worktree is not mounted in the executing environment.

- Repository: `rzqllh/Yomirra`
- Proposed release PR: https://github.com/rzqllh/Yomirra/pull/59 (DRAFT)
- Patch branch: `fix/yomirra-datasafety-20261029`, starting from `e6c59eef679f96a9a7714722dbd6b097243d81fd`
- Base main at branch creation: `62f2124808d7508d865632405a88d874d745ccd8`
- Last code/test commit before this checkpoint: `f8f686b740cfeee6721bfd62977fdba002104060`
- Original user worktrees and 11 staged files: NOT modified. No force push, reset, merge, tag, or production deployment was performed.

## Changes available in PR #59
1. Removed the automatic 1,000-item Rak Buku eviction and remote-delete side effect.
2. Per-title serialized writes; revisions and per-key rollback prevent stale failed writes overwriting other saved titles.
3. Queued sync operations carry an owner UID; a guest action stays local, and an old account cannot write to a newly signed-in account.
4. Optimistic bookmark toast no longer claims confirmed cloud success.
5. Guest-merge actual per-domain writes are used for Q127 diagnostics.
6. After a *partial* multi-batch Firestore commit, the merge UI blocks retry until a fresh cloud snapshot and new diff are obtained. It does not falsely promise global multi-batch atomicity.
7. Added tests for >1,000 titles, concurrent failures, account switches, and partial merge failure.
8. Updated stale splash-screen test to verify the current two-second fail-open contract.

## Verification truth gate
- GitHub Actions CI is triggered by the draft PR (workflow: `.github/workflows/ci.yml`).
- CI run 461: FAILED during Typecheck (two type-narrowing errors); source fixed.
- CI run 462: Typecheck PASS, Lint PASS; Vitest FAILED with one obsolete splash test among 1,433 tests; test updated to assert actual fail-open contract.
- After the last edit, run 466 is the current expected candidate gate. **Check actual status before claiming PASS.**
- Build, full suite and review must be verified on the final SHA, not copied from earlier AGY reports.
- Physical iOS Safari Add-to-Home-Screen, BrowserStack, live Firebase account migration and production storage recovery: NOT independently tested here.
- Q1–Q175 tracker currently labels 167 VERIFIED, 7 PARTIAL and 1 BLOCKED; those labels are prior project claims and have **not** been independently reproduced item-by-item in this execution.

## Release restrictions
Do not merge into main, deploy production, tag, delete branches, run destructive data migrations or present this as enterprise release until current commit's CI and evidence gates pass. A draft PR is safe for review.

## Next executable tasks
1. Fetch the latest head SHA of PR #59 and CI workflow run associated with that exact SHA.
2. Fix any failing TypeScript, lint, Vitest or build gate without weakening valid test expectations.
3. Inspect actual tests and confirm targeted regression assertions against concurrent mutation ordering, guest mode, account isolation and partial cloud commit.
4. Review all 175 decisions with source + behavioral evidence before upgrading classifications; do not infer verification from a file name or token-only test.
5. Ask owner only for genuine external QA (real iOS PWA/BrowserStack) and explicit production merge/deploy approval. Do not repeat completed product-grilling questions.
