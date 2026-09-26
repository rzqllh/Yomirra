import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MangaCard, CollapsibleBadgeRow } from "../manga-card";

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../../bookmark-button", () => ({
  BookmarkButton: ({ manga }: { manga: { title: string } }) => (
    <button type="button" className="size-11" aria-label={`Simpan ${manga.title} ke rak`} />
  ),
}));

describe("CollapsibleBadgeRow", () => {
  it("renders up to 2 badges without overflow indicator", () => {
    render(
      <CollapsibleBadgeRow
        badges={[
          <span key="1">ONGOING</span>,
          <span key="2">MANHWA</span>,
        ]}
      />
    );

    expect(screen.getByText("ONGOING")).toBeDefined();
    expect(screen.getByText("MANHWA")).toBeDefined();
    expect(screen.queryByText(/\+/)).toBeNull();
  });

  it("collapses 3 badges into 2 visible badges and a +1 overflow indicator", () => {
    render(
      <CollapsibleBadgeRow
        badges={[
          <span key="1">ONGOING</span>,
          <span key="2">MANHWA</span>,
          <span key="3">DIBACA</span>,
        ]}
      />
    );

    expect(screen.getByText("ONGOING")).toBeDefined();
    expect(screen.getByText("MANHWA")).toBeDefined();
    expect(screen.queryByText("DIBACA")).toBeNull();
    expect(screen.getByText("+1")).toBeDefined();
  });
});

describe("MangaCard", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders discovery variant with title, cover, and metadata", () => {
    render(
      <MangaCard
        variant="discovery"
        sourceId="shinigami"
        manga={{
          id: "solo-max-level-newbie",
          title: "Solo Max-Level Newbie",
          coverUrl: "https://example.com/cover.jpg",
          latestChapter: "Chapter 150",
          score: 9.2,
          format: "MANHWA",
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Solo Max-Level Newbie" })).toBeDefined();
    expect(screen.getByText("Chapter 150")).toBeDefined();
    expect(screen.getByText("9.2")).toBeDefined();
  });

  it("renders rank variant with ranking number and top-3 visual hierarchy", () => {
    const { rerender } = render(
      <MangaCard
        variant="rank"
        sourceId="shinigami"
        rank={1}
        manga={{
          id: "manga-top-1",
          title: "Top Manga 1",
          coverUrl: "https://example.com/cover1.jpg",
          latestChapter: "Ch. 50",
          latestChapterTime: "2026-09-26T20:00:00.000Z",
          score: 9.8,
        }}
      />
    );

    const rank1Badge = screen.getByText("1");
    expect(rank1Badge).toBeDefined();
    expect(rank1Badge.className).toContain("amber-500");

    rerender(
      <MangaCard
        variant="rank"
        sourceId="shinigami"
        rank={2}
        manga={{
          id: "manga-top-2",
          title: "Top Manga 2",
          coverUrl: "https://example.com/cover2.jpg",
          latestChapter: "Ch. 40",
          score: 9.5,
        }}
      />
    );

    const rank2Badge = screen.getByText("2");
    expect(rank2Badge.className).toContain("slate-300");
  });

  it("renders progress variant with percentage, Lanjut button, and 100% color-coding", () => {
    const { rerender } = render(
      <MangaCard
        variant="progress"
        sourceId="shinigami"
        progressPercent={45}
        chapterTitle="Chapter 45"
        chapterId="ch-45"
        manga={{
          id: "reading-manga",
          title: "Reading Manga",
          coverUrl: "https://example.com/cover.jpg",
        }}
      />
    );

    expect(screen.getByText("45%")).toBeDefined();
    expect(screen.getByText("Lanjut")).toBeDefined();
    expect(screen.getByText("45%").className).toContain("text-accent");

    rerender(
      <MangaCard
        variant="progress"
        sourceId="shinigami"
        progressPercent={100}
        chapterTitle="Chapter 100"
        chapterId="ch-100"
        manga={{
          id: "reading-manga",
          title: "Reading Manga",
          coverUrl: "https://example.com/cover.jpg",
        }}
      />
    );

    expect(screen.getByText("100%")).toBeDefined();
    // 100% should use status success color
    expect(screen.getByText("100%").className).toContain("status-success");
  });

  it("supports animateReveal and index props without throwing", () => {
    const { container } = render(
      <MangaCard
        variant="discovery"
        sourceId="shinigami"
        animateReveal={true}
        index={2}
        manga={{
          id: "manga-reveal",
          title: "Reveal Manga",
          coverUrl: "https://example.com/cover.jpg",
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Reveal Manga" })).toBeDefined();
    expect(container.firstChild).toBeDefined();
  });
});
