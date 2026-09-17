import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MangaDetailErrorState } from "../manga-detail-error-state";

const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    back: mockBack,
    push: mockPush,
    forward: vi.fn(),
  }),
}));

vi.mock("@/shared/sources/source-registry", () => ({
  getSourceMetadata: (id: string) => ({
    id,
    name: id === "komikindo" ? "Komikindo" : id,
    status: "online",
  }),
}));

describe("MangaDetailErrorState", () => {
  it("renders network_error with retry and back buttons", () => {
    render(
      <MangaDetailErrorState
        sourceId="komikindo"
        mangaId="solo-leveling"
        type="network_error"
      />
    );

    expect(screen.getAllByText("Gagal Terhubung ke Komikindo").length).toBeGreaterThanOrEqual(1);
    const retryBtn = screen.getByRole("button", { name: /Coba Lagi/i });
    expect(retryBtn).toBeDefined();

    fireEvent.click(retryBtn);
    expect(mockRefresh).toHaveBeenCalled();

    const backBtns = screen.getAllByRole("button", { name: /Kembali/i });
    fireEvent.click(backBtns[backBtns.length - 1]);
    expect(mockBack).toHaveBeenCalled();
  });

  it("renders not_found with search other sources option", () => {
    render(
      <MangaDetailErrorState
        sourceId="komikindo"
        mangaId="solo-leveling"
        type="not_found"
      />
    );

    expect(screen.getAllByText("Manga Tidak Ditemukan").length).toBeGreaterThanOrEqual(1);
    const searchLink = screen.getByRole("link", { name: /Cari di Sumber Lain/i });
    expect(searchLink).toBeDefined();
    expect(searchLink.getAttribute("href")).toContain("/search?q=solo%20leveling");
  });

  it("renders disabled state with link to settings", () => {
    render(
      <MangaDetailErrorState
        sourceId="komikindo"
        mangaId="solo-leveling"
        type="disabled"
      />
    );

    expect(screen.getAllByText(/Sumber "Komikindo" Dinonaktifkan/i).length).toBeGreaterThanOrEqual(1);
    const settingsLink = screen.getByRole("link", { name: /Buka Pengaturan/i });
    expect(settingsLink).toBeDefined();
    expect(settingsLink.getAttribute("href")).toBe("/settings");
  });
});
