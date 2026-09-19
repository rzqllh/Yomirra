import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeadSourceRecovery } from "../dead-source-recovery";
import { useLibraryStore } from "@/shared/store/library-store";
import { useDownloadStore } from "@/shared/store/download-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/shared/sources/dynamic-source-registry", () => ({
  dynamicSourceRegistry: {
    get: (id: string) => ({ id, name: id.toUpperCase(), status: "unavailable" }),
    getAll: () => [
      { id: "alt-src", name: "ALT-SRC", capabilities: { search: true }, status: "online" }
    ],
  },
}));

vi.mock("@/shared/api-client", () => ({
  apiClient: {
    search: vi.fn().mockResolvedValue({ results: [] }),
    getChapters: vi.fn().mockResolvedValue([]),
  },
}));

describe("DeadSourceRecovery Component", () => {
  beforeEach(() => {
    useLibraryStore.setState({ items: {} });
    useDownloadStore.setState({ downloads: {} });
  });

  it("renders warning banner indicating the source is unavailable", () => {
    render(<DeadSourceRecovery sourceId="komikindo" mangaId="solo-leveling" />);

    expect(screen.getByText(/Sumber "KOMIKINDO" Tidak Tersedia/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Cari Sumber Alternatif/i })).toBeDefined();
  });

  it("displays known title from library", () => {
    useLibraryStore.getState().addToLibrary({
      sourceId: "komikindo",
      mangaId: "solo-leveling",
      title: "Solo Leveling Manhwa",
      author: "Chugong",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<DeadSourceRecovery sourceId="komikindo" mangaId="solo-leveling" />);

    expect(screen.getByText("Solo Leveling Manhwa")).toBeDefined();
    expect(screen.getByText("Chugong")).toBeDefined();
  });

  it("displays offline chapters when available in download store", () => {
    useDownloadStore.setState({
      downloads: {
        "komikindo::solo-leveling::ch1": {
          id: "komikindo::solo-leveling::ch1",
          sourceId: "komikindo",
          mangaId: "solo-leveling",
          mangaTitle: "Solo Leveling",
          chapterId: "ch1",
          chapterTitle: "Chapter 1",
          status: "downloaded",
          progress: 100,
          totalPages: 10,
          downloadedPages: 10,
          pages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });

    render(<DeadSourceRecovery sourceId="komikindo" mangaId="solo-leveling" />);

    expect(screen.getByText(/Tersedia Offline \(1 chapter\)/i)).toBeDefined();
    expect(screen.getByText("Chapter 1")).toBeDefined();
    expect(screen.getByText(/Baca Offline/i)).toBeDefined();
  });

  it("shows quick switch button when AUTO_SAFE linked source is available", () => {
    useLibraryStore.getState().addToLibrary({
      sourceId: "komikindo",
      mangaId: "solo-leveling",
      title: "Solo Leveling",
      author: "Chugong",
      linkedSources: [
        {
          sourceId: "alt-src",
          mangaId: "solo-alt",
          matchConfidence: "CONFIRMED",
          addedAt: Date.now(),
        },
      ],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<DeadSourceRecovery sourceId="komikindo" mangaId="solo-leveling" />);

    expect(screen.getByRole("button", { name: /Alihkan ke ALT-SRC/i })).toBeDefined();
  });
});

