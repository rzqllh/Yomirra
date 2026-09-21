import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MangaRating } from "../manga-rating";
import { useLibraryStore } from "@/shared/store/library-store";

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

describe("MangaRating Guest Gating", () => {
  beforeEach(() => {
    mockAuthUser.mockReturnValue(null);
    useLibraryStore.setState({ items: {} });
    vi.clearAllMocks();
  });

  it("saves rating directly when user is logged in", () => {
    mockAuthUser.mockReturnValue({ uid: "user-123" });

    render(
      <MangaRating
        sourceId="shinigami"
        mangaId="m1"
        variant="action"
        mangaDetail={{ title: "Solo Leveling" }}
      />
    );

    // Open dropdown
    const trigger = screen.getByRole("button", { name: "Beri Rating" });
    fireEvent.click(trigger);

    // Select star 9
    const star9 = screen.getByText("9");
    fireEvent.click(star9);

    // Soft-gate modal should NOT be present
    expect(screen.queryByText(/Simpan rating 9\/10 ke cloud\?/i)).toBeNull();

    // Rating should be saved in library store
    const item = useLibraryStore.getState().getLibraryItem("shinigami", "m1");
    expect(item?.userRating).toBe(9);
  });

  it("triggers soft-nudge modal when guest selects a rating, and saves upon clicking Lanjut di Perangkat Ini", () => {
    mockAuthUser.mockReturnValue(null);

    render(
      <MangaRating
        sourceId="shinigami"
        mangaId="m1"
        variant="action"
        mangaDetail={{ title: "Solo Leveling" }}
      />
    );

    // Open dropdown
    const trigger = screen.getByRole("button", { name: "Beri Rating" });
    fireEvent.click(trigger);

    // Select star 8
    const star8 = screen.getByText("8");
    fireEvent.click(star8);

    // Soft-gate modal should appear with context 8/10
    expect(screen.getByText(/Biar rating 8\/10 kamu nggak hilang pas ganti device/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Simpan ke Akun \(Google\)/i })).toBeDefined();

    // Click "Lanjut di Device Ini Aja"
    const proceedGuestBtn = screen.getByRole("button", { name: /Lanjut di Device Ini Aja/i });
    fireEvent.click(proceedGuestBtn);

    // Rating should be committed to local store
    const item = useLibraryStore.getState().getLibraryItem("shinigami", "m1");
    expect(item?.userRating).toBe(8);
  });

  it("logs in with Google and commits rating when guest chooses Google sign-in", async () => {
    mockAuthUser.mockReturnValue(null);
    mockLoginWithGoogle.mockResolvedValueOnce(undefined);

    render(
      <MangaRating
        sourceId="shinigami"
        mangaId="m1"
        variant="action"
        mangaDetail={{ title: "Solo Leveling" }}
      />
    );

    const trigger = screen.getByRole("button", { name: "Beri Rating" });
    fireEvent.click(trigger);

    const star10 = screen.getByText("10");
    fireEvent.click(star10);

    const googleBtn = screen.getByRole("button", { name: /Simpan ke Akun \(Google\)/i });
    fireEvent.click(googleBtn);

    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      const item = useLibraryStore.getState().getLibraryItem("shinigami", "m1");
      expect(item?.userRating).toBe(10);
    });
  });
});
