import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReaderChapterDrawer } from "../reader-chapter-drawer";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("../reader-panel-shell", () => ({
  ReaderPanelShell: ({ children, headerControls }: { children: React.ReactNode; headerControls: React.ReactNode }) => <div>{headerControls}{children}</div>,
}));

describe("chapter search and order", () => {
  const chapters = [
    { id: "extra", mangaId: "test", title: "Extra Winter", number: 12.5, url: "", date: "2026-11-09" },
    { id: "first", mangaId: "test", title: "Opening", number: 1, url: "", date: "2026-11-08" },
  ];
  it("matches a trimmed decimal number and special title, and shows result count", () => {
    render(<ReaderChapterDrawer isOpen onClose={vi.fn()} chapters={chapters} sourceId="test" mangaId="test" />);
    const search = screen.getByPlaceholderText("Cari nomor atau judul chapter…");
    fireEvent.change(search, { target: { value: " 12.5 " } });
    expect(screen.getByRole("button", { name: "Chapter 12.5" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Chapter 1" })).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("1 dari 2 chapter");
    fireEvent.change(search, { target: { value: " WINTER " } });
    expect(screen.getByRole("button", { name: "Chapter 12.5" })).toBeTruthy();
  });
  it("keeps current chapter marked and explains both sort states", () => {
    render(<ReaderChapterDrawer isOpen onClose={vi.fn()} chapters={chapters} currentChapterId="first" sourceId="test" mangaId="test" />);
    expect(screen.getByRole("button", { name: "Chapter 1, sedang dibaca" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("status").textContent).toContain("Lama ke baru");
    fireEvent.click(screen.getByRole("button", { name: "Urutkan baru ke lama" }));
    expect(screen.getByRole("status").textContent).toContain("Baru ke lama");
  });
});
