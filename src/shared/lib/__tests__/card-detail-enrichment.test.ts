import { describe, expect, it, vi } from "vitest";
import {
  MAX_CONCURRENT_CARD_DETAIL_REQUESTS,
  getCardDetailEnrichmentState,
  runCardDetailEnrichment,
} from "../card-detail-enrichment";

describe("card detail enrichment budget", () => {
  it("keeps concurrent detail work within the shared budget", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let active = 0;
    let maxObserved = 0;

    const jobs = Array.from({ length: 12 }, (_, index) =>
      runCardDetailEnrichment(async () => {
        active += 1;
        maxObserved = Math.max(maxObserved, active);
        await gate;
        active -= 1;
        return index;
      })
    );

    await vi.waitFor(() => {
      expect(getCardDetailEnrichmentState()).toEqual({
        active: MAX_CONCURRENT_CARD_DETAIL_REQUESTS,
        queued: 12 - MAX_CONCURRENT_CARD_DETAIL_REQUESTS,
      });
    });

    release?.();
    await expect(Promise.all(jobs)).resolves.toHaveLength(12);
    expect(maxObserved).toBe(MAX_CONCURRENT_CARD_DETAIL_REQUESTS);
    expect(getCardDetailEnrichmentState()).toEqual({ active: 0, queued: 0 });
  });

  it("removes aborted queued work without consuming a slot", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const activeJobs = Array.from(
      { length: MAX_CONCURRENT_CARD_DETAIL_REQUESTS },
      () => runCardDetailEnrichment(async () => gate)
    );

    await vi.waitFor(() => {
      expect(getCardDetailEnrichmentState().active).toBe(
        MAX_CONCURRENT_CARD_DETAIL_REQUESTS
      );
    });

    const controller = new AbortController();
    const queued = runCardDetailEnrichment(
      async () => "should-not-run",
      controller.signal
    );

    expect(getCardDetailEnrichmentState().queued).toBe(1);
    controller.abort();

    await expect(queued).rejects.toMatchObject({ name: "AbortError" });
    expect(getCardDetailEnrichmentState().queued).toBe(0);

    release?.();
    await Promise.all(activeJobs);
  });
});
