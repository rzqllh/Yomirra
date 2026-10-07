import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { EditorialSpotlight } from "@/components/home/editorial-spotlight";

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getDetail: vi.fn(),
  },
}));

const manga = {
  id: "manga-a",
  title: "Manga A",
  coverUrl: "/cover.jpg",
  description: "Description",
  format: "Manhwa",
  latestChapter: "Chapter 18",
};

describe("EditorialSpotlight accessibility", () => {
  it("renders synopsis-absent slot with truthful metadata composition and no placeholder text when synopsis is missing", () => {
    const { container } = render(
      <EditorialSpotlight
        manga={{ id: "manga-b", title: "Manga B", coverUrl: "/cover-b.jpg" }}
        sourceId="source-b"
        sourceName="Source B"
      />
    );

    // Per Gate Decision: no fake placeholder string like "Sinopsis belum tersedia"
    expect(screen.queryByText("Sinopsis belum tersedia")).toBeNull();
    // When synopsis is absent, a dedicated slot is rendered with metadata composition
    expect(container.querySelector('[data-spotlight-slot="synopsis-absent"]')).toBeTruthy();
    expect(container.querySelector('[data-spotlight-slot="synopsis"]')).toBeNull();
    expect(container.querySelector('[data-spotlight-slot="metadata"]')).toBeTruthy();
  });

  it("uses truthful semantics, explicit detail targets, display source names, and 44px carousel controls", () => {
    const { container } = render(
      <EditorialSpotlight
        manga={manga}
        sourceId="source-a"
        sourceName="Source A"
        totalCount={3}
      />
    );

    expect(screen.getByText("SOROTAN TERBARU")).toBeTruthy();
    expect(screen.getByText("Source A")).toBeTruthy();
    expect(screen.queryByText("source-a")).toBeNull();

    const article = screen.getByRole("article", {
      name: "Sorotan komik: Manga A",
    });
    expect(article.closest("a")).toBeNull();

    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: "Komik sebelumnya" }).className
    ).toContain("size-11");
    expect(
      screen.getByRole("button", { name: "Komik berikutnya" }).className
    ).toContain("size-11");

    const coverImage = container.querySelector(
      'a[aria-label="Lihat komik Manga A"] img'
    );
    expect(coverImage?.className).not.toContain("group-hover:scale");
  });

  it("renders normalized synopsis when alternate fields like synopsis or summary are provided", () => {
    const { container } = render(
      <EditorialSpotlight
        manga={{
          id: "manga-c",
          title: "Manga C",
          coverUrl: "/cover-c.jpg",
          synopsis: "  <p>Cerita tentang petualangan &amp; sihir heroik.</p>  ",
        } as any}
        sourceId="source-c"
        sourceName="Source C"
      />
    );

    expect(screen.getByText("Cerita tentang petualangan & sihir heroik.")).toBeTruthy();
    expect(container.querySelector('[data-spotlight-slot="synopsis"]')).toBeTruthy();
    expect(container.querySelector('[data-spotlight-slot="synopsis-absent"]')).toBeNull();
  });

  it("lazily enriches missing synopsis via query client when mounted in app context", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(apiClient.getDetail).mockResolvedValueOnce({
      id: "manga-d",
      title: "Manga D",
      description: "Petualangan seru terisi setelah detail dimuat secara lazy.",
    } as any);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <EditorialSpotlight
          manga={{ id: "manga-d", title: "Manga D", coverUrl: "/cover-d.jpg" }}
          sourceId="source-d"
          sourceName="Source D"
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Petualangan seru terisi setelah detail dimuat secara lazy.")).toBeTruthy();
    });

    expect(container.querySelector('[data-spotlight-slot="synopsis"]')).toBeTruthy();
    expect(container.querySelector('[data-spotlight-slot="synopsis-absent"]')).toBeNull();
  });
});
