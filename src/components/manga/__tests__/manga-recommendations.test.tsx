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
    getRelatedTitles: vi.fn(),
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

  const renderComponent = (props: {
    sourceId: string;
    currentMangaId: string;
    genres: string[];
    title?: string;
    author?: string;
  }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MangaRecommendations title={props.title || "Current Manga"} {...props} />
      </QueryClientProvider>
    );
  };

  it("renders 'Komik Serupa' header and recommendations from server catalog primary path", async () => {
    (apiClient.getRelatedTitles as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        canonicalKey: "src::manga-1::Title+One",
        sourceId: "sourceA",
        mangaId: "manga-1",
        title: "Manga One",
        coverUrl: "/cover1.jpg",
        genres: ["Action"],
      },
      {
        canonicalKey: "src::manga-2::Title+Two",
        sourceId: "sourceA",
        mangaId: "manga-2",
        title: "Manga Two",
        coverUrl: "/cover2.jpg",
        genres: ["Action"],
      },
    ]);
    (apiClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({ results: [] });
    (apiClient.getPopular as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getLatest as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getSources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderComponent({
      sourceId: "sourceA",
      currentMangaId: "current-manga",
      genres: ["Action", "Adventure"],
    });

    const cards = await screen.findAllByTestId("shelf-card");
    expect(cards).toHaveLength(2);
    expect(cards[0].getAttribute("data-manga-id")).toBe("manga-1");
    expect(cards[1].getAttribute("data-manga-id")).toBe("manga-2");
  });

  it("falls back to genre search when catalog returns empty", async () => {
    (apiClient.getRelatedTitles as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    (apiClient.search as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      results: [
        { id: "manga-1", title: "Manga One", coverUrl: "/cover1.jpg" },
        { id: "manga-2", title: "Manga Two", coverUrl: "/cover2.jpg" },
      ],
    });
    (apiClient.getPopular as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getLatest as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getSources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

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

  it("falls back to genre search when catalog call throws", async () => {
    (apiClient.getRelatedTitles as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Catalog unavailable"));
    (apiClient.search as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      results: [{ id: "manga-fallback", title: "Fallback Manga", coverUrl: "" }],
    });
    (apiClient.getPopular as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getLatest as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getSources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderComponent({
      sourceId: "sourceA",
      currentMangaId: "current-manga",
      genres: ["Action"],
    });

    const cards = await screen.findAllByTestId("shelf-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("data-manga-id")).toBe("manga-fallback");
  });

  it("does not recommend the current title when it comes from catalog", async () => {
    (apiClient.getRelatedTitles as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        canonicalKey: "src::same-title::Current+Manga",
        sourceId: "sourceB",
        mangaId: "same-title",
        title: "Current Manga",
      },
      {
        canonicalKey: "src::different::Different+Manga",
        sourceId: "sourceB",
        mangaId: "different-title",
        title: "Different Manga",
      },
    ]);
    (apiClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({ results: [] });
    (apiClient.getPopular as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getLatest as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getSources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <MangaRecommendations
          sourceId="sourceA"
          currentMangaId="current-manga"
          title="Current Manga"
          author="Author A"
          genres={["Action"]}
        />
      </QueryClientProvider>
    );

    const cards = await screen.findAllByTestId("shelf-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("data-manga-id")).toBe("different-title");
  });

  it("falls back to popular items on the same source when genre search is empty", async () => {
    (apiClient.getRelatedTitles as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    (apiClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({ results: [] });
    (apiClient.getPopular as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      mangas: [{ id: "popular-1", title: "Popular One" }],
      hasNextPage: false,
    });
    (apiClient.getLatest as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getSources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderComponent({
      sourceId: "sourceA",
      currentMangaId: "current-manga",
      genres: ["Action"],
    });

    const cards = await screen.findAllByTestId("shelf-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("data-manga-id")).toBe("popular-1");
  });

  it("falls back to secondary active sources when all primary results are under target", async () => {
    (apiClient.getRelatedTitles as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    (apiClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({ results: [] });
    (apiClient.getPopular as ReturnType<typeof vi.fn>).mockImplementation((srcId: string) => {
      if (srcId === "sourceA") return Promise.resolve({ mangas: [{ id: "manga-a", title: "Manga A" }], hasNextPage: false });
      if (srcId === "sourceB") return Promise.resolve({ mangas: [{ id: "manga-b", title: "Manga B" }], hasNextPage: false });
      return Promise.resolve({ mangas: [], hasNextPage: false });
    });
    (apiClient.getLatest as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getSources as ReturnType<typeof vi.fn>).mockResolvedValue([
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

  it("excludes currentMangaId and deduplicates titles from genre fallback", async () => {
    (apiClient.getRelatedTitles as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    (apiClient.search as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      results: [
        { id: "current-manga", title: "Current Manga Title" },
        { id: "manga-unique", title: "Unique Manga" },
        { id: "manga-dup", title: "Unique Manga" },
      ],
    });
    (apiClient.getPopular as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getLatest as ReturnType<typeof vi.fn>).mockResolvedValue({ mangas: [], hasNextPage: false });
    (apiClient.getSources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderComponent({
      sourceId: "sourceA",
      currentMangaId: "current-manga",
      genres: ["Romance"],
      title: "Current Manga Title",
    });

    const cards = await screen.findAllByTestId("shelf-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("data-manga-id")).toBe("manga-unique");
  });
});
