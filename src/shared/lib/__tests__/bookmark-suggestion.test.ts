import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookmarkSuggestionKey, noteCompletedChapter, takeBookmarkSuggestion } from "../bookmark-suggestion";
const owner = vi.hoisted(() => ({ uid: "guest" }));
vi.mock("../local-data-owner", () => ({ getLocalDataOwnerUid: () => owner.uid }));
beforeEach(() => { sessionStorage.clear(); owner.uid = "guest"; });
describe("read-to-bookmark suggestion", () => {
  it("waits for more than three distinct completed chapters and offers once", () => {
    for (const id of ["1", "2", "3", "3"]) noteCompletedChapter("a", "m", id);
    expect(takeBookmarkSuggestion("a", "m")).toBe(false);
    noteCompletedChapter("a", "m", "4"); expect(takeBookmarkSuggestion("a", "m")).toBe(true);
    noteCompletedChapter("a", "m", "5"); expect(takeBookmarkSuggestion("a", "m")).toBe(false);
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
