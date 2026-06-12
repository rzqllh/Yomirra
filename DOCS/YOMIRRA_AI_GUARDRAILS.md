# Yomirra AI Guardrails

These rules exist to stop hallucination, random redesign, fake completion, and messy code changes.

## Golden rule

No claim without repository evidence.

If you did not inspect the file, do not claim what it contains.

## Evidence requirement

Every important audit finding must include at least one of:

- File path.
- Route path.
- Component name.
- Store/hook name.
- API endpoint.
- Exact class/token/constant.
- Behavior reproduced locally.

Use this format:

```md
Evidence: `src/app/(web)/bookmark/page.tsx` uses `Object.values(libraryItemsMap)` and sorts locally, but ...
```

## Assumption format

If an assumption is unavoidable, write it like this:

```md
[ASSUMPTION] This flow probably stores bookmark state locally because `useLibraryStore` is used here, but I have not yet found the persistence layer.
Uncertainty: medium.
Verification needed: inspect the store implementation and storage middleware.
```

Never hide assumptions inside confident language.

## Before editing code

Do this first:

1. Read related files.
2. Identify current behavior.
3. Identify intended behavior.
4. Identify minimal safe change.
5. Identify affected routes/components.
6. Check whether design tokens/components already exist.
7. Check whether a similar component already exists.
8. Confirm no feature is being deleted accidentally.

## Forbidden behavior

Do not:

- Invent a component that already exists under another name.
- Create duplicate UI primitives instead of improving the existing system.
- Add random colors outside tokens.
- Add random `px`, `rem`, `vh`, `vw`, `z-index`, `shadow`, `blur`, or breakpoints without token justification.
- Rewrite routes blindly.
- Delete guest/local mode.
- Break local-to-cloud migration expectations.
- Replace real data with mock data.
- Create fake API contracts.
- Leave nonfunctional buttons in the UI.
- Ship inaccessible dropdowns/modals/sheets.
- Ignore reduced motion.
- Use neon colors for attention/danger states.
- Use pure red danger without checking contrast and tone.
- Make the app look like a generic SaaS dashboard.

## Magic number policy

A magic number is any unexplained one-off value in layout, motion, sizing, spacing, z-index, or responsive behavior.

Examples:

- `top-[73px]`
- `h-[calc(100vh-117px)]`
- `mt-[13px]`
- `z-[9999]`
- `duration-[417ms]`
- `max-w-[1192px]`
- repeated hardcoded `px` values that should be tokens

Allowed only when:

1. It is required by a measured browser/platform bug.
2. It is documented in a comment.
3. It is isolated in a named constant/token.

Preferred replacements:

- Tailwind theme tokens.
- CSS custom properties.
- semantic layout primitives.
- named constants such as `APP_SHELL_HEIGHT`, `BOTTOM_NAV_HEIGHT`, `READER_TOOLBAR_HEIGHT`.
- component variants.

## Completion standard

A task is not complete until:

- Type check passes.
- Lint passes.
- Relevant tests pass or missing tests are explicitly reported.
- UI state is verified for loading, empty, error, and success.
- Mobile viewport is checked.
- Keyboard navigation is checked for interactive components.
- Dark and light modes are checked.
- No new hardcoded token violations are introduced.

## Reporting format after implementation

```md
## Changed

- ...

## Verified

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- manual mobile viewport check
- dark/light check

## Known issues

- ...

## Files touched

- ...
```

If a command fails, include the failure and fix plan. Do not hide it.
