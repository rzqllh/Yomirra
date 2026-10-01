import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HomeHero, HERO_COLLAGE_CACHE_KEY } from "../home-hero";
import { HeaderActions } from "../header-actions";
import { PageHeader } from "../header";

const pushMock = vi.fn();
const backMock = vi.fn();
const replaceMock = vi.fn();
let mockUser: unknown = null;
let mockHistoryItems: Record<string, unknown> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: backMock, replace: replaceMock }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    resolvedTheme: "dark",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/shared/hooks/use-mounted", () => ({
  useMounted: () => true,
}));

vi.mock("@/components/app/updates-bell", () => ({
  UpdatesBell: ({ className }: { className?: string }) => (
    <button type="button" aria-label="Pembaruan" className={className}>
      Bell
    </button>
  ),
}));

vi.mock("@/shared/store/history-store", () => ({
  useHistoryStore: (selector: any) => selector({ items: mockHistoryItems }),
}));

describe("Header & Hero System (Squircle & Reusable)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockHistoryItems = {};
    sessionStorage.clear();
  });

  describe("HomeHero", () => {
    it("renders the compact canonical heading, new-user eyebrow, and global search entry", () => {
      render(<HomeHero />);

      expect(
        screen.getByRole("heading", { level: 1, name: "Mau baca apa hari ini?" })
      ).toBeTruthy();
      expect(screen.getByText("BACAANMU DIMULAI DI SINI")).toBeTruthy();
      expect(
        screen.getByPlaceholderText(/Cari judul atau kreator/i)
      ).toBeTruthy();
    });

    it("switches to the returning-reader eyebrow when local reading history exists", () => {
      mockHistoryItems = { "source-a::title-a": { chapterId: "1" } };

      render(<HomeHero />);

      expect(screen.getByText("LANJUT LAGI DI YOMIRRA")).toBeTruthy();
      expect(screen.queryByText("BACAANMU DIMULAI DI SINI")).toBeNull();
    });

    it("hands Home search to the shared global search surface", () => {
      const listener = vi.fn();
      window.addEventListener("open-command-menu", listener);

      render(<HomeHero />);
      const input = screen.getByPlaceholderText(
        /Cari judul atau kreator/i
      );
      fireEvent.change(input, { target: { value: "solo leveling" } });

      expect(listener).toHaveBeenCalled();
      const lastEvent = listener.mock.calls.at(-1)?.[0] as CustomEvent;
      expect(lastEvent.detail).toEqual({ query: "solo leveling" });

      window.removeEventListener("open-command-menu", listener);
    });

    it("keeps decorative artwork optional and does not render an artwork skeleton", () => {
      const { container } = render(<HomeHero candidates={[]} />);

      expect(container.querySelectorAll("img")).toHaveLength(0);
      expect(container.querySelector(".animate-pulse")).toBeNull();
      expect(
        screen.getByRole("heading", { name: "Mau baca apa hari ini?" })
      ).toBeTruthy();
    });

    it("selects the collage once per browser session and reuses the cached selection", () => {
      const candidates = Array.from({ length: 5 }, (_, index) => ({
        coverUrl: `https://example.com/cover-${index}.jpg`,
        title: `Manga ${index}`,
      }));
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      const firstRender = render(<HomeHero candidates={candidates} />);
      const firstSelection = sessionStorage.getItem(HERO_COLLAGE_CACHE_KEY);

      expect(firstSelection).toBeTruthy();
      expect(JSON.parse(firstSelection ?? "[]")).toHaveLength(3);

      firstRender.unmount();
      randomSpy.mockReturnValue(0.99);
      render(<HomeHero candidates={candidates} />);

      expect(sessionStorage.getItem(HERO_COLLAGE_CACHE_KEY)).toBe(
        firstSelection
      );

      randomSpy.mockRestore();
    });

    it("keeps the Hero usable when decorative artwork fails", () => {
      render(
        <HomeHero
          candidates={[
            {
              coverUrl: "https://example.com/broken.jpg",
              title: "Broken cover",
            },
          ]}
        />
      );

      const image = document.querySelector("img");
      expect(image).toBeTruthy();
      fireEvent.error(image!);

      expect(
        screen.getByRole("heading", { name: "Mau baca apa hari ini?" })
      ).toBeTruthy();
      expect(screen.getByRole("search")).toBeTruthy();
    });
  });

  describe("HeaderActions & Dropdown Popover", () => {
    it("uses squircle rounded-2xl geometry for bell and settings trigger", () => {
      render(<HeaderActions />);
      const bellButton = screen.getByRole("button", { name: /pembaruan/i });
      expect(bellButton.className).toContain("rounded-2xl");

      const settingsBtn = screen.getByRole("button", {
        name: /buka menu akun/i,
      });
      expect(settingsBtn.className).toContain("rounded-2xl");
    });

    it("opens dropdown menu on settings button click with all required options in squircle geometry", () => {
      render(<HeaderActions />);
      const settingsBtn = screen.getByRole("button", {
        name: /buka menu akun/i,
      });

      expect(screen.queryByText(/Pengaturan aplikasi/i)).toBeNull();
      fireEvent.click(settingsBtn);

      expect(screen.getByText(/Pengaturan aplikasi/i)).toBeTruthy();
      expect(screen.getByRole("link", { name: "Sumber" }).getAttribute("href")).toBe(
        "/sources"
      );
      expect(screen.getByText(/Tema tampilan/i)).toBeTruthy();
      expect(screen.getByText(/Bahasa/i)).toBeTruthy();
      expect(screen.getByText(/Pusat bantuan/i)).toBeTruthy();
      expect(screen.getByText(/Masuk akun/i)).toBeTruthy();
    });
  });

  describe("PageHeader (Responsive Header Architecture)", () => {
    it("renders mobile header actions but does NOT leak HeaderActions to desktop banner", () => {
      const { container } = render(
        <PageHeader
          title="Populer"
          subtitle="Manga, Manhwa, dan Manhua paling populer saat ini."
        />
      );

      const mobileHeader = container.querySelector("header.md\\:hidden");
      expect(mobileHeader).toBeTruthy();
      expect(
        mobileHeader?.querySelector('button[aria-label="Pembaruan"]')
      ).toBeTruthy();

      const desktopBanner = container.querySelector("div.hidden.md\\:block");
      expect(desktopBanner).toBeTruthy();
      expect(desktopBanner?.querySelector('a[href="/updates"]')).toBeNull();
      expect(desktopBanner?.textContent).toContain("Populer");
      expect(desktopBanner?.textContent).toContain(
        "Manga, Manhwa, dan Manhua paling populer saat ini."
      );
    });

    it("prefers native browser history for logical back navigation", () => {
      window.history.pushState({}, "", "/library");
      window.history.pushState(
        {},
        "",
        "/manga/source-a/title-a?returnTo=%2Flibrary"
      );

      render(<PageHeader title="Detail" showBack backHref="/library" />);

      fireEvent.click(screen.getByRole("button", { name: "Kembali" }));

      expect(backMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).not.toHaveBeenCalled();
    });

    it("renders custom desktopActions on desktop banner when provided", () => {
      const { container } = render(
        <PageHeader
          title="Unduhan"
          desktopActions={
            <button data-testid="desktop-delete-all">Hapus Semua</button>
          }
        />
      );

      const desktopBanner = container.querySelector("div.hidden.md\\:block");
      expect(
        desktopBanner?.querySelector('[data-testid="desktop-delete-all"]')
      ).toBeTruthy();
    });
  });
});
