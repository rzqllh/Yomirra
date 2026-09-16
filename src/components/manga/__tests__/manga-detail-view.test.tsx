import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MangaDetailView } from "../manga-detail-view";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/manga/shinigami/test-manga",
}));

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getRatingScore: vi.fn().mockResolvedValue({ score: 8.5 }),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null }),
}));

vi.mock("@/components/manga/manga-recommendations", () => ({
  MangaRecommendations: () => <div data-testid="manga-recommendations" />,
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => 0,
}));

describe("MangaDetailView - Scroll Position Reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets window scroll to top (0, 0) on render/mount", () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    render(
      <MangaDetailView
        sourceId="shinigami"
        mangaId="test-manga"
        detail={{
          id: "test-manga",
          title: "Test Manga",
          coverUrl: "https://example.com/cover.jpg",
          description: "Synopsis text",
          status: "Ongoing",
          genres: ["Action"],
        }}
        chapters={[
          { id: "ch-1", number: 1, title: "Chapter 1", date: "2026-09-16" },
        ]}
      />
    );

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    scrollToSpy.mockRestore();
  });
});
