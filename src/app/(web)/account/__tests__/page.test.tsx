import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountPage from "../page";

const mocks = vi.hoisted(() => ({
  runFullSync: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/account",
}));

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { uid: "user-a", displayName: "Reader", email: "reader@example.com", photoURL: null },
    loading: false,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/shared/hooks/use-sync", () => ({
  useSync: () => ({ runFullSync: mocks.runFullSync, isSyncing: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.success, error: mocks.error, info: vi.fn() },
}));

describe("AccountPage manual sync feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows success only after manual synchronization resolves", async () => {
    let resolveSync: (() => void) | undefined;
    mocks.runFullSync.mockImplementation(() => new Promise<void>((resolve) => { resolveSync = resolve; }));
    render(<AccountPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sinkronkan sekarang" }));
    expect(mocks.success).not.toHaveBeenCalled();
    resolveSync?.();

    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Sinkronisasi selesai", expect.any(Object)));
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("shows the existing error toast when manual synchronization rejects", async () => {
    mocks.runFullSync.mockRejectedValue(new Error("offline"));
    render(<AccountPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sinkronkan sekarang" }));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Sinkronisasi gagal", expect.any(Object)));
    expect(mocks.success).not.toHaveBeenCalled();
  });
});
