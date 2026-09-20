import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GuestActionGateModal } from "../guest-action-gate-modal";

const mockLoginWithGoogle = vi.fn();

vi.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({
    user: null,
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

describe("GuestActionGateModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders rating copy correctly with context", () => {
    render(
      <GuestActionGateModal
        isOpen={true}
        onOpenChange={vi.fn()}
        actionType="rating"
        titleContext="9/10"
        onProceedAsGuest={vi.fn()}
      />
    );

    expect(screen.getByText("Rating Personal")).toBeDefined();
    expect(screen.getByText("Simpan rating 9/10 ke cloud?")).toBeDefined();
    expect(screen.getByText(/Rating kamu saat ini hanya tersimpan di browser perangkat ini/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Masuk dengan Google/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Lanjut di Perangkat Ini/i })).toBeDefined();
  });

  it("renders collection copy correctly", () => {
    render(
      <GuestActionGateModal
        isOpen={true}
        onOpenChange={vi.fn()}
        actionType="collection"
        onProceedAsGuest={vi.fn()}
      />
    );

    expect(screen.getByText("Koleksi Kustom")).toBeDefined();
    expect(screen.getByText("Bawa koleksi kustom ke semua perangkat")).toBeDefined();
    expect(screen.getByText(/Koleksi kustom mengelompokkan bacaan sesuai seleramu/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Masuk dengan Google/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Lanjut sebagai Tamu/i })).toBeDefined();
  });

  it("calls onProceedAsGuest when clicking guest proceed button", () => {
    const onProceedAsGuest = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GuestActionGateModal
        isOpen={true}
        onOpenChange={onOpenChange}
        actionType="collection"
        onProceedAsGuest={onProceedAsGuest}
      />
    );

    const guestBtn = screen.getByRole("button", { name: /Lanjut sebagai Tamu/i });
    fireEvent.click(guestBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onProceedAsGuest).toHaveBeenCalledTimes(1);
  });

  it("calls loginWithGoogle and proceeds on successful login", async () => {
    mockLoginWithGoogle.mockResolvedValueOnce(undefined);
    const onLoginSuccess = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GuestActionGateModal
        isOpen={true}
        onOpenChange={onOpenChange}
        actionType="rating"
        onProceedAsGuest={vi.fn()}
        onLoginSuccess={onLoginSuccess}
      />
    );

    const loginBtn = screen.getByRole("button", { name: /Masuk dengan Google/i });
    fireEvent.click(loginBtn);

    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
