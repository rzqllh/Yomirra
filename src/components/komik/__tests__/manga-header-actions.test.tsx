import * as React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MangaHeaderActions } from "../manga-header-actions";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useLibraryStore } from "@/shared/store/library-store";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("MangaHeaderActions", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      mutedMangaKeys: [],
    });
    useLibraryStore.setState({
      items: {},
    });
    vi.clearAllMocks();
  });

  it("renders only Share and Bell buttons (no copy link button)", () => {
    render(
      <MangaHeaderActions
        sourceId="shinigami"
        mangaId="solo-leveling"
        title="Solo Leveling"
      />
    );

    const shareButton = screen.getByRole("button", { name: /Bagikan/i });
    const bellButton = screen.getByRole("button", { name: /Notifikasi pembaruan/i });
    expect(shareButton).toBeDefined();
    expect(bellButton).toBeDefined();
    expect(shareButton.className).toContain("bg-transparent");
    expect(shareButton.className).toContain("shadow-none");
    expect(shareButton.className).not.toContain("liquid-glass");
    expect(bellButton.className).toContain("bg-transparent");
    expect(bellButton.className).toContain("shadow-none");
    expect(bellButton.className).not.toContain("liquid-glass");
    expect(screen.queryByRole("button", { name: /Salin link/i })).toBeNull();
  });

  it("displays info toast and does NOT toggle mute if manga is not saved in library", () => {
    render(
      <MangaHeaderActions
        sourceId="shinigami"
        mangaId="solo-leveling"
        title="Solo Leveling"
      />
    );

    const bellBtn = screen.getByRole("button", { name: /Notifikasi pembaruan/i });
    fireEvent.click(bellBtn);

    expect(toast.info).toHaveBeenCalledWith(
      "Simpan komik ini terlebih dahulu untuk mengaktifkan notifikasi pembaruan"
    );
    expect(useSettingsStore.getState().mutedMangaKeys).toEqual([]);
  });

  it("toggles mute if manga is saved in library", async () => {
    useLibraryStore.setState({
      items: {
        "shinigami::solo-leveling": {
          sourceId: "shinigami",
          mangaId: "solo-leveling",
          title: "Solo Leveling",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    render(
      <MangaHeaderActions
        sourceId="shinigami"
        mangaId="solo-leveling"
        title="Solo Leveling"
      />
    );

    // Wait for mounted state if any
    const bellBtn = screen.getByRole("button", { name: /Senyapkan notifikasi/i });
    fireEvent.click(bellBtn);

    expect(useSettingsStore.getState().mutedMangaKeys).toContain("shinigami::solo-leveling");
  });
});
