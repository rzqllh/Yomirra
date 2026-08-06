import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MangaRecommendations } from "../manga-recommendations";
import { apiClient } from "@/shared/api-client";

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    search: vi.fn(),
    getPopular: vi.fn(),
    getLatest: vi.fn(),
    getSources: vi.fn(),
  },
}));

vi.mock("@/components/manga/card/shelf-card", () => ({
  ShelfCard: ({ sourceId, manga }: { sourceId: string; manga: { id: string; title: string } }) => (
    <div data-testid="shelf-card" data-source={sourceId} data-manga-id={manga.id}>
      {manga.title}
    </div>
  ),
}));

describe("MangaRecommendations Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderComponent = (props: { sourceId: string; currentMangaId: string; genres: string[] }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MangaRecommendations {...props} />
      </QueryClientProvider>
    );
  };

  it("renders 'Komik Serupa' header and recommendations from primary genre search", async () => {
    (apiClient.search as any).mockResolvedValueOnce({
      results: [
        { id: "manga-1", title: "Manga One", coverUrl: "/cover1.jpg" },
        { id: "manga-2", title: "Manga Two", coverUrl: "/cover2.jpg" },
      ],
    });

    renderComponent({
      sourceId: "sourceA",
      currentMangaId: "current-manga",
      genres: ["Action", "Adventure", "Fantasy"],
    });

    const cards = await screen.findAllByTestId("shelf-card");
    expect(cards).toHaveLength(2);
    expect(cards[0].getAttribute("data-manga-id")).toBe("manga-1");
    expect(cards[1].getAttribute("data-manga-id")).toBe("manga-2");
  });

  it("falls back to popular items on the same source when genre search is empty", async () => {
    (apiClient.search as any).mockResolvedValue({ results: [] });
    (apiClient.getPopular as any).mockResolvedValueOnce({
      mangas: [{ id: "popular-1", title: "Popular One" }],
      hasNextPage: false,
    });

    renderComponent({
      sourceId: "sourceA",
      currentMangaId: "current-manga",
      genres: ["Action"],
    });

    const cards = await screen.findAllByTestId("shelf-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("data-manga-id")).toBe("popular-1");
  });

  it("falls back to secondary active sources when current source results are under target", async () => {
    (apiClient.search as any).mockResolvedValue({ results: [] });
    (apiClient.getPopular as any).mockImplementation((srcId: string) => {
      if (srcId === "sourceA") return Promise.resolve({ mangas: [{ id: "manga-a", title: "Manga A" }], hasNextPage: false });
      if (srcId === "sourceB") return Promise.resolve({ mangas: [{ id: "manga-b", title: "Manga B" }], hasNextPage: false });
      return Promise.resolve({ mangas: [], hasNextPage: false });
    });
    (apiClient.getLatest as any).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getSources as any).mockResolvedValue([
      { id: "sourceA", isEnabled: true, isNsfw: false },
      { id: "sourceB", isEnabled: true, isNsfw: false },
    ]);

    renderComponent({
      sourceId: "sourceA",
      currentMangaId: "current-manga",
      genres: ["Fantasy"],
    });

    const cards = await screen.findAllByTestId("shelf-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.some((c) => c.getAttribute("data-source") === "sourceB")).toBe(true);
  });

  it("excludes currentMangaId and deduplicates titles", async () => {
    (apiClient.search as any).mockResolvedValueOnce({
      results: [
        { id: "current-manga", title: "Current Manga Title" },
        { id: "manga-unique", title: "Unique Manga" },
        { id: "manga-dup", title: "Unique Manga" },
      ],
    });
    (apiClient.getPopular as any).mockResolvedValue({ mangas: [], hasNextPage: false });

    renderComponent({
      sourceId: "sourceA",
      currentMangaId: "current-manga",
      genres: ["Romance"],
    });

    const cards = await screen.findAllByTestId("shelf-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("data-manga-id")).toBe("manga-unique");
  });
});
