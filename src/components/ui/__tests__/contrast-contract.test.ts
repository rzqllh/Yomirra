import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const normalized = hex.replace("#", "");
  const red = channelToLinear(Number.parseInt(normalized.slice(0, 2), 16));
  const green = channelToLinear(Number.parseInt(normalized.slice(2, 4), 16));
  const blue = channelToLinear(Number.parseInt(normalized.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function token(block: string, name: string): string {
  const match = block.match(
    new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`)
  );
  if (!match?.[1]) {
    throw new Error(`Missing hex token --${name}`);
  }
  return match[1];
}

describe("design-token contrast", () => {
  const css = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/(web)/globals.css"),
    "utf-8"
  );
  const darkBlock = css.match(/:root, \.dark \{([\s\S]*?)\n  \}/)?.[1] ?? "";
  const lightBlock = css.match(/\.light \{([\s\S]*?)\n  \}/)?.[1] ?? "";

  it.each([
    ["dark accent button", darkBlock, "color-accent", "text-on-accent"],
    ["dark muted metadata", darkBlock, "text-muted", "surface-base"],
    ["dark secondary metadata", darkBlock, "text-secondary", "surface-base"],
    ["dark muted raised", darkBlock, "text-muted", "surface-raised"],
    ["dark selected chip", darkBlock, "color-accent", "color-accent-dim"],
    ["dark success status", darkBlock, "status-success-fg", "status-success-bg"],
    ["dark warning status", darkBlock, "status-warning-fg", "status-warning-bg"],
    ["dark error status", darkBlock, "status-error-fg", "status-error-bg"],
    ["dark info status", darkBlock, "status-info-fg", "status-info-bg"],
    ["light accent button", lightBlock, "color-accent", "text-on-accent"],
    ["light muted metadata", lightBlock, "text-muted", "surface-base"],
    ["light secondary metadata", lightBlock, "text-secondary", "surface-base"],
    ["light muted raised", lightBlock, "text-muted", "surface-raised"],
    ["light selected chip", lightBlock, "color-accent", "color-accent-dim"],
    ["light success status", lightBlock, "status-success-fg", "status-success-bg"],
    ["light warning status", lightBlock, "status-warning-fg", "status-warning-bg"],
    ["light error status", lightBlock, "status-error-fg", "status-error-bg"],
    ["light info status", lightBlock, "status-info-fg", "status-info-bg"],
  ])("%s remains at least 4.5:1", (_label, block, foreground, background) => {
    expect(
      contrastRatio(token(block, foreground), token(block, background))
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps disabled buttons semantically disabled instead of relying on color alone", () => {
    const buttonSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/ui/button.tsx"),
      "utf-8"
    );

    expect(buttonSource).toContain("disabled={isDisabled}");
    expect(buttonSource).toContain("aria-disabled={isDisabled || undefined}");
    expect(buttonSource).toContain("disabled:opacity-40");
  });
});
