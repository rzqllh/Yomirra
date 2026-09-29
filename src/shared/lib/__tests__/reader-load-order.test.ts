import { describe, expect, it } from "vitest";
import {
  advanceReaderReveal,
  getReaderPageLoadState,
} from "../reader-load-order";

describe("reader load order", () => {
  it("opens only the first two request slots at chapter start", () => {
    expect(getReaderPageLoadState(0, 0, -1)).toEqual({
      shouldLoad: true,
      shouldReveal: false,
    });
    expect(getReaderPageLoadState(1, 0, -1)).toEqual({
      shouldLoad: true,
      shouldReveal: false,
    });
    expect(getReaderPageLoadState(2, 0, -1)).toEqual({
      shouldLoad: false,
      shouldReveal: false,
    });
  });

  it("does not reveal a later page before every previous page has settled", () => {
    const settled = new Set<number>([1]);
    expect(advanceReaderReveal(settled, -1, 5)).toBe(-1);

    settled.add(0);
    expect(advanceReaderReveal(settled, -1, 5)).toBe(1);
  });

  it("opens the next bounded window only after ordered reveal advances", () => {
    expect(getReaderPageLoadState(2, 0, 1)).toEqual({
      shouldLoad: true,
      shouldReveal: false,
    });
    expect(getReaderPageLoadState(3, 0, 1)).toEqual({
      shouldLoad: true,
      shouldReveal: false,
    });
    expect(getReaderPageLoadState(4, 0, 1)).toEqual({
      shouldLoad: false,
      shouldReveal: false,
    });
  });

  it("lets a resumed reader load pages above its resume point if the user scrolls back", () => {
    expect(getReaderPageLoadState(8, 10, 9)).toEqual({
      shouldLoad: true,
      shouldReveal: true,
    });
    expect(getReaderPageLoadState(10, 10, 9)).toEqual({
      shouldLoad: true,
      shouldReveal: false,
    });
  });
});
