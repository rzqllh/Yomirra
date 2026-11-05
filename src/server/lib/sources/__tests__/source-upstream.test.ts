import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSourceUpstream } from "../source-upstream";

describe("source upstream resilience", () => {
  afterEach(() => vi.useRealTimers());

  it("holds a 429 until retry-after, then permits one recovery request", async () => {
    vi.useFakeTimers();
    const limited = vi.fn().mockRejectedValue(Object.assign(new Error("429"), {
      status: 429, retryAfterSeconds: 20,
    }));
    const load = (fetcher: () => Promise<unknown>) => loadSourceUpstream("limited-test", "search", null, fetcher);
    await expect(load(limited)).rejects.toMatchObject({ code: "RATE_LIMITED" });
    await expect(load(limited)).rejects.toMatchObject({ retryAfterSeconds: 20 });
    expect(limited).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(20_001);
    const probe = Promise.withResolvers<number>();
    const pending = load(() => probe.promise);
    await expect(load(limited)).rejects.toMatchObject({ code: "RATE_LIMITED" });
    probe.resolve(1);
    await expect(pending).resolves.toBe(1);
    await expect(load(async () => 2)).resolves.toBe(2);
  });

  it("backs off after repeated timeouts without blocking a different source", async () => {
    const timeout = vi.fn().mockRejectedValue(new Error("request timeout"));
    const load = () => loadSourceUpstream("timeout-test", "pages", null, timeout);
    await expect(load()).rejects.toMatchObject({ code: "UPSTREAM_TIMEOUT" });
    await expect(load()).rejects.toMatchObject({ code: "UPSTREAM_TIMEOUT" });
    await expect(load()).rejects.toMatchObject({ statusCode: 503, retryAfterSeconds: 20 });
    expect(timeout).toHaveBeenCalledTimes(2);
    await expect(loadSourceUpstream("healthy-test", "search", null, async () => 1)).resolves.toBe(1);
  });

  it("caches a missing resource briefly without tripping the source", async () => {
    vi.useFakeTimers();
    const upstream = vi.fn().mockRejectedValueOnce(new Error("404")).mockResolvedValue(2);
    const load = (key: string) => loadSourceUpstream("missing-test", "detail", key, upstream);
    await expect(load("missing-title")).rejects.toMatchObject({ code: "CONTENT_NOT_FOUND" });
    await expect(load("missing-title")).rejects.toMatchObject({ code: "CONTENT_NOT_FOUND" });
    await expect(load("other-title")).resolves.toBe(2);
    expect(upstream).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(30_001);
    await expect(load("missing-title")).resolves.toBe(2);
  });
});
