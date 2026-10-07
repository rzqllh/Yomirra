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

    expect(screen.getAllByText("Belum bisa terhubung ke Komikindo").length).toBeGreaterThanOrEqual(1);
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

    expect(screen.getAllByText("Komik tidak ditemukan").length).toBeGreaterThanOrEqual(1);
    const searchLink = screen.getByRole("link", { name: /Cari di Sumber Lain/i });
    expect(searchLink).toBeDefined();
    expect(searchLink.getAttribute("href")).toContain("/search?q=solo%20leveling");
  });

  it("does not render raw internal error messages", () => {
    render(
      <MangaDetailErrorState
        sourceId="komikindo"
        mangaId="solo-leveling"
        type="network_error"
        message="ETIMEDOUT https://upstream.example?token=super-secret"
      />
    );

    expect(screen.queryByText(/super-secret/i)).toBeNull();
    expect(screen.queryByText(/ETIMEDOUT/i)).toBeNull();
    expect(screen.getByText(/Komikindo sedang tidak dapat digunakan/i)).toBeDefined();
    expect(screen.queryByText(/server/i)).toBeNull();
    expect(screen.queryByText(/solo-leveling/i)).toBeNull();
  });

  it("renders disabled state with link to sources", () => {
    render(
      <MangaDetailErrorState
        sourceId="komikindo"
        mangaId="solo-leveling"
        type="disabled"
      />
    );

    expect(screen.getAllByText(/Sumber "Komikindo" Dinonaktifkan/i).length).toBeGreaterThanOrEqual(1);
    const sourcesLink = screen.getByRole("link", { name: /Buka Sumber/i });
    expect(sourcesLink).toBeDefined();
    expect(sourcesLink.getAttribute("href")).toBe("/sources");
  });
});
