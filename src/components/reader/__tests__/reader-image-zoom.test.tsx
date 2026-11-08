import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ReaderImage } from "../reader-image";

it("does not intercept double taps or disable browser zoom on the image", () => {
  render(<ReaderImage
    pageIndex={0}
    pageUrl="/page.jpg"
    isWebtoon={false}
    dataSaver={false}
    isAllowedToLoad
    onLoadComplete={vi.fn()}
    onError={vi.fn()}
  />);

  const image = screen.getByRole("img");
  const page = image.closest<HTMLElement>(".reader-page-container");
  expect(fireEvent.doubleClick(image)).toBe(true);
  expect(image.parentElement?.style.transform).toBe("");
  expect(page?.style.getPropertyValue("touch-action")).toBe("");
});
