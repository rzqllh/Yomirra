import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MangaCover } from "../manga-cover";
import { describe, it, expect } from "vitest";

describe("MangaCover", () => {
  it("renders valid cover image with correct attributes", () => {
    render(
      <MangaCover
        src="https://example.com/cover.jpg"
        alt="Solo Leveling"
        className="custom-container"
        imageClassName="custom-image"
      />
    );

    const img = screen.getByRole("img", { name: "Solo Leveling" });
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("https://example.com/cover.jpg");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(img.className).toContain("custom-image");
  });

  it("uses eager loading when priority is true", () => {
    render(
      <MangaCover
        src="https://example.com/cover.jpg"
        alt="Tower of God"
        priority={true}
      />
    );

    const img = screen.getByRole("img", { name: "Tower of God" });
    expect(img.getAttribute("loading")).toBe("eager");
  });

  it("falls back to ImageBroken icon when onError triggers", () => {
    render(
      <MangaCover
        src="https://example.com/broken-cover.jpg"
        alt="Broken Manga"
        fallbackTitle="Broken Manga"
      />
    );

    const img = screen.getByRole("img", { name: "Broken Manga" });
    fireEvent.error(img);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Broken Manga")).not.toBeNull();
  });

  it("renders broken fallback directly when src is missing", () => {
    render(<MangaCover alt="No Cover Manga" fallbackTitle="No Cover Manga" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("No Cover Manga")).not.toBeNull();
  });
});
