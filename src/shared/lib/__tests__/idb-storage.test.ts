import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { idbStorage } from "../idb-storage";

describe("idbStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("when IndexedDB is not supported (fallback mode)", () => {
    it("falls back to localStorage seamlessly", async () => {
      await idbStorage.setItem("fallback-key", JSON.stringify({ mode: "fallback" }));
      expect(localStorage.getItem("fallback-key")).toBe(JSON.stringify({ mode: "fallback" }));

      const retrieved = await idbStorage.getItem("fallback-key");
      expect(retrieved).toBe(JSON.stringify({ mode: "fallback" }));

      await idbStorage.removeItem("fallback-key");
      expect(localStorage.getItem("fallback-key")).toBeNull();
      expect(await idbStorage.getItem("fallback-key")).toBeNull();
    });
  });

  describe("when IndexedDB is supported", () => {
    let mockStore: Map<string, any>;

    beforeEach(() => {
      mockStore = new Map();

      const mockDB = {
        objectStoreNames: {
          contains: (name: string) => name === "keyval",
        },
        createObjectStore: vi.fn(),
        transaction: () => ({
          objectStore: () => ({
            get: (key: string) => {
              const req: any = {};
              setTimeout(() => {
                req.result = mockStore.get(key);
                req.onsuccess?.();
              }, 0);
              return req;
            },
            put: (value: any, key: string) => {
              const req: any = {};
              setTimeout(() => {
                mockStore.set(key, value);
                req.onsuccess?.();
              }, 0);
              return req;
            },
            delete: (key: string) => {
              const req: any = {};
              setTimeout(() => {
                mockStore.delete(key);
                req.onsuccess?.();
              }, 0);
              return req;
            },
          }),
        }),
      };

      const mockOpenRequest: any = {};
      (window as any).indexedDB = {
        open: () => {
          setTimeout(() => {
            mockOpenRequest.result = mockDB;
            mockOpenRequest.onsuccess?.();
          }, 0);
          return mockOpenRequest;
        },
      };
    });

    afterEach(() => {
      delete (window as any).indexedDB;
    });

    it("writes and reads from IndexedDB and cleans up localStorage", async () => {
      await idbStorage.setItem("idb-key", "idb-value");
      expect(mockStore.get("idb-key")).toBe("idb-value");
      expect(await idbStorage.getItem("idb-key")).toBe("idb-value");

      await idbStorage.removeItem("idb-key");
      expect(mockStore.has("idb-key")).toBe(false);
      expect(await idbStorage.getItem("idb-key")).toBeNull();
    });

    it("migrates existing data from localStorage to IDB and reclaims localStorage quota", async () => {
      const legacyData = JSON.stringify({ state: { downloads: { "ch-10": { id: "ch-10" } } }, version: 0 });
      localStorage.setItem("yomirra-downloads", legacyData);

      const result = await idbStorage.getItem("yomirra-downloads");
      expect(result).toBe(legacyData);

      // Verify it was copied to IndexedDB
      expect(mockStore.get("yomirra-downloads")).toBe(legacyData);

      // Verify localStorage was cleared to reclaim 5MB quota
      expect(localStorage.getItem("yomirra-downloads")).toBeNull();
    });
  });
});
