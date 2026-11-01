import { describe, expect, it } from "vitest";
import {
  getRedisKeyNamespace,
  physicalScanPattern,
  physicalToLogicalRedisKey,
} from "../redis-key-scope";

describe("Redis environment and branch scoping", () => {
  const branchA = getRedisKeyNamespace({ vercelEnv: "preview", branch: "preview" });
  const branchB = getRedisKeyNamespace({ vercelEnv: "preview", branch: "feature/isolation" });

  it("preserves all production key names without migration", () => {
    expect(getRedisKeyNamespace({ vercelEnv: "production", branch: "main" })).toBe("");
  });

  it("assigns stable distinct namespaces to preview branches", () => {
    expect(branchA).toMatch(/^yomirra:preview:[a-f0-9]{16}:$/);
    expect(branchA).not.toBe(branchB);
    expect(branchA).toBe(getRedisKeyNamespace({ vercelEnv: "preview", branch: "preview" }));
  });

  it("scopes SCAN patterns and strips only belonging physical keys", () => {
    expect(physicalScanPattern("yomirra:*", branchA)).toBe(`${branchA}yomirra:*`);
    expect(physicalToLogicalRedisKey(`${branchA}yomirra:site:config`, branchA)).toBe("yomirra:site:config");
    expect(physicalToLogicalRedisKey("yomirra:site:config", branchA)).toBeNull();
    expect(physicalToLogicalRedisKey(`${branchB}yomirra:site:config`, branchA)).toBeNull();
  });

  it("keeps production scans compatible and separates development", () => {
    expect(physicalScanPattern("source:*", "")).toBe("source:*");
    expect(physicalToLogicalRedisKey("source:test", "")).toBe("source:test");
    expect(getRedisKeyNamespace({ vercelEnv: "development" })).toBe("yomirra:development:");
  });
});
