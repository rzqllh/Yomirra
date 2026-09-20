import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GuestSyncBanner } from "../guest-sync-banner";
import { useLibraryStore } from "@/shared/store/library-store";
import { useCollectionStore } from "@/shared/store/collection-store";
import { useSettingsStore } from "@/shared/store/settings-store";

const mockAuthUser = vi.fn();
const mockLoginWithGoogle = vi.fn();

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockAuthUser(),
    loading: false,
    loginWithGoogle: mockLoginWithGoogle,
    logout: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("GuestSyncBanner", () => {
  beforeEach(() => {
    mockAuthUser.mockReturnValue(null);
    useSettingsStore.getState().resetGuestBanner();
    useLibraryStore.setState({ items: {} });
    useCollectionStore.setState({ readingStatusByManga: {} });
    vi.clearAllMocks();
  });

  it("does not render when user is logged in", () => {
    mockAuthUser.mockReturnValue({ uid: "user-123" });
    // Even with 10 items
    useLibraryStore.setState({
      items: {
        "s1::m1": {} as any,
        "s1::m2": {} as any,
        "s1::m3": {} as any,
        "s1::m4": {} as any,
        "s1::m5": {} as any,
        "s1::m6": {} as any,
      },
    });

    const { container } = render(<GuestSyncBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render when guest has fewer than 5 items", () => {
    mockAuthUser.mockReturnValue(null);
    useLibraryStore.setState({
      items: {
        "s1::m1": {} as any,
        "s1::m2": {} as any,
        "s1::m3": {} as any,
      },
    });

    const { container } = render(<GuestSyncBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when guest has 5 or more items combined across library and reading status", () => {
    mockAuthUser.mockReturnValue(null);
    useLibraryStore.setState({
      items: {
        "s1::m1": {} as any,
        "s1::m2": {} as any,
        "s1::m3": {} as any,
      },
    });
    useCollectionStore.setState({
      readingStatusByManga: {
        "s1::m4": "reading",
        "s1::m5": "completed",
      },
    });

    render(<GuestSyncBanner />);

    expect(screen.getByText("5 komik tersimpan di browser ini")).toBeDefined();
    expect(screen.getByText(/kalau ganti device atau bersihkan browser, nggak ikut kebawa/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Cadangkan ke Akun/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Nanti saja/i })).toBeDefined();
  });

  it("snoozes for 7 days when dismissed initially", () => {
    mockAuthUser.mockReturnValue(null);
    useLibraryStore.setState({
      items: {
        "s1::m1": {} as any,
        "s1::m2": {} as any,
        "s1::m3": {} as any,
        "s1::m4": {} as any,
        "s1::m5": {} as any,
      },
    });

    const { unmount } = render(<GuestSyncBanner />);
    const dismissBtn = screen.getByRole("button", { name: /Nanti saja/i });
    fireEvent.click(dismissBtn);

    expect(useSettingsStore.getState().guestBannerDismissCount).toBe(1);
    expect(useSettingsStore.getState().guestBannerSnoozedUntil).toBeGreaterThan(Date.now() + 6 * 86400 * 1000);
    unmount();

    // After dismiss and re-render, should not be visible
    const { container: rerenderContainer } = render(<GuestSyncBanner />);
    expect(rerenderContainer.firstChild).toBeNull();
  });

  it("escalates copy and snoozes for 3 days when items >= 15 and previously dismissed", () => {
    mockAuthUser.mockReturnValue(null);
    const fifteenItems: Record<string, any> = {};
    for (let i = 1; i <= 16; i++) {
      fifteenItems[`s1::m${i}`] = {} as any;
    }
    useLibraryStore.setState({ items: fifteenItems });

    // Simulate previous dismiss
    useSettingsStore.setState({ guestBannerDismissCount: 1, guestBannerSnoozedUntil: null });

    render(<GuestSyncBanner />);

    expect(screen.getByText("Koleksimu makin banyak di browser ini")).toBeDefined();
    expect(screen.getByText("16 Judul Tersimpan")).toBeDefined();

    const dismissBtn = screen.getByRole("button", { name: /Nanti saja/i });
    fireEvent.click(dismissBtn);

    expect(useSettingsStore.getState().guestBannerDismissCount).toBe(2);
    // Should be snoozed for 3 days (~259200000ms)
    const snoozedUntil = useSettingsStore.getState().guestBannerSnoozedUntil!;
    expect(snoozedUntil).toBeLessThanOrEqual(Date.now() + 3 * 86400 * 1000 + 2000);
    expect(snoozedUntil).toBeGreaterThan(Date.now() + 2.9 * 86400 * 1000);
  });
});
