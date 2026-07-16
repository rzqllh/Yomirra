/**
 * Token bucket rate limiter for MangaDex API.
 * Max 4 req/s to stay under their 5/s limit with headroom.
 * Requests queue when bucket is empty, timeout after 10s.
 */

const MAX_TOKENS = 4;
const REFILL_INTERVAL_MS = 1000; // 1 token per 250ms = 4/s
const REQUEST_TIMEOUT_MS = 10000;

let tokens = MAX_TOKENS;
let lastRefill = Date.now();
const queue: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];

function refillTokens() {
  const now = Date.now();
  const elapsed = now - lastRefill;
  const newTokens = Math.floor(elapsed / (REFILL_INTERVAL_MS / MAX_TOKENS));
  if (newTokens > 0) {
    tokens = Math.min(MAX_TOKENS, tokens + newTokens);
    lastRefill = now;
  }
}

function processQueue() {
  refillTokens();
  while (tokens > 0 && queue.length > 0) {
    tokens--;
    const next = queue.shift();
    next?.resolve();
  }
}

/** Acquire a token before making a MangaDex API request. Queues if no tokens available. */
export function acquireToken(): Promise<void> {
  refillTokens();

  if (tokens > 0) {
    tokens--;
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      const idx = queue.findIndex(q => q.resolve === resolve);
      if (idx !== -1) queue.splice(idx, 1);
      reject(new Error("MangaDex rate limit queue timeout"));
    }, REQUEST_TIMEOUT_MS);

    queue.push({
      resolve: () => {
        clearTimeout(timeout);
        resolve();
      },
      reject,
    });

    // Schedule a drain attempt
    setTimeout(processQueue, REFILL_INTERVAL_MS / MAX_TOKENS);
  });
}
