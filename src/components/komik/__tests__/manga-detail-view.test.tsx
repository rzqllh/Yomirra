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

vi.mock("@/components/komik/manga-recommendations", () => ({
  MangaRecommendations: () => <div data-testid="manga-recommendations" />,
}));

vi.mock("@/components/chrome/header", () => ({
  PageHeader: (props: any) => (
    <div data-testid="page-header" data-backhref={props.backHref} data-showback={props.showBack}>
      {props.title}
    </div>
  ),
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => 0,
  useReducedMotion: () => false,
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
          status: "ONGOING",
          genres: ["Action"],
        }}
        chapters={[
          { id: "ch-1", mangaId: "test-manga", number: 1, title: "Chapter 1", date: "2026-09-16" },
        ]}
      />
    );

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    scrollToSpy.mockRestore();
  });

  it("passes safe backHref to PageHeader", () => {
    const { getByTestId } = render(
      <MangaDetailView
        sourceId="shinigami"
        mangaId="test-manga"
        detail={{
          id: "test-manga",
          title: "Test Manga",
          coverUrl: "https://example.com/cover.jpg",
          description: "Synopsis text",
          status: "ONGOING",
          genres: ["Action"],
        }}
        chapters={[
          { id: "ch-1", mangaId: "test-manga", number: 1, title: "Chapter 1", date: "2026-09-16" },
        ]}
      />
    );

    const header = getByTestId("page-header");
    // When no returnTo query is present, backHref is undefined (null in DOM attribute) so PageHeader uses contextual router.back()
    expect(header.getAttribute("data-backhref")).toBeNull();
    expect(header.getAttribute("data-showback")).toBe("true");
  });

  it("renders backdrop with parallax motion wrapper and lowered bottom gradient scrim", () => {
    const { container } = render(
      <MangaDetailView
        sourceId="shinigami"
        mangaId="test-manga"
        detail={{
          id: "test-manga",
          title: "Test Manga",
          coverUrl: "https://example.com/cover.jpg",
          description: "Synopsis text",
          status: "ONGOING",
          genres: ["Action"],
        }}
        chapters={[]}
      />
    );

    // Verify smoothed bottom gradient (via-45% from-[var(--color-surface-base)])
    const bottomGradient = container.querySelector('[class*="via-45%"]');
    expect(bottomGradient).not.toBeNull();
    expect(bottomGradient?.className).toContain("from-[var(--color-surface-base)]");

    // Verify parallax container overflow positioning
    const parallaxLayer = container.querySelector('[class*="-top-12"]');
    expect(parallaxLayer).not.toBeNull();
    expect(parallaxLayer?.className).toContain("-bottom-24");
  });

  it("sanitizes dirty synopsis on detail view using shared stripHtml", () => {
    const { getByText } = render(
      <MangaDetailView
        sourceId="shinigami"
        mangaId="test-manga"
        detail={{
          id: "test-manga",
          title: "Test Manga",
          coverUrl: "https://example.com/cover.jpg",
          description: "<p>Setelah menyelesaikan \\[MENARA UJIAN\\], pahlawan kembali &amp; mendapati dunia &quot;baru&quot;.</p>",
          status: "ONGOING",
          genres: ["Action"],
        }}
        chapters={[]}
      />
    );

    expect(
      getByText('Setelah menyelesaikan [MENARA UJIAN], pahlawan kembali & mendapati dunia "baru".')
    ).toBeDefined();
  });

  it("prefixes 'Menyusul' author as 'Penulis: Menyusul' and omits unknown authors", () => {
    const { getAllByText } = render(
      <MangaDetailView
        sourceId="shinigami"
        mangaId="test-manga-1"
        detail={{
          id: "test-manga-1",
          title: "Test Manga",
          coverUrl: "https://example.com/cover.jpg",
          description: "Synopsis",
          author: "Menyusul",
          status: "ONGOING",
          genres: ["Action"],
        }}
        chapters={[]}
      />
    );

    // Desktop and mobile both render Penulis: Menyusul
    expect(getAllByText("Penulis: Menyusul", { exact: false })).toHaveLength(2);

    const { queryByText } = render(
      <MangaDetailView
        sourceId="shinigami"
        mangaId="test-manga-2"
        detail={{
          id: "test-manga-2",
          title: "Test Manga",
          coverUrl: "https://example.com/cover.jpg",
          description: "Synopsis",
          author: "unknown",
          status: "ONGOING",
          genres: ["Action"],
        }}
        chapters={[]}
      />
    );

    expect(queryByText("unknown")).toBeNull();
    expect(queryByText("Unknown")).toBeNull();
  });
});
