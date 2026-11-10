import { describe, expect, it, vi } from "vitest";
import type { HttpClient } from "../../base/http-client";
import { RestrictedGallery01Source } from "../index";
import {
  chapterGalleryId,
  normalizeGallery,
  normalizeListing,
  numericId,
} from "../normalizer";

const fixture = {
  id: 123,
  media_id: "456",
  title: { english: "Fixture Gallery", pretty: "Fixture", japanese: "" },
  tags: [{ type: "tag", name: "fiction" }],
  images: {
    cover: { t: "w" },
    pages: [{ t: "j", w: 800, h: 1200 }, { t: "p" }],
  },
  num_pages: 2,
  upload_date: 1760000000,
};

describe("RCS-01 (disabled-by-default candidate)", () => {
  it("keeps the source unlisted and unavailable", () => {
    const source = new RestrictedGallery01Source();
    expect(source.id).toBe("rcs-01");
    expect(source.isNsfw).toBe(true);
    expect(source.isEnabled).toBe(false);
    expect(source.status).toBe("in-dev");
    expect(source.capabilities.search).toBe(false);
    expect(source.capabilities.pages).toBe(false);
    expect(source.capabilities.download).toBe(false);
  });

  it("normalizes a synthetic gallery with stable identifiers", () => {
    const output = normalizeGallery(fixture);
    expect(output.item).toMatchObject({
      id: "123",
      title: "Fixture Gallery",
      contentRating: "pornographic",
      isNsfw: true,
    });
    expect(output.chapter).toMatchObject({
      id: "123-ch1",
      mangaId: "123",
      number: 1,
      pageCount: 2,
    });
    expect(output.pages.map((page) => page.index)).toEqual([0, 1]);
    expect(output.pages[0].url).toContain("/456/1.jpg");
    expect(output.pages[1].url).toContain("/456/2.png");
    expect(output.detail.genres).toEqual(["fiction"]);
  });

  it("rejects invalid identifiers and malformed gallery input", () => {
    expect(() => numericId("../123")).toThrow();
    expect(() => numericId(0)).toThrow();
    expect(() => chapterGalleryId("123-ch2")).toThrow();
    expect(chapterGalleryId("123-ch1")).toBe("123");
    expect(() => normalizeGallery({
      ...fixture,
      num_pages: 3,
    })).toThrow(/Page count mismatch/);
    expect(() => normalizeGallery({
      ...fixture,
      images: { ...fixture.images, pages: [{ t: "exe" }] },
      num_pages: 1,
    })).toThrow(/Unsupported image encoding/);
  });

  it("uses upstream pagination rather than guessing from item count", () => {
    expect(normalizeListing({ result: [fixture], num_pages: 3 }, 1))
      .toMatchObject({ hasNextPage: true });
    expect(normalizeListing({ result: [fixture], num_pages: 1 }, 1))
      .toMatchObject({ hasNextPage: false });
    expect(normalizeListing({ result: [fixture] }, 1))
      .toMatchObject({ hasNextPage: false });
  });

  it("never issues HTTP requests while disabled, including explicit opt-in requests", async () => {
    const get = vi.fn().mockRejectedValue(new Error("NETWORK_MUST_NOT_RUN"));
    const client = { get } as unknown as HttpClient;
    const source = new RestrictedGallery01Source(client);

    await expect(source.getPopular(1, { hideNsfw: false })).rejects.toMatchObject({ code: "SOURCE_DISABLED" });
    await expect(source.getLatest(1, { hideNsfw: false })).rejects.toMatchObject({ code: "SOURCE_DISABLED" });
    await expect(source.search("fixture", 1, undefined, { hideNsfw: false }))
      .rejects.toMatchObject({ code: "SOURCE_DISABLED" });
    await expect(source.getDetail("123", { hideNsfw: false }))
      .rejects.toMatchObject({ code: "SOURCE_DISABLED" });
    await expect(source.getChapters("123", { hideNsfw: false }))
      .rejects.toMatchObject({ code: "SOURCE_DISABLED" });
    await expect(source.getPages("123-ch1")).rejects.toMatchObject({ code: "SOURCE_DISABLED" });
    expect(get).not.toHaveBeenCalled();
  });
});
