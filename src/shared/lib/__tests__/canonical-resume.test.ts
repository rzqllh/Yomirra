import { describe, expect, it } from "vitest";
import { resolveCanonicalResume } from "../canonical-resume";

const bindings = [{ sourceId: "shinigami", mangaId: "shini-id" }, { sourceId: "asurascans", mangaId: "asura-id" }];
const lastRead = [{ sourceId: "asurascans", mangaId: "asura-id", chapterId: "chapter-99", readAt: 100 }];

describe("canonical smart resume", () => {
  it("respects explicit preferred source even if another source was read more recently", () => {
    expect(resolveCanonicalResume({ bindings, preferredSourceId: "shinigami", lastRead })).toEqual({
      action: "resume", source: bindings[0], chapterId: undefined, reason: "preferred",
    });
  });
  it("never silently switches away from unavailable preferred source", () => {
    expect(resolveCanonicalResume({ bindings, preferredSourceId: "shinigami", unavailableSourceIds: ["shinigami"], lastRead })).toEqual({
      action: "pick-source", reason: "preferred-unavailable",
    });
  });
  it("chooses last-read when there is no explicit preference", () => {
    expect(resolveCanonicalResume({ bindings, lastRead })).toEqual({
      action: "resume", source: bindings[1], chapterId: "chapter-99", reason: "last-read",
    });
  });
  it("does not treat device offline as a broken source or switch to cached alternative", () => {
    expect(resolveCanonicalResume({ bindings, preferredSourceId: "shinigami", deviceOffline: true, cachedSourceRefs: [bindings[1]], lastRead })).toEqual({
      action: "offline", reason: "no-cached-preferred",
    });
  });
  it("resumes an offline cached preferred source", () => {
    expect(resolveCanonicalResume({ bindings, preferredSourceId: "shinigami", deviceOffline: true, cachedSourceRefs: [bindings[0]] })).toEqual({
      action: "resume", source: bindings[0], reason: "preferred", chapterId: undefined,
    });
  });
  it("does not translate chapter IDs between sources", () => {
    expect(resolveCanonicalResume({ bindings, preferredSourceId: "shinigami", lastRead })).not.toHaveProperty("chapterId", "chapter-99");
  });
  it("shows picker if multiple eligible bindings remain", () => {
    expect(resolveCanonicalResume({ bindings })).toEqual({ action: "pick-source", reason: "multiple-sources" });
  });
});
