import { afterEach, describe, expect, it, vi } from "vitest";
import { createMangaDexTagFetcher } from "../tag-cache";
import { createMangaDexTransport } from "../transport";

const tagPayload = {
  result: "ok",
  response: "collection",
  data: [
    {
      id: "tag-1",
      type: "tag",
      attributes: { name: { en: "Action" }, group: "genre" },
    },
  ],
  limit: 1,
  offset: 0,
  total: 1,
};

const dohPayload = {
  Status: 0,
  TC: false,
  AD: true,
  Question: [{ name: "api.mangadex.org.", type: 1 }],
  Answer: [{
    name: "api.mangadex.org.",
    type: 1,
    TTL: 60,
    data: "104.17.161.14",
  }],
};

afterEach(() => {
  vi.useRealTimers();
});

describe("MangaDex tag transport", () => {
  it("uses the source-local transport without adding a 429 retry", async () => {
    let calls = 0;
    const transport = createMangaDexTransport({
      normalFetch: async () => {
        calls += 1;
        return new Response("rate limited", { status: 429 });
      },
      now: () => 0,
    });
    const fetchTags = createMangaDexTagFetcher(transport);

    await expect(fetchTags()).rejects.toThrow("Failed to fetch MangaDex tags: 429");
    expect(calls).toBe(1);
  });

  it("reserves 6500ms of its 10 second deadline for fallback", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    let normalSignal: AbortSignal | undefined;
    const transport = createMangaDexTransport({
      normalFetch: async (_input, init) => {
        normalSignal = init?.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          normalSignal?.addEventListener(
            "abort",
            () => reject(normalSignal?.reason ?? new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        });
      },
      dohFetch: async () => Response.json(dohPayload),
      systemLookup: async () => ["198.18.0.1"],
      pinnedRequest: async () => Response.json(tagPayload),
      now: () => Date.now(),
    });
    const fetchTags = createMangaDexTagFetcher(transport);

    const request = fetchTags();
    await vi.advanceTimersByTimeAsync(3500);

    expect(normalSignal?.aborted).toBe(true);
    await expect(request).resolves.toEqual(tagPayload.data);
  });
});
