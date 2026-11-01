import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api-client";
import { useUpdateStore } from "@/shared/store/update-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { MangaCard, CollapsibleBadgeRow } from "../manga-card";

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../../bookmark-button", () => ({
  BookmarkButton: ({ manga, sourceId }: { manga: { title: string; id: string }; sourceId: string }) => (
    <button type="button" className="size-11" data-source-id={sourceId} data-manga-id={manga.id} aria-label={`Simpan ${manga.title} ke rak`} />
  ),
}));

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getDetail: vi.fn(),
  },
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
    vi.clearAllMocks();
    useSettingsStore.setState({ hideNsfw: true });

    class ImmediateIntersectionObserver {
      private callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = "0px";
      thresholds = [0];
    }

    vi.stubGlobal("IntersectionObserver", ImmediateIntersectionObserver);
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

  it.each(["grid", "compact"] as const)(
    "opens the only eligible source directly in %s view",
    (viewMode) => {
      render(
        <MangaCard
          variant="discovery"
          viewMode={viewMode}
          sourceId="shinigami"
          sourceBindings={[{ sourceId: "mangadex", mangaId: "verified-alternative", title: "Work" }]}
          manga={{ id: "disabled-primary", title: "Work", coverUrl: "", description: "Sinopsis sampel." }}
        />
      );
      const links = screen.getAllByRole("link", { name: /Lihat Work/ });
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link.getAttribute("href")).toContain("/manga/mangadex/verified-alternative");
        expect(link.getAttribute("aria-haspopup")).toBeNull();
      }
      expect(screen.queryByRole("dialog")).toBeNull();
      const bookmark = screen.getByRole("button", { name: "Simpan Work ke rak" });
      expect(bookmark.getAttribute("data-source-id")).toBe("mangadex");
      expect(bookmark.getAttribute("data-manga-id")).toBe("verified-alternative");
    }
  );

  it("still requires a manual picker for two eligible sources", () => {
    render(
      <MangaCard
        sourceId="shinigami"
        sourceBindings={[
          { sourceId: "shinigami", mangaId: "a", title: "Work" },
          { sourceId: "mangadex", mangaId: "b", title: "Work" },
        ]}
        manga={{ id: "a", title: "Work", coverUrl: "" }}
      />
    );
    fireEvent.click(screen.getByRole("link", { name: "Pilih sumber untuk Work" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Pilih sumber")).toBeDefined();
  });

  it("does not navigate to a disabled or missing canonical source", () => {
    render(
      <MangaCard
        sourceId="shinigami"
        sourceBindings={[{ sourceId: "missing-source", mangaId: "a", title: "Work" }]}
        manga={{ id: "a", title: "Work", coverUrl: "" }}
      />
    );
    const link = screen.getByRole("link", { name: "Sumber tidak tersedia untuk Work" });
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.getAttribute("href")).toBe("#");
    expect(fireEvent.click(link)).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lazily hydrates and sanitizes a missing compact-card synopsis", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(apiClient.getDetail).mockResolvedValue({
      id: "missing-synopsis",
      title: "Missing Synopsis",
      coverUrl: "https://example.com/cover.jpg",
      description:
        "&lt;p&gt;&lt;strong&gt;Sinopsis:&lt;/strong&gt;&lt;br /&gt;Cerita bersih dari detail.&lt;/p&gt;&lt;p&gt;&lt;strong&gt;Download Batch&lt;/strong&gt; Chapter 01-10&lt;/p&gt;",
      status: "ONGOING",
      genres: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MangaCard
          variant="discovery"
          viewMode="compact"
          sourceId="shinigami"
          manga={{
            id: "missing-synopsis",
            title: "Missing Synopsis",
            coverUrl: "https://example.com/cover.jpg",
            contentRating: "safe",
          }}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Cerita bersih dari detail.")).toBeDefined();
    });
    expect(apiClient.getDetail).toHaveBeenCalledWith(
      "shinigami",
      "missing-synopsis",
      expect.objectContaining({ signal: expect.anything() })
    );

    queryClient.clear();
  });

  it("deduplicates simultaneous synopsis enrichment for the same manga", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(apiClient.getDetail).mockResolvedValue({
      id: "same-manga",
      title: "Same Manga",
      coverUrl: "https://example.com/cover.jpg",
      description: "Sinopsis yang sama.",
      status: "ONGOING",
      genres: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <>
          <MangaCard
            variant="discovery"
            viewMode="compact"
            sourceId="shinigami"
            manga={{
              id: "same-manga",
              title: "Same Manga",
              coverUrl: "https://example.com/cover.jpg",
              contentRating: "safe",
            }}
          />
          <MangaCard
            variant="discovery"
            viewMode="compact"
            sourceId="shinigami"
            manga={{
              id: "same-manga",
              title: "Same Manga Copy",
              coverUrl: "https://example.com/cover.jpg",
              contentRating: "safe",
            }}
          />
        </>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(apiClient.getDetail).toHaveBeenCalledTimes(1);
    });

    queryClient.clear();
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
    expect(rank1Badge.className).toContain("amber-400");
    expect(rank1Badge.className).toContain("w-[30px]");

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
    expect(rank2Badge.className).toContain("slate-200");
    expect(rank2Badge.className).toContain("w-[28px]");

    rerender(
      <MangaCard
        variant="rank"
        sourceId="shinigami"
        rank={3}
        manga={{
          id: "manga-top-3",
          title: "Top Manga 3",
          coverUrl: "https://example.com/cover3.jpg",
          latestChapter: "Ch. 30",
          score: 9.3,
        }}
      />
    );

    const rank3Badge = screen.getByText("3");
    expect(rank3Badge.className).toContain("amber-800");

    // Test string rank coercion (e.g. "1" as string)
    rerender(
      <MangaCard
        variant="rank"
        sourceId="shinigami"
        rank={"1" as any}
        manga={{
          id: "manga-top-1",
          title: "Top Manga 1",
          coverUrl: "https://example.com/cover1.jpg",
        }}
      />
    );
    expect(screen.getByText("1").className).toContain("amber-400");

    // Test rank > 3 default badge
    rerender(
      <MangaCard
        variant="rank"
        sourceId="shinigami"
        rank={15}
        manga={{
          id: "manga-top-15",
          title: "Top Manga 15",
          coverUrl: "https://example.com/cover15.jpg",
        }}
      />
    );
    expect(screen.getByText("15").className).toContain("bg-black/85");
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

  it("caps progress to 95% and displays Baru badge when new chapter release exists in updateStore", () => {
    useUpdateStore.setState({
      items: {
        "shinigami::machinaots": {
          sourceId: "shinigami",
          mangaId: "machinaots",
          mangaTitle: "Machinaots",
          latestChapterId: "ch-51",
          seenAt: undefined,
        },
      },
    });

    render(
      <MangaCard
        variant="progress"
        sourceId="shinigami"
        progressPercent={100}
        chapterTitle="Chapter 50"
        chapterId="ch-50"
        manga={{
          id: "machinaots",
          title: "Machinaots",
          coverUrl: "https://example.com/cover.jpg",
        }}
      />
    );

    expect(screen.getByText("Baru")).toBeDefined();
    expect(screen.getByText("95%")).toBeDefined();
    expect(screen.queryByText("100%")).toBeNull();
  });

  it("caps progress to 95% and avoids 100% completed badge when manga status is ongoing", () => {
    render(
      <MangaCard
        variant="progress"
        sourceId="shinigami"
        progressPercent={100}
        chapterTitle="Chapter 50"
        chapterId="ch-50"
        manga={{
          id: "ongoing-series",
          title: "Ongoing Series",
          coverUrl: "https://example.com/cover.jpg",
          status: "ONGOING",
        }}
      />
    );

    expect(screen.getByText("95%")).toBeDefined();
    expect(screen.queryByText("100%")).toBeNull();
  });

  it("hides confirmed restricted cached records and source-only adult cards without rendering a title, cover or link", () => {
    const { rerender } = render(
      <MangaCard sourceId="shinigami" manga={{
        id: "restricted", title: "Sensitive title", coverUrl: "https://example.com/sensitive.jpg", contentRating: "erotica",
      }} />
    );
    expect(screen.getByRole("status").textContent).toContain("Konten disembunyikan");
    expect(screen.queryByText("Sensitive title")).toBeNull();
    expect(screen.queryByRole("link", { name: /Sensitive title/ })).toBeNull();
    expect(screen.queryByTestId("unverified-cover")).toBeNull();

    rerender(<MangaCard sourceId="doujindesu" manga={{
      id: "source-only", title: "Old source-only title", coverUrl: "https://example.com/source.jpg", contentRating: "safe",
    }} />);
    expect(screen.getByRole("status").textContent).toContain("Konten disembunyikan");
    expect(screen.queryByText("Old source-only title")).toBeNull();
  });

  it.each([
    ["discovery", "grid"],
    ["discovery", "compact"],
    ["rank", "grid"],
    ["progress", "grid"],
  ] as const)("masks UNKNOWN cover before acknowledgement for %s/%s cards", (variant, viewMode) => {
    const { rerender } = render(<MangaCard
      variant={variant}
      viewMode={viewMode}
      sourceId="shinigami"
      manga={{ id: "unknown-title", title: "Unknown title", coverUrl: "https://example.com/unverified.jpg", description: "Known fixture text" }}
    />);
    expect(screen.getByTestId("unverified-cover").textContent).toContain("Rating belum terverifikasi");
    useSettingsStore.setState({ hideNsfw: false });
    rerender(<MangaCard
      variant={variant}
      viewMode={viewMode}
      sourceId="shinigami"
      manga={{ id: "unknown-title", title: "Unknown title", coverUrl: "https://example.com/unverified.jpg", description: "Known fixture text" }}
    />);
    expect(screen.queryByTestId("unverified-cover")).toBeNull();
  });

  it("does not issue compact-card synopsis requests for unverified titles while NSFW is OFF", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><MangaCard
      variant="discovery" viewMode="compact" sourceId="shinigami"
      manga={{ id: "unknown-synopsis", title: "Unknown synopsis", coverUrl: "https://example.com/unknown.jpg" }}
    /></QueryClientProvider>);
    expect(screen.getByTestId("unverified-cover")).toBeDefined();
    expect(apiClient.getDetail).not.toHaveBeenCalled();
    queryClient.clear();
  });

});
