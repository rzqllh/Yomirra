# Testing — Yomirra Conventions

Yomirra uses Vitest and Testing Library for automated coverage, plus targeted browser/device verification for behavior that cannot be proven in jsdom.

## 1. Stack and Commands

| Tool | Role |
| --- | --- |
| `vitest` | Test runner |
| `jsdom` | Browser-like DOM environment |
| `@testing-library/react` | React component interaction testing |
| `@vitejs/plugin-react` | React/JSX transform for Vitest |

Config: `vitest.config.ts`  
Setup: `vitest.setup.ts`

```bash
pnpm test             # Vitest watch/development mode
pnpm test --run       # Single full-suite run
pnpm test --coverage  # Coverage when configured/needed
```

Preferred full verification gate for a broad refactor or release-sensitive change:

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
git diff --check
```

Report lint results accurately, including the current warning count when warnings remain. `0 errors` does not mean `0 warnings`.

## 2. Test Locations

Tests are generally co-located in `__tests__/` directories near the implementation they cover.

```text
src/
├── components/
│   ├── manga/__tests__/
│   ├── library/__tests__/
│   └── ui/__tests__/
├── app/(web)/.../__tests__/
├── server/lib/.../__tests__/
└── shared/
    ├── store/__tests__/
    └── utils/__tests__/
```

Use `[name].test.ts` or `[name].test.tsx`.

## 3. Risk-Based Test Strategy

### Always cover high-risk logic

- source adapter normalization/parsing;
- security boundaries such as signing/verification and public error normalization;
- persistent Zustand store actions and migrations;
- backup/restore schemas and rollback behavior;
- API input validation and important failure paths;
- pagination/filter/query logic that changes request behavior;
- multi-source merging, pruning, partial failure, and retry/exhaustion rules.

### Test canonical UI primitives when they own behavior

A presentational component is worth testing when it centralizes logic or accessibility that many consumers now depend on.

Examples:

- `MangaCover`: eager/lazy loading contract, error fallback, broken completed image, forwarded classes/alt text;
- `ReadingProgress`: 0–100 clamping, progressbar semantics, optional label;
- `FilterChip`: selected/ARIA semantics and important state variants;
- filter/controller integrations where Apply/Reset/draft-state behavior can regress.

Do not skip a test merely because the component renders UI. A bug in a canonical primitive has a larger blast radius than the same bug in one local component.

### Usually avoid low-value tests

You generally do not need a dedicated test for a pure wrapper that:

- contains no branching or state;
- only forwards props/classes to an already-tested primitive;
- has no accessibility or interaction contract of its own.

Test the behavior boundary, not every file created during a decomposition.

## 4. Structural Refactors

For controller/view decomposition or canonical-component migrations:

1. Capture the behavior being preserved before changing ownership.
2. Keep business behavior and visual redesign out of the same batch unless intentional.
3. Run focused tests during development.
4. Run the full verification gate on the final tree.
5. Browser-smoke-test affected responsive/interactive flows.

Do not describe a refactor as “100% zero behavior change” based only on typecheck, lint, tests, or build. Prefer:

> Structural refactor completed with no intentional behavior changes; automated checks and the documented smoke-test scenarios passed.

## 5. Focused Tests

Use Vitest path/name matching during a development loop:

```bash
pnpm vitest run "src/components/ui/__tests__/filter-chip.test.tsx"
pnpm vitest run "src/app/(web)/search/__tests__/search-integration.test.tsx"
```

Before closing a broad change, still run the full suite.

## 6. Component/Hook Test Pattern

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReadingProgress } from "../reading-progress";

describe("ReadingProgress", () => {
  it("clamps progress and exposes semantic state", () => {
    render(<ReadingProgress value={120} showLabel />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
```

Test public behavior. Avoid asserting private implementation details unless they are part of an explicit contract.

## 7. Stores and Pure Utilities

Reset persistent/global state between tests. Prefer store APIs and pure helpers over reaching into unrelated implementation details.

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useHistoryStore } from "../history-store";

describe("history store", () => {
  beforeEach(() => {
    useHistoryStore.setState({ items: {} });
  });

  it("stores a history entry", () => {
    // exercise the public store action, then assert state
  });
});
```

For persisted-schema changes, include older stored/backup shapes as fixtures so backward compatibility is tested deliberately.

## 8. Source Adapters

Prefer deterministic fixtures and mocked HTTP responses for parser/normalizer tests. Do not make the unit suite depend on a third-party site being online.

Test at least the source-specific areas that can silently corrupt normalized data:

- title/link extraction;
- cover extraction and lazy-image attributes;
- status/format normalization;
- pagination;
- filter mapping;
- malformed/empty responses;
- bounded retry behavior where implemented.

Live/hosted source checks are a different verification layer.

## 9. Browser Smoke Tests

Use browser verification for responsive, geometry, navigation, focus, or overlay behavior. Typical high-value scenarios include:

### Library / Bookmark / Search

- search and clear;
- sort/filter apply/reset;
- pagination;
- tab/source-rail changes;
- selection/bulk actions where present;
- detail navigation and browser-back state retention;
- empty/error/partial-source states.

### Canonical headers and loading states

- mobile fixed header does not overlap content;
- desktop title hierarchy is preserved;
- loading and loaded routes keep compatible spacing;
- safe-area offsets are not doubled.

### Reader panels

- open/close button;
- backdrop dismiss;
- Escape dismiss where supported;
- long chapter-list scrolling;
- active chapter indication/auto-scroll;
- setting changes and persistence;
- mobile bottom layout and desktop side-panel behavior;
- resize/open-state edge cases when changing viewport classes.

## 10. PWA, Offline, and Hosted-Source Verification

Some behavior requires real runtime verification and must not be inferred from unit tests:

- PWA installation;
- service-worker update/caching behavior;
- browser Cache Storage limits;
- offline reader behavior on target browsers/devices;
- source health from deployed/serverless infrastructure;
- upstream WAF/rate-limit behavior.

Document the browser/device/deployment environment when reporting those results.

## 11. Test Changes During Refactors

If a refactor causes existing tests to fail, distinguish clearly between:

1. **implementation regression** — fix the implementation;
2. **valid contract change** — update implementation and test with an explicit reason;
3. **stale test assertion** — update the test only after confirming the runtime/public contract did not regress.

Do not make a test green by weakening it to match an accidental implementation change.
