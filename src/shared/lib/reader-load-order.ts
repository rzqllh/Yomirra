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
  dataSaver: boolean,
  totalCount?: number
): number {
  if (dataSaver) return 1;

  switch (intensity) {
    case "light":
      return 1;
    case "aggressive":
      // Never eagerly request an entire long chapter. Eight pages ahead
      // keeps navigation responsive without multiplying proxy/origin transfer.
      return Math.min(totalCount ?? 8, 8);
    case "balanced":
    default:
      return 3;
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

/** Match the vertical reader's full-width aspect-ratio box before measuring it.
 * Unknown or implausible metadata keeps the existing loose 1200px estimate. */
export function estimateVerticalPageSize(page:{width?:number;height?:number}|undefined,layoutWidth:number,gap:number):number {
  const w=page?.width,h=page?.height;
  if(typeof w!=="number"||typeof h!=="number"||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||!Number.isFinite(layoutWidth)||layoutWidth<=0)return 1200;
  const height=layoutWidth*h/w;
  if(!Number.isFinite(height)||height<1||height>100000)return 1200;
  return height+gap;
}
