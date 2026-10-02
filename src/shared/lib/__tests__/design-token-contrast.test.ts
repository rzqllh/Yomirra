import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/(web)/globals.css"),
  "utf8"
);

function parseHexTokens(block: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

function getThemeTokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  expect(start).toBeGreaterThanOrEqual(0);
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n  }", open);
  expect(close).toBeGreaterThan(open);
  return parseHexTokens(css.slice(open + 1, close));
}

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const value = hex.slice(1);
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const requiredPairs = [
  ["text-muted", "surface-base"],
  ["text-secondary", "surface-base"],
  ["color-accent", "surface-base"],
  ["text-on-accent", "color-accent"],
  ["status-success-fg", "status-success-bg"],
  ["status-warning-fg", "status-warning-bg"],
  ["status-error-fg", "status-error-bg"],
  ["status-info-fg", "status-info-bg"],
] as const;

describe("design token contrast", () => {
  for (const [theme, selector] of [
    ["dark", ":root, .dark {"],
    ["light", ".light {"],
  ] as const) {
    it(`${theme} critical text/status pairs meet WCAG AA small-text contrast`, () => {
      const tokens = getThemeTokens(selector);

      for (const [foreground, background] of requiredPairs) {
        expect(tokens[foreground], `${theme} ${foreground} missing`).toBeDefined();
        expect(tokens[background], `${theme} ${background} missing`).toBeDefined();
        expect(
          contrastRatio(tokens[foreground], tokens[background]),
          `${theme} ${foreground} on ${background}`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
