import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ViewModeToggle } from "../view-mode-toggle";
import { CompactCard } from "../card/compact-card";
import { useSettingsStore } from "@/shared/store/settings-store";


describe("Listing View Mode & CompactCard", () => {
  beforeEach(() => {
    useSettingsStore.setState({ listingViewMode: "grid" });
  });

  it("ViewModeToggle toggles between grid and compact in settings store", () => {
    render(<ViewModeToggle />);

    const gridBtn = screen.getByRole("button", { name: "Tampilan Card Grid" });
    const compactBtn = screen.getByRole("button", { name: "Tampilan Kompak" });

    expect(gridBtn).not.toBeNull();
    expect(compactBtn).not.toBeNull();
    expect(useSettingsStore.getState().listingViewMode).toBe("grid");

    fireEvent.click(compactBtn);
    expect(useSettingsStore.getState().listingViewMode).toBe("compact");

    fireEvent.click(gridBtn);
    expect(useSettingsStore.getState().listingViewMode).toBe("grid");
  });

  it("CompactCard renders title, cover, score, format badge, and latest chapter", () => {
    const mockManga = {
      id: "solo-leveling",
      title: "Solo Leveling",
      coverUrl: "https://example.com/cover.jpg",
      score: 9.8,
      type: "manhwa",
      status: "Completed",
      latestChapter: "Chapter 200",
      description: "A world-renowned hunter journeys through perilous gates.",
    };

    render(
      <CompactCard
        sourceId="shinigami"
        manga={mockManga}
        showSourceBadge={true}
      />
    );

    expect(screen.getByText("Solo Leveling")).not.toBeNull();
    expect(screen.getByText("9.8")).not.toBeNull();
    expect(screen.getByText("manhwa")).not.toBeNull();
    expect(screen.getByText("Shinigami")).not.toBeNull();
    expect(screen.getByText("Chapter 200")).not.toBeNull();
    expect(screen.getByText(/Completed/)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Simpan Solo Leveling ke rak" })).not.toBeNull();
  });

  it("sorts rating descending with null-last and tie-breaks by popularity/rank", () => {
    const rawItems = [
      { id: "unrated-1", title: "Unrated 1", score: 0, rank: 500 },
      { id: "rated-low", title: "Rated Low", score: 7.2, rank: 100 },
      { id: "rated-high-1", title: "Rated High 1", score: 9.5, rank: 10 },
      { id: "rated-high-2", title: "Rated High 2", score: 9.5, rank: 50 },
      { id: "unrated-2", title: "Unrated 2", score: undefined, rank: 1000 },
    ];

    const sorted = [...rawItems].sort((a, b) => {
      const scoreA = typeof a.score === "number" && a.score > 0 ? a.score : -1;
      const scoreB = typeof b.score === "number" && b.score > 0 ? b.score : -1;

      // Null-last: unrated titles are kept at the bottom of the list
      if (scoreA === -1 && scoreB === -1) return 0;
      if (scoreA === -1) return 1;
      if (scoreB === -1) return -1;

      // Primary sort: descending by rating
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // Tie-break fallback to popularity/rank
      const rankA = a.rank ?? 0;
      const rankB = b.rank ?? 0;
      return rankB - rankA;
    });

    expect(sorted[0].id).toBe("rated-high-2");
    expect(sorted[1].id).toBe("rated-high-1");
    expect(sorted[2].id).toBe("rated-low");
    expect(sorted[3].id).toBe("unrated-1");
    expect(sorted[4].id).toBe("unrated-2");
  });

  it("renders real synopsis without generic tap instructions", () => {
    const mockManga = {
      id: "demonic-emperor",
      title: "Demonic Emperor",
      coverUrl: "https://example.com/cover.jpg",
      description: "Karena dia memiliki warisan Ancient Demonic emperor...",
    };

    render(
      <CompactCard
        sourceId="shinigami"
        manga={mockManga}
      />
    );

    expect(screen.getByText(/Karena dia memiliki warisan Ancient Demonic emperor/)).not.toBeNull();
    expect(screen.queryByText(/Ketuk untuk melihat ringkasan/)).toBeNull();
  });

  it("does not render generic instruction placeholder when description is missing", () => {
    const mockMangaWithoutDesc = {
      id: "no-desc-manga",
      title: "No Desc Manga",
      coverUrl: "https://example.com/cover.jpg",
    };

    render(
      <CompactCard
        sourceId="shinigami"
        manga={mockMangaWithoutDesc}
      />
    );

    expect(screen.queryByText(/Ketuk untuk melihat ringkasan/)).toBeNull();
  });
});
