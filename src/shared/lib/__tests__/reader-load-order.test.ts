import { describe, expect, it } from "vitest";
import {
  advanceReaderReveal,
  getReaderLookAheadWindow,
  getReaderPageLoadState,
  transitionReaderPageQueueState,
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
    const settled = new Set<number>([0, 1, 2, 3]);
    const revealed = advanceReaderReveal(settled, -1, 10);

    expect(revealed).toBe(3);
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

  it("models the explicit image job lifecycle and keeps cancelled jobs terminal", () => {
    let state = transitionReaderPageQueueState("idle", "queue");
    expect(state).toBe("queued");

    state = transitionReaderPageQueueState(state, "start");
    expect(state).toBe("loading");

    state = transitionReaderPageQueueState(state, "decode");
    expect(state).toBe("decoded");
    expect(transitionReaderPageQueueState(state, "fail")).toBe("decoded");

    let cancelled = transitionReaderPageQueueState("loading", "cancel");
    expect(cancelled).toBe("cancelled");
    expect(transitionReaderPageQueueState(cancelled, "decode")).toBe("cancelled");

    cancelled = transitionReaderPageQueueState(cancelled, "reset");
    expect(cancelled).toBe("idle");
  });

  it("uses one shared configurable look-ahead policy", () => {
    expect(getReaderLookAheadWindow("light", false)).toBe(1);
    expect(getReaderLookAheadWindow("balanced", false)).toBe(2);
    expect(getReaderLookAheadWindow("aggressive", false)).toBe(3);
    expect(getReaderLookAheadWindow("aggressive", true)).toBe(1);
  });

  it("keeps a long throttled chapter bounded and prevents later pages from skipping unresolved earlier pages", () => {
    const totalPages = 100;
    const windowSize = 3;
    const settled = new Set<number>();
    let revealedThrough = -1;

    const eligible = () =>
      Array.from({ length: totalPages }, (_, index) => index).filter(
        (index) =>
          !settled.has(index) &&
          index > revealedThrough &&
          getReaderPageLoadState(index, 0, revealedThrough, windowSize).shouldLoad
      );

    expect(eligible()).toEqual([0, 1, 2]);

    settled.add(2);
    revealedThrough = advanceReaderReveal(settled, revealedThrough, totalPages);
    expect(revealedThrough).toBe(-1);
    expect(eligible()).toEqual([0, 1]);

    settled.add(0);
    revealedThrough = advanceReaderReveal(settled, revealedThrough, totalPages);
    expect(revealedThrough).toBe(0);
    expect(eligible()).toEqual([1, 3]);

    settled.add(3);
    revealedThrough = advanceReaderReveal(settled, revealedThrough, totalPages);
    expect(revealedThrough).toBe(0);
    expect(eligible()).toEqual([1]);

    settled.add(1);
    revealedThrough = advanceReaderReveal(settled, revealedThrough, totalPages);
    expect(revealedThrough).toBe(3);
    expect(eligible()).toEqual([4, 5, 6]);
    expect(eligible()).toHaveLength(windowSize);
  });
});
