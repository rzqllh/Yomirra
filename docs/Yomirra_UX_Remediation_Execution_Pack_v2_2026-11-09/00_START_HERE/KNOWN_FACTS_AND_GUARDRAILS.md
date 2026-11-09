# Known facts / guardrails / no hallucinations

## FACT — confirmed by owner
- Reader controls: tap comic area toggles; scrolling hides controls.
- Reader percent (`3%`, `59%`) measures scroll progress **within chapter**.
- `Hal. x/y` currently means image/file sequence, not a narrative page; vertical webtoon assets have heterogeneous heights.
- Reader slider chevrons navigate images; bottom row chevrons change chapters; floating up chevron scrolls to top.
- Bookmark saves **comic title**. Reading position is in **history read**, not bookmark.
- Owner confirms: toast covers reader controls; chevrons are redundant/confusing; Reader dock lacks breathing room; `Daftar chapter` CTA steals focus; notifications/copy are inconsistent with app.
- Owner requests holistic UX remediation, not visual rebranding/redesign, and wants agent questions when facts cannot be determined.

## OBSERVED — from screenshots; does NOT prove underlying code defect
- Fixed bottom navigation visually overlays lower content at many scroll positions.
- Multiple dropdown menus and overlays occupy large areas over underlying cards.
- Reader settings option label `Sesuai Siste...` and Library filter values are truncated.
- Reader has dark/light skins, minimal immersive mode, on-demand controls, toast add/remove bookmark.
- Chapter grid selects 152; initial anchoring on open is unknown.
- Settings show modes / scope toggle / controls and data actions. No direct evidence what code does when tapped.
- Help copy uses technical 403/429 terms and long paragraphs.
- External MAL ranking provides source/date/context — preserve this positive behavior.

## UNKNOWN — do NOT silently resolve
- Whether resume toast `hal.4` vs index `hal.2` is a defect or an in-progress transition.
- Whether 0% in history vs 3% in reader is stale/snapshot/restoration timing.
- Whether 138 saved vs 136 'Semua' is scope semantics, duplicates, or actual mismatch.
- Whether chapter list count 173 vs entries / latest 172 is source data, chapter prologue, or a defect.
- Whether header blur is app CSS/blur, screenshot privacy obfuscation, or screenshot artifact. **Do not change blur until reproduced**. Reader's top overlay/gradient over artwork is a separate observed design concern.
- Reader paged mode support; behavior of scaling options, preload presets, theme inheritance, current progress badge and exact route paths.
- Whether update checks are periodic in background or only on app open.
- Exact colors/tokens, source component names, tech stack, backend data shape, test framework, accessibility tree, and touch hitboxes.

## User constraints and authorization boundaries
- **NO implementation yet.** This package provides a plan and specs. Ask before editing source, creating hooks, installing dependencies, changing config/API/DB, security logic or deploying.
- Do not delete existing functions/features or 'simplify' functionality without owner approval. Reduce visual weight, fix semantics and preserve functionality by default.
- Preserve brand direction and existing visual identity where sound: light/dark, red accent, rounded components, imagery-rich presentation. 'Modernize UI' is NOT a goal.
- Group changes by root-cause/components and verify every affected page; no screenshot-only patchwork.
- A proposal is not an accepted contract. Explicit approvals are tracked in `05_PLAN/DECISION_LOG_TEMPLATE.md`.
- **Never invent a file path, function/API, dataset relation, release timestamp, PASS, or post-fix screenshot.** Route names and component names here are conceptual locators only.

## State vocabulary
- `VISUAL_OR_OWNER_CONFIRMED`: visual symptom or owner-confirmed interaction; code cause not verified.
- `REQUIRES_QA`: risk/ambiguity; do not write a bug ticket until reproduced.
- `PROPOSAL_ONLY`: solution idea requiring owner decision.
- `BACKLOG_UNVALIDATED` → `CODE_LOCATED` → `ROOT_CAUSE_CONFIRMED` → `APPROVED_FOR_CHANGE` → `IMPLEMENTED_UNVERIFIED` → `QA_PASS / QA_FAIL` → `OWNER_ACCEPTED`. These are **suggested workflow states**, not current state.
- `BLOCKED_QUESTION`: workstream contains a product decision that cannot be guessed; continue unrelated approved repairs.
