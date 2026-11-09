import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsView } from "../settings-view";
import { getYomirraStorageBreakdown } from "@/shared/lib/yomirra-storage";

vi.mock("@/shared/hooks/use-auth", () => ({ useAuth: () => ({ user: null, logout: vi.fn() }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/settings",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/shared/lib/yomirra-storage", () => ({
  getYomirraStorageBreakdown: vi.fn(), clearAllDownloadsCache: vi.fn(),
}));

describe("offline storage action", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not announce an empty cache while the storage check is pending", async () => {
    vi.mocked(getYomirraStorageBreakdown).mockReturnValue(new Promise(() => {}));
    render(<SettingsView />);
    const button = await screen.findByRole("button", { name: /Hapus unduhan offline/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("Tidak ada bab komik offline yang tersimpan saat ini.")).toBeNull();
    expect(screen.getByText("Memeriksa unduhan offline…")).toBeTruthy();
  });

  it("allows confirmation for cached pages even when their displayed size rounds to zero", async () => {
    vi.mocked(getYomirraStorageBreakdown).mockResolvedValue({
      readingCacheMB: 0, downloadsMB: 0, localDataMB: 0, totalYomirraMB: 0,
      entryCounts: { readingCache: 0, downloads: 1 },
    });
    render(<SettingsView />);
    const button = await screen.findByRole("button", { name: /Hapus unduhan offline/ });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
