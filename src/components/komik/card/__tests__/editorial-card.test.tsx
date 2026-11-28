import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorialCard } from "../editorial-card";

vi.mock("next/navigation", () => ({
  usePathname: () => "/popular",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../../bookmark-button", () => ({
  BookmarkButton: ({ manga }: { manga: { title: string } }) => (
    <button type="button" className="size-11" aria-label={`Simpan ${manga.title} ke rak`} />
  ),
}));

describe("EditorialCard", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it.each([
    ["ONGOING", "Sedang terbit"],
    ["COMPLETED", "Tamat"],
    ["UNKNOWN", null],
  ])("renders the publication label for %s", (status, label) => {
    render(<EditorialCard sourceId="test-source" manga={{ id: "fixture", title: "Fixture", coverUrl: "", status }} />);
    expect(screen.queryByText(status)).toBeNull();
    if (label) expect(screen.getByText(label)).toBeTruthy();
  });

  it("keeps the primary link and bookmark action as sibling interactions", () => {
    render(
      <EditorialCard
        sourceId="test-source"
        manga={{
          id: "manga-1",
          title: "Test manga",
          coverUrl: "https://example.com/cover.jpg",
          latestChapter: "Chapter 12",
          score: 8.7,
        }}
      />
    );

    const primaryLink = screen.getByRole("link", { name: "Baca Test manga" });
    const bookmark = screen.getByRole("button", { name: "Simpan Test manga ke rak" });

    expect(primaryLink.contains(bookmark)).toBe(false);
    expect(primaryLink.querySelector("button, a")).toBeNull();
    expect(bookmark.className).toContain("size-11");
  });

  it("normalizes uppercase comic format and uses unified chapter fallback copy", () => {
    render(
      <EditorialCard
        sourceId="test-source"
        manga={{
          id: "manga-2",
          title: "Solo Test",
          coverUrl: "https://example.com/cover.jpg",
          format: "MANHWA",
        }}
      />
    );

    expect(screen.getByText("Manhwa")).toBeTruthy();
    expect(screen.queryByText("MANHWA")).toBeNull();
    expect(screen.getByText("Bab terbaru belum tersedia")).toBeTruthy();
    expect(screen.queryByText("Chapter belum tersedia")).toBeNull();
  });
});
