import { afterEach, expect, it, vi } from "vitest";

const redis = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue("OK"),
}));
vi.mock("@/env", () => ({ env: { GEMINI_API_KEY: "fixture-key" } }));
vi.mock("@/server/lib/cache/redis", () => ({ redis }));

import { embedSearchText } from "../gemini-embeddings";

afterEach(() => vi.unstubAllGlobals());

it("coalesces identical work, sheds excess keys, and admits work after completion", async () => {
  const provider = Promise.withResolvers<Response>();
  const fetchMock = vi.fn()
    .mockImplementation(() => provider.promise.then((response) => response.clone()));
  vi.stubGlobal("fetch", fetchMock);

  const shared = embedSearchText(" same title ");
  const duplicate = embedSearchText("same title");
  const unique = Array.from({ length: 7 }, (_, i) => embedSearchText("title " + i));
  await expect(embedSearchText("overflow")).resolves.toBeNull();
  expect(redis.get).toHaveBeenCalledTimes(8);
  expect(fetchMock).toHaveBeenCalledTimes(8);
  expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    redirect: "error",
    headers: expect.objectContaining({ "x-goog-api-key": "fixture-key" }),
  }));

  provider.resolve(Response.json({ embedding: { values: [1, 2] } }));
  const results = await Promise.all([shared, duplicate, ...unique]);
  expect(results).toHaveLength(9);
  expect(results.every((result) => result?.[0] === 1)).toBe(true);
  await expect(embedSearchText("overflow")).resolves.toEqual([1, 2]);
  expect(fetchMock).toHaveBeenCalledTimes(9);
});
