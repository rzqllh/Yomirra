import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  CARD_ENRICHMENT_CONCURRENCY,
  createCardEnrichmentQueue,
  runCardEnrichment,
} from "../card-enrichment-queue";

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("card enrichment queue", () => {
  it("keeps detail enrichment bounded and starts pending work in FIFO order", async () => {
    const queue = createCardEnrichmentQueue(CARD_ENRICHMENT_CONCURRENCY);
    const started: number[] = [];
    const releases = new Map<number, () => void>();
    let active = 0;
    let maxActive = 0;

    const jobs = Array.from({ length: 6 }, (_, index) =>
      queue.run(
        () =>
          new Promise<number>((resolve) => {
            started.push(index);
            active += 1;
            maxActive = Math.max(maxActive, active);
            releases.set(index, () => {
              active -= 1;
              resolve(index);
            });
          })
      )
    );

    await flushMicrotasks();
    expect(started).toEqual([0, 1, 2]);
    expect(maxActive).toBe(CARD_ENRICHMENT_CONCURRENCY);

    releases.get(1)?.();
    await flushMicrotasks();
    expect(started).toEqual([0, 1, 2, 3]);

    releases.get(0)?.();
    await flushMicrotasks();
    expect(started).toEqual([0, 1, 2, 3, 4]);

    releases.get(2)?.();
    await flushMicrotasks();
    expect(started).toEqual([0, 1, 2, 3, 4, 5]);

    for (const index of [3, 4, 5]) {
      releases.get(index)?.();
    }

    await expect(Promise.all(jobs)).resolves.toEqual([0, 1, 2, 3, 4, 5]);
    expect(maxActive).toBeLessThanOrEqual(CARD_ENRICHMENT_CONCURRENCY);
  });

  it("releases queue capacity when an enrichment request fails", async () => {
    const queue = createCardEnrichmentQueue(1);
    const order: string[] = [];

    const first = queue.run(async () => {
      order.push("first");
      throw new Error("detail failed");
    });
    const second = queue.run(async () => {
      order.push("second");
      return "ok";
    });

    await expect(first).rejects.toThrow("detail failed");
    await expect(second).resolves.toBe("ok");
    expect(order).toEqual(["first", "second"]);
  });

  it("retains React Query in-flight dedupe for identical synopsis query keys", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const detailTask = vi.fn(async () => ({ description: "Synopsis" }));
    const queryKey = ["manga-card-synopsis", "source-a", "manga-a"] as const;
    const queryFn = () => runCardEnrichment(detailTask);

    const [first, second] = await Promise.all([
      queryClient.fetchQuery({ queryKey, queryFn }),
      queryClient.fetchQuery({ queryKey, queryFn }),
    ]);

    expect(first).toEqual({ description: "Synopsis" });
    expect(second).toEqual({ description: "Synopsis" });
    expect(detailTask).toHaveBeenCalledTimes(1);
  });
});
