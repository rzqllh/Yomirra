export interface ReaderPageLoadState {
  shouldLoad: boolean;
  shouldReveal: boolean;
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
