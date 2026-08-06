# TESTING — Yomirra Testing Conventions

---

## 1. Stack

| Tool | Role |
|------|------|
| `vitest` v4 | Test runner |
| `jsdom` | DOM simulation for React component tests |
| `@vitejs/plugin-react` | React + JSX support in tests |

Config: `vitest.config.ts`
Setup: `vitest.setup.ts`

Run tests:
```bash
pnpm test            # watch mode
pnpm test --run      # single run
pnpm test --coverage # with coverage
```

Run full automated verification:
```bash
pnpm typecheck && pnpm lint && pnpm test --run && pnpm build
```

---

## 2. Test File Locations

Tests live in `__tests__/` subdirectories, co-located with the source they test.

```
src/
├── server/lib/
│   ├── __tests__/sign-proxy-url.test.ts      ← server utility tests
│   └── cache/__tests__/redis-cache.test.ts   ← cache tests
│
├── server/lib/sources/adapters/
│   └── sample-adapter/__tests__/normalize.test.ts ← adapter normalizer tests
│
└── shared/
    ├── store/__tests__/history-store.test.ts  ← store tests
    └── utils/__tests__/normalize.test.ts      ← utility tests
```

**Naming convention:** `[filename].test.ts` or `[filename].test.tsx`

---

## 3. What to Test

### Always test:
- **Source adapter normalizers** — scraping is fragile, normalization logic must be verified
- **Utility functions** — pure functions are easy to test and critical for correctness
- **Zustand store logic** — actions, selectors, edge cases (empty state, cap enforcement)
- **API validation** — Zod schemas, error paths
- **HMAC signing/verification** — security-critical

### Test when appropriate:
- React hooks with complex logic (e.g. search pruning, update checker)
- Complex integrations (e.g. multi-source search deduplication)

### Focused Test Patterns
For fast development loops on specific features, run focused tests using path matching:
```bash
pnpm test backup --run
pnpm test update-store --run
```

### Don't bother testing:
- Simple presentational components (wasted effort)
- Third-party library wrappers
- Next.js routing/layout

---

## 4. Writing Tests

### Utility/Store Tests

```typescript
// src/shared/utils/__tests__/normalize.test.ts
import { describe, it, expect } from "vitest";
import { normalizeTitle } from "../normalize";

describe("normalizeTitle", () => {
  it("strips trailing punctuation", () => {
    expect(normalizeTitle("Title:")).toBe("Title");
  });

  it("handles empty string", () => {
    expect(normalizeTitle("")).toBe("");
  });
});
```

### Source Adapter Tests

```typescript
// Test the normalizer, not the HTTP calls (mock fetch)
import { describe, it, expect, vi } from "vitest";
import { ShinigamiNormalizer } from "../normalizer";

describe("ShinigamiNormalizer", () => {
  it("normalizes manga status to ONGOING", () => {
    const result = ShinigamiNormalizer.normalizeStatus("Ongoing");
    expect(result).toBe("ONGOING");
  });
});
```

### Zustand Store Tests

```typescript
// src/shared/store/__tests__/history-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore } from "../history-store";
import { act } from "@testing-library/react";

describe("historyStore", () => {
  beforeEach(() => {
    useHistoryStore.setState({ entries: {} });
  });

  it("adds reading history entry", () => {
    act(() => {
      useHistoryStore.getState().addEntry({
        sourceId: "test",
        mangaId: "manga-1",
        // ...
      });
    });

    const entries = useHistoryStore.getState().entries;
    expect(Object.keys(entries)).toHaveLength(1);
  });
});
```

---

## 5. Mocking

```typescript
// Mock fetch for adapter tests
import { vi } from "vitest";

vi.mock("node-fetch", () => ({
  default: vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve("<html>...</html>"),
  }),
}));

// Mock Firebase (always mock in tests, never real)
vi.mock("@/shared/lib/firebase", () => ({
  initFirebase: vi.fn().mockResolvedValue({ app: null, auth: null, db: null }),
}));
```

---

## 6. Coverage Areas

| Area | Target Focus |
|------|--------------|
| Source adapter normalizers | Ensuring extraction resilience against markup changes |
| Utility functions | Perfect coverage for pure helpers (normalize, filter) |
| Zustand store actions | Validation of local-first state, backup engine schemas, caching |
| Hooks & Integrations | Verifying parallel search, deduplication, update checking flows |
| HMAC signing | Security-critical boundary |
| API validation schemas | Enforcing robust boundaries |

---

## 7. Verification

### Automated Verification
Automated verification runs on every CI push (GitHub Actions). The pipeline explicitly requires:
```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```
Failing tests or typechecks will block deployment.

### Manual Runtime Verification
Certain flows cannot be fully validated via automated tests and require manual verification:
- **PWA & Offline Behavior**: Installing the PWA on real devices (iOS Safari, Android Chrome), disabling network, and checking Service Worker cache hits.
- **Hosted Source Verification**: Checking if source adapters work on Vercel infrastructure (verifying edge/serverless IP reputation and bot protections).
- **Accessibility & Hydration**: Verifying ARIA states and focus management dynamically.


