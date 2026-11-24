import { afterEach, beforeEach, expect, it, vi } from "vitest";

const redis = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue("OK"),
}));
vi.mock("@/env", () => ({ env: { GEMINI_API_KEY: "fixture-key" } }));
vi.mock("@/server/lib/cache/redis", () => ({ redis }));
const admission=vi.hoisted(()=>vi.fn().mockResolvedValue(true));
vi.mock("@/server/lib/cache/optional-service-budget",()=>({reserveOptionalService:admission}));
const vector=Array.from({length:768},(_,i)=>i===0?1:2);

import { embedSearchText } from "../gemini-embeddings";

beforeEach(()=>{vi.clearAllMocks();admission.mockResolvedValue(true);redis.get.mockResolvedValue(null);});
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
  await vi.waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(8));
  expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    redirect: "error",
    headers: expect.objectContaining({ "x-goog-api-key": "fixture-key" }),
  }));

  provider.resolve(Response.json({ embedding: { values: vector } }));
  const results = await Promise.all([shared, duplicate, ...unique]);
  expect(results).toHaveLength(9);
  expect(results.every((result) => result?.[0] === 1)).toBe(true);
  await expect(embedSearchText("overflow")).resolves.toEqual(vector);
  expect(fetchMock).toHaveBeenCalledTimes(9);
});

it("uses a cached vector without spending new admissions and degrades on denied budget",async()=>{
  const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);admission.mockResolvedValue(false);
  redis.get.mockResolvedValueOnce(JSON.stringify(vector));
  expect(await embedSearchText("cached")).toEqual(vector);
  expect(admission).not.toHaveBeenCalled();
  expect(await embedSearchText("uncached")).toBeNull();
  expect(admission).toHaveBeenCalledWith("gemini");expect(fetcher).not.toHaveBeenCalled();
});
