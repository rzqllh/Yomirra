import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialSpotlight } from "../editorial-spotlight";

const manga = {
  id: "manga-a",
  title: "Manga A",
  coverUrl: "/cover.jpg",
  description: "Description",
  format: "Manhwa",
  latestChapter: "Chapter 18",
};

describe("EditorialSpotlight accessibility", () => {
  it("renders synopsis-absent slot and fallback text when synopsis is missing", () => {
    const { container } = render(
      <EditorialSpotlight
        manga={{ id: "manga-b", title: "Manga B", coverUrl: "/cover-b.jpg" }}
        sourceId="source-b"
        sourceName="Source B"
      />
    );

    expect(screen.getByText("Sinopsis belum tersedia")).toBeTruthy();
    // When synopsis is absent, a dedicated slot is rendered instead of reserving empty geometry
    expect(container.querySelector('[data-spotlight-slot="synopsis-absent"]')).toBeTruthy();
    expect(container.querySelector('[data-spotlight-slot="synopsis"]')).toBeNull();
    expect(container.querySelector('[data-spotlight-slot="metadata"]')).toBeTruthy();
  });

  it("uses truthful semantics, explicit detail targets, display source names, and 44px carousel controls", () => {
    const { container } = render(
      <EditorialSpotlight
        manga={manga}
        sourceId="source-a"
        sourceName="Source A"
        totalCount={3}
      />
    );

    expect(screen.getByText("SOROTAN TERBARU")).toBeTruthy();
    expect(screen.getByText("Source A")).toBeTruthy();
    expect(screen.queryByText("source-a")).toBeNull();

    const article = screen.getByRole("article", {
      name: "Sorotan komik: Manga A",
    });
    expect(article.closest("a")).toBeNull();

    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: "Komik sebelumnya" }).className
    ).toContain("size-11");
    expect(
      screen.getByRole("button", { name: "Komik berikutnya" }).className
    ).toContain("size-11");

    const coverImage = container.querySelector(
      'a[aria-label="Lihat komik Manga A"] img'
    );
    expect(coverImage?.className).not.toContain("group-hover:scale");
  });
});
