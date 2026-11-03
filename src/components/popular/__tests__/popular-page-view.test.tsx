import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PopularPageView } from "../popular-page-view";
import type { PopularSourceFeed } from "@/shared/lib/popular-ranking";
import type { MalPopularFeed } from "@/shared/types/mal";

const mockFeeds: PopularSourceFeed[] = [
  {
    sourceId: "shinigami",
    sourceName: "Shinigami",
    mangas: [
      { id: "m1", title: "Solo Leveling", coverUrl: "/solo.jpg", latestChapter: "200" },
      { id: "m2", title: "Omniscient Reader", coverUrl: "/orv.jpg", latestChapter: "180" },
    ],
    loadFailed: false,
  },
  {
    sourceId: "komikindo",
    sourceName: "Komikindo",
    mangas: [
      { id: "m3", title: "One Piece", coverUrl: "/op.jpg", latestChapter: "1100" },
    ],
    loadFailed: false,
  },
  {
    sourceId: "broken-source",
    sourceName: "Broken Source",
    mangas: [],
    loadFailed: true,
  },
];

const mockMalFeed: MalPopularFeed = {
  status: "ready",
  safeOnly: false,
  fetchedAt: "2026-10-31T00:00:00Z",
  works: [
    {
      malId: 101,
      title: "Berserk",
      rank: 1,
      members: 500000,
      coverUrl: "/berserk.jpg",
      mediaType: "manga",
      nsfw: "white",
    },
  ],
};

describe("PopularPageView (Unified Popular Architecture - D-03)", () => {
  it("defaults to 'Populer di Yomirra' tab and renders source filter pills", () => {
    render(<PopularPageView feeds={mockFeeds} mal={mockMalFeed} />);

    // Check SegmentedControl options
    expect(screen.getByRole("button", { name: "Populer di Yomirra" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tren MyAnimeList" })).toBeTruthy();

    // Check Source filter pills
    expect(screen.getByRole("button", { name: /Semua Sumber/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Shinigami/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Komikindo/i })).toBeTruthy();

    // Broken source has 'Down' badge
    expect(screen.getByText("Down")).toBeTruthy();

    // Combined heading is displayed by default
    expect(screen.getByText("Peringkat lintas sumber")).toBeTruthy();
    expect(screen.getByText("Solo Leveling")).toBeTruthy();
  });

  it("filters to single source when clicking that source's pill", () => {
    render(<PopularPageView feeds={mockFeeds} mal={mockMalFeed} />);

    // Click Komikindo pill
    const komikindoButton = screen.getByRole("button", { name: /Komikindo/i });
    fireEvent.click(komikindoButton);

    expect(screen.getByRole("heading", { name: "Populer di Komikindo" })).toBeTruthy();
    expect(screen.getByText("One Piece")).toBeTruthy();
    expect(screen.queryByText("Peringkat lintas sumber")).toBeNull();
  });

  it("shows an informative notice when clicking a failed source pill without crashing", () => {
    render(<PopularPageView feeds={mockFeeds} mal={mockMalFeed} />);

    const brokenSourceButton = screen.getByRole("button", { name: /Broken Source/i });
    fireEvent.click(brokenSourceButton);

    expect(screen.getByRole("heading", { name: "Populer di Broken Source" })).toBeTruthy();
    expect(
      screen.getByText(/Peringkat dari Broken Source belum bisa dimuat/i)
    ).toBeTruthy();
  });

  it("switches to 'Tren MyAnimeList' tab when clicked", () => {
    render(<PopularPageView feeds={mockFeeds} mal={mockMalFeed} />);

    const malTab = screen.getByRole("button", { name: "Tren MyAnimeList" });
    fireEvent.click(malTab);

    expect(screen.getByRole("heading", { name: "Populer MAL" })).toBeTruthy();
    expect(screen.getByText("Berserk")).toBeTruthy();
  });

  it("renders empty state when no feeds and no MAL data", () => {
    render(<PopularPageView feeds={[]} />);

    expect(screen.getByText("Belum ada sumber aktif")).toBeTruthy();
  });
});
