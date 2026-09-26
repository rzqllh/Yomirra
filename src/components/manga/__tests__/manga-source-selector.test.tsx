import * as React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MangaSourceSelector } from "../manga-source-selector";
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

describe("MangaSourceSelector (Phase 6 UI)", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      perTitleSourcePreferences: {},
    });
    useLibraryStore.setState({
      items: {
        "komiku::frieren-indo": {
          id: "saved-frieren-123",
          sourceId: "komiku",
          mangaId: "frieren-indo",
          title: "Sousou no Frieren",
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          linkedSources: [
            {
              sourceId: "mangadex",
              mangaId: "frieren-md",
              addedAt: Date.now(),
              matchConfidence: "CONFIRMED",
            },
          ],
        },
      },
    });
    vi.clearAllMocks();
  });

  it("renders current source name badge", () => {
    render(
      <MangaSourceSelector
        sourceId="komiku"
        mangaId="frieren-indo"
        title="Sousou no Frieren"
      />
    );

    expect(screen.getByText("Komiku")).toBeDefined();
  });

  it("indicates temporary fallback when isTemporaryFallback is true", () => {
    render(
      <MangaSourceSelector
        sourceId="mangadex"
        mangaId="frieren-md"
        title="Sousou no Frieren"
        isTemporaryFallback={true}
      />
    );

    expect(screen.getByText(/Sementara/i)).toBeDefined();
  });

  it("opens modal and allows setting per-title preferred source", () => {
    render(
      <MangaSourceSelector
        sourceId="komiku"
        mangaId="frieren-indo"
        title="Sousou no Frieren"
      />
    );

    // Open dialog
    const trigger = screen.getByText("Komiku");
    fireEvent.click(trigger);

    expect(screen.getByText("Sumber Bacaan")).toBeDefined();
    expect(screen.getByText("MangaDex")).toBeDefined();

    // Click "Jadikan Pilihan" for current source
    const buttons = screen.getAllByRole("button", { name: /Jadikan Pilihan/i });
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);

    expect(useSettingsStore.getState().perTitleSourcePreferences["saved-frieren-123"]).toBe("komiku");
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Komiku jadi sumber utama untuk Sousou no Frieren")
    );
  });
});
