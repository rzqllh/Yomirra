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
    expect(screen.getByText(/Biar rating 9\/10 kamu nggak hilang pas ganti device/i)).toBeDefined();
    expect(screen.getByText(/Rating ini baru nempel di browser ini doang/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Simpan ke Akun \(Google\)/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Lanjut di Device Ini Aja/i })).toBeDefined();
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
    expect(screen.getByText(/Bikin playlist komikmu aman di cloud/i)).toBeDefined();
    expect(screen.getByText(/Udah rapihin folder bacaan, jangan sampai hilang pas ganti HP/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Amankan Pake Google/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Bikin di Device Ini Dulu/i })).toBeDefined();
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

    const guestBtn = screen.getByRole("button", { name: /Bikin di Device Ini Dulu/i });
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

    const loginBtn = screen.getByRole("button", { name: /Simpan ke Akun \(Google\)/i });
    fireEvent.click(loginBtn);

    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
