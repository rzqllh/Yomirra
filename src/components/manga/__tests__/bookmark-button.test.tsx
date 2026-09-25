import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookmarkButton } from "../bookmark-button";

const manga = {
  id: "solo-leveling",
  title: "Solo Leveling",
  coverUrl: "https://example.com/solo-leveling.jpg",
};

describe("BookmarkButton", () => {
  it("uses the 44px card-action target at every viewport", () => {
    render(<BookmarkButton sourceId="shinigami" manga={manga} />);

    const button = screen.getByRole("button", {
      name: "Simpan Solo Leveling ke rak",
    });

    expect(button.className).toContain("size-11");
    expect(button.className).not.toContain("size-10");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });
});
