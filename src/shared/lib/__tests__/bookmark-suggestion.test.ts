import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookmarkSuggestionKey, noteCompletedChapter, takeBookmarkSuggestion } from "../bookmark-suggestion";
const owner = vi.hoisted(() => ({ uid: "guest" }));
vi.mock("../local-data-owner", () => ({ getLocalDataOwnerUid: () => owner.uid }));
beforeEach(() => { sessionStorage.clear(); localStorage.clear(); owner.uid = "guest"; });
describe("read-to-bookmark suggestion", () => {
  it("waits for more than three distinct completed chapters and offers once", () => {
    for (const id of ["1", "2", "3", "3"]) noteCompletedChapter("a", "m", id);
    expect(takeBookmarkSuggestion("a", "m")).toBe(false);
    noteCompletedChapter("a", "m", "4"); expect(takeBookmarkSuggestion("a", "m")).toBe(true);
    noteCompletedChapter("a", "m", "5"); expect(takeBookmarkSuggestion("a", "m")).toBe(false);
  });
  it("keeps completion counts and one-time prompt across tab sessions", () => {
    for (const id of ["1", "2"]) noteCompletedChapter("a", "m", id);
    const key = bookmarkSuggestionKey("a", "m");
    expect(localStorage.getItem(key)).toContain('"1"');
    sessionStorage.clear(); // Simulates the loss of session-only state on tab close.
    noteCompletedChapter("a", "m", "3");
    noteCompletedChapter("a", "m", "4");
    expect(takeBookmarkSuggestion("a", "m")).toBe(true);
    sessionStorage.clear();
    noteCompletedChapter("a", "m", "5");
    expect(takeBookmarkSuggestion("a", "m")).toBe(false);
  });

  it("upgrades a previous session-only suggestion without losing its offer state", () => {
    const key = bookmarkSuggestionKey("a", "m");
    sessionStorage.setItem(key, JSON.stringify({ chapters: ["1", "2", "3"], offered: false }));
    noteCompletedChapter("a", "m", "4");
    expect(takeBookmarkSuggestion("a", "m")).toBe(true);
    expect(localStorage.getItem(key)).toContain('"offered":true');
  });

  it("isolates provider and account identity", () => {
    for (const id of ["1", "2", "3", "4"]) noteCompletedChapter("a", "m", id);
    expect(takeBookmarkSuggestion("b", "m")).toBe(false);
    const guestKey = bookmarkSuggestionKey("a", "m"); owner.uid = "another-user";
    expect(bookmarkSuggestionKey("a", "m")).not.toBe(guestKey); expect(takeBookmarkSuggestion("a", "m")).toBe(false);
  });
  it("tolerates unavailable session storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new Error("quota"); });
    expect(() => noteCompletedChapter("a", "m", "1")).not.toThrow(); vi.restoreAllMocks();
  });
});
