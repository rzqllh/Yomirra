# Yomirra Master Audit Prompt

You are auditing and reimagining **Yomirra**, a Next.js App Router manga reader.

Your job is not to lightly polish the current UI. Your job is to perform a full product, logic, architecture, and UI/UX audit, then produce an execution plan and implement fixes only after proving the current state from the repository.

## Working style

Respond to the user in Indonesian.
Use English for code, file names, route names, component names, variables, and technical implementation naming.

Be blunt, precise, and evidence-based.
Do not overpraise.
Do not say something is done unless it is actually implemented and verified.

## Available project context

Yomirra is expected to be a premium manga reader with:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Radix primitives.
- Zustand stores.
- React Query or equivalent async data strategy if present.
- Manga source adapter architecture.
- Local guest mode data.
- Auth/cloud sync for features that require account.
- Reader, library/readlist, browse, search, history, settings, detail, and source-related flows.

Do not assume all of these are implemented. Verify each one.

## Skills to use if available

Read `.agents/skills` and use relevant project skills only when helpful:

- `ui-ux-promax`
- `huashu-design`
- `grill-me`
- `frontend-design`
- `shadcn`
- `improve-codebase-architecture`
- `web-design-guidelines`
- `sleek-design-mobile-apps`
- `vercel-react-best-practices`
- `vercel-optimize`
- `vercel-react-view-transitions`
- `vercel-composition-patterns`

Do not load every skill blindly if it slows reasoning. Pick the skills relevant to the current phase.

## First task: repository discovery

Before making any recommendation, inspect:

- `package.json`
- `next.config.*`
- `tsconfig.json`
- `components.json`
- `src/app/**`
- `src/components/**`
- `src/shared/**`
- `src/lib/**`
- `src/store/**` or equivalent state folders
- `src/features/**` if present
- `DOCS/**`
- existing audit/design docs such as:
  - `YOMIRRA_FULL_AUDIT.md`
  - `YOMIRRA_FULL_AUDIT_Next_Step.md`
  - `YOMIRRA_REWRITE_PROMPT_V2.md`
  - `YOMIRRA_DESIGN_TOKENS.md`
  - `YOMIRRA_COMPONENT_INVENTORY.md`
  - `YOMIRRA_ADAPTER_BOUNDARY.md`
  - `YOMIRRA_MOTION_CONTRACT.md`

If a file does not exist, say it does not exist. Do not pretend.

## Audit priority order

### P0 — Product logic correctness

Check whether each route and flow actually works:

- Home
- Browse
- Search
- Manga detail
- Reader
- Library / Readlist
- Bookmarks
- History
- Updates
- Popular
- Settings
- Auth flow
- Guest/local mode
- Local-to-cloud migration after login
- Source adapter integration
- Error states
- Empty states
- Loading states
- Offline or bad network states if present

For every broken flow, report:

| Severity | Area | Evidence | User impact | Root cause | Fix strategy | Files involved |

### P1 — UI/UX reimagination

Main issue: current UI feels boring, flat, inconsistent, overly generic, and full of layout magic numbers.

Audit and redesign:

- Information hierarchy.
- Reading flow.
- Navigation rhythm.
- Mobile ergonomics.
- Touch targets.
- Spacing system.
- Typography scale.
- Color system.
- Visual depth.
- Component consistency.
- State feedback.
- Motion.
- Dark/light behavior.
- Accessibility.
- Component reuse.
- Per-page composition.

Treat UI as something that can be reimagined from zero, not just patched.

### P2 — Architecture and maintainability

Audit:

- Duplicate components.
- Mixed UI primitives.
- Hardcoded routes.
- Hardcoded colors.
- Hardcoded spacing.
- Magic numbers.
- Ad-hoc responsive classes.
- Store naming mismatch.
- Local storage schema.
- Unclear data contracts.
- Unclear component ownership.
- Client/server boundary mistakes.
- Unnecessary client components.
- Bundle/performance problems.

### P3 — Security, privacy, and reliability

Audit:

- Image proxy safety.
- Source adapter input validation.
- Unsafe URL handling.
- Env variable handling.
- Auth boundary.
- Cloud sync ownership.
- Guest data migration.
- API rate/error behavior.
- Error logging.
- Broken production deployment patterns.
- Vercel compatibility.

## UI/UX direction

Use the dedicated spec in `YOMIRRA_UIUX_REIMAGINE_SPEC.md`.

Short version:

- Mobile-first.
- Dark priority.
- Light/dark toggle required.
- Premium cinematic manga-reader feel.
- Not neon.
- Not generic dashboard.
- Not flat app-shell.
- Not AI slop.
- Accent palette from reference:
  - `#003135`
  - `#024950`
  - `#964734`
  - `#0FA4AF`
  - `#AFDDE5`

## Required output format

Start with this exact structure:

```md
# Yomirra Full Audit Result

## 1. Executive verdict
- Readiness:
- Biggest blocker:
- UI/UX verdict:
- Logic verdict:
- Architecture verdict:

## 2. Evidence map
| Area | File/Route/Component | Evidence | Issue | Severity |

## 3. Product flow audit
...

## 4. UI/UX audit
...

## 5. Magic number and inconsistency inventory
...

## 6. Design system correction plan
...

## 7. Component architecture plan
...

## 8. Implementation phases
### Phase 0 — Stabilize logic
### Phase 1 — Tokenize design system
### Phase 2 — Rebuild shell/navigation
### Phase 3 — Rebuild core screens
### Phase 4 — Reader polish
### Phase 5 — Accessibility/performance/test pass

## 9. Exact next actions
```

## Implementation permission rule

Do not immediately rewrite everything.

First produce:

1. Audit findings with evidence.
2. Proposed design direction.
3. Component architecture.
4. Step-by-step implementation plan.
5. Risk list.

After approval, implement in small phases.

If explicitly told to implement now, still produce a short plan first, then execute.
