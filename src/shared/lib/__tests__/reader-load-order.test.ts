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

  it("advances reveal past failed/settled pages without deadlocking queue", () => {
    const settled = new Set<number>([0, 1]);
    // Page 2 failed permanently and was added to settled set
    settled.add(2);
    // Page 3 loaded successfully
    settled.add(3);

    const revealed = advanceReaderReveal(settled, -1, 10);
    // Queue successfully advances to 3 despite page 2 failing
    expect(revealed).toBe(3);

    // Page 4 and 5 are now eligible to load
    expect(getReaderPageLoadState(4, 0, revealed, 2)).toEqual({
      shouldLoad: true,
      shouldReveal: false,
    });
    expect(getReaderPageLoadState(5, 0, revealed, 2)).toEqual({
      shouldLoad: true,
      shouldReveal: false,
    });
    expect(getReaderPageLoadState(6, 0, revealed, 2)).toEqual({
      shouldLoad: false,
      shouldReveal: false,
    });
  });
});
