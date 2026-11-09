# Definition of Done — evidence-based, no redesign

## Global invariants
1. At end scroll, all meaningful content and actions fully clear the floating nav. Validate across all app routes, not just one.
2. Active overlay never obscures required navigation and all its own list items/footers are reachable.
3. Selected dropdown/setting values and important action text remain understandable on supported viewport and type size.
4. Bookmark is recognized as **title saved state** while history resume is a separate persisted reading position.
5. Progress and index UI reflect their real unit (chapter scroll % vs image asset index). Any new paged mode must have an approved contract.
6. P1 changes are tested for keyboard/VoiceOver and touch, not inferred from screenshots.
7. Storage/data deletion provides confirmed scope and cancel path and is tested safely without touching live user data.
8. Existing theme, navigation destinations and functional features remain unless approved change request says otherwise.

## Per work item handoff MUST include
- Issue ID(s), component/route names **as found in real code**.
- Before reproduction: state and input; evidence path + severity.
- Root cause evidence with actual source location and why shared change is appropriate.
- Approved decision reference for behavioral changes.
- List of files changed, scope and risks; no invented paths.
- After screenshots at matching state, QA commands with outputs, manual test results and device/viewport.
- Rollback steps and any residual issues/blocked questions.

## Invalid 'done' claims
- 'Looks better' but no verification across consumers.
- 'Fixed all' from only changing padding in one screen.
- Toggling flags until screenshot matches without behavior proof.
- Marking PASS on test checklist before a runtime test.
- Assuming defaults from screenshot state.
