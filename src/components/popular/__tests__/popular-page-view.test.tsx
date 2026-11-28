import { act, render, screen, fireEvent } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PopularPageView } from "../popular-page-view";
import { MalPopularSection } from "../mal-popular-section";
import type { PopularSourceFeed } from "@/shared/lib/popular-ranking";
import type { MalPopularFeed } from "@/shared/types/mal";

vi.mock("next/navigation", () => ({
  usePathname: () => "/populer",
  useSearchParams() {
    const query = useSyncExternalStore((notify) => {
      window.addEventListener("test-search-change", notify);
      return () => window.removeEventListener("test-search-change", notify);
    }, () => window.location.search);
    return new URLSearchParams(query);
  },
}));

beforeEach(() => {
  const replaceState = window.history.replaceState.bind(window.history);
  vi.spyOn(window.history, "replaceState").mockImplementation((state, title, url) => {
    replaceState(state, title, url);
    window.dispatchEvent(new Event("test-search-change"));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

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
    sourceId: "komiku-ii",
    sourceName: "Komiku II",
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

describe("MAL ranking filters", () => {
  it("keeps the latest sort results when an older request resolves last", async () => {
    const favorite = Promise.withResolvers<Response>();
    const score = Promise.withResolvers<Response>();
    const fetchRanking = vi.spyOn(globalThis, "fetch")
      .mockReturnValueOnce(favorite.promise)
      .mockReturnValueOnce(score.promise);

    try {
      const { container } = render(<MalPopularSection feed={mockMalFeed} />);
      const sort = container.querySelector('select[aria-label="Urutkan hasil MAL"]')!;
      fireEvent.change(sort, { target: { value: "favorite" } });
      fireEvent.change(sort, { target: { value: "score" } });
      expect(fetchRanking.mock.calls.map(([url]) => url)).toEqual([
        "/api/metadata/mal/popular?type=favorite",
        "/api/metadata/mal/popular?type=all",
      ]);

      await act(async () => {
        score.resolve(Response.json({
          data: {
            ...mockMalFeed,
            rankingType: "all",
            works: [{ ...mockMalFeed.works[0], title: "Latest score fixture" }],
          },
        }));
      });
      expect(screen.getByText("Latest score fixture")).toBeTruthy();

      await act(async () => {
        favorite.resolve(Response.json({
          data: {
            ...mockMalFeed,
            rankingType: "favorite",
            works: [{ ...mockMalFeed.works[0], title: "Stale favorite fixture" }],
          },
        }));
      });
      expect(screen.getByText("Latest score fixture")).toBeTruthy();
      expect(screen.queryByText("Stale favorite fixture")).toBeNull();
    } finally {
      fetchRanking.mockRestore();
    }
  });

  it("keeps a failed sort selected, hides old rows, and retries that ranking", async () => {
    const fetchRanking = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({
        data: {
          ...mockMalFeed,
          rankingType: "favorite",
          works: [{ ...mockMalFeed.works[0], title: "Favorite fixture" }],
        },
      }));
    try {
      const { container } = render(<MalPopularSection feed={mockMalFeed} />);
      expect(screen.getByText("Berserk")).toBeTruthy();
      fireEvent.change(container.querySelector('select[aria-label="Urutkan hasil MAL"]')!, {
        target: { value: "favorite" },
      });

      expect(screen.queryByText("Berserk")).toBeNull();
      expect(await screen.findByText("Peringkat untuk pilihan ini gagal dimuat.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Urutkan hasil MAL: Paling Difavoritkan" })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
      expect(await screen.findByText("Favorite fixture")).toBeTruthy();
      expect(fetchRanking.mock.calls.map(([url]) => url)).toEqual([
        "/api/metadata/mal/popular?type=favorite",
        "/api/metadata/mal/popular?type=favorite",
      ]);
    } finally {
      fetchRanking.mockRestore();
    }
  });

  it("keeps a failed format selected and restores the initial snapshot when switching back", async () => {
    const fetchRanking = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Offline"));
    try {
      render(<MalPopularSection feed={mockMalFeed} />);
      fireEvent.click(screen.getByRole("button", { name: "Manga" }));

      expect(await screen.findByText("Peringkat untuk pilihan ini gagal dimuat.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Manga", pressed: true })).toBeTruthy();
      expect(screen.queryByText("Berserk")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Semua Format" }));
      expect(screen.getByText("Berserk")).toBeTruthy();
      expect(fetchRanking).toHaveBeenCalledOnce();
    } finally {
      fetchRanking.mockRestore();
    }
  });
});

describe("PopularPageView (Unified Popular Architecture - D-03)", () => {
  it("exposes source filters as a group of pressed buttons", () => {
    render(<PopularPageView feeds={mockFeeds} />);
    expect(screen.getByRole("group", { name: "Filter sumber komik" })).toBeTruthy();
    expect(screen.getByRole("tablist", { name: "Peringkat populer" })).toBeTruthy();
    const source = screen.getByRole("button", { name: /Komiku II/i });
    fireEvent.click(source);
    expect(source.getAttribute("aria-pressed")).toBe("true");
  });
  it("defaults to 'Populer di Yomirra' tab and renders source filter pills", () => {
    render(<PopularPageView feeds={mockFeeds} mal={mockMalFeed} />);

    expect(screen.getByRole("tab", { name: "Populer di Yomirra", selected: true })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Tren MyAnimeList" })).toBeTruthy();

    // Check Source filter pills
    expect(screen.getByRole("button", { name: /Semua Sumber/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Shinigami/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Komiku II/i })).toBeTruthy();

    expect(screen.getByRole("button", { name: "Broken Source, gagal dimuat" })).toBeTruthy();

    // Combined heading is displayed by default
    expect(screen.getByText("Peringkat lintas sumber")).toBeTruthy();
    expect(screen.getByText("Solo Leveling")).toBeTruthy();
  });

  it("filters to single source when clicking that source's pill", () => {
    render(<PopularPageView feeds={mockFeeds} mal={mockMalFeed} />);

    // Click Komiku II pill
    const komikuIiButton = screen.getByRole("button", { name: /Komiku II/i });
    fireEvent.click(komikuIiButton);

    expect(screen.getByRole("heading", { name: "Populer di Komiku II" })).toBeTruthy();
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

    const malTab = screen.getByRole("tab", { name: "Tren MyAnimeList" });
    fireEvent.mouseDown(malTab, { button: 0, ctrlKey: false });

    expect(screen.getByRole("heading", { name: "Peringkat Global MyAnimeList" })).toBeTruthy();
    expect(screen.getByText("Berserk")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Tren MyAnimeList", selected: true })).toBeTruthy();
    expect(screen.getByRole("tabpanel", { name: "Tren MyAnimeList" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Anggota terbanyak/i })).toBeTruthy();
  });

  it("renders empty state when no feeds and no MAL data", () => {
    render(<PopularPageView feeds={[]} />);

    expect(screen.getByText("Belum ada sumber aktif")).toBeTruthy();
  });
});
