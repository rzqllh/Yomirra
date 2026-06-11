# Yomirra — Source Adapter Boundary Contract

> **Version:** 0.1  
> **Status:** BINDING  
> **Rule:** Any change to source adapter, API layer, or data-fetching contracts requires explicit approval. This file defines the exact boundary. When in doubt, treat it as NOT ALLOWED and ask.

---

## 1. What Is "The Adapter Layer"

The adapter layer includes any file that:

- Makes HTTP requests to manga source APIs
- Parses source API responses into internal types
- Handles image proxy/CDN URL rewriting
- Defines source capability flags (e.g., `supportsSearch`, `supportsFilter`)
- Defines the `MangaSource`, `Manga`, `Chapter`, `Page` type contracts
- Lives in server-side route handlers (`/api/`, `route.ts`, `page.tsx` with `export async function GET`)

**These are OUT OF SCOPE for the UI rewrite unless a specific exception is listed below.**

---

## 2. ALLOWED — Safe to Do Without Approval

These changes are safe because they extend without breaking:

| Change | Condition |
|--------|-----------|
| Add an optional prop to an existing adapter response type | Prop must be `optional` (`?`), not required. Existing consumers must not break. |
| Add a more specific error subtype to an existing error union | The existing error type must still be valid. No consumer may break. |
| Add a new optional field to `MangaSource` capability flags | Must be optional. Existing sources that don't implement it return `undefined`. |
| Read an existing field from adapter response that was previously unused in UI | No server-side change needed. UI reads what already exists. |
| Add a UI-only prop to a data type used only as a display model | Only if the type is a UI view model, not the raw source adapter type. |
| Fix a TypeScript type annotation error without changing runtime behavior | No logic change. Type fix only. |

---

## 3. NOT ALLOWED — Requires Explicit Approval

These changes require stopping and asking before proceeding:

| Change | Why It Is Blocked |
|--------|-------------------|
| Rename any field in `Manga`, `Chapter`, `Page`, or `MangaSource` types | Breaks all callsites across the codebase |
| Make an optional field required | Breaks all existing callsites that don't provide it |
| Change a function return type (adapter fetch functions) | Breaks all consumers of that function |
| Add a new required parameter to an adapter fetch function | Breaks all existing callers |
| Change the URL pattern of an API route (`/api/**`) | Breaks existing client fetch calls |
| Add or remove a source capability flag that changes adapter behavior | Changes product behavior, not just UI |
| Change image proxy URL format or proxy rules | Security risk, breaks image loading across all pages |
| Touch Firebase / Supabase query logic | Auth and sync risk |
| Touch Zustand store shape (add/remove/rename root keys) | Breaks all subscribers; requires migration plan |
| Add a new npm/pnpm dependency | Requires explicit installation approval |
| Change `GEMINI.md` rules | Requires explicit approval |

---

## 4. Gray Zone — Ask First

| Change | How to Handle |
|--------|--------------|
| Adding a new server route (`/api/new-endpoint`) | Ask first. State the use case. |
| Changing a query parameter name on an existing route | Ask first. Check if any existing URL is saved/bookmarked. |
| Wrapping an existing adapter response in a new transformer | Fine if adapter itself is untouched. Transformer lives in UI layer. |
| Adding a `metadata` or `extra` field to adapter response for UI hints | Ask first. Propose the minimal type extension. |

---

## 5. Escalation Protocol

When a UI task cannot be completed without a change that is NOT ALLOWED:

1. **STOP** — do not implement a workaround that violates the boundary.
2. **Write a concise proposal:**
   ```
   ADAPTER CHANGE REQUEST
   
   Screen/component: [where the issue is]
   Problem: [what the UI cannot do without this change]
   Proposed change: [exact change to adapter/type/route]
   Type of change: [RENAME / NEW FIELD / RETURN TYPE / PARAM / ROUTE / OTHER]
   Risk assessment: [what could break and why]
   Alternative if rejected: [what UI does instead]
   ```
3. **Submit the proposal** and wait for approval.
4. **Do not proceed** until approval is received.

---

## 6. Type Extension Example — ALLOWED

```ts
// Original adapter type (do not change)
interface Chapter {
  id: string;
  title: string;
  number: number;
  publishedAt: string;
}

// ALLOWED: UI view model extends it with optional UI-only field
interface ChapterUIModel extends Chapter {
  isRead?: boolean;        // optional, UI-layer only
  isCurrent?: boolean;     // optional, UI-layer only
}

// Usage: transform in component, never in adapter
function toChapterUIModel(chapter: Chapter, history: ReadHistory): ChapterUIModel {
  return {
    ...chapter,
    isRead: history.readChapterIds.has(chapter.id),
    isCurrent: history.currentChapterId === chapter.id,
  };
}
```

## 7. Type Change Example — NOT ALLOWED

```ts
// ❌ NEVER: Renaming a field in the base adapter type
interface Chapter {
  id: string;
  name: string;       // ❌ was "title" — this breaks all callsites
  chapterNo: number;  // ❌ was "number" — this breaks all callsites
}

// ❌ NEVER: Making an optional field required
interface MangaSource {
  id: string;
  name: string;
  iconUrl: string;    // ❌ was optional — now breaks sources that don't provide it
}
```

---

## 8. Source Capability Flags Reference

Before building any UI that relies on source capabilities (filters, tags, sort, etc.), verify the capability flag exists and is true for the active source. Do not render controls for capabilities that may not exist.

```ts
// Always guard capability-dependent UI:
if (source.capabilities.supportsFilter) {
  // render filter UI
}

// Never: render filter UI and just show "unsupported" error after user taps
```

---

## 9. Image Proxy — Security Note

The image proxy is security-critical. Do not:

- Change the proxy URL pattern
- Add bypass parameters
- Expose the original source URL to the client if the current implementation proxies it
- Add new image sources without going through the proxy

If cover images fail to load, debug through the existing proxy, not by pointing directly to source CDN.
