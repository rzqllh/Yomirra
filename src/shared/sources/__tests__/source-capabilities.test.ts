import { describe, it, expect } from "vitest";
import {
  DEFAULT_CAPABILITIES,
  hasCapability,
  SourceCapabilities,
} from "../source-capabilities";
import { sourceRegistry } from "../source-registry";

describe("SourceCapabilities Infrastructure", () => {
  it("DEFAULT_CAPABILITIES has all flags set to false and is immutable", () => {
    expect(DEFAULT_CAPABILITIES.popular).toBe(false);
    expect(DEFAULT_CAPABILITIES.latest).toBe(false);
    expect(DEFAULT_CAPABILITIES.search).toBe(false);
    expect(DEFAULT_CAPABILITIES.detail).toBe(false);
    expect(DEFAULT_CAPABILITIES.chapters).toBe(false);
    expect(DEFAULT_CAPABILITIES.pages).toBe(false);
    expect(DEFAULT_CAPABILITIES.filters).toBe(false);
    expect(DEFAULT_CAPABILITIES.multiLanguage).toBe(false);
    expect(DEFAULT_CAPABILITIES.auth).toBe(false);
    expect(DEFAULT_CAPABILITIES.related).toBe(false);
    expect(DEFAULT_CAPABILITIES.download).toBe(false);

    // Verify immutability
    expect(Object.isFrozen(DEFAULT_CAPABILITIES)).toBe(true);
  });

  describe("hasCapability helper", () => {
    it("returns false for null, undefined, or empty objects", () => {
      expect(hasCapability(null, "search")).toBe(false);
      expect(hasCapability(undefined, "search")).toBe(false);
      expect(hasCapability({} as any, "search")).toBe(false);
      expect(hasCapability({ capabilities: {} }, "search")).toBe(false);
    });

    it("evaluates declared basic capabilities correctly", () => {
      const source = {
        capabilities: {
          popular: true,
          latest: false,
          search: true,
          detail: true,
          chapters: true,
          pages: true,
        },
      };

      expect(hasCapability(source, "popular")).toBe(true);
      expect(hasCapability(source, "latest")).toBe(false);
      expect(hasCapability(source, "search")).toBe(true);
    });

    it("evaluates optional V1 capabilities safely when undeclared", () => {
      const source = {
        capabilities: {
          popular: true,
          latest: true,
          search: true,
          detail: true,
          chapters: true,
          pages: true,
          // filters, multiLanguage, auth, related, download are omitted
        },
      };

      expect(hasCapability(source, "filters")).toBe(false);
      expect(hasCapability(source, "multiLanguage")).toBe(false);
      expect(hasCapability(source, "auth")).toBe(false);
      expect(hasCapability(source, "related")).toBe(false);
      expect(hasCapability(source, "download")).toBe(false);
    });

    it("evaluates optional V1 capabilities when explicitly enabled", () => {
      const source: { capabilities: SourceCapabilities } = {
        capabilities: {
          popular: true,
          latest: true,
          search: true,
          detail: true,
          chapters: true,
          pages: true,
          filters: true,
          multiLanguage: true,
          related: true,
        },
      };

      expect(hasCapability(source, "filters")).toBe(true);
      expect(hasCapability(source, "multiLanguage")).toBe(true);
      expect(hasCapability(source, "related")).toBe(true);
      expect(hasCapability(source, "auth")).toBe(false);
    });

    it("works seamlessly on all existing built-in sources in sourceRegistry", () => {
      expect(sourceRegistry.length).toBeGreaterThanOrEqual(4);

      for (const source of sourceRegistry) {
        expect(hasCapability(source, "search")).toBe(true);
        expect(hasCapability(source, "detail")).toBe(true);
        expect(hasCapability(source, "chapters")).toBe(true);
        expect(hasCapability(source, "pages")).toBe(true);
        // Optional capabilities default safely to false when omitted
        expect(hasCapability(source, "download")).toBe(false);
      }
    });
  });
});
