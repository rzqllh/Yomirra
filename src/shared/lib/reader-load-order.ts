export type ReaderPageQueueState =
  | "idle"
  | "queued"
  | "loading"
  | "decoded"
  | "failed"
  | "cancelled";

export type ReaderPageQueueEvent =
  | "queue"
  | "start"
  | "decode"
  | "fail"
  | "cancel"
  | "reset";

export type ReaderPreloadIntensity = "light" | "balanced" | "aggressive";

export interface ReaderPageLoadState {
  shouldLoad: boolean;
  shouldReveal: boolean;
}

/**
 * Small, explicit lifecycle used by reader image jobs. Invalid/stale events are
 * intentionally ignored so an old async completion cannot revive a cancelled job.
 */
export function transitionReaderPageQueueState(
  state: ReaderPageQueueState,
  event: ReaderPageQueueEvent
): ReaderPageQueueState {
  if (event === "reset") return "idle";

  switch (state) {
    case "idle":
      if (event === "queue") return "queued";
      if (event === "cancel") return "cancelled";
      return state;
    case "queued":
      if (event === "start") return "loading";
      if (event === "fail") return "failed";
      if (event === "cancel") return "cancelled";
      return state;
    case "loading":
      if (event === "decode") return "decoded";
      if (event === "fail") return "failed";
      if (event === "cancel") return "cancelled";
      return state;
    case "decoded":
    case "failed":
      return state;
    case "cancelled":
      return state;
  }
}

export function getReaderLookAheadWindow(
  intensity: ReaderPreloadIntensity,
  dataSaver: boolean
): number {
  if (dataSaver) return 1;

  switch (intensity) {
    case "light":
      return 1;
    case "aggressive":
      return 3;
    case "balanced":
    default:
      return 2;
  }
}

export function getReaderPageLoadState(
  index: number,
  queueStartIndex: number,
  revealedThrough: number,
  windowSize = 2
): ReaderPageLoadState {
  if (index < queueStartIndex) {
    return { shouldLoad: true, shouldReveal: true };
  }

  return {
    shouldLoad: index <= revealedThrough + windowSize,
    shouldReveal: index <= revealedThrough,
  };
}

export function advanceReaderReveal(
  settledIndices: ReadonlySet<number>,
  revealedThrough: number,
  totalPages: number
): number {
  let next = revealedThrough;
  while (next + 1 < totalPages && settledIndices.has(next + 1)) {
    next += 1;
  }
  return next;
}
