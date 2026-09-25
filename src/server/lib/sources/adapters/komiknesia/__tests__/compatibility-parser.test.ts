import { describe, expect, it } from "vitest";
import {
  parseKomikNesiaContents,
  parseKomikNesiaDetail,
  parseKomikNesiaSearch,
} from "../compatibility-parser";

const identity = {
  id: 1,
  title: "Hantu Kerja",
  slug: "hantu-kerja",
  cover: "https://data.cdnesia.my.id/covers/hantu-kerja.jpg",
  status: "ongoing",
};

describe("KomikNesia compatibility parser", () => {
  it("normalizes legacy and current detail contracts identically", () => {
    const legacy = parseKomikNesiaDetail({
      status: true,
      data: {
        ...identity,
        type: "manhwa",
        description: "Cerita hantu",
        chapters: [
          {
            id: 10,
            slug: "hantu-kerja-chapter-7",
            number: "7",
            title: "Chapter 7",
            createdAt: "2024-01-10T00:00:00.000Z",
          },
        ],
      },
    });

    const current = parseKomikNesiaDetail({
      ...identity,
      content_type: "manhwa",
      synopsis: "Cerita hantu",
      chapters: [
        {
          id: 10,
          slug: "hantu-kerja-chapter-7",
          chapter_number: "7",
          title: "Chapter 7",
          created_at: "2024-01-10T00:00:00.000Z",
        },
      ],
    });

    expect(current).toEqual(legacy);
  });

  it("normalizes legacy and current contents pagination identically", () => {
    const legacy = parseKomikNesiaContents({
      status: true,
      data: [
        {
          ...identity,
          type: "manhwa",
          description: "Cerita hantu",
          latestChapter: {
            number: "7",
            slug: "hantu-kerja-chapter-7",
            createdAt: "2024-01-10T00:00:00.000Z",
          },
        },
      ],
      totalPages: 4,
    });

    const current = parseKomikNesiaContents({
      status: true,
      data: [
        {
          ...identity,
          content_type: "manhwa",
          sinopsis: "Cerita hantu",
          lastChapters: [
            {
              number: "7",
              slug: "hantu-kerja-chapter-7",
              created_at: { time: 1704844800 },
            },
          ],
        },
      ],
      meta: { page: 1, total_pages: 4 },
    });

    expect(current).toEqual(legacy);
  });

  it("accepts current search with a null last_chapter", () => {
    expect(
      parseKomikNesiaSearch({
        manga: [
          {
            ...identity,
            content_type: "manhwa",
            synopsis: "Cerita hantu",
            last_chapter: null,
          },
        ],
        totalPages: 1,
      })
    ).toEqual({
      items: [
        {
          ...identity,
          thumbnail: undefined,
          genres: undefined,
          author: undefined,
          artist: undefined,
          rating: undefined,
          totalChapters: undefined,
          type: "manhwa",
          description: "Cerita hantu",
          createdAt: undefined,
          updatedAt: undefined,
        },
      ],
      totalPages: 1,
    });
  });

  it.each([
    ["null root", () => parseKomikNesiaDetail(null)],
    ["non-array contents", () => parseKomikNesiaContents({ data: {}, totalPages: 1 })],
    ["missing identity", () => parseKomikNesiaDetail({ title: "No slug" })],
    ["negative pagination", () => parseKomikNesiaContents({ data: [], totalPages: -1 })],
    [
      "malformed timestamp wrapper",
      () =>
        parseKomikNesiaContents({
          data: [
            {
              ...identity,
              content_type: "manhwa",
              lastChapters: [{ number: "7", created_at: { time: "bad" } }],
            },
          ],
          meta: { total_pages: 1 },
        }),
    ],
    [
      "present null timestamp",
      () =>
        parseKomikNesiaContents({
          data: [{ ...identity, type: "manhwa", createdAt: null }],
          totalPages: 1,
        }),
    ],
    [
      "non-ISO timestamp text",
      () =>
        parseKomikNesiaContents({
          data: [{ ...identity, type: "manhwa", createdAt: "January 10, 2024" }],
          totalPages: 1,
        }),
    ],
    [
      "unrepresentable unix timestamp",
      () =>
        parseKomikNesiaContents({
          data: [{ ...identity, type: "manhwa", createdAt: { time: Number.MAX_VALUE } }],
          totalPages: 1,
        }),
    ],
    [
      "unknown non-null last_chapter shape",
      () =>
        parseKomikNesiaSearch({
          manga: [{ ...identity, content_type: "manhwa", last_chapter: { number: 7 } }],
          totalPages: 1,
        }),
    ],
    [
      "mixed legacy and current search items",
      () =>
        parseKomikNesiaSearch({
          manga: [
            { ...identity, type: "manhwa" },
            { ...identity, slug: "hantu-kerja-2", content_type: "manhwa" },
          ],
          totalPages: 1,
        }),
    ],
  ])("rejects %s with the stable schema mismatch prefix", (_name, parse) => {
    expect(parse).toThrow(/^KOMIKNESIA_SCHEMA_MISMATCH/);
  });
});
