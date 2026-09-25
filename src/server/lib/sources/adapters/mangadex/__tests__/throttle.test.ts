import { afterEach, describe, expect, it, vi } from "vitest";

interface AcquireOptions {
  signal?: AbortSignal;
  deadlineMs?: number;
  now?: () => number;
}

async function freshAcquireToken() {
  vi.resetModules();
  const { acquireToken } = await import("../throttle");
  return acquireToken as (options?: AcquireOptions) => Promise<void>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("MangaDex throttle cancellation", () => {
  it("rejects a pre-aborted caller before consuming a token", async () => {
    const acquireToken = await freshAcquireToken();
    const caller = new AbortController();
    caller.abort(new DOMException("Cancelled", "AbortError"));

    await expect(acquireToken({ signal: caller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("removes a queued request when the caller aborts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const acquireToken = await freshAcquireToken();
    await Promise.all(Array.from({ length: 4 }, () => acquireToken()));
    const caller = new AbortController();

    const queued = acquireToken({ signal: caller.signal });
    caller.abort(new DOMException("Cancelled", "AbortError"));

    await expect(queued).rejects.toMatchObject({ name: "AbortError" });
  });

  it("expires a queued request at the absolute deadline", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const acquireToken = await freshAcquireToken();
    await Promise.all(Array.from({ length: 4 }, () => acquireToken()));

    const queued = acquireToken({ deadlineMs: 100, now: () => Date.now() });
    const settled = queued.catch((error) => error);
    await vi.advanceTimersByTimeAsync(100);

    await expect(settled).resolves.toMatchObject({
      message: "MangaDex rate limit deadline exceeded",
    });
  });
});
