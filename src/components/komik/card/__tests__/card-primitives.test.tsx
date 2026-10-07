import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MangaCardCoverFrame,
  MangaCardMeta,
  MangaCardTitle,
  mangaCardInteraction,
  mangaCardSurface,
} from "../primitives";

describe("manga card visual primitives", () => {
  it("composes presentational cover, title, and metadata without link semantics", () => {
    render(
      <MangaCardCoverFrame data-testid="cover">
        <span aria-label="Test manga cover" />
      </MangaCardCoverFrame>
    );

    render(<MangaCardTitle as="h4" lines={2}>Test manga</MangaCardTitle>);
    render(<MangaCardMeta as="p">Chapter 12</MangaCardMeta>);

    const cover = screen.getByTestId("cover");
    const title = screen.getByRole("heading", { level: 4, name: "Test manga" });

    expect(cover.className).toContain("aspect-[2/3]");
    expect(cover.className).toContain("rounded-xs");
    expect(title.className).not.toContain("group-hover");
    expect(title.className).not.toContain("focus-visible");
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Chapter 12").tagName).toBe("P");
  });

  it("exposes stable semantic surface and interaction recipes", () => {
    expect(mangaCardSurface({ kind: "enclosed" })).toContain("rounded-md");
    expect(mangaCardSurface({ kind: "open" })).not.toContain("rounded-md");
    expect(mangaCardSurface({ kind: "row" })).toContain("border-b");
    expect(mangaCardSurface({ kind: "nested" })).toContain("rounded-xs");
    expect(mangaCardInteraction.link).toContain("focus-visible");
    expect(mangaCardInteraction.coverImage).toContain("motion-reduce:transform-none");
  });
});
