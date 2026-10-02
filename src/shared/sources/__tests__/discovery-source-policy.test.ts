import { describe, expect, it } from "vitest";
import type { SourceMetadata } from "@/shared/sources/source-types";
import {
  isDiscoverySourceSelected,
  isDiscoverySourceSystemEligible,
  isSearchSourceSystemEligible,
  parseDisabledSourceIdsCookie,
  selectDiscoverySources,
  resolveDiscoverySourceId,
} from "../discovery-source-policy";

const source = (overrides: Partial<SourceMetadata> = {}) =>
  ({
    id: "source-a",
    name: "Source A",
    description: "",
    language: "id",
    baseUrl: "https://example.com",
    version: "1.0.0",
    isEnabled: true,
    isInstalled: true,
    status: "online",
    isNsfw: false,
    capabilities: {
      popular: true,
      latest: true,
      search: true,
      detail: true,
      chapters: true,
      pages: true,
      filters: false,
    },
    ...overrides,
  }) as SourceMetadata;

describe("discovery source policy", () => {
  it("keeps user preference separate from runtime eligibility", () => {
    expect(isDiscoverySourceSystemEligible(source())).toBe(true);
    expect(isDiscoverySourceSystemEligible(source({ isEnabled: false }))).toBe(false);
    expect(isDiscoverySourceSystemEligible(source({ isInstalled: false }))).toBe(false);
    expect(isDiscoverySourceSystemEligible(source({ status: "unavailable" }))).toBe(false);
    expect(isDiscoverySourceSystemEligible(source({ status: "in-fix" }))).toBe(false);
    expect(isDiscoverySourceSystemEligible(source({ status: "in-dev" }))).toBe(false);
  });

  it("keeps Search independent from discovery preference but excludes non-operational sources", () => {
    expect(isSearchSourceSystemEligible(source())).toBe(true);
    expect(isSearchSourceSystemEligible(source({ status: "slow" }))).toBe(true);
    expect(isSearchSourceSystemEligible(source({ status: "unknown" }))).toBe(true);
    expect(isSearchSourceSystemEligible(source({ status: "unavailable" }))).toBe(false);
    expect(isSearchSourceSystemEligible(source({ status: "in-fix" }))).toBe(false);
    expect(isSearchSourceSystemEligible(source({ status: "in-dev" }))).toBe(false);
    expect(isSearchSourceSystemEligible(source({ isEnabled: false }))).toBe(false);
    expect(
      isSearchSourceSystemEligible(
        source({ capabilities: { ...source().capabilities, search: false } })
      )
    ).toBe(false);
  });

  it("applies the user discovery preference only after system eligibility", () => {
    expect(isDiscoverySourceSelected(source(), [])).toBe(true);
    expect(isDiscoverySourceSelected(source(), ["source-a"])).toBe(false);
    expect(
      isDiscoverySourceSelected(source({ isEnabled: false }), [])
    ).toBe(false);
  });

  it("filters the everyday discovery surfaces consistently", () => {
    const sources = [
      source({ id: "a" }),
      source({ id: "b" }),
      source({ id: "c", status: "in-fix" }),
      source({ id: "d", isEnabled: false }),
    ];

    expect(selectDiscoverySources(sources, ["b"]).map((item) => item.id)).toEqual(["a"]);
  });

  it("resolves Library default from the first eligible source without a provider hard-code", () => {
    const eligible = [source({ id: "first" }), source({ id: "second" })];

    expect(resolveDiscoverySourceId(null, eligible)).toBe("first");
    expect(resolveDiscoverySourceId("second", eligible)).toBe("second");
    expect(resolveDiscoverySourceId(null, [])).toBe("");
  });

  it("parses the persisted disabled-source cookie defensively", () => {
    expect(parseDisabledSourceIdsCookie()).toEqual([]);
    expect(parseDisabledSourceIdsCookie("not-json")).toEqual([]);
    expect(
      parseDisabledSourceIdsCookie(
        encodeURIComponent(JSON.stringify(["a", "a", 7, "", "b"]))
      )
    ).toEqual(["a", "b"]);
  });
});
