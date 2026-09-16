import * as React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MangaActions } from "../manga-actions";
import { useLibraryStore } from "@/shared/store/library-store";

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    getRatingScore: vi.fn().mockResolvedValue({ score: null }),
  },
}));

describe("MangaActions", () => {
  beforeEach(() => {
    useLibraryStore.setState({ items: {} });
    vi.clearAllMocks();
  });

  it("renders 'Simpan' when manga is not in library", () => {
    render(
      <MangaActions
        sourceId="shinigami"
        mangaId="solo-leveling"
        title="Solo Leveling"
        coverUrl="https://example.com/cover.jpg"
      />
    );

    expect(screen.getByText("Simpan")).toBeDefined();
    expect(screen.getByRole("button", { name: /Tambah ke library/i })).toBeDefined();
  });

  it("renders 'Tersimpan' when manga is in library", async () => {
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
      <MangaActions
        sourceId="shinigami"
        mangaId="solo-leveling"
        title="Solo Leveling"
        coverUrl="https://example.com/cover.jpg"
      />
    );

    expect(await screen.findByText("Tersimpan")).toBeDefined();
    expect(screen.getByRole("button", { name: /Hapus dari library/i })).toBeDefined();
  });
});
