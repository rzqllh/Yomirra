import { describe, it, expect, beforeEach } from "vitest";
import { useSearchFilterStore } from "../search-filter-store";

describe("search-filter-store", () => {
  beforeEach(() => {
    useSearchFilterStore.setState({
      selectedSources: null,
      genres: [],
      formats: [],
      status: "",
      sort: "popular"
    });
  });

  describe("pruneFilters", () => {
    it("should retain valid filters and remove invalid ones", () => {
      const store = useSearchFilterStore.getState();

      store.applyFilters({
        genres: ["action", "romance", "horror"],
        formats: ["manga", "manhwa"],
        status: "ongoing",
        sort: "latest"
      });

      // only action and romance are supported now
      const supportedGenres = ["action", "romance"];
      const supportedFormats = ["manga"];
      const supportedStatuses = ["completed"];
      const supportedSorts = ["latest", "popular"];

      useSearchFilterStore.getState().pruneFilters(supportedGenres, supportedFormats, supportedStatuses, supportedSorts);

      const updated = useSearchFilterStore.getState();

      expect(updated.genres).toEqual(["action", "romance"]);
      expect(updated.formats).toEqual(["manga"]);
      expect(updated.status).toBe(""); // ongoing was not in supportedStatuses
      expect(updated.sort).toBe("latest");
    });

    it("should not trigger state update if nothing changes", () => {
      const store = useSearchFilterStore.getState();

      store.applyFilters({
        genres: ["action"],
        formats: ["manga"],
        status: "ongoing",
        sort: "latest"
      });

      const beforeRef = useSearchFilterStore.getState();

      useSearchFilterStore.getState().pruneFilters(["action"], ["manga"], ["ongoing"], ["latest"]);

      const afterRef = useSearchFilterStore.getState();

      // Ensure object reference is exactly the same
      expect(beforeRef).toBe(afterRef);
    });
  });
});
