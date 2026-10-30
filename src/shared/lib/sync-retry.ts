/**
 * Backoff for automatic (not manual) Firebase full-sync attempts.
 * Bounded exponential retries with jitter avoid retry storms after outages.
 */
export function nextSyncRetryDelayMs(consecutiveFailures: number, jitter = Math.random()): number {
  const failures = Number.isFinite(consecutiveFailures)
    ? Math.max(1, Math.floor(consecutiveFailures))
    : 1;
  const exponential = Math.min(60_000, 1_000 * 2 ** Math.min(6, failures - 1));
  const boundedJitter = Math.min(1, Math.max(0, Number.isFinite(jitter) ? jitter : 0.5));
  return Math.min(60_000, Math.round(exponential * (0.8 + boundedJitter * 0.4)));
}
