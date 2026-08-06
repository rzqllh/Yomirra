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
- React hooks with complex logic
- Components with non-trivial render conditions

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

## 6. Coverage Targets

| Area | Target |
|------|--------|
| Source adapter normalizers | 80%+ |
| Utility functions | 90%+ |
| Zustand store actions | 70%+ |
| HMAC signing | 100% |
| API validation schemas | 80%+ |

---

## 7. CI Integration

Tests run on every push (Vercel preview build + separate test step).

```bash
# Runs in CI
pnpm typecheck && pnpm lint && pnpm test --run
```

Failing tests **block deployment**.
