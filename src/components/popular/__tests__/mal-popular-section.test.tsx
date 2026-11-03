import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MalPopularSection } from "../mal-popular-section";
import { useSettingsStore } from "@/shared/store/settings-store";
import type { MalPopularFeed } from "@/shared/types/mal";
const feed: MalPopularFeed = { status: "ready", safeOnly: false, fetchedAt: "2026-10-31T00:00:00Z", works: [
  { malId: 1, title: "Safe Work", rank: 3, members: 100, coverUrl: "", mediaType: "manga", nsfw: "white" },
  { malId: 2, title: "Restricted Work", rank: 4, members: 90, coverUrl: "https://cdn.myanimelist.net/hidden.jpg", mediaType: "manga", nsfw: "black" },
] };
describe("external MAL metadata", () => {
  it("removes opted-in metadata immediately when safe mode is restored", () => {
    useSettingsStore.setState({ hideNsfw: false }); render(<MalPopularSection feed={feed} />);
    expect(screen.getByText("Restricted Work")).toBeDefined();
    act(() => useSettingsStore.setState({ hideNsfw: true }));
    expect(screen.queryByText("Restricted Work")).toBeNull();
    expect(document.querySelector('img[src*="hidden.jpg"]')).toBeNull();
    expect(screen.getByText("Safe Work")).toBeDefined();
    expect(new URL(screen.getByRole("link", { name: "Cari sumber bacaan" }).getAttribute("href")!, "https://example.test").searchParams.get("q")).toBe("Safe Work");
  });
});
