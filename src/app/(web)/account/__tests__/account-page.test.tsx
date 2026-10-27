import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AccountPage from "../page";
import { useSyncDiagnosticsStore } from "@/shared/store/sync-diagnostics-store";
import { useGuestMergeStore } from "@/shared/store/guest-merge-store";

let mockUser: any = null;
const mockLoginWithGoogle = vi.fn();
const mockLogout = vi.fn();
const mockRunFullSync = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/account",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    loginWithGoogle: mockLoginWithGoogle,
    logout: mockLogout,
  }),
}));

vi.mock("@/shared/hooks/use-sync", () => ({
  useSync: () => ({
    runFullSync: mockRunFullSync,
    isSyncing: false,
  }),
}));

vi.mock("@/components/chrome/header", () => ({
  PageHeader: ({ title, description }: any) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  ),
}));

describe("AccountPage & Q127 Honest Diagnostics & Q64 Guest Merge UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    useSyncDiagnosticsStore.getState().resetDiagnostics();
    useGuestMergeStore.getState().cancelMergeReview();
  });

  it("renders guest state with honest Q64 notice and Masuk dengan Google button", () => {
    render(<AccountPage />);

    expect(screen.getByRole("heading", { name: /Masuk ke Yomirra/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Masuk dengan Google/i })).toBeTruthy();
    expect(screen.queryByText(/item tersinkron/i)).toBeNull();
  });

  it("renders honest sync diagnostics for logged in user without fake checkmarks before first sync", () => {
    mockUser = { uid: "user-test", displayName: "Tester", email: "test@example.com" };

    render(<AccountPage />);

    expect(screen.getByText("Tester")).toBeTruthy();
    expect(screen.getByText("Sinkronisasi cloud")).toBeTruthy();

    // Must show waiting state, NOT fake checkmarks claiming synced items!
    const waitingElements = screen.getAllByText("Menunggu sinkronisasi");
    expect(waitingElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/item terverifikasi di cloud/i)).toBeNull();
  });

  it("displays verified committed count when domain sync actually succeeds", () => {
    mockUser = { uid: "user-test", displayName: "Tester", email: "test@example.com" };

    useSyncDiagnosticsStore.getState().recordSuccessfulCommit({
      uid: "user-test",
      domains: [
        { domain: "library", successfulWriteCount: 0, verifiedReadCount: 12 },
        { domain: "history", successfulWriteCount: 0, verifiedReadCount: 34 },
      ],
      timestamp: "2026-10-27T12:00:00Z",
    });

    render(<AccountPage />);

    expect(screen.getByText("12 item terverifikasi di cloud")).toBeTruthy();
    expect(screen.getByText("34 riwayat terverifikasi di cloud")).toBeTruthy();
    expect(screen.getByText("Tersinkron")).toBeTruthy();
  });

  it("displays honest write count breakdown when new items were actually committed", () => {
    mockUser = { uid: "user-test", displayName: "Tester", email: "test@example.com" };

    useSyncDiagnosticsStore.getState().recordSuccessfulCommit({
      uid: "user-test",
      domains: [
        { domain: "library", successfulWriteCount: 5, verifiedReadCount: 12 },
        { domain: "history", successfulWriteCount: 10, verifiedReadCount: 34 },
      ],
      timestamp: "2026-10-27T12:00:00Z",
    });

    render(<AccountPage />);

    expect(screen.getByText("5 item baru di-commit (12 terverifikasi)")).toBeTruthy();
    expect(screen.getByText("10 riwayat baru di-commit (34 terverifikasi)")).toBeTruthy();
  });

  it("renders GuestMergeDialog when isMergePending is active", () => {
    mockUser = { uid: "user-test", displayName: "Tester", email: "test@example.com" };

    useGuestMergeStore.getState().startMergeReview({
      user: { uid: "user-test", displayName: "Tester", email: "test@example.com" },
      guestSnapshot: {
        library: { "m1": { id: "m1", title: "Manga Lokal" } as any },
        history: {},
      },
      cloudSnapshot: {
        library: { "m2": { id: "m2", title: "Manga Cloud" } as any },
        history: {},
      },
      diff: {
        hasGuestData: true,
        hasCloudData: true,
        guestOnlyLibrary: [{ id: "m1", title: "Manga Lokal" } as any],
        cloudOnlyLibrary: [{ id: "m2", title: "Manga Cloud" } as any],
        conflictingLibrary: [],
        guestOnlyHistoryCount: 0,
        cloudOnlyHistoryCount: 0,
        conflictingHistoryCount: 0,
        totalMergedLibraryCount: 2,
        totalMergedHistoryCount: 0,
      },
    });

    render(<AccountPage />);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/Penyelarasan Data Tamu & Akun/i)).toBeTruthy();
    expect(screen.getByText(/1\. Gabungkan Data/i)).toBeTruthy();
    expect(screen.getByText(/2. Gunakan Data Cloud/i)).toBeTruthy();
  });

  it("renders fail-closed error view in GuestMergeDialog when snapshot fetch failed", () => {
    mockUser = { uid: "user-test", displayName: "Tester", email: "test@example.com" };

    useGuestMergeStore.getState().setMergeError({
      user: { uid: "user-test", displayName: "Tester", email: "test@example.com" },
      errorMessage: "Koneksi cloud gagal membaca snapshot akun",
    });

    render(<AccountPage />);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/Gagal Membaca Data Cloud/i)).toBeTruthy();
    expect(screen.getByText(/Koneksi cloud gagal membaca snapshot akun/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Coba Lagi/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Batalkan Masuk Akun/i })).toBeTruthy();
  });
});
