import { describe, expect, it } from "vitest";
import { getVisualViewportBounds } from "../visual-viewport-bounds";

describe("visual viewport drawer placement", () => {
  it("moves the drawer footer above browser toolbar / virtual keyboard", () => {
    expect(getVisualViewportBounds(844, 600, 0)).toEqual({ height: 600, bottom: 244 });
  });

  it("accounts for the visual viewport panning when the keyboard focuses an input", () => {
    expect(getVisualViewportBounds(844, 600, 40)).toEqual({ height: 600, bottom: 204 });
  });

  it("does not add a negative inset when the visual viewport reaches layout bottom", () => {
    expect(getVisualViewportBounds(844, 844, 0)).toEqual({ height: 844, bottom: 0 });
    expect(getVisualViewportBounds(844, 850, 0)).toEqual({ height: 850, bottom: 0 });
  });

  it("rounds the browser's fractional visual viewport units", () => {
    expect(getVisualViewportBounds(844, 600.3, 14.4)).toEqual({ height: 600, bottom: 229 });
  });
});
