/**
 * Token bucket rate limiter for MangaDex API.
 * Max 4 req/s to stay under their 5/s limit with headroom.
 * Requests queue when bucket is empty, timeout after 10s.
 */

const MAX_TOKENS = 4;
const REFILL_INTERVAL_MS = 1000; // 1 token per 250ms = 4/s
const REQUEST_TIMEOUT_MS = 10000;
const REFILL_STEP_MS = REFILL_INTERVAL_MS / MAX_TOKENS;

let tokens = MAX_TOKENS;
let lastRefill = Date.now();
let drainTimer: ReturnType<typeof setTimeout> | undefined;

interface QueueEntry {
  resolve: () => void;
  reject: (error: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
  signal?: AbortSignal;
  onAbort?: () => void;
}

const queue: QueueEntry[] = [];

function refillTokens() {
  const now = Date.now();
  const elapsed = now - lastRefill;
  const newTokens = Math.floor(elapsed / REFILL_STEP_MS);
  if (newTokens > 0) {
    tokens = Math.min(MAX_TOKENS, tokens + newTokens);
    lastRefill += newTokens * REFILL_STEP_MS;
  }
}

function removeEntry(entry: QueueEntry) {
  const index = queue.indexOf(entry);
  if (index !== -1) queue.splice(index, 1);
  clearTimeout(entry.timeout);
  if (entry.onAbort) entry.signal?.removeEventListener("abort", entry.onAbort);
}

function scheduleDrain() {
  if (drainTimer || queue.length === 0) return;
  drainTimer = setTimeout(() => {
    drainTimer = undefined;
    processQueue();
    scheduleDrain();
  }, REFILL_STEP_MS);
}

function processQueue() {
  refillTokens();
  while (tokens > 0 && queue.length > 0) {
    tokens--;
    const next = queue.shift();
    if (next) {
      clearTimeout(next.timeout);
      if (next.onAbort) next.signal?.removeEventListener("abort", next.onAbort);
      next.resolve();
    }
  }
}

export interface AcquireTokenOptions {
  signal?: AbortSignal;
  deadlineMs?: number;
  now?: () => number;
}

/** Acquire a token before making a MangaDex API request. Queues if no tokens available. */
export async function acquireToken(options: AcquireTokenOptions = {}): Promise<void> {
  options.signal?.throwIfAborted();
  const now = options.now ?? (() => performance.now());
  const deadlineWait = options.deadlineMs === undefined
    ? REQUEST_TIMEOUT_MS
    : options.deadlineMs - now();
  if (deadlineWait <= 0) {
    return Promise.reject(new Error("MangaDex rate limit deadline exceeded"));
  }

  refillTokens();

  if (tokens > 0) {
    tokens--;
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const waitMs = Math.min(REQUEST_TIMEOUT_MS, deadlineWait);
    const entry = {} as QueueEntry;
    entry.resolve = resolve;
    entry.reject = reject;
    entry.signal = options.signal;
    entry.timeout = setTimeout(() => {
      removeEntry(entry);
      reject(new Error(
        deadlineWait <= REQUEST_TIMEOUT_MS
          ? "MangaDex rate limit deadline exceeded"
          : "MangaDex rate limit queue timeout"
      ));
    }, waitMs);
    entry.onAbort = options.signal
      ? () => {
          removeEntry(entry);
          reject(options.signal?.reason ?? new DOMException("Aborted", "AbortError"));
        }
      : undefined;
    options.signal?.addEventListener("abort", entry.onAbort!, { once: true });
    queue.push(entry);
    scheduleDrain();
  });
}
