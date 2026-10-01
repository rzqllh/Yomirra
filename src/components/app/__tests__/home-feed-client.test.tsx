import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { HomeFeedClient, SPOTLIGHT_AUTOPLAY_MS } from "../home-feed-client";
import { HomeView } from "../home-view";
import { HomeLeaderboardPanel } from "../home-leaderboard-panel";
import {
  isConfidentHomeDuplicate,
  selectSpotlightItems,
  type HomeFeedManga,
} from "../home-feed-selection";

const motionState = vi.hoisted(() => ({ reduced: false }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => motionState.reduced,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/shared/store/history-store", () => ({
  useHistoryStore: (selector: any) =>
    selector({
      items: {},
      getContinueReading: () => [
        {
          sourceId: "source-a",
          mangaId: "solo-leveling",
          mangaTitle: "Solo Leveling",
          chapterId: "100",
          chapterTitle: "Chapter 100",
          coverUrl: "https://example.com/cover.jpg",
          progressPercent: 50,
        },
      ],
      removeMangaHistory: vi.fn(),
    }),
}));

vi.mock("@/shared/store/source-preferences-store", () => ({
  useSourcePreferencesStore: () => ({
    isSourceDisabled: () => false,
    isSourceHiddenFromHome: () => false,
  }),
}));

const mockSettingsState = {
  notifyForAllLibraryItems: true,
  mutedMangaKeys: [],
  hideNsfw: false,
  listingViewMode: "compact",
};

vi.mock("@/shared/store/settings-store", () => ({
  useSettingsStore: Object.assign(
    (selector: any) =>
      typeof selector === "function"
        ? selector(mockSettingsState)
        : mockSettingsState,
    { getState: () => mockSettingsState }
  ),
}));

vi.mock("@/shared/hooks/use-nsfw-source-ids", () => ({
  useNsfwSourceIds: () => ({ status: "KNOWN", ids: new Set() }),
}));

vi.mock("@/shared/hooks/use-mounted", () => ({
  useMounted: () => true,
}));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}));

const samplePopular: HomeFeedManga[] = [
  {
    id: "manga-1",
    title: "Manga Test 1",
    coverUrl: "https://example.com/1.jpg",
    sourceId: "source-a",
    sourceName: "Source A",
    score: 8.5,
    latestChapter: "Ch. 120",
  },
  {
    id: "manga-2",
    title: "Manga Test 2",
    coverUrl: "https://example.com/2.jpg",
    sourceId: "source-a",
    sourceName: "Source A",
    score: 9,
    latestChapter: "Ch. 45",
  },
  {
    id: "manga-b-1",
    title: "Manga Source B",
    coverUrl: "https://example.com/b1.jpg",
    sourceId: "source-b",
    sourceName: "Source B",
    score: 9.5,
    latestChapter: "Ch. 10",
  },
];

const sampleLatest: HomeFeedManga[] = [
  {
    id: "manga-feat-1",
    title: "Featured Manga Alpha",
    coverUrl: "https://example.com/feat1.jpg",
    sourceId: "source-a",
    sourceName: "Source A",
    latestChapter: "Ch. 50",
    description: "Sinopsis petualangan epik komik alpha.",
  },
  {
    id: "manga-feat-2",
    title: "Featured Manga Beta",
    coverUrl: "https://example.com/feat2.jpg",
    sourceId: "source-b",
    sourceName: "Source B",
    latestChapter: "Ch. 12",
    description: "Sinopsis komik beta yang mendebarkan.",
  },
];

describe("Yomirra Editorial Home Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    motionState.reduced = false;
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("HomeView & Layout Hierarchy", () => {
    it("renders clean layout with mobile actions and feed content", () => {
      render(
        <HomeView>
          <div data-testid="feed-child">Content</div>
        </HomeView>
      );

      expect(screen.getByTestId("feed-child")).toBeTruthy();
      const bellButtons = screen.getAllByRole("button", {
        name: /pembaruan/i,
      });
      expect(bellButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Spotlight selection", () => {
    it("takes one eligible item per source before filling remaining slots", () => {
      const items: HomeFeedManga[] = [
        {
          id: "a-1",
          title: "A One",
          coverUrl: "/a1.jpg",
          sourceId: "source-a",
          sourceName: "Source A",
        },
        {
          id: "a-2",
          title: "A Two",
          coverUrl: "/a2.jpg",
          sourceId: "source-a",
          sourceName: "Source A",
        },
        {
          id: "b-1",
          title: "B One",
          coverUrl: "/b1.jpg",
          sourceId: "source-b",
          sourceName: "Source B",
        },
        {
          id: "c-1",
          title: "C One",
          coverUrl: "/c1.jpg",
          sourceId: "source-c",
          sourceName: "Source C",
        },
      ];

      expect(selectSpotlightItems(items, 4).map((item) => item.id)).toEqual([
        "a-1",
        "b-1",
        "c-1",
        "a-2",
      ]);
    });

    it("deduplicates only confident matches and keeps title-only uncertainty", () => {
      const confidentA: HomeFeedManga = {
        id: "a",
        title: "Same Work",
        author: "Author One",
        coverUrl: "/a.jpg",
        sourceId: "source-a",
        sourceName: "Source A",
      };
      const confidentB: HomeFeedManga = {
        id: "b",
        title: "Same Work",
        author: "Author One",
        coverUrl: "/b.jpg",
        sourceId: "source-b",
        sourceName: "Source B",
      };
      const uncertain: HomeFeedManga = {
        id: "c",
        title: "Same Work",
        coverUrl: "/c.jpg",
        sourceId: "source-c",
        sourceName: "Source C",
      };

      expect(isConfidentHomeDuplicate(confidentA, confidentB)).toBe(true);
      expect(isConfidentHomeDuplicate(confidentA, uncertain)).toBe(false);
      expect(selectSpotlightItems([confidentA, confidentB, uncertain], 5)).toEqual([
        confidentA,
        uncertain,
      ]);
    });
  });

  describe("Spotlight Carousel & Leaderboard", () => {
    it("uses the Hero as H1 and keeps Sorotan & peringkat as the next heading level", () => {
      render(
        <HomeFeedClient
          unifiedPopular={samplePopular}
          unifiedLatest={sampleLatest}
        />
      );

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Mau baca apa hari ini?",
        })
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: /sorotan & peringkat/i,
        })
      ).toBeTruthy();
      expect(screen.getByText("SOROTAN TERBARU")).toBeTruthy();
    });

    it("cycles through carousel items manually and wraps in both directions", () => {
      render(
        <HomeFeedClient
          unifiedPopular={samplePopular}
          unifiedLatest={sampleLatest}
        />
      );

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Alpha",
        })
      ).toBeTruthy();

      const nextButton = screen.getByRole("button", {
        name: /komik berikutnya/i,
      });
      fireEvent.click(nextButton);

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Beta",
        })
      ).toBeTruthy();

      fireEvent.click(nextButton);
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Alpha",
        })
      ).toBeTruthy();

      fireEvent.click(
        screen.getByRole("button", { name: /komik sebelumnya/i })
      );
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Beta",
        })
      ).toBeTruthy();
    });

    it("autoplays after six seconds and resets the timer after manual navigation", () => {
      vi.useFakeTimers();

      render(
        <HomeFeedClient
          unifiedPopular={samplePopular}
          unifiedLatest={sampleLatest}
        />
      );

      act(() => {
        vi.advanceTimersByTime(SPOTLIGHT_AUTOPLAY_MS - 1);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Alpha",
        })
      ).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Beta",
        })
      ).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(5_000);
      });
      fireEvent.click(
        screen.getByRole("button", { name: /komik berikutnya/i })
      );

      act(() => {
        vi.advanceTimersByTime(1_000);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Alpha",
        })
      ).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(5_000);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Beta",
        })
      ).toBeTruthy();
    });

    it("pauses autoplay while hovered or focused and disables autoplay for reduced motion", () => {
      vi.useFakeTimers();

      const view = render(
        <HomeFeedClient
          unifiedPopular={samplePopular}
          unifiedLatest={sampleLatest}
        />
      );

      const carousel = screen.getByTestId("spotlight-carousel");
      fireEvent.mouseEnter(carousel);
      act(() => {
        vi.advanceTimersByTime(SPOTLIGHT_AUTOPLAY_MS);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Alpha",
        })
      ).toBeTruthy();

      fireEvent.mouseLeave(carousel);
      const nextButton = screen.getByRole("button", {
        name: /komik berikutnya/i,
      });
      fireEvent.focus(nextButton);
      act(() => {
        vi.advanceTimersByTime(SPOTLIGHT_AUTOPLAY_MS);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Alpha",
        })
      ).toBeTruthy();

      fireEvent.blur(nextButton, { relatedTarget: null });
      act(() => {
        vi.advanceTimersByTime(SPOTLIGHT_AUTOPLAY_MS);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Beta",
        })
      ).toBeTruthy();

      view.unmount();
      motionState.reduced = true;

      render(
        <HomeFeedClient
          unifiedPopular={samplePopular}
          unifiedLatest={sampleLatest}
        />
      );
      act(() => {
        vi.advanceTimersByTime(SPOTLIGHT_AUTOPLAY_MS * 2);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Alpha",
        })
      ).toBeTruthy();
    });

    it("supports swipe navigation and restarts autoplay after touch interaction", () => {
      vi.useFakeTimers();

      render(
        <HomeFeedClient
          unifiedPopular={samplePopular}
          unifiedLatest={sampleLatest}
        />
      );

      const carousel = screen.getByTestId("spotlight-carousel");
      fireEvent.touchStart(carousel, {
        touches: [{ clientX: 220 }],
      });
      act(() => {
        vi.advanceTimersByTime(2_000);
      });
      fireEvent.touchEnd(carousel, {
        changedTouches: [{ clientX: 120 }],
      });

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Beta",
        })
      ).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(SPOTLIGHT_AUTOPLAY_MS - 1);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Beta",
        })
      ).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Featured Manga Alpha",
        })
      ).toBeTruthy();
    });

    it("keeps ranking source-scoped, uses display names, and preserves source context in Lihat semua", () => {
      render(<HomeLeaderboardPanel items={samplePopular} />);

      expect(screen.getByText("Paling banyak dibaca")).toBeTruthy();
      expect(screen.getByText("Manga Test 1")).toBeTruthy();
      expect(screen.getByText("Manga Test 2")).toBeTruthy();
      expect(screen.queryByText("Manga Source B")).toBeNull();

      const select = screen.getByRole("combobox", {
        name: /pilih sumber peringkat/i,
      });
      expect(select).toBeTruthy();

      const initialSeeAll = screen.getByRole("link", { name: /lihat semua/i });
      expect(initialSeeAll.getAttribute("href")).toBe(
        "/sources/source-a?sort=popular"
      );

      fireEvent.change(select, { target: { value: "source-b" } });

      expect(screen.getByText("Manga Source B")).toBeTruthy();
      expect(screen.queryByText("Manga Test 1")).toBeNull();
      expect(screen.getByText("Source B")).toBeTruthy();
      expect(screen.queryByText("source-b")).toBeNull();
      expect(
        screen.getByRole("link", { name: /lihat semua/i }).getAttribute("href")
      ).toBe("/sources/source-b?sort=popular");
    });

    it("gives rank one restrained hierarchy without changing order", () => {
      render(<HomeLeaderboardPanel items={samplePopular} />);

      const first = screen.getByRole("link", { name: /Manga Test 1/i });
      const second = screen.getByRole("link", { name: /Manga Test 2/i });

      expect(first.className).toContain("min-h-[68px]");
      expect(second.className).toContain("min-h-[52px]");
      expect(screen.getByText("01")).toBeTruthy();
      expect(screen.getByText("02")).toBeTruthy();
    });

    it("renders empty state when selected source has no ranking items", () => {
      render(
        <HomeLeaderboardPanel items={[]} defaultSourceId="source-empty" />
      );

      expect(
        screen.getByText(/belum ada peringkat dari sumber ini/i)
      ).toBeTruthy();
    });

    it("clamps leaderboard to maximum 5 items on mobile-compatible vertical rows", () => {
      const tenItems: HomeFeedManga[] = Array.from(
        { length: 10 },
        (_, index) => ({
          id: `manga-${index}`,
          title: `Manga ${index}`,
          sourceId: "source-a",
          sourceName: "Source A",
          coverUrl: "https://example.com/cover.jpg",
        })
      );

      render(
        <HomeLeaderboardPanel
          items={tenItems}
          defaultSourceId="source-a"
        />
      );

      expect(screen.getByText("01")).toBeTruthy();
      expect(screen.getByText("05")).toBeTruthy();
      expect(screen.queryByText("06")).toBeNull();
    });
  });

  describe("Continue Reading Shelf", () => {
    it("renders Continue Reading with normalized progress and context menu trigger", () => {
      render(
        <HomeFeedClient
          unifiedPopular={samplePopular}
          unifiedLatest={sampleLatest}
        />
      );

      expect(screen.getByRole("heading", { name: "Lanjut Baca" })).toBeTruthy();
      expect(screen.getByText("Solo Leveling")).toBeTruthy();
      expect(screen.getByText("50%")).toBeTruthy();

      const continueLink = screen.getByRole("link", {
        name: /lanjut baca solo leveling/i,
      });
      expect(continueLink).toBeTruthy();
      expect(continueLink.getAttribute("href")).toBe(
        "/manga/source-a/solo-leveling/read/100?returnTo=%2F"
      );

      expect(
        screen.getByRole("button", { name: /opsi untuk solo leveling/i })
      ).toBeTruthy();
    });
  });

  describe("Popularity Deduplication", () => {
    it("keeps only the compact source-scoped ranking panel", () => {
      render(
        <HomeFeedClient
          unifiedPopular={samplePopular}
          unifiedLatest={sampleLatest}
        />
      );

      expect(screen.getByText("Paling banyak dibaca")).toBeTruthy();
      expect(
        screen.queryByRole("heading", { level: 2, name: /banyak dibaca/i })
      ).toBeNull();
      expect(document.getElementById("popular-section")).toBeNull();
    });
  });
});
