import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderboardRow } from "../leaderboard-row";
import { useSettingsStore } from "@/shared/store/settings-store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const manga = {
  id: "ranking-work",
  title: "Ranking work",
  coverUrl: "https://example.com/cover.jpg",
  score: 8.8,
  rank: 1,
};

describe("LeaderboardRow content policy", () => {
  beforeEach(() => {
    useSettingsStore.setState({ hideNsfw: true });
  });

  it("keeps missing/UNKNOWN-rated results identifiable without mounting an unverified image", () => {
    const { container } = render(<LeaderboardRow sourceId="shinigami" manga={manga} />);
    expect(screen.getByText("Ranking work")).toBeTruthy();
    expect(screen.getByText("Rating belum terverifikasi")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("link")).toBeTruthy();
  });

  it("conceals confirmed restricted records before rendering cover, title or detail link", () => {
    const { container } = render(
      <LeaderboardRow sourceId="shinigami" manga={{ ...manga, contentRating: "erotica" }} />
    );
    expect(screen.getByRole("status").textContent).toContain("Konten disembunyikan");
    expect(screen.queryByText("Ranking work")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("does not treat a safe-marked title from an adult-only provider as safe", () => {
    const { container } = render(
      <LeaderboardRow sourceId="doujindesu" manga={{ ...manga, contentRating: "safe" }} />
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("preserves ordinary navigation without the unverified warning for confirmed-safe content", () => {
    render(<LeaderboardRow sourceId="shinigami" manga={{ ...manga, contentRating: "safe" }} />);
    expect(screen.getByText("Ranking work")).toBeTruthy();
    expect(screen.queryByText("Rating belum terverifikasi")).toBeNull();
    expect(screen.getByRole("link")).toBeTruthy();
  });
});
